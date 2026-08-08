import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import { mkFormatCompact } from './chart-utils';

/** One day's datum for `mk-calendar-heatmap`. */
export interface MkCalendarHeatmapEntry {
  /**
   * The day — a `Date`, or a string. `YYYY-MM-DD` strings are parsed as
   * **local** dates (never UTC-shifted); other strings go through `new Date()`.
   */
  date: Date | string;
  /** The day's value (e.g. an activity count). Multiple entries for the same day are summed. */
  value: number;
}

/** Payload of `mk-calendar-heatmap`'s `cellClick`. */
export interface MkCalendarHeatmapCell {
  /** The clicked day (local midnight). */
  date: Date;
  /** The day's aggregated value (0 when no entry exists). */
  value: number;
}

interface DayCell {
  key: string;
  /** `null` for grid padding outside the displayed range. */
  date: Date | null;
  value: number;
  bg: string;
  title: string | null;
}
interface WeekdayRow {
  label: string;
  /** Visually show the label (Mon/Wed/Fri style); hidden rows keep it for SR. */
  showLabel: boolean;
  cells: DayCell[];
}
interface MonthSegment {
  key: string;
  label: string;
  /** Number of week columns the month header spans. */
  span: number;
}
interface Layout {
  rows: WeekdayRow[];
  months: MonthSegment[];
  weekCount: number;
  dayCount: number;
  max: number;
}

