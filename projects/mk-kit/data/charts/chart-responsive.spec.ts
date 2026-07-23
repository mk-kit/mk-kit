import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkBarChart } from './bar-chart';
import { MkLineChart } from './line-chart';

/**
 * The charts draw into a viewBox while the stylesheet sets
 * `width: 100%; height: auto`, so the rendered height used to be
 * `containerWidth × (viewBoxHeight / viewBoxWidth)` — unbounded. A full-width
 * chart on a wide monitor measured over 2000px tall.
 *
 * `responsive` (default on) re-derives the viewBox width from the measured host
 * so `height` means pixels. jsdom has no layout, so ResizeObserver never
 * reports a width here — which is exactly the pre-measurement path these tests
 * pin: the declared `width` must remain the fallback, and `responsive="false"`
 * must keep the drawing pinned to it.
 */
describe('chart responsive sizing', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  function bar(responsive?: boolean) {
    const f = TestBed.createComponent(MkBarChart);
    f.componentRef.setInput('categories', ['A', 'B']);
    f.componentRef.setInput('series', [{ name: 'S', data: [1, 2] }]);
    f.componentRef.setInput('width', 400);
    f.componentRef.setInput('height', 200);
    if (responsive !== undefined) {
      f.componentRef.setInput('responsive', responsive);
    }
    f.detectChanges();
    return f;
  }

  it('defaults to responsive', () => {
    expect(bar().componentInstance.responsive()).toBe(true);
  });

  it('falls back to the declared width before the host is measured', () => {
    const f = bar();
    expect((f.componentInstance as any).drawWidth()).toBe(400);
  });

  it('pins the drawing to `width` when responsive is off', () => {
    const f = bar(false);
    expect((f.componentInstance as any).drawWidth()).toBe(400);
  });

  it('drives the viewBox from the drawing width, not the raw input', () => {
    const f = bar();
    const svg: SVGElement = f.nativeElement.querySelector('svg');
    // height stays exactly as declared — that is the whole point of the fix
    expect(svg.getAttribute('viewBox')).toBe('0 0 400 200');
  });

  it('applies to the line chart too', () => {
    const f = TestBed.createComponent(MkLineChart);
    f.componentRef.setInput('categories', ['A', 'B']);
    f.componentRef.setInput('series', [{ name: 'S', data: [1, 2] }]);
    f.componentRef.setInput('width', 640);
    f.componentRef.setInput('height', 240);
    f.detectChanges();
    expect(f.componentInstance.responsive()).toBe(true);
    expect(
      f.nativeElement.querySelector('svg').getAttribute('viewBox'),
    ).toBe('0 0 640 240');
  });

  it('geometry still scales with the drawing width', () => {
    const narrow = bar(false);
    const narrowBars = (narrow.componentInstance as any).bars();
    const wide = TestBed.createComponent(MkBarChart);
    wide.componentRef.setInput('categories', ['A', 'B']);
    wide.componentRef.setInput('series', [{ name: 'S', data: [1, 2] }]);
    wide.componentRef.setInput('width', 1200);
    wide.componentRef.setInput('height', 200);
    wide.componentRef.setInput('responsive', false);
    wide.detectChanges();
    const wideBars = (wide.componentInstance as any).bars();
    expect(wideBars[0].w).toBeGreaterThan(narrowBars[0].w);
  });
});
