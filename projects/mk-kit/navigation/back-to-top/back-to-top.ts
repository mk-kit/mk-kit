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
import { MK_I18N } from '@mkornas/ui/core';

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
  protected readonly i18n = inject(MK_I18N);

  /** Scroll distance (px) before the button appears. */
  readonly threshold = input(400);
  /** Optional scroll container; defaults to the window. */
  readonly target = input<HTMLElement | null>(null);
  /** Accessible label. */
  readonly ariaLabel = input(this.i18n.backToTop);
  /**
   * Smooth-scroll on click. Ignored under `prefers-reduced-motion: reduce`
   * (programmatic `scrollTo` is not toned down by browsers, so the component
   * falls back to an instant jump itself).
   */
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
    const behavior: ScrollBehavior =
      this.smooth() && !this.prefersReducedMotion() ? 'smooth' : 'auto';
    if (el) {
      el.scrollTo({ top: 0, behavior });
      this.focusScrollTarget(el);
    } else {
      this.document.defaultView?.scrollTo({ top: 0, behavior });
      const doc = (this.document.scrollingElement ??
        this.document.documentElement) as HTMLElement | null;
      if (doc) this.focusScrollTarget(doc);
    }
  }

  /**
   * Once the page is back at the top the button hides itself, which would
   * silently drop keyboard focus on `<body>` (WCAG 2.4.3). Move focus to the
   * scroll container instead, so the tab sequence resumes from the top.
   */
  private focusScrollTarget(el: HTMLElement): void {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }

  /** `prefers-reduced-motion: reduce`, SSR-safe. */
  private prefersReducedMotion(): boolean {
    const win = this.document.defaultView;
    return (
      !!win &&
      typeof win.matchMedia === 'function' &&
      win.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  ngOnDestroy(): void {
    this.scrollSource?.removeEventListener('scroll', this.onScroll);
  }
}
