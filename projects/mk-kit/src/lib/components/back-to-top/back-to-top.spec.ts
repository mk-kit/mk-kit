import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkBackToTop } from './back-to-top';

describe('MkBackToTop', () => {
  let fixture: ComponentFixture<MkBackToTop>;
  let btt: MkBackToTop;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkBackToTop);
    btt = fixture.componentInstance;
    fixture.componentRef.setInput('threshold', 300);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('is hidden until scrolled past the threshold', () => {
    (btt as any).scrollY.set(100);
    expect((btt as any).visible()).toBe(false);
    (btt as any).scrollY.set(500);
    expect((btt as any).visible()).toBe(true);
  });

  it('scrolls the window to the top', () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      value: scrollTo,
      configurable: true,
    });
    (btt as any).scrollToTop();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
