import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MK_I18N } from '@mkornas/ui/core';
import {
  addMonths,
  buildMonthMatrix,
  formatDate,
  getWeekdayFullName,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from '../datetime/date-utils';

/** A single event plotted onto the {@link MkEventCalendar} month grid. */
export interface MkCalendarEvent {
  /** The day the event falls on (time component is ignored for placement). */
  date: Date;
  /** Short label shown inside the event pill. */
  title: string;
  /** Optional pill background colour; falls back to `--mk-primary`. */
  color?: string;
  /** Optional caller-supplied identifier, echoed back on `eventClick`. */
  id?: unknown;
}

/** Weekday column header (short label + full name for the `abbr[title]`). */
interface MkWeekdayHeader {
  short: string;
  full: string;
}

/** A rendered day cell: its date, classification, and the events on it. */
interface MkDayCell {
  date: Date;
  outside: boolean;
  today: boolean;
  /** Up to `maxPerDay` events shown as pills. */
  visible: readonly MkCalendarEvent[];
  /** Count beyond `maxPerDay` (0 when nothing is hidden). */
  overflow: number;
}

/**
 * Event calendar — a month-grid scheduler view. Renders a 6×7 grid of day
 * cells built from {@link buildMonthMatrix}; each cell lists the events whose
 * `date` falls on that day as coloured pills, capped at `maxPerDay` with a
 * "+N more" line for the remainder.
 *
 * Shares the month-grid rendering, header navigation, and weekday header of
 * `mk-calendar` but is display-only (no date selection). Exposes the viewed
 * month as a two-way `viewDate` model plus `dayClick` / `eventClick` outputs.
 *
 * ```html
 * <mk-event-calendar [events]="events" [(viewDate)]="month"
 *   (eventClick)="open($event)" />
 * ```
 */
@Component({
  selector: 'mk-event-calendar',
  templateUrl: './event-calendar.html',
  styleUrl: './event-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-event-calendar',
  },
})
export class MkEventCalendar {
  protected readonly i18n = inject(MK_I18N);

  /** Events to plot onto the grid. */
  readonly events = input<readonly MkCalendarEvent[]>([]);
  /** Two-way month being viewed (any day within it). Defaults to today. */
  readonly viewDate = model<Date>(new Date());
  /** First column of the week: 0 = Sunday … 6 = Saturday. */
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  /** Max event pills per day before collapsing the rest into "+N more". */
  readonly maxPerDay = input(3, { transform: numberAttribute });

  /** Emitted when a day cell is activated (click / Enter). */
  readonly dayClick = output<Date>();
  /**
   * Emitted when an event pill is clicked (does not also fire `dayClick`).
   * Mouse-only convenience: the pills are presentational (`aria-hidden`), so
   * keyboard / screen-reader users reach events via the day button — its label
   * announces the day's events and activating it fires `dayClick`.
   */
  readonly eventClick = output<MkCalendarEvent>();
  /** Emitted when the viewed month changes via the prev/next buttons. */
  readonly monthChange = output<Date>();

  /** id of the visible month/year label — wired as the grid's label. */
  readonly labelId = mkUniqueId('mk-event-calendar-label');

  /** First day of the visible month. */
  protected readonly viewMonth = computed(() => startOfMonth(this.viewDate()));
  /** Human label for the visible month, e.g. `July 2026`. */
  protected readonly monthLabel = computed(() =>
    formatDate(this.viewDate(), 'MMMM yyyy', this.i18n.dateNames),
  );

  /** Raw 6×7 grid of dates for the visible month. */
  private readonly weeks = computed(() =>
    buildMonthMatrix(this.viewDate(), this.firstDayOfWeek()),
  );

  /** Weekday column headers ordered from `firstDayOfWeek`. */
  protected readonly weekdays = computed<MkWeekdayHeader[]>(() =>
    this.weeks()[0].map((d) => ({
      short: formatDate(d, 'ddd', this.i18n.dateNames),
      full: getWeekdayFullName(d, this.i18n.dateNames),
    })),
  );

  /** Events grouped by local calendar day, keyed by `startOfDay` timestamp. */
  private readonly eventsByDay = computed(() => {
    const map = new Map<number, MkCalendarEvent[]>();
    for (const event of this.events()) {
      const key = startOfDay(event.date).getTime();
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    }
    return map;
  });

  /** 6×7 grid of day cells with their (capped) events resolved. */
  protected readonly weekCells = computed<MkDayCell[][]>(() => {
    const month = this.viewMonth();
    const today = new Date();
    const max = this.maxPerDay();
    const byDay = this.eventsByDay();
    return this.weeks().map((week) =>
      week.map((date) => {
        const dayEvents = byDay.get(startOfDay(date).getTime()) ?? [];
        return {
          date,
          outside: !isSameMonth(date, month),
          today: isSameDay(date, today),
          visible: dayEvents.slice(0, max),
          overflow: Math.max(0, dayEvents.length - max),
        };
      }),
    );
  });

  /**
   * Screen-reader label for a day cell. The button's `aria-label` replaces its
   * visual content, so the label also announces the day's events — count plus
   * up to three titles — e.g. `July 9, 2026, 2 events: Standup, Demo`.
   */
  protected dayLabel(cell: MkDayCell): string {
    const formatted = formatDate(cell.date, 'MMMM d, yyyy', this.i18n.dateNames);
    const count = cell.visible.length + cell.overflow;
    if (count === 0) return formatted;
    const titles = cell.visible
      .slice(0, 3)
      .map((e) => e.title)
      .join(', ');
    return `${formatted}, ${this.i18n.dayEvents(count, titles)}`;
  }

  protected prevMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  private shiftMonth(delta: number): void {
    const next = addMonths(this.viewDate(), delta);
    this.viewDate.set(next);
    this.monthChange.emit(next);
  }

  protected onDayClick(d: Date): void {
    this.dayClick.emit(d);
  }

  protected onEventClick(event: Event, calendarEvent: MkCalendarEvent): void {
    event.stopPropagation();
    this.eventClick.emit(calendarEvent);
  }
}
