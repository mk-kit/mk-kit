import {
  Directive,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * InfiniteScroll — emits `(mkInfiniteScroll)` when the host scroll container is
 * scrolled within `distance` px of its bottom, so a list can load its next
 * page. Apply it to the scrollable element (`overflow: auto`). It fires once per
 * approach and re-arms after you scroll back up past the threshold, so a single
 * gesture never triggers repeated loads. Set `disabled` while a page is loading
 * or once everything is loaded.
 *
 * ```html
 * <div class="feed" mkInfiniteScroll [disabled]="loading() || done()"
 *      (mkInfiniteScroll)="loadMore()">
 *   @for (item of items(); track item.id) { … }
 * </div>
 * ```
 */
@Directive({
  selector: '[mkInfiniteScroll]',
  exportAs: 'mkInfiniteScroll',
})
export class MkInfiniteScroll {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Distance (px) from the bottom at which the output fires. */
  readonly distance = input(200, { transform: numberAttribute });
  /** Pause firing (e.g. while a page is loading or all items are loaded). */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emitted when the host is scrolled near its bottom. */
  readonly mkInfiniteScroll = output<void>();

  /** Whether the next bottom-approach is allowed to fire. */
  private armed = true;

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      this.host.nativeElement.addEventListener('scroll', this.onScroll, {
        passive: true,
      });
      // Fire immediately if the initial content doesn't fill the container.
      this.check();
    }, { injector: this.injector });
  }

  private readonly onScroll = (): void => this.check();

  private check(): void {
    const el = this.host.nativeElement;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining > this.distance()) {
      // Scrolled away from the bottom — allow the next approach to fire.
      this.armed = true;
      return;
    }
    if (!this.armed || this.disabled()) return;
    this.armed = false;
    this.mkInfiniteScroll.emit();
  }

  ngOnDestroy(): void {
    this.host.nativeElement.removeEventListener('scroll', this.onScroll);
  }
}
