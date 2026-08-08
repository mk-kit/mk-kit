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

  /** Scroll measurement is rAF-coalesced — wait one frame for it to land. */
  function frame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  /** Fake read-only scroll metrics on the viewport and fire a scroll event. */
  const mockMetrics = async (m: Partial<Record<string, number>>): Promise<void> => {
    const view = viewport();
    for (const [key, value] of Object.entries(m)) {
      Object.defineProperty(view, key, { value, configurable: true });
    }
    view.dispatchEvent(new Event('scroll'));
    await frame();
  };

  it('computes the vertical thumb size from clientHeight / scrollHeight', async () => {
    await mockMetrics({ scrollHeight: 400, clientHeight: 100, scrollTop: 0 });
    // 100 / 400 → thumb occupies 25% of the track.
    expect((cmp as any).vThumbSize()).toBeCloseTo(0.25);
  });

  it('computes the vertical thumb offset from scrollTop / range', async () => {
    await mockMetrics({ scrollHeight: 400, clientHeight: 100, scrollTop: 150 });
    // scrollTop 150 of a (400 - 100 =) 300 range → 50% down the track.
    expect((cmp as any).vThumbOffset()).toBeCloseTo(0.5);
  });

  it('clamps the offset within [0, 1]', async () => {
    await mockMetrics({ scrollHeight: 400, clientHeight: 100, scrollTop: 999 });
    expect((cmp as any).vThumbOffset()).toBe(1);
  });

  it('marks the viewport scrollable only when content overflows', async () => {
    await mockMetrics({ scrollHeight: 400, clientHeight: 100 });
    expect((cmp as any).vScrollable()).toBe(true);
    await mockMetrics({ scrollHeight: 100, clientHeight: 100 });
    expect((cmp as any).vScrollable()).toBe(false);
  });

  it('coalesces a burst of scroll events into one measurement batch', async () => {
    await frame(); // let any pending frame from the initial render settle
    const rafCallbacks: FrameRequestCallback[] = [];
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });
    const measure = vi.spyOn(cmp as any, 'measure');

    const view = viewport();
    for (let i = 0; i < 6; i++) view.dispatchEvent(new Event('scroll'));

    // Six raw events do no synchronous reads; the flush measures once.
    // (rAF call counts can't be asserted — Angular's zoneless scheduler
    // also books frames on the same spied global.)
    expect(measure).not.toHaveBeenCalled();
    for (const cb of rafCallbacks.splice(0)) cb(performance.now());
    expect(measure).toHaveBeenCalledTimes(1);

    // The next burst after a flush schedules a fresh frame.
    view.dispatchEvent(new Event('scroll'));
    for (const cb of rafCallbacks.splice(0)) cb(performance.now());
    expect(measure).toHaveBeenCalledTimes(2);

    // Leave no captured-but-unfired callbacks behind: a swallowed scheduler
    // frame would wedge every later `whenStable()` in this file.
    for (const cb of rafCallbacks.splice(0)) cb(performance.now());
    raf.mockRestore();
  });

  it('exposes a horizontal bar for horizontal orientation', async () => {
    fixture.componentRef.setInput('orientation', 'horizontal');
    await mockMetrics({ scrollWidth: 400, clientWidth: 100, scrollLeft: 50 });
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
