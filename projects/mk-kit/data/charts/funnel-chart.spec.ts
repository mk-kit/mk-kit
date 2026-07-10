import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkFunnelChart } from './funnel-chart';
import type { MkFunnelSegment } from './funnel-chart';

describe('MkFunnelChart', () => {
  let fixture: ComponentFixture<MkFunnelChart>;
  let chart: MkFunnelChart;

  const segments: MkFunnelSegment[] = [
    { label: 'Visits', value: 1000 },
    { label: 'Signups', value: 400 },
    { label: 'Paid', value: 120 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkFunnelChart);
    chart = fixture.componentInstance;
    fixture.componentRef.setInput('segments', segments);
    fixture.componentRef.setInput('width', 420);
    fixture.componentRef.setInput('height', 300);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders one band per segment', () => {
    const bands = (chart as any).bands();
    expect(bands).toHaveLength(3);
    const polygons = fixture.nativeElement.querySelectorAll(
      '.mk-funnel-chart__band',
    );
    expect(polygons).toHaveLength(3);
  });

  it('scales band top widths proportionally (Visits widest)', () => {
    const bands = (chart as any).bands();
    const [visits, signups, paid] = bands;
    // Widths track the value / maxValue ratio.
    expect(visits.topWidth).toBeGreaterThan(signups.topWidth);
    expect(signups.topWidth).toBeGreaterThan(paid.topWidth);
    // Signups is 40% of Visits, so its top width should be too.
    expect(signups.topWidth / visits.topWidth).toBeCloseTo(0.4, 5);
  });

  it('computes conversion relative to the top segment', () => {
    const bands = (chart as any).bands();
    expect(bands[0].percent).toBeCloseTo(100, 5);
    // Paid: 120 / 1000 = 12% of top.
    expect(bands[2].percent).toBeCloseTo(12, 5);
    expect(bands[2].percentLabel).toBe('12% of top');
  });

  it('formats values with mkFormatCompact in the SR table', () => {
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('.mk-chart__sr-table td'),
    ).map((el: any) => el.textContent.trim());
    // 1000 → "1k" via mkFormatCompact.
    expect(cells).toContain('1k');
    expect(cells).toContain('12% of top');
  });

  it('hides the legend by default (funnels label each band)', () => {
    expect((chart as any).legendVisible()).toBe(false);
  });
});
