import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * BackToTop — a floating button that appears once the page (or a scroll target)
 * has scrolled past `threshold`, and smooth-scrolls back to the top on click.
 *
 * ```html
 * <mk-back-to-top [threshold]="600" />
 * ```
 * Pass `[target]` to watch/scroll a specific scroll container instead of the
 * window.
 */
@Component({
  selector: 'mk-back-to-top',
  templateUrl: './back-to-top.html',
  styleUrl: './back-to-top.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-back-to-top',
    '[class.mk-back-to-top--visible]': 'visible()',
    '[attr.hidden]': 'visible() ? null : ""',
  },
})
export class MkBackToTop {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Scroll distance (px) before the button appears. */
  readonly threshold = input(400);
  /** Optional scroll container; defaults to the window. */
  readonly target = input<HTMLElement | null>(null);
  /** Accessible label. */
  readonly ariaLabel = input('Back to top');
  /** Smooth-scroll on click (respects reduced-motion by browser). */
  readonly smooth = input(true, { transform: booleanAttribute });

  private readonly scrollY = signal(0);
  protected readonly visible = computed(() => this.scrollY() > this.threshold());

  private scrollSource?: EventTarget;

  private readonly onScroll = (): void => {
    const el = this.target();
    this.scrollY.set(
      el
        ? el.scrollTop
        : (this.document.defaultView?.scrollY ??
          this.document.documentElement.scrollTop),
    );
  };

  constructor() {
    // afterNextRender runs after inputs are bound, so `target()` is resolved.
    afterNextRender(() => {
      if (!this.isBrowser) return;
      this.scrollSource = this.target() ?? this.document.defaultView ?? undefined;
      this.scrollSource?.addEventListener('scroll', this.onScroll, {
        passive: true,
      });
      this.onScroll();
    });
  }

  protected scrollToTop(): void {
    const el = this.target();
    const behavior: ScrollBehavior = this.smooth() ? 'smooth' : 'auto';
    if (el) {
      el.scrollTo({ top: 0, behavior });
    } else {
      this.document.defaultView?.scrollTo({ top: 0, behavior });
    }
  }

  ngOnDestroy(): void {
    this.scrollSource?.removeEventListener('scroll', this.onScroll);
  }
}
