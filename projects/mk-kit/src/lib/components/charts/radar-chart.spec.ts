import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkRadarChart } from './radar-chart';
import type { MkChartSeries } from './chart-utils';

describe('MkRadarChart', () => {
  let fixture: ComponentFixture<MkRadarChart>;
  let chart: MkRadarChart;

  const series: MkChartSeries[] = [
    { name: 'A', data: [10, 0, 5, 5] },
    { name: 'B', data: [2, 8, 4, 6] },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkRadarChart);
    chart = fixture.componentInstance;
    fixture.componentRef.setInput('axes', ['N', 'E', 'S', 'W']);
    fixture.componentRef.setInput('series', series);
    fixture.componentRef.setInput('width', 200);
    fixture.componentRef.setInput('height', 200);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders one polygon per series with a vertex per axis', () => {
    const rendered = (chart as any).rendered();
    expect(rendered).toHaveLength(2);
    expect(rendered[0].points).toHaveLength(4);
    // Polygon string has 4 "x,y" pairs.
    expect(rendered[0].polygon.split(' ')).toHaveLength(4);
  });

  it('places a max-value vertex on the ring and a zero vertex at the centre', () => {
    const [ptN] = (chart as any).rendered()[0].points; // A[0] = 10 (max) at top
    const centre = { x: 100, y: 100 };
    // North axis points straight up: same x as centre, y above it.
    expect(ptN.x).toBeCloseTo(centre.x, 0);
    expect(ptN.y).toBeLessThan(centre.y);

    // A[1] = 0 (East) collapses to the centre.
    const east = (chart as any).rendered()[0].points[1];
    expect(east.x).toBeCloseTo(centre.x, 0);
    expect(east.y).toBeCloseTo(centre.y, 0);
  });

  it('builds the requested number of grid rings and one spoke per axis', () => {
    fixture.componentRef.setInput('levels', 5);
    expect((chart as any).rings()).toHaveLength(5);
    expect((chart as any).axisSpokes()).toHaveLength(4);
  });

  it('shows the legend for multiple series', () => {
    expect((chart as any).legendVisible()).toBe(true);
    expect((chart as any).legend()).toHaveLength(2);
  });
});