/** Local midnight for `d` (drops the time-of-day). */
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parse an entry date; `YYYY-MM-DD` strings become local dates. */
function parseDay(value: Date | string): Date {
  if (value instanceof Date) return stripTime(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  return stripTime(new Date(value));
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Calendar heatmap — a GitHub-style year of daily squares: weeks as columns,
 * weekdays as rows, each day shaded by its value. Rendered as a semantic
 * `<table>` (month headers span their week columns, weekday names are row
 * headers, every cell carries its formatted value for screen readers) with
 * intensities mixed from `color` over the surface via `color-mix`, so it
 * tracks the theme. Values are bucketed linearly against the range maximum
 * into `levels` steps; days with value 0 (or no entry) render transparent.
 *
 * Shows the last 12 months ending today by default; set `year` for a fixed
 * calendar year.
 *
 * ```html
 * <mk-calendar-heatmap
 *   [data]="contributions"
 *   [year]="2026"
 *   (cellClick)="openDay($event.date)"
 * />
 * ```
 */
@Component({
  selector: 'mk-calendar-heatmap',
  templateUrl: './calendar-heatmap.html',
  styleUrl: './calendar-heatmap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-calendar-heatmap',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkCalendarHeatmap {
  /** The daily values. Days without an entry count as 0. */
  readonly data = input<readonly MkCalendarHeatmapEntry[]>([]);
  /** Show a fixed calendar year; unset shows the last 12 months ending today. */
  readonly year = input<number | null, number | string | null>(null, {
    transform: (value) => {
      if (value == null || value === '') return null;
      const parsed = numberAttribute(value);
      return Number.isFinite(parsed) ? parsed : null;
    },
  });
  /** First weekday of the columns: 0 = Sunday … 6 = Saturday. */
  readonly firstDayOfWeek = input(1, { transform: numberAttribute });
  /** Base colour mixed over the surface for intensity. */
  readonly color = input<string>('var(--mk-primary)');
  /** Number of intensity buckets in the ramp. */
  readonly levels = input(5, { transform: numberAttribute });
  /** Formatter for each cell's title / screen-reader text (and legend max). */
  readonly format = input<((date: Date, value: number) => string) | null>(null);
  /** Show the less→more colour ramp legend. */
  readonly showScale = input(true, { transform: booleanAttribute });
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');
  /** Emits the clicked day and its value. */
  readonly cellClick = output<MkCalendarHeatmapCell>();

  protected readonly i18n = inject(MK_I18N);

  /** Aggregated value per day key (duplicate entries are summed). */
  private readonly values = computed(() => {
    const map = new Map<string, { date: Date; value: number }>();
    for (const entry of this.data()) {
      const date = parseDay(entry.date);
      const key = dayKey(date);
      const previous = map.get(key);
      map.set(key, { date, value: (previous?.value ?? 0) + entry.value });
    }
    return map;
  });

  /** Displayed [start, end] range, both at local midnight, inclusive. */
  private readonly range = computed<[Date, Date]>(() => {
    const year = this.year();
    if (year != null) return [new Date(year, 0, 1), new Date(year, 11, 31)];
    const end = stripTime(new Date());
    const start = addDays(
      new Date(end.getFullYear() - 1, end.getMonth(), end.getDate()),
      1,
    );
    return [start, end];
  });

  private readonly sanitizedLevels = computed(() =>
    Math.max(1, Math.round(this.levels()) || 1),
  );

  private readonly layout = computed<Layout>(() => {
    const [start, end] = this.range();
    const fdow = ((Math.round(this.firstDayOfWeek()) % 7) + 7) % 7;
    const levels = this.sanitizedLevels();
    const color = this.color();
    const values = this.values();
    const fmt = this.format() ?? this.defaultFormat;
    const names = this.i18n.dateNames;

    // Bucket against the maximum value inside the displayed range.
    let max = 0;
    for (const { date, value } of values.values()) {
      if (date >= start && date <= end) max = Math.max(max, value);
    }

    const gridStart = addDays(start, -((((start.getDay() - fdow) % 7) + 7) % 7));
    const weeks: DayCell[][] = [];
    const months: MonthSegment[] = [];
    let dayCount = 0;

    for (let weekStart = gridStart; weekStart <= end; weekStart = addDays(weekStart, 7)) {
      const week: DayCell[] = [];
      let firstInRange: Date | null = null;
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        if (date < start || date > end) {
          // Padding before the range start / after its end — blank, silent.
          week.push({
            key: `pad-${dayKey(date)}`,
            date: null,
            value: 0,
            bg: 'transparent',
            title: null,
          });
          continue;
        }
        firstInRange ??= date;
        dayCount++;
        const value = values.get(dayKey(date))?.value ?? 0;
        const level =
          value <= 0 || max <= 0
            ? 0
            : Math.min(levels, Math.max(1, Math.ceil((value / max) * levels)));
        week.push({
          key: dayKey(date),
          date,
          value,
          // Zero / no data stays transparent, like mk-heatmap's null cells.
          bg:
            level === 0
              ? 'transparent'
              : `color-mix(in srgb, ${color} ${Math.round((level / levels) * 100)}%, var(--mk-surface-2))`,
          title: fmt(date, value),
        });
      }
      weeks.push(week);

      // A week column belongs to the month of its first in-range day; group
      // consecutive columns of the same month into one spanning header.
      const monthOf = firstInRange ?? weekStart;
      const monthKey = `${monthOf.getFullYear()}-${monthOf.getMonth()}`;
      const last = months[months.length - 1];
      if (last && last.key === monthKey) last.span++;
      else {
        months.push({
          key: monthKey,
          label: names.monthsShort[monthOf.getMonth()] ?? '',
          span: 1,
        });
      }
    }

    const rows: WeekdayRow[] = Array.from({ length: 7 }, (_, i) => {
      const weekday = (fdow + i) % 7;
      return {
        label: names.weekdaysShort[weekday] ?? '',
        // Mon/Wed/Fri style regardless of the first day of the week.
        showLabel: weekday % 2 === 1,
        cells: weeks.map((week) => week[i]),
      };
    });

    return { rows, months, weekCount: weeks.length, dayCount, max };
  });

  protected readonly rows = computed(() => this.layout().rows);
  protected readonly monthSegments = computed(() => this.layout().months);

  /** Legend: 0 → max swatches mixed exactly like the cells. */
  protected readonly scaleStops = computed(() => {
    const levels = this.sanitizedLevels();
    const color = this.color();
    return {
      min: '0',
      max: mkFormatCompact(this.layout().max),
      swatches: Array.from(
        { length: levels + 1 },
        (_, i) =>
          `color-mix(in srgb, ${color} ${Math.round((i / levels) * 100)}%, var(--mk-surface-2))`,
      ),
    };
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const { dayCount, weekCount } = this.layout();
    return `Calendar heatmap, ${dayCount} days over ${weekCount} weeks`;
  });

  private readonly defaultFormat = (date: Date, value: number): string =>
    `${date.toLocaleDateString()}: ${value}`;

  protected onCellClick(cell: DayCell): void {
    if (!cell.date) return;
    this.cellClick.emit({ date: cell.date, value: cell.value });
  }
}
