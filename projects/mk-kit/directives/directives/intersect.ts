import {
  DOCUMENT,
  Directive,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Intersect — a thin `IntersectionObserver` wrapper. Emits `(mkIntersect)` with
 * the host's visibility whenever it enters or leaves the viewport (or `root`),
 * and exposes an `intersecting` signal via `exportAs`. Set `once` to fire a
 * single time and disconnect — the primitive for reveal-on-scroll animations
 * and lazy loading.
 *
 * ```html
 * <img [attr.src]="loaded() ? src : null" mkIntersect once
 *      (mkIntersect)="loaded.set(true)" />
 *
 * <div mkIntersect #io="mkIntersect" [class.in-view]="io.intersecting()">…</div>
 * ```
 */
@Directive({
  selector: '[mkIntersect]',
  exportAs: 'mkIntersect',
})
export class MkIntersect {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Element used as the viewport for the check (defaults to the browser one). */
  readonly root = input<HTMLElement | null>(null);
  /** Margin grown/shrunk around the root before computing intersection. */
  readonly rootMargin = input('0px');
  /** Visibility ratio(s) at which the observer fires. */
  readonly threshold = input<number | number[]>(0);
  /** Emit the first time the host becomes visible, then disconnect. */
  readonly once = input(false, { transform: booleanAttribute });

  /** Emits the host's `isIntersecting` state on every change. */
  readonly mkIntersect = output<boolean>();
  /** The current visibility, also readable via `exportAs`. */
  readonly intersecting = signal(false);

  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser || typeof IntersectionObserver === 'undefined') return;
      this.observer = new IntersectionObserver(
        (entries) => this.onEntries(entries),
        {
          root: this.root(),
          rootMargin: this.rootMargin(),
          threshold: this.threshold(),
        },
      );
      this.observer.observe(this.host.nativeElement);
    }, { injector: this.injector });
  }

  private onEntries(entries: IntersectionObserverEntry[]): void {
    // Ignore any callback queued before we disconnected (e.g. after `once`).
    if (!this.observer) return;
    const entry = entries[entries.length - 1];
    const visible = entry.isIntersecting;
    if (visible === this.intersecting()) return;
    this.intersecting.set(visible);
    this.mkIntersect.emit(visible);
    if (visible && this.once()) this.disconnect();
  }

  private disconnect(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
