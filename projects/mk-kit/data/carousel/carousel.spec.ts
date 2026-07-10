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
});
