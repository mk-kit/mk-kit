import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkScrollArea } from './scroll-area';

describe('MkScrollArea', () => {
  let fixture: ComponentFixture<MkScrollArea>;
  let cmp: MkScrollArea;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkScrollArea);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const viewport = (): HTMLElement =>
    fixture.nativeElement.querySelector('.mk-scroll-area__viewport');

  /** Fake read-only scroll metrics on the viewport and fire a scroll event. */
  const mockMetrics = (m: Partial<Record<string, number>>): void => {
    const view = viewport();
    for (const [key, value] of Object.entries(m)) {
      Object.defineProperty(view, key, { value, configurable: true });
    }
    view.dispatchEvent(new Event('scroll'));
  };

  it('computes the vertical thumb size from clientHeight / scrollHeight', () => {
    mockMetrics({ scrollHeight: 400, clientHeight: 100, scrollTop: 0 });
    // 100 / 400 → thumb occupies 25% of the track.
    expect((cmp as any).vThumbSize()).toBeCloseTo(0.25);
  });

  it('computes the vertical thumb offset from scrollTop / range', () => {
    mockMetrics({ scrollHeight: 400, clientHeight: 100, scrollTop: 150 });
    // scrollTop 150 of a (400 - 100 =) 300 range → 50% down the track.
    expect((cmp as any).vThumbOffset()).toBeCloseTo(0.5);
  });

  it('clamps the offset within [0, 1]', () => {
    mockMetrics({ scrollHeight: 400, clientHeight: 100, scrollTop: 999 });
    expect((cmp as any).vThumbOffset()).toBe(1);
  });

  it('marks the viewport scrollable only when content overflows', () => {
    mockMetrics({ scrollHeight: 400, clientHeight: 100 });
    expect((cmp as any).vScrollable()).toBe(true);
    mockMetrics({ scrollHeight: 100, clientHeight: 100 });
    expect((cmp as any).vScrollable()).toBe(false);
  });

  it('exposes a horizontal bar for horizontal orientation', () => {
    fixture.componentRef.setInput('orientation', 'horizontal');
    mockMetrics({ scrollWidth: 400, clientWidth: 100, scrollLeft: 50 });
    fixture.detectChanges();

    expect((cmp as any).showHorizontal()).toBe(true);
    expect((cmp as any).showVertical()).toBe(false);
    expect((cmp as any).hThumbSize()).toBeCloseTo(0.25);
    expect((cmp as any).hThumbOffset()).toBeCloseTo(50 / 300);
    expect(
      fixture.nativeElement.querySelector(
        '.mk-scroll-area__scrollbar--horizontal',
      ),
    ).toBeTruthy();
  });

  it('always shows the bars when hideDelay is 0', () => {
    fixture.componentRef.setInput('hideDelay', 0);
    expect((cmp as any).barsVisible()).toBe(true);
  });

  it('exposes a labelled region only when ariaLabel is set', () => {
    // Default: no role, no aria-label (but still focusable).
    expect(viewport().getAttribute('role')).toBeNull();
    expect(viewport().getAttribute('aria-label')).toBeNull();
    expect(viewport().getAttribute('tabindex')).toBe('0');

    fixture.componentRef.setInput('ariaLabel', 'Release notes');
    fixture.detectChanges();
    expect(viewport().getAttribute('role')).toBe('region');
    expect(viewport().getAttribute('aria-label')).toBe('Release notes');
  });
});
