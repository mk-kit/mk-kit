import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkCalendarHeatmap } from './calendar-heatmap';
import type { MkCalendarHeatmapCell } from './calendar-heatmap';

const DAY_CELLS =
  'td.mk-calendar-heatmap__cell:not(.mk-calendar-heatmap__cell--blank)';

describe('MkCalendarHeatmap', () => {
  let fixture: ComponentFixture<MkCalendarHeatmap>;
  let chart: MkCalendarHeatmap;

  const create = (inputs: Record<string, unknown> = {}): void => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkCalendarHeatmap);
    chart = fixture.componentInstance;
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
  };

  afterEach(() => fixture?.destroy());

  it('renders one cell per day of a fixed year, aligned to the weekday grid', () => {
    create({ year: 2026, firstDayOfWeek: 1 });
    // 2026 is not a leap year.
    const cells = fixture.nativeElement.querySelectorAll(DAY_CELLS);
    expect(cells).toHaveLength(365);

    const rows = (chart as any).rows();
    expect(rows).toHaveLength(7);
    // Jan 1 2026 is a Thursday: with Monday-first columns, the first column's
    // Mon–Wed cells are padding and the Thursday row holds Jan 1.
    expect(rows[0].cells[0].date).toBeNull();
    expect(rows[2].cells[0].date).toBeNull();
    expect(rows[3].cells[0].date?.getMonth()).toBe(0);
    expect(rows[3].cells[0].date?.getDate()).toBe(1);
    // Weekday row headers come from i18n short names, Mon/Wed/Fri visible.
    expect(rows[0].label).toBe('Mon');
    expect(rows[0].showLabel).toBe(true);
    expect(rows[1].label).toBe('Tue');
    expect(rows[1].showLabel).toBe(false);
  });

  it('spans the last 12 months ending today when year is unset', () => {
    create({});
    const today = new Date();
    const start = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate() + 1,
    );
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const expected =
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const cells = fixture.nativeElement.querySelectorAll(DAY_CELLS);
    expect(cells).toHaveLength(expected);
  });

  it('buckets values linearly against the max: full intensity at max, transparent at 0', () => {
    create({
      year: 2026,
      firstDayOfWeek: 1,
      levels: 5,
      data: [
        { date: new Date(2026, 0, 1), value: 10 }, // Thu — the max
        { date: new Date(2026, 0, 2), value: 1 }, // Fri — lowest bucket
        { date: new Date(2026, 0, 3), value: 0 }, // Sat — empty
      ],
    });
    const rows = (chart as any).rows();
    const jan1 = rows[3].cells[0];
    const jan2 = rows[4].cells[0];
    const jan3 = rows[5].cells[0];
    expect(jan1.value).toBe(10);
    expect(jan1.bg).toContain(' 100%,');
    expect(jan2.bg).toContain(' 20%,');
    expect(jan3.bg).toBe('transparent');
    // A day with no entry at all is also transparent.
    const jan4 = rows[6].cells[0];
    expect(jan4.value).toBe(0);
    expect(jan4.bg).toBe('transparent');
  });

  it('renders one month header per month with colspans covering every week', () => {
    create({ year: 2026, firstDayOfWeek: 1 });
    const months = (chart as any).monthSegments();
    expect(months).toHaveLength(12);
    expect(months[0].label).toBe('Jan');
    expect(months[11].label).toBe('Dec');
    // Colspans cover the whole grid: Mon Dec 29 2025 → Thu Dec 31 2026 = 53 weeks.
    const total = months.reduce(
      (sum: number, m: { span: number }) => sum + m.span,
      0,
    );
    expect(total).toBe(53);
    const headers = fixture.nativeElement.querySelectorAll(
      '.mk-calendar-heatmap__month',
    );
    expect(headers).toHaveLength(12);
  });

  it('emits cellClick with the day and its aggregated value', () => {
    create({
      year: 2026,
      data: [{ date: '2026-01-01', value: 3 }],
      format: (date: Date, value: number) =>
        `${date.getMonth() + 1}/${date.getDate()}: ${value}`,
    });
    let payload: MkCalendarHeatmapCell | undefined;
    chart.cellClick.subscribe((cell) => (payload = cell));
    const cell = fixture.nativeElement.querySelector(
      'td[title="1/1: 3"]',
    ) as HTMLElement;
    expect(cell).toBeTruthy();
    cell.click();
    expect(payload?.value).toBe(3);
    expect(payload?.date.getFullYear()).toBe(2026);
    expect(payload?.date.getMonth()).toBe(0);
    expect(payload?.date.getDate()).toBe(1);
  });

  it('uses format() for the title and the screen-reader text', () => {
    create({
      year: 2026,
      data: [{ date: new Date(2026, 5, 15), value: 7 }],
      format: (date: Date, value: number) =>
        `custom ${date.getDate()} → ${value}`,
    });
    const cell = fixture.nativeElement.querySelector(
      'td[title="custom 15 → 7"]',
    ) as HTMLElement;
    expect(cell).toBeTruthy();
    expect(
      cell.querySelector('.mk-visually-hidden')?.textContent?.trim(),
    ).toBe('custom 15 → 7');
  });

  it('parses YYYY-MM-DD strings as local dates and sums duplicate days', () => {
    create({
      year: 2026,
      firstDayOfWeek: 1,
      data: [
        { date: '2026-03-05', value: 2 },
        { date: '2026-03-05', value: 3 },
      ],
    });
    const rows = (chart as any).rows();
    const all = rows.flatMap((row: { cells: readonly unknown[] }) => row.cells);
    const march5 = all.find(
      (cell: any) =>
        cell.date?.getMonth() === 2 && cell.date?.getDate() === 5,
    ) as any;
    expect(march5).toBeTruthy();
    expect(march5.value).toBe(5);
    // The max day: full intensity.
    expect(march5.bg).toContain(' 100%,');
  });
});
