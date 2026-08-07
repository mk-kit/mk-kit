import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId } from '@mkornas/ui/core';

/** Which axes get a custom scrollbar for {@link MkScrollArea}. */
export type MkScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

type Axis = 'vertical' | 'horizontal';

/**
 * ScrollArea — a scroll container that hides the native scrollbar and renders
 * its own themed overlay bars (à la Radix ScrollArea). The projected content
 * scrolls inside a real, keyboard-focusable viewport, so native wheel / arrow
 * scrolling keeps working; the custom bars are decorative (`aria-hidden`) and
 * draggable.
 *
 * ```html
 * <mk-scroll-area maxHeight="20rem">
 *   <p>…lots of content…</p>
 * </mk-scroll-area>
 * ```
 *
 * Set `orientation` to `horizontal` / `both` for a horizontal bar, and
 * `hideDelay` to auto-hide the bars after inactivity (`0` = always visible).
 */
@Component({
  selector: 'mk-scroll-area',
  templateUrl: './scroll-area.html',
  styleUrl: './scroll-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-scroll-area',
    '(mouseenter)': 'onEnter()',
    '(mouseleave)': 'onLeave()',
  },
})
export class MkScrollArea {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly viewportRef =
    viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly contentRef =
    viewChild.required<ElementRef<HTMLElement>>('content');

  /** Optional CSS max-height for the viewport, e.g. `'20rem'`. */
  readonly maxHeight = input<string>('');
  /**
   * Accessible name for the scrollable viewport. When set, the viewport is
   * exposed as a labelled `region` landmark — recommended, since the viewport
   * is keyboard-focusable (`tabindex="0"`) and a focusable scroll container
   * should have an accessible name. When empty, no role / label is added.
   */
  readonly ariaLabel = input<string>('');
  /** Which axes render a custom bar. */
  readonly orientation = input<MkScrollAreaOrientation>('vertical');
  /** Auto-hide the bars after this many ms of inactivity (`0` = always on). */
  readonly hideDelay = input(1000, { transform: numberAttribute });

  protected readonly viewportId = mkUniqueId('mk-scroll-area');

  // Live viewport metrics, mirrored into signals so the thumbs recompute.
  protected readonly scrollTop = signal(0);
  protected readonly scrollLeft = signal(0);
  protected readonly scrollHeight = signal(0);
  protected readonly scrollWidth = signal(0);
  protected readonly clientHeight = signal(0);
  protected readonly clientWidth = signal(0);

  protected readonly showVertical = computed(
    () => this.orientation() !== 'horizontal',
  );
  protected readonly showHorizontal = computed(
    () => this.orientation() !== 'vertical',
  );

  /** The viewport actually overflows on the given axis. */
  protected readonly vScrollable = computed(
    () => this.scrollHeight() - this.clientHeight() > 1,
  );
  protected readonly hScrollable = computed(
    () => this.scrollWidth() - this.clientWidth() > 1,
  );

  /** Thumb length as a fraction of the track (`clientHeight / scrollHeight`). */
  protected readonly vThumbSize = computed(() => {
    const sh = this.scrollHeight();
    return sh > 0 ? Math.min(1, this.clientHeight() / sh) : 0;
  });
  protected readonly hThumbSize = computed(() => {
    const sw = this.scrollWidth();
    return sw > 0 ? Math.min(1, this.clientWidth() / sw) : 0;
  });

  /** Thumb position as a fraction of the scroll range (0 = start, 1 = end). */
  protected readonly vThumbOffset = computed(() => {
    const range = this.scrollHeight() - this.clientHeight();
    return range > 0 ? Math.min(1, Math.max(0, this.scrollTop() / range)) : 0;
  });
  protected readonly hThumbOffset = computed(() => {
    const range = this.scrollWidth() - this.clientWidth();
    return range > 0 ? Math.min(1, Math.max(0, this.scrollLeft() / range)) : 0;
  });

  /** CSS `top` / `left` for the thumb, accounting for its own length. */
  protected readonly vThumbTop = computed(
    () => `calc((100% - ${this.vThumbSize() * 100}%) * ${this.vThumbOffset()})`,
  );
  protected readonly hThumbLeft = computed(
    () => `calc((100% - ${this.hThumbSize() * 100}%) * ${this.hThumbOffset()})`,
  );

