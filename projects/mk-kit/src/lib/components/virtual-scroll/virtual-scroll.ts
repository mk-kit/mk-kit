import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';

/**
 * VirtualScroll — renders only the rows visible in the viewport (plus a small
 * overscan), so a list of thousands of fixed-height items stays smooth. Give
 * the host a height and provide a row template:
 *
 * ```html
 * <mk-virtual-scroll [items]="rows" [itemHeight]="40" style="height: 20rem;">
 *   <ng-template let-row let-i="index">{{ i }} — {{ row.name }}</ng-template>
 * </mk-virtual-scroll>
 * ```
 */
@Component({
  selector: 'mk-virtual-scroll',
  templateUrl: './virtual-scroll.html',
  styleUrl: './virtual-scroll.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: { class: 'mk-virtual-scroll' },
})
export class MkVirtualScroll {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly viewportRef =
    viewChild<ElementRef<HTMLElement>>('viewport');

  /** The full list of items. */
  readonly items = input<readonly unknown[]>([]);
  /** Fixed height of each row in px. */
  readonly itemHeight = input(40, { transform: numberAttribute });
  /** Extra rows rendered above/below the viewport to smooth fast scrolls. */
  readonly overscan = input(4, { transform: numberAttribute });

  /** The row template (`<ng-template let-item let-i="index">`). */
  protected readonly template = contentChild(TemplateRef);

  protected readonly scrollTop = signal(0);
  protected readonly viewportHeight = signal(0);

  /** Total scrollable height (sizes the scrollbar). */
  protected readonly totalHeight = computed(
    () => this.items().length * this.itemHeight(),
  );

  /**
   * The [start, end) index window currently rendered. Custom equality means
   * per-pixel scrolling only re-renders when the window actually shifts.
   */
  private readonly range = computed(
    () => {
      const ih = this.itemHeight() || 1;
      const count = this.items().length;
      const visible = Math.ceil(this.viewportHeight() / ih);
      const start = Math.max(0, Math.floor(this.scrollTop() / ih) - this.overscan());
      const end = Math.min(count, start + visible + this.overscan() * 2);
      return { start, end };
    },
    { equal: (a, b) => a.start === b.start && a.end === b.end },
  );

  /** Offset of the first rendered row from the top. */
  protected readonly offset = computed(() => this.range().start * this.itemHeight());

  /** The rendered slice, each with its absolute index. */
  protected readonly visibleItems = computed(() => {
    const { start, end } = this.range();
    return this.items()
      .slice(start, end)
      .map((item, i) => ({ item, index: start + i }));
  });

  constructor() {
    afterNextRender(() => {
      this.measure();
      const view = this.viewportRef()?.nativeElement;
      if (view && this.isBrowser && 'ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => this.measure());
        this.resizeObserver.observe(view);
      }
    });
  }

  private resizeObserver?: ResizeObserver;

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private measure(): void {
    const view = this.viewportRef()?.nativeElement;
    if (view) this.viewportHeight.set(view.clientHeight);
  }

  protected onScroll(event: Event): void {
    this.scrollTop.set((event.target as HTMLElement).scrollTop);
  }
}
