import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MK_I18N } from '@mkornas/ui/core';

/**
 * A single slide inside {@link MkCarousel}. Mark each slide element with
 * `mkCarouselSlide`; the carousel wires ARIA + visibility.
 */
@Directive({
  selector: '[mkCarouselSlide]',
  host: {
    class: 'mk-carousel__slide',
    role: 'group',
    'aria-roledescription': 'slide',
  },
})
export class MkCarouselSlide {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
}

/**
 * Carousel — an accessible slides/gallery. Project slides marked with
 * `mkCarouselSlide`; get prev/next arrows, dot indicators, Arrow-key navigation
 * and optional autoplay that pauses on hover/focus. The current slide is a
 * two-way `index` model.
 *
 * ```html
 * <mk-carousel ariaLabel="Featured" autoplay>
 *   <div mkCarouselSlide>…</div>
 *   <div mkCarouselSlide>…</div>
 * </mk-carousel>
 * ```
 */
@Component({
  selector: 'mk-carousel',
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-carousel' },
})
export class MkCarousel {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly slides = contentChildren(MkCarouselSlide);
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** Two-way current slide index. */
  readonly index = model(0);
  /** Accessible label for the carousel region. */
  readonly ariaLabel = input(this.i18n.carouselLabel);
  /** Wrap around at the ends. */
  readonly loop = input(true, { transform: booleanAttribute });
  /** Show the dot indicators. */
  readonly showDots = input(true, { transform: booleanAttribute });
  /** Show the prev/next arrows. */
  readonly showArrows = input(true, { transform: booleanAttribute });
  /** Advance automatically (pauses on hover/focus). */
  readonly autoplay = input(false, { transform: booleanAttribute });
  /** Autoplay interval in ms. */
  readonly interval = input(5000, { transform: numberAttribute });

  protected readonly paused = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly count = computed(() => this.slides().length);
  protected readonly dots = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i),
  );
  protected readonly liveText = computed(() =>
    this.count() ? `Slide ${this.index() + 1} of ${this.count()}` : '',
  );

  /** Resolved text direction ('ltr' until measured in the browser). */
  private readonly dir = signal<'ltr' | 'rtl'>('ltr');
  /**
   * Track offset — in RTL the flex track lays out right-to-left, so moving to
   * the next slide means translating in the positive X direction.
   */
  protected readonly trackTransform = computed(() => {
    const sign = this.dir() === 'rtl' ? 1 : -1;
    return `translateX(${sign * this.index() * 100}%)`;
  });

  constructor() {
    afterNextRender(() => {
      const { direction } = getComputedStyle(this.host.nativeElement);
      this.dir.set(direction === 'rtl' ? 'rtl' : 'ltr');
    });
    // Reflect the active slide onto each slide element (visibility + a11y).
    effect(() => {
      const active = this.index();
      this.slides().forEach((slide, i) => {
        const el = slide.el.nativeElement;
        const hidden = i !== active;
        el.setAttribute('aria-hidden', String(hidden));
        if (hidden) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
        el.setAttribute('aria-label', `${i + 1} of ${this.slides().length}`);
      });
    });
    // Autoplay lifecycle.
    effect(() => {
      const on = this.autoplay() && !this.paused() && this.count() > 1;
      this.stopTimer();
      if (on && this.isBrowser) {
        this.timer = setInterval(() => this.next(), this.interval());
      }
    });
  }

  /** Go to slide `i` (clamped, or wrapped when `loop`). */
  goTo(i: number): void {
    const count = this.count();
    if (count === 0) return;
    if (this.loop()) {
      this.index.set((i + count) % count);
    } else {
      this.index.set(Math.max(0, Math.min(count - 1, i)));
    }
  }

  next(): void {
    this.goTo(this.index() + 1);
  }

  prev(): void {
    this.goTo(this.index() - 1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  protected pause(): void {
    this.paused.set(true);
  }
  protected resume(): void {
    this.paused.set(false);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
