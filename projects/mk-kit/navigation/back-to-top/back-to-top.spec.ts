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

  afterEach(() => {
    vi.restoreAllMocks();
    fixture.destroy();
  });

  const mockWindowScrollTo = () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      value: scrollTo,
      configurable: true,
    });
    return scrollTo;
  };

  // This worker's jsdom has no window.matchMedia to spy on — define a stub
  // (configurable so afterEach can delete the shadow again).
  const mockReducedMotion = (matches: boolean) => {
    const fn = vi.fn().mockReturnValue({ matches } as MediaQueryList);
    Object.defineProperty(window, 'matchMedia', {
      value: fn,
      configurable: true,
    });
    return fn;
  };

  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('is hidden until scrolled past the threshold', () => {
    (btt as any).scrollY.set(100);
    expect((btt as any).visible()).toBe(false);
    (btt as any).scrollY.set(500);
    expect((btt as any).visible()).toBe(true);
  });

  it('scrolls the window to the top', () => {
    const scrollTo = mockWindowScrollTo();
    mockReducedMotion(false);
    (btt as any).scrollToTop();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('scrolls instantly under prefers-reduced-motion even when smooth', () => {
    const scrollTo = mockWindowScrollTo();
    const matchMedia = mockReducedMotion(true);
    (btt as any).scrollToTop();
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('moves focus to the page scroll container after activating', () => {
    mockWindowScrollTo();
    const doc = (document.scrollingElement ??
      document.documentElement) as HTMLElement;
    doc.removeAttribute('tabindex');
    const focus = vi.spyOn(doc, 'focus');

    (btt as any).scrollToTop();

    expect(doc.getAttribute('tabindex')).toBe('-1');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('scrolls and focuses the [target] element instead of the window', () => {
    const target = document.createElement('div');
    const scrollTo = vi.fn();
    (target as any).scrollTo = scrollTo;
    document.body.appendChild(target);
    const focus = vi.spyOn(target, 'focus');

    fixture.componentRef.setInput('target', target);
    fixture.detectChanges();
    (btt as any).scrollToTop();

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: expect.any(String),
    });
    expect(target.getAttribute('tabindex')).toBe('-1');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    target.remove();
  });
});
