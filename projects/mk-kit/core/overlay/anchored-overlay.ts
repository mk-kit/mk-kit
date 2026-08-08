import {
  AfterViewInit,
  DOCUMENT,
  Directive,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { MkPlacement } from '../types';

/** Options controlling {@link mkComputeAnchoredPosition}. */
export interface MkAnchoredPositionOptions {
  placement: MkPlacement;
  gap: number;
  flip: boolean;
  clamp: boolean;
  /** Resolve `-start`/`-end` alignment against a right-to-left anchor. */
  rtl?: boolean;
}

interface MkRectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface MkSize {
  width: number;
  height: number;
}

/** Resolved coordinates (viewport-relative, for `position: fixed`). */
export interface MkAnchoredPosition {
  top: number;
  left: number;
  /** The placement actually used after any flip. */
  placement: MkPlacement;
}

/**
 * Never shrink a panel below this via the viewport size cap — a sub-120px
 * dropdown is unusable; at that point overflowing beats collapsing.
 */
const MIN_SIZE_CAP = 120;

function sideOf(placement: MkPlacement): 'top' | 'bottom' | 'left' | 'right' {
  if (placement.startsWith('top')) return 'top';
  if (placement.startsWith('bottom')) return 'bottom';
  return placement as 'left' | 'right';
}

function alignOf(placement: MkPlacement): 'start' | 'center' | 'end' {
  if (placement.endsWith('-start')) return 'start';
  if (placement.endsWith('-end')) return 'end';
  return 'center';
}

/**
 * Pure viewport-positioning maths shared by every anchored overlay
 * ({@link MkAnchoredPanel} and the tooltip). Given the anchor rect, the panel
 * size and the viewport size, returns the top/left for a `position: fixed`
 * panel — flipping to the opposite side when it would overflow and clamping
 * back inside the viewport.
 */
export function mkComputeAnchoredPosition(
  anchor: MkRectLike,
  panel: MkSize,
  viewport: MkSize,
  opts: MkAnchoredPositionOptions,
): MkAnchoredPosition {
  const { gap, flip, clamp } = opts;
  let side = sideOf(opts.placement);
  const align = alignOf(opts.placement);
  const { width: w, height: h } = panel;
  const { width: vw, height: vh } = viewport;

  // Vertical flip for top/bottom placements.
  if (flip && (side === 'top' || side === 'bottom')) {
    const fitsBelow = anchor.bottom + gap + h <= vh;
    const fitsAbove = anchor.top - gap - h >= 0;
    if (side === 'bottom' && !fitsBelow && fitsAbove) side = 'top';
    else if (side === 'top' && !fitsAbove && fitsBelow) side = 'bottom';
  }
  // Horizontal flip for left/right placements.
  if (flip && (side === 'left' || side === 'right')) {
    const fitsRight = anchor.right + gap + w <= vw;
    const fitsLeft = anchor.left - gap - w >= 0;
    if (side === 'right' && !fitsRight && fitsLeft) side = 'left';
    else if (side === 'left' && !fitsLeft && fitsRight) side = 'right';
  }

  let top = 0;
  let left = 0;

  if (side === 'bottom') top = anchor.bottom + gap;
  else if (side === 'top') top = anchor.top - h - gap;
  else if (side === 'right') left = anchor.right + gap;
  else left = anchor.left - w - gap;

  if (side === 'top' || side === 'bottom') {
    // Cross axis is horizontal; in RTL, inline-start is the anchor's right edge.
    const startLeft = opts.rtl ? anchor.right - w : anchor.left;
    const endLeft = opts.rtl ? anchor.left : anchor.right - w;
    if (align === 'start') left = startLeft;
    else if (align === 'end') left = endLeft;
    else left = anchor.left + anchor.width / 2 - w / 2;
  } else {
    // Left/right: centre on the cross (vertical) axis.
    top = anchor.top + anchor.height / 2 - h / 2;
  }

  if (clamp) {
    left = Math.max(gap, Math.min(left, vw - w - gap));
    top = Math.max(gap, Math.min(top, vh - h - gap));
  }

  return { top: Math.round(top), left: Math.round(left), placement: `${side}${align === 'center' ? '' : `-${align}`}` as MkPlacement };
}

/**
 * Anchored-overlay directive. Apply it to a floating panel element (a dropdown
 * list, calendar, menu, …) that is rendered inside its component's own template
 * — typically inside an `@if (open()) { … }` block. On init the directive
 * **teleports the panel to `document.body` and into the browser top layer** via
 * the native Popover API (`popover="manual"` + `showPopover()`), then positions
 * it against the anchor with `position: fixed`. Because the element stays part
 * of the component's Angular view, all bindings, `@for` content, events and
 * projected content keep working after the move.
 *
 * The top layer is immune to ancestor `overflow`, `transform` and `z-index`
 * stacking contexts, so the panel can never be clipped by a container or hidden
 * behind sibling content. Where the Popover API is unavailable the panel still
 * renders in a `document.body` portal with a `z-index` fallback.
 *
 * ```html
 * <ul #panel mkAnchoredPanel [mkAnchoredPanelFor]="trigger" [matchWidth]="true"
 *     (dismiss)="close()"> … </ul>
 * ```
 */
@Directive({
  selector: '[mkAnchoredPanel]',
  exportAs: 'mkAnchoredPanel',
})
export class MkAnchoredPanel implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The trigger element to position against. */
  readonly anchor = input<HTMLElement | ElementRef<HTMLElement> | undefined>(
    undefined,
    { alias: 'mkAnchoredPanelFor' },
  );
  /** Viewport-point anchor (e.g. a right-click position) — takes precedence. */
  readonly anchorRect = input<{ x: number; y: number } | undefined>(undefined);
  /** Preferred placement relative to the anchor. */
  readonly placement = input<MkPlacement>('bottom-start');
  /** Distance in px between the anchor and the panel. */
  readonly gap = input(4);
  /** Set the panel's `min-width` to the anchor's width (dropdowns). */
  readonly matchWidth = input(false);
  /** Flip to the opposite side when the preferred side would overflow. */
  readonly flip = input(true);
  /** Clamp the panel inside the viewport. */
  readonly clamp = input(true);

  /** Emitted on an outside pointerdown or when the window loses focus. */
  readonly dismiss = output<void>();

  private popover = false;
  /** Whether {@link position} applied an inline viewport size cap (`max-*`). */
  private sizeCapped = false;

  private repositionRaf: number | null = null;
  /**
   * Scroll-driven repositions track the anchor without clamping, so the
   * panel follows its trigger instead of detaching and hugging the viewport
   * edge; open/resize positioning clamps as usual.
   */
  private pendingTrack = true;
  /** rAF-coalesced repositioning — at most one layout pass per frame. */
  private reposition(track: boolean): void {
    // A clamped (open/resize) request in the same frame wins over tracking.
    this.pendingTrack &&= track;
    if (this.repositionRaf != null) return;
    this.repositionRaf =
      this.document.defaultView?.requestAnimationFrame(() => {
        this.repositionRaf = null;
        const wasTrack = this.pendingTrack;
        this.pendingTrack = true;
        this.position(wasTrack);
      }) ?? null;
  }
  private readonly onScroll = () => this.reposition(true);
  private readonly onResize = () => this.reposition(false);
  private readonly onDocPointerdown = (e: Event) => {
    const target = e.target as Node;
    if (this.host.nativeElement.contains(target)) return;
    const anchorEl = this.resolveAnchorEl();
    if (anchorEl?.contains(target)) return;
    this.dismiss.emit();
  };
  private readonly onWindowBlur = () => this.dismiss.emit();

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const el = this.host.nativeElement;

    el.style.position = 'fixed';
    el.style.margin = '0';
    el.style.inset = 'auto';
    // setProperty (not .style.zIndex) so the CSS var() value is accepted. Only
    // matters in the no-Popover fallback; the top layer ignores z-index.
    el.style.setProperty('z-index', 'var(--mk-z-menu)');

    this.document.body.appendChild(el);

    // Promote into the top layer when the Popover API is available.
    const withPopover = el as HTMLElement & {
      showPopover?: () => void;
      hidePopover?: () => void;
    };
    if (typeof withPopover.showPopover === 'function') {
      el.setAttribute('popover', 'manual');
      try {
        withPopover.showPopover();
        this.popover = true;
      } catch {
        // Already open or unsupported context — fall back to the body portal.
        // The attribute must go too: with it left on, the UA sheet's
        // `[popover]:not(:popover-open) { display: none }` hides the panel.
        el.removeAttribute('popover');
        this.popover = false;
      }
    }

    this.position();

    const view = this.document.defaultView;
    view?.addEventListener('scroll', this.onScroll, {
      capture: true,
      passive: true,
    });
    view?.addEventListener('resize', this.onResize);
    view?.addEventListener('blur', this.onWindowBlur);
    // iOS's software keyboard (and pinch-zoom) resizes/pans only the VISUAL
    // viewport — `window` never fires resize/scroll for it — so listen there
    // too, into the same reposition paths. Feature-detected: jsdom and older
    // browsers have no visualViewport.
    const visual = view?.visualViewport;
    visual?.addEventListener('resize', this.onResize);
    visual?.addEventListener('scroll', this.onScroll);
    this.document.addEventListener('pointerdown', this.onDocPointerdown, true);

    // Re-measure once layout has settled (fonts, async content).
    view?.requestAnimationFrame(() => this.position());
  }

  /**
   * Recompute and apply the panel position. Safe to call at any time.
   * With `track` (scroll-driven), the panel follows the anchor unclamped and
   * dismisses once the anchor leaves the viewport (matching the CDK's
   * reposition-with-auto-close scroll behaviour).
   */
  position(track = false): void {
    if (!this.isBrowser) return;
    const el = this.host.nativeElement;
    const view = this.document.defaultView;
    if (!view) return;

    const anchor = this.resolveAnchorRect();
    if (!anchor) return;

    // Prefer the visual viewport when it exists and is measured: on iOS the
    // software keyboard shrinks only `visualViewport`, never the layout
    // viewport, so clamp/flip maths against `documentElement.client*` would
    // keep placing panels underneath the keyboard. Fallback (no visualViewport,
    // or one reporting 0×0 pre-measure) keeps the existing behaviour, including
    // the jsdom "unmeasured viewport" guards below.
    const visual = view.visualViewport;
    const useVisual = visual != null && visual.width > 0 && visual.height > 0;
    const vw = useVisual ? visual.width : this.document.documentElement.clientWidth;
    const vh = useVisual ? visual.height : this.document.documentElement.clientHeight;

    // Anchor scrolled fully out of view — the panel would float detached.
    // Zero-size anchor rects and a zero-size viewport are skipped: they mean
    // "not yet measured" (jsdom, SSR hydration), not "off-screen".
    if (
      track &&
      !this.anchorRect() &&
      vw > 0 &&
      vh > 0 &&
      (anchor.width > 0 || anchor.height > 0) &&
      (anchor.bottom <= 0 || anchor.top >= vh || anchor.right <= 0 || anchor.left >= vw)
    ) {
      this.dismiss.emit();
      return;
    }

    if (this.matchWidth() && anchor.width > 0) {
      el.style.minWidth = `${Math.round(anchor.width)}px`;
    }

    const gap = this.gap();

    // Viewport size cap: a panel wider or taller than the screen (a fat menu
    // on a 360px phone) gets an inline `max-width`/`max-height` so it scrolls
    // internally instead of overflowing. An inline max-* OVERRIDES any
    // stylesheet max (e.g. a select list's own 16rem max-height), so the cap
    // is applied only when the panel's NATURAL size exceeds it — it never
    // enlarges a panel that already limits itself. A previously applied cap is
    // cleared first so the natural size is re-measured against the current
    // viewport. Scroll-tracking frames skip all of this: the viewport has not
    // resized mid-scroll, and clearing/re-measuring would force two extra
    // reflows per frame.
    if (!track && this.sizeCapped) {
      el.style.removeProperty('max-width');
      el.style.removeProperty('max-height');
      this.sizeCapped = false;
    }
    let rect = el.getBoundingClientRect();
    if (!track && vw > 0 && vh > 0) {
      const capW = Math.max(MIN_SIZE_CAP, Math.floor(vw - 2 * gap));
      const capH = Math.max(MIN_SIZE_CAP, Math.floor(vh - 2 * gap));
      const capWidth = rect.width > capW;
      const capHeight = rect.height > capH;
      if (capWidth) el.style.maxWidth = `${capW}px`;
      if (capHeight) el.style.maxHeight = `${capH}px`;
      if (capWidth || capHeight) {
        this.sizeCapped = true;
        rect = el.getBoundingClientRect();
      }
    }

    const pos = mkComputeAnchoredPosition(
      anchor,
      { width: rect.width, height: rect.height },
      { width: vw, height: vh },
      {
        placement: this.placement(),
        gap,
        flip: this.flip(),
        clamp: this.clamp() && !track,
        rtl: this.isAnchorRtl(),
      },
    );
    el.style.top = `${pos.top}px`;
    el.style.left = `${pos.left}px`;
    el.setAttribute('data-placement', pos.placement);
  }

  /** Whether the anchor renders in a right-to-left context. */
  private isAnchorRtl(): boolean {
    const el = this.resolveAnchorEl();
    const view = this.document.defaultView;
    if (!el || !view) return false;
    return view.getComputedStyle(el).direction === 'rtl';
  }

  private resolveAnchorEl(): HTMLElement | null {
    const a = this.anchor();
    if (!a) return null;
    return a instanceof ElementRef ? a.nativeElement : a;
  }

  private resolveAnchorRect(): MkRectLike | null {
    const point = this.anchorRect();
    if (point) {
      return {
        top: point.y,
        left: point.x,
        right: point.x,
        bottom: point.y,
        width: 0,
        height: 0,
      };
    }
    return this.resolveAnchorEl()?.getBoundingClientRect() ?? null;
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    const el = this.host.nativeElement;
    const view = this.document.defaultView;
    if (this.repositionRaf != null) {
      view?.cancelAnimationFrame(this.repositionRaf);
      this.repositionRaf = null;
    }
    view?.removeEventListener('scroll', this.onScroll, true);
    view?.removeEventListener('resize', this.onResize);
    view?.removeEventListener('blur', this.onWindowBlur);
    const visual = view?.visualViewport;
    visual?.removeEventListener('resize', this.onResize);
    visual?.removeEventListener('scroll', this.onScroll);
    this.document.removeEventListener('pointerdown', this.onDocPointerdown, true);

    const withPopover = el as HTMLElement & { hidePopover?: () => void };
    if (this.popover && typeof withPopover.hidePopover === 'function') {
      try {
        withPopover.hidePopover();
      } catch {
        // Ignore — the element may already be disconnected.
      }
      el.removeAttribute('popover');
    }

    // Remove the teleported node ourselves. It was moved out of the component's
    // view into `document.body`, so Angular's view teardown removes it by
    // reference (`node.remove()`); re-inserting it anywhere would orphan a
    // detached copy, leaking one panel per open/close cycle. A plain remove is
    // idempotent whichever teardown step runs first.
    el.remove();
  }
}