  private readonly _visible = signal(false);
  /** Whether the bars are currently shown (always true when `hideDelay` is 0). */
  protected readonly barsVisible = computed(
    () => this.hideDelay() === 0 || this._visible(),
  );

  private dragAxis: Axis | null = null;
  private dragStartPointer = 0;
  private dragStartScroll = 0;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private resizeObserver?: ResizeObserver;

  constructor() {
    // Runs after the first render (inputs bound, view children resolved).
    afterNextRender(() => {
      if (!this.isBrowser) return;
      this.measure();
      const view = this.viewportRef().nativeElement;
      const content = this.contentRef().nativeElement;
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => this.measure());
        this.resizeObserver.observe(view);
        this.resizeObserver.observe(content);
      }
    });
  }

  /** Snapshot the viewport's scroll metrics into signals. */
  private measure(): void {
    const view = this.viewportRef().nativeElement;
    this.scrollTop.set(view.scrollTop);
    this.scrollLeft.set(view.scrollLeft);
    this.scrollHeight.set(view.scrollHeight);
    this.scrollWidth.set(view.scrollWidth);
    this.clientHeight.set(view.clientHeight);
    this.clientWidth.set(view.clientWidth);
  }

  protected onScroll(): void {
    this.measure();
    this.show();
    this.scheduleHide();
  }

  protected onEnter(): void {
    this.show();
  }

  protected onLeave(): void {
    this.scheduleHide();
  }

  // --- Thumb dragging -------------------------------------------------------

  protected onThumbPointerdown(event: PointerEvent, axis: Axis): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation(); // don't let the track handler page as well
    const view = this.viewportRef().nativeElement;
    this.dragAxis = axis;
    if (axis === 'vertical') {
      this.dragStartPointer = event.clientY;
      this.dragStartScroll = view.scrollTop;
    } else {
      this.dragStartPointer = event.clientX;
      this.dragStartScroll = view.scrollLeft;
    }
    try {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Pointer already lifted (fast tap) — nothing left to capture.
    }
    this.show();
  }

  protected onThumbPointermove(event: PointerEvent): void {
    if (!this.dragAxis) return;
    const view = this.viewportRef().nativeElement;
    if (this.dragAxis === 'vertical') {
      const delta = event.clientY - this.dragStartPointer;
      // A 1px thumb move maps to scrollHeight/clientHeight px of scroll.
      const scale = this.clientHeight()
        ? this.scrollHeight() / this.clientHeight()
        : 0;
      view.scrollTop = this.dragStartScroll + delta * scale;
    } else {
      const delta = event.clientX - this.dragStartPointer;
      const scale = this.clientWidth()
        ? this.scrollWidth() / this.clientWidth()
        : 0;
      view.scrollLeft = this.dragStartScroll + delta * scale;
    }
  }

  protected onThumbPointerup(event: PointerEvent): void {
    if (!this.dragAxis) return;
    this.dragAxis = null;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    this.scheduleHide();
  }

  // --- Track paging ---------------------------------------------------------

  protected onTrackPointerdown(event: PointerEvent, axis: Axis): void {
    if (event.button !== 0) return;
    const view = this.viewportRef().nativeElement;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (axis === 'vertical') {
      const clickPos = event.clientY - rect.top;
      const thumbLen = rect.height * this.vThumbSize();
      const thumbStart = this.vThumbOffset() * (rect.height - thumbLen);
      const page = view.clientHeight * 0.9;
      if (clickPos < thumbStart) view.scrollTop -= page;
      else if (clickPos > thumbStart + thumbLen) view.scrollTop += page;
    } else {
      const clickPos = event.clientX - rect.left;
      const thumbLen = rect.width * this.hThumbSize();
      const thumbStart = this.hThumbOffset() * (rect.width - thumbLen);
      const page = view.clientWidth * 0.9;
      if (clickPos < thumbStart) view.scrollLeft -= page;
      else if (clickPos > thumbStart + thumbLen) view.scrollLeft += page;
    }
  }

  // --- Auto-hide ------------------------------------------------------------

  private show(): void {
    if (!this.isBrowser) return;
    this._visible.set(true);
    this.clearHideTimer();
  }

  private scheduleHide(): void {
    const delay = this.hideDelay();
    if (delay === 0 || this.dragAxis) return;
    this.clearHideTimer();
    this.hideTimer = setTimeout(() => this._visible.set(false), delay);
  }

  private clearHideTimer(): void {
    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.clearHideTimer();
  }
}
