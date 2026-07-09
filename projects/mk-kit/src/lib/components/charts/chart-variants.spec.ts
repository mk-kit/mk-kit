import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkBarChart } from './bar-chart';
import { MkLineChart } from './line-chart';

describe('MkBarChart orientation', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  function make(orientation: 'vertical' | 'horizontal') {
    const f = TestBed.createComponent(MkBarChart);
    f.componentRef.setInput('categories', ['A', 'B']);
    f.componentRef.setInput('series', [{ name: 'S', data: [10, 20] }]);
    f.componentRef.setInput('orientation', orientation);
    f.componentRef.setInput('width', 400);
    f.componentRef.setInput('height', 200);
    f.detectChanges();
    return f;
  }

  it('vertical bars grow upward (height scales with value)', () => {
    const f = make('vertical');
    const bars = (f.componentInstance as any).bars();
    expect(bars).toHaveLength(2);
    // Larger value → taller bar.
    expect(bars[1].h).toBeGreaterThan(bars[0].h);
    // Same bar width for both.
    expect(bars[0].w).toBeCloseTo(bars[1].w);
    f.destroy();
  });

  it('horizontal bars grow rightward (width scales with value)', () => {
    const f = make('horizontal');
    const bars = (f.componentInstance as any).bars();
    const plot = (f.componentInstance as any).plot();
    expect(bars).toHaveLength(2);
    // Both bars start at the value-axis origin (left).
    expect(bars[0].x).toBeCloseTo(plot.x);
    // Larger value → wider bar; same bar thickness (height).
    expect(bars[1].w).toBeGreaterThan(bars[0].w);
    expect(bars[0].h).toBeCloseTo(bars[1].h);
    f.destroy();
  });
});

describe('MkLineChart stacked area', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  it('stacks series cumulatively and fills the areas', () => {
    const f = TestBed.createComponent(MkLineChart);
    f.componentRef.setInput('categories', ['x', 'y']);
    f.componentRef.setInput('series', [
      { name: 'A', data: [1, 2] },
      { name: 'B', data: [3, 4] },
    ]);
    f.componentRef.setInput('stacked', true);
    f.detectChanges();
    const cmp = f.componentInstance as any;
    expect(cmp.fillAreas()).toBe(true);
    const rendered = cmp.rendered();
    // Top series (B) sits above A → smaller y (cumulative 4 vs 1 at x=0).
    expect(rendered[1].points[0].y).toBeLessThan(rendered[0].points[0].y);
    // Both series carry a filled area path.
    expect(rendered[0].area).toContain('Z');
    expect(rendered[1].area).toContain('Z');
    f.destroy();
  });
});
