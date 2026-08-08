import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
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

/** Horizontal movement (px) before a pointer gesture commits to a swipe. */
const SWIPE_START_PX = 30;

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
 * `mkCarouselSlide`; get prev/next arrows, dot indicators, Arrow-key
 * navigation, pointer swipe (touch or mouse drag; vertical page scroll stays
 * native) and optional autoplay that pauses on hover/focus. The current slide
 * is a two-way `index` model.
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
  private readonly document = inject(DOCUMENT);
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
  /**
   * Advance automatically. Pauses transiently on hover/focus/pointer-down and
   * shows a persistent pause/play toggle (`userPaused`). Never runs when the
   * user prefers reduced motion.
   */
  readonly autoplay = input(false, { transform: booleanAttribute });
  /** Autoplay interval in ms. */
  readonly interval = input(5000, { transform: numberAttribute });

  /**
   * Persistent, user-controlled pause (WCAG 2.2.2). Latched by the pause/play
   * toggle; the transient hover/focus pause never overrides it. Two-way so
   * consumers can bind or preset it.
   */
  readonly userPaused = model(false);

  /** Transient pause (hover / focus / pointer held down inside the viewport). */
  protected readonly paused = signal(false);
  /** True while the autoplay interval is actually running. */
  protected readonly playing = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly count = computed(() => this.slides().length);
  protected readonly dots = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i),
  );
  protected readonly liveText = computed(() =>
    this.count() ? this.i18n.slideOf(this.index() + 1, this.count()) : '',
  );
  /**
   * Silence the live region while the slideshow is auto-advancing — otherwise
   * every auto-advance is announced forever. Announce again as soon as the
   * user is in control (paused, latched, or autoplay off).
   */
  protected readonly liveMode = computed(() => (this.playing() ? 'off' : 'polite'));

  /** Resolved text direction ('ltr' until measured in the browser). */
  private readonly dir = signal<'ltr' | 'rtl'>('ltr');

  /** Live swipe gesture, or null when no pointer is being tracked. */
  private swipe: {
    startX: number;
    startY: number;
    startT: number;
    /** True once the gesture committed to a horizontal drag. */
    active: boolean;
  } | null = null;
  /** Visual drag offset (px) applied on top of the slide position. */
  private readonly dragOffset = signal(0);
  /** True while a horizontal drag is in flight (kills the track transition). */
  protected readonly dragging = signal(false);

  /**
   * Track offset — in RTL the flex track lays out right-to-left, so moving to
   * the next slide means translating in the positive X direction. While a
   * swipe is in flight the pixel drag offset rides on top.
   */
  protected readonly trackTransform = computed(() => {
    const sign = this.dir() === 'rtl' ? 1 : -1;
    const base = sign * this.index() * 100;
    const offset = this.dragOffset();
    return offset
      ? `translateX(calc(${base}% + ${offset}px))`
      : `translateX(${base}%)`;
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
        el.setAttribute('aria-label', this.i18n.slideOf(i + 1, this.slides().length));
      });
    });
    // Autoplay lifecycle. Never starts under prefers-reduced-motion — the
    // motion itself must stop, not just the CSS transition.
    effect(() => {
      const on =
        this.autoplay() && !this.paused() && !this.userPaused() && this.count() > 1;
      this.stopTimer();
      const start = on && this.isBrowser && !this.prefersReducedMotion();
      this.playing.set(start);
      if (start) {
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

  /** Latches / releases the persistent pause (the toolbar toggle button). */
  protected toggleUserPause(): void {
    this.userPaused.update((v) => !v);
  }

  /**
   * Touch users can't hover — holding a pointer down pauses autoplay
   * transiently. It also arms swipe tracking, except on the carousel's own
   * controls (play/pause, arrows), which must stay plain tappable buttons.
   */
  protected onPointerDown(event: PointerEvent): void {
    this.pause();
    const target = event.target as HTMLElement | null;
    if (this.count() < 2 || target?.closest?.('button')) return;
    this.swipe = {
      startX: event.clientX ?? 0,
      startY: event.clientY ?? 0,
      startT: performance.now(),
      active: false,
    };
  }

  protected onPointerMove(event: PointerEvent): void {
    const swipe = this.swipe;
    if (!swipe) return;
    const dx = (event.clientX ?? 0) - swipe.startX;
    const dy = (event.clientY ?? 0) - swipe.startY;
    if (!swipe.active) {
      // Mostly vertical — hand the gesture back to native page scroll
      // (touch-action: pan-y keeps that scroll running throughout).
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_START_PX) {
        this.swipe = null;
        return;
      }
      // Commit to a horizontal drag only past the threshold.
      if (Math.abs(dx) < SWIPE_START_PX || Math.abs(dx) <= Math.abs(dy)) return;
      swipe.active = true;
      this.dragging.set(true);
      try {
        // Keep receiving moves when a mouse drag leaves the viewport.
        (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(
          event.pointerId,
        );
      } catch {
        /* jsdom / detached target */
      }
    }
    this.dragOffset.set(dx);
  }

  protected onPointerUp(event: PointerEvent): void {
    // A mouse release while still hovering must not undo the hover pause.
    if (event.pointerType !== 'mouse') this.resume();

    const swipe = this.swipe;
    this.swipe = null;
    if (!swipe?.active) return;
    this.dragging.set(false);
    this.dragOffset.set(0); // springs back / snaps via the track transition

    const viewport = event.currentTarget as HTMLElement | null;
    if (event.type === 'pointercancel') return;

    const dx = (event.clientX ?? 0) - swipe.startX;
    const elapsed = performance.now() - swipe.startT;
    // Velocity only counts for gestures long enough to measure — guards
    // against nonsense values from near-zero durations.
    const velocity = elapsed >= 50 ? dx / elapsed : 0;
    const width = viewport?.offsetWidth || 360;
    if (Math.abs(dx) > width * 0.25 || Math.abs(velocity) > 0.5) {
      // In RTL the track lays out right-to-left, so dragging towards positive
      // X reveals the NEXT slide; in LTR it's the opposite.
      const toNext = this.dir() === 'rtl' ? dx > 0 : dx < 0;
      if (toNext) this.next();
      else this.prev();
    }
    // A real drag happened — swallow the click that follows so links/buttons
    // inside the slide don't activate from a swipe.
    if (viewport) this.suppressNextClick(viewport);
  }

  /**
   * Capture-phase, one-shot click swallow: the browser fires a synthetic click
   * right after pointerup, which would activate whatever link/button the drag
   * ended on. The safety timeout covers gestures that produce no click at all.
   */
  private suppressNextClick(viewport: HTMLElement): void {
    const swallow = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    viewport.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(
      () => viewport.removeEventListener('click', swallow, { capture: true }),
      400,
    );
  }

  private prefersReducedMotion(): boolean {
    return (
      this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
        .matches ?? false
    );
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
