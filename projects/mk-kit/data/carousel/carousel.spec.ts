import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkCarousel, MkCarouselSlide } from './carousel';

@Component({
  imports: [MkCarousel, MkCarouselSlide],
  template: `<mk-carousel [loop]="loop()">
    <div mkCarouselSlide>A</div>
    <div mkCarouselSlide>B</div>
    <div mkCarouselSlide>C</div>
  </mk-carousel>`,
})
class Host {
  readonly loop = signal(true);
}

describe('MkCarousel', () => {
  let fixture: ComponentFixture<Host>;
  let carousel: MkCarousel;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    carousel = fixture.debugElement.children[0].componentInstance;
  });

  afterEach(() => fixture.destroy());

  it('counts the projected slides', () => {
    expect((carousel as any).count()).toBe(3);
  });

  it('next / prev move the index', () => {
    carousel.next();
    expect(carousel.index()).toBe(1);
    carousel.prev();
    expect(carousel.index()).toBe(0);
  });

  it('wraps around when loop is enabled', () => {
    carousel.prev();
    expect(carousel.index()).toBe(2);
    carousel.next();
    expect(carousel.index()).toBe(0);
  });

  it('clamps at the ends when loop is disabled', async () => {
    fixture.componentInstance.loop.set(false);
    await fixture.whenStable();
    carousel.prev();
    expect(carousel.index()).toBe(0);
    carousel.goTo(99);
    expect(carousel.index()).toBe(2);
  });

  it('marks non-active slides hidden + inert', () => {
    const slides = fixture.nativeElement.querySelectorAll('[mkCarouselSlide]');
    expect(slides[0].getAttribute('aria-hidden')).toBe('false');
    expect(slides[1].getAttribute('aria-hidden')).toBe('true');
    expect(slides[1].hasAttribute('inert')).toBe(true);
  });

  it('labels slides via i18n slideOf', () => {
    const slides = fixture.nativeElement.querySelectorAll('[mkCarouselSlide]');
    expect(slides[0].getAttribute('aria-label')).toBe('Slide 1 of 3');
    expect(slides[2].getAttribute('aria-label')).toBe('Slide 3 of 3');
  });
});

@Component({
  imports: [MkCarousel, MkCarouselSlide],
  template: `<mk-carousel autoplay [interval]="60000">
    <div mkCarouselSlide>A</div>
    <div mkCarouselSlide>B</div>
    <div mkCarouselSlide>C</div>
  </mk-carousel>`,
})
class AutoplayHost {}

describe('MkCarousel autoplay', () => {
  let fixture: ComponentFixture<AutoplayHost>;
  let carousel: MkCarousel;

  const create = async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(AutoplayHost);
    fixture.detectChanges();
    await fixture.whenStable();
    carousel = fixture.debugElement.children[0].componentInstance;
  };

  const playing = () => (carousel as any).playing() as boolean;
  const viewport = () =>
    fixture.nativeElement.querySelector('.mk-carousel__viewport') as HTMLElement;
  const liveRegion = () =>
    fixture.nativeElement.querySelector('.mk-visually-hidden') as HTMLElement;

  afterEach(() => {
    fixture?.destroy();
    delete (window as any).matchMedia;
  });

  it('runs the interval while autoplaying', async () => {
    await create();
    expect(playing()).toBe(true);
  });

  it('renders a persistent pause toggle first inside the region', async () => {
    await create();
    const button = viewport().querySelector<HTMLButtonElement>('.mk-carousel__playpause')!;
    expect(button).toBeTruthy();
    // First in tab order inside the carousel region.
    expect(viewport().querySelector('button')).toBe(button);
    expect(button.getAttribute('aria-label')).toBe('Pause slideshow');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    await fixture.whenStable();
    expect(carousel.userPaused()).toBe(true);
    expect(playing()).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Play slideshow');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the userPaused latch through transient hover pause/resume', async () => {
    await create();
    carousel.userPaused.set(true);
    await fixture.whenStable();
    expect(playing()).toBe(false);

    // Hover in and out — the focus/hover resume must NOT override the latch.
    viewport().dispatchEvent(new Event('mouseenter'));
    viewport().dispatchEvent(new Event('mouseleave'));
    await fixture.whenStable();
    expect(playing()).toBe(false);

    carousel.userPaused.set(false);
    await fixture.whenStable();
    expect(playing()).toBe(true);
  });

  it('silences the live region while autoplaying, announces otherwise', async () => {
    await create();
    expect(liveRegion().getAttribute('aria-live')).toBe('off');
    expect(liveRegion().textContent).toContain('Slide 1 of 3');

    carousel.userPaused.set(true);
    await fixture.whenStable();
    expect(liveRegion().getAttribute('aria-live')).toBe('polite');
  });

  it('does not start autoplay under prefers-reduced-motion', async () => {
    (window as any).matchMedia = vi.fn().mockReturnValue({ matches: true });
    await create();
    expect(playing()).toBe(false);
    expect(liveRegion().getAttribute('aria-live')).toBe('polite');
  });

  it('pauses transiently on pointerdown and resumes on pointerup', async () => {
    await create();
    viewport().dispatchEvent(new Event('pointerdown'));
    await fixture.whenStable();
    expect(playing()).toBe(false);
    expect(carousel.userPaused()).toBe(false);

    viewport().dispatchEvent(new Event('pointerup'));
    await fixture.whenStable();
    expect(playing()).toBe(true);
  });
});
