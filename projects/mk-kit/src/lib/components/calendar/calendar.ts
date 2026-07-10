import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
} from '@angular/core';
import type { MkSize } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MK_I18N } from '../../core/i18n/mk-i18n';
import { MkLiveAnnouncer } from '../../core/a11y/live-announcer.service';
import {
  addDays,
  addMonths,
  buildMonthMatrix,
  clampDate,
  formatDate,
  getWeekdayFullName,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from '../datetime/date-utils';

/** Weekday header descriptor (short label + full name for `abbr[title]`). */
interface MkWeekdayHeader {
  short: string;
  full: string;
}

/**
 * Calendar — an accessible month-grid date picker following the WAI-ARIA
 * grid / date-picker pattern. It is the reusable core behind
 * `mk-date-picker` and `mk-date-range-picker`.
 *
 * Keyboard (when a day has focus): Arrow keys move by day/week (crossing month
 * boundaries updates the view), Home/End jump to the start/end of the week,
 * PageUp/PageDown change month, Shift+PageUp/PageDown change year, and
 * Enter/Space selects the focused day. A roving tabindex keeps a single tab
 * stop. Month changes are announced via {@link MkLiveAnnouncer}.
 *
 * Exposes a two-way `value` model. Additive range inputs (`rangeMode`,
 * `rangeStart`, `rangeEnd`) let it highlight an in-progress selection without
 * affecting single-date use; range hosts listen to `dateSelected`.
 *
 * ```html
 * <mk-calendar [(value)]="date" [min]="minDate" [firstDayOfWeek]="1" />
 * ```
 */
@Component({
  selector: 'mk-calendar',
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-calendar',
    '[class.mk-calendar--sm]': "size() === 'sm'",
    '[class.mk-calendar--md]': "size() === 'md'",
    '[class.mk-calendar--lg]': "size() === 'lg'",
    '[class.mk-calendar--range]': 'rangeMode()',
  },
})
export class MkCalendar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly i18n = inject(MK_I18N);
  private readonly injector = inject(Injector);
  private readonly announcer = inject(MkLiveAnnouncer);

  /** Two-way selected date (single-date mode). */
  readonly value = model<Date | null>(null);
  /** Earliest selectable date (inclusive, day granularity). */
  readonly min = input<Date | null>(null);
  /** Latest selectable date (inclusive, day granularity). */
  readonly max = input<Date | null>(null);
  /** First column of the week: 0 = Sunday … 6 = Saturday. */
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  /** Predicate marking individual days as disabled. */
  readonly disabledDate = input<((d: Date) => boolean) | null>(null);
  /** Control size. */
  readonly size = input<MkSize>('md');

  // --- Range mode (additive; does not affect single-date use) --------------
  /** Enable range highlighting. Hosts drive selection via `dateSelected`. */
  readonly rangeMode = input(false, { transform: booleanAttribute });
  /** Range start endpoint to highlight (range mode). */
  readonly rangeStart = input<Date | null>(null);
  /** Range end endpoint to highlight (range mode). */
  readonly rangeEnd = input<Date | null>(null);

  /** Emitted whenever a (non-disabled) day is activated. */
  readonly dateSelected = output<Date>();
  /**
   * Emitted (in range mode) as the pointer hovers days — the hovered day, or
   * `null` on leave. Lets hosts preview a selection (e.g. a whole-week
   * highlight in `mk-week-picker`).
   */
  readonly dateHovered = output<Date | null>();

  /** id of the visible month/year label — wire as the grid's label. */
  readonly labelId = mkUniqueId('mk-calendar-label');

  /** The day that currently owns the roving tabindex; also drives the view. */
  protected readonly focusedDate = signal<Date>(this.initialFocus());
  /** Hovered day used to preview a range before the end is picked. */
  protected readonly hoveredDate = signal<Date | null>(null);

  /** First day of the visible month. */
  protected readonly viewMonth = computed(() =>
    startOfMonth(this.focusedDate()),
  );
  /** Human label for the visible month, e.g. `July 2026`. */
  protected readonly monthLabel = computed(() =>
    formatDate(this.viewMonth(), 'MMMM yyyy', this.i18n.dateNames),
  );
  /** 6×7 grid of dates for the visible month. */
  protected readonly weeks = computed(() =>
    buildMonthMatrix(this.viewMonth(), this.firstDayOfWeek()),
  );
  /** Weekday column headers ordered from `firstDayOfWeek`. */
  protected readonly weekdays = computed<MkWeekdayHeader[]>(() =>
    this.weeks()[0].map((d) => ({
      short: formatDate(d, 'ddd', this.i18n.dateNames),
      full: getWeekdayFullName(d, this.i18n.dateNames),
    })),
  );

  private announcedMonth = this.monthLabel();

  constructor() {
    // Follow external value changes into the view/focus. Read focusedDate
    // untracked so this effect only reacts to `value` — otherwise navigating
    // months (which moves focusedDate) would re-run it and snap the view back.
    effect(() => {
      const v = this.value();
      if (v && !isSameDay(v, untracked(this.focusedDate))) {
        this.focusedDate.set(startOfDay(v));
      }
    });
    // Announce month transitions for screen-reader users.
    effect(() => {
      const label = this.monthLabel();
      if (label !== this.announcedMonth) {
        this.announcedMonth = label;
        this.announcer.announce(label);
      }
    });
  }

  private initialFocus(): Date {
    const base = this.value() ?? new Date();
    return startOfDay(clampDate(startOfDay(base), this.min(), this.max()));
  }

  // --- Day classification ---------------------------------------------------
  protected isOutside(d: Date): boolean {
    return !isSameMonth(d, this.viewMonth());
  }

  protected isDisabled(d: Date): boolean {
    const day = startOfDay(d);
    const min = this.min();
    const max = this.max();
    if (min && isBefore(day, startOfDay(min))) return true;
    if (max && isAfter(day, startOfDay(max))) return true;
    return this.disabledDate()?.(d) ?? false;
  }

  protected isToday(d: Date): boolean {
    return isSameDay(d, new Date());
  }

  protected isSelected(d: Date): boolean {
    const v = this.value();
    return !this.rangeMode() && !!v && isSameDay(d, v);
  }

  protected isFocused(d: Date): boolean {
    return isSameDay(d, this.focusedDate());
  }

  /** Effective range end while previewing (falls back to the hovered day). */
  private previewEnd(): Date | null {
    return this.rangeEnd() ?? this.hoveredDate();
  }

  protected isRangeStart(d: Date): boolean {
    const s = this.rangeStart();
    return this.rangeMode() && !!s && isSameDay(d, s);
  }

  protected isRangeEnd(d: Date): boolean {
    if (!this.rangeMode()) return false;
    const end = this.previewEnd();
    return !!end && isSameDay(d, end);
  }

  protected isInRange(d: Date): boolean {
    if (!this.rangeMode()) return false;
    const s = this.rangeStart();
    const end = this.previewEnd();
    if (!s || !end) return false;
    const [lo, hi] = isAfter(end, s) ? [s, end] : [end, s];
    const day = startOfDay(d);
    return isAfter(day, startOfDay(lo)) && isBefore(day, startOfDay(hi));
  }

  protected dayLabel(d: Date): string {
    return formatDate(d, 'MMMM d, yyyy', this.i18n.dateNames);
  }

  // --- Interaction ----------------------------------------------------------
  protected select(d: Date): void {
    if (this.isDisabled(d)) return;
    const day = startOfDay(d);
    this.focusedDate.set(day);
    if (!this.rangeMode()) this.value.set(day);
    this.dateSelected.emit(day);
    this.focusActiveCell();
  }

  protected onHover(d: Date): void {
    if (!this.rangeMode()) return;
    const day = startOfDay(d);
    this.hoveredDate.set(day);
    this.dateHovered.emit(day);
  }

  protected clearHover(): void {
    if (!this.rangeMode()) return;
    this.hoveredDate.set(null);
    this.dateHovered.emit(null);
  }

  protected prevMonth(): void {
    this.moveFocus(addMonths(this.focusedDate(), -1));
  }
  protected nextMonth(): void {
    this.moveFocus(addMonths(this.focusedDate(), 1));
  }
  protected prevYear(): void {
    this.moveFocus(addMonths(this.focusedDate(), -12));
  }
  protected nextYear(): void {
    this.moveFocus(addMonths(this.focusedDate(), 12));
  }

  protected onGridKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    const current = this.focusedDate();
    let next: Date | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        next = addDays(current, -1);
        break;
      case 'ArrowRight':
        next = addDays(current, 1);
        break;
      case 'ArrowUp':
        next = addDays(current, -7);
        break;
      case 'ArrowDown':
        next = addDays(current, 7);
        break;
      case 'Home':
        next = addDays(current, -this.weekdayOffset(current));
        break;
      case 'End':
        next = addDays(current, 6 - this.weekdayOffset(current));
        break;
      case 'PageUp':
        next = addMonths(current, e.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(current, e.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.select(current);
        return;
      default:
        return;
    }

    e.preventDefault();
    if (next) this.moveFocus(next);
  }

  private weekdayOffset(d: Date): number {
    return (d.getDay() - this.firstDayOfWeek() + 7) % 7;
  }

  private moveFocus(target: Date): void {
    this.focusedDate.set(startOfDay(target));
    this.focusActiveCell();
  }

  private focusActiveCell(): void {
    afterNextRender(
      {
        write: () => {
          const el = this.host.nativeElement.querySelector<HTMLElement>(
            '.mk-calendar__day[tabindex="0"]',
          );
          el?.focus();
        },
      },
      { injector: this.injector },
    );
  }
}
