import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkScatterChart, type MkScatterSeries } from './scatter-chart';
import { MkHeatmap } from './heatmap';

describe('MkScatterChart', () => {
  let fixture: ComponentFixture<MkScatterChart>;
  let chart: MkScatterChart;

  const series: MkScatterSeries[] = [
    { name: 'A', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
    { name: 'B', points: [{ x: 5, y: 20, size: 100 }] },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkScatterChart);
    chart = fixture.componentInstance;
    fixture.componentRef.setInput('series', series);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders every point across all series', () => {
    expect((chart as any).points()).toHaveLength(3);
  });

  it('maps larger y values to smaller cy (screen-inverted axis)', () => {
    const pts = (chart as any).points();
    const low = pts.find((p: any) => p.y === 0);
    const high = pts.find((p: any) => p.y === 20);
    expect(high.cy).toBeLessThan(low.cy);
  });

  it('uses a fixed radius unless bubble sizing is enabled', () => {
    fixture.componentRef.setInput('pointRadius', 5);
    expect((chart as any).points().every((p: any) => p.r === 5)).toBe(true);

    fixture.componentRef.setInput('bubble', true);
    const radii = (chart as any).points().map((p: any) => p.r);
    // Distinct radii once sizing by value.
    expect(new Set(radii).size).toBeGreaterThan(1);
  });

  it('shows the legend for multiple series', () => {
    expect((chart as any).legendVisible()).toBe(true);
    expect((chart as any).legend()).toHaveLength(2);
  });

  it('builds a tooltip for the hovered point', () => {
    (chart as any).setHover((chart as any).keyOf(2)); // series B point
    const t = (chart as any).tooltip();
    expect(t.title).toBe('B');
    expect(t.y).toBe('20');
  });
});

describe('MkHeatmap', () => {
  let fixture: ComponentFixture<MkHeatmap>;
  let heat: MkHeatmap;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkHeatmap);
    heat = fixture.componentInstance;
    fixture.componentRef.setInput('xLabels', ['Mon', 'Tue']);
    fixture.componentRef.setInput('yLabels', ['AM', 'PM']);
    fixture.componentRef.setInput('data', [
      [0, 10],
      [5, null],
    ]);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('builds a row per yLabel and a cell per xLabel', () => {
    const rows = (heat as any).rows();
    expect(rows).toHaveLength(2);
    expect(rows[0].cells).toHaveLength(2);
    expect(rows[0].label).toBe('AM');
    expect(rows[0].cells[1].xLabel).toBe('Tue');
  });

  it('mixes more accent into higher values and flags strong cells', () => {
    const rows = (heat as any).rows();
    // Domain is [0, 10]; the max cell is fully strong, the min is not.
    expect(rows[0].cells[0].bg).toContain('0%'); // value 0
    expect(rows[0].cells[1].bg).toContain('100%'); // value 10
    expect(rows[0].cells[1].strong).toBe(true);
    expect(rows[0].cells[0].strong).toBe(false);
  });

  it('renders null cells as blank and transparent', () => {
    const rows = (heat as any).rows();
    const blank = rows[1].cells[1];
    expect(blank.value).toBeNull();
    expect(blank.bg).toBe('transparent');
    expect(blank.display).toBe('');
  });

  it('exposes a legend scale spanning the data domain', () => {
    const scale = (heat as any).scaleStops();
    expect(scale.min).toBe('0');
    expect(scale.max).toBe('10');
    expect(scale.swatches).toHaveLength(5);
  });

  it('exposes the scroll wrapper as a focusable named region', () => {
    const scroll = (fixture.nativeElement as HTMLElement).querySelector(
      '.mk-heatmap__scroll',
    )!;
    expect(scroll.getAttribute('tabindex')).toBe('0');
    expect(scroll.getAttribute('role')).toBe('region');
    expect(scroll.getAttribute('aria-label')).toBe(
      'Heatmap, 2 rows by 2 columns',
    );
  });

  it('exposes cell values to AT even when showValues is off', () => {
    const el: HTMLElement = fixture.nativeElement;
    // showValues defaults to false → values live in visually-hidden spans.
    const hidden = el.querySelectorAll('.mk-heatmap__cell .mk-visually-hidden');
    expect(hidden).toHaveLength(3); // 4 cells, one is null
    expect(hidden[0].textContent?.trim()).toBe('0');

    fixture.componentRef.setInput('showValues', true);
    fixture.detectChanges();
    expect(el.querySelectorAll('.mk-heatmap__cell .mk-visually-hidden')).toHaveLength(0);
    expect(el.querySelectorAll('.mk-heatmap__value')).toHaveLength(3);
  });
});
