import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  forwardRef,
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
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import type { MkSize } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { mkValidatorChange } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkLiveAnnouncer } from '@mk-kit/ui/core';
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
 * Exposes a two-way `value` model and implements `ControlValueAccessor`, so it
 * also works directly with `ngModel` / `formControl` (single-date mode).
 * Additive range inputs (`rangeMode`,
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkCalendar),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkCalendar),
      multi: true,
    },
  ],
  host: {
    class: 'mk-calendar',
    '[class.mk-calendar--disabled]': 'isControlDisabled()',
    '(focusout)': 'onFocusout($event)',
    '[class.mk-calendar--sm]': "size() === 'sm'",
    '[class.mk-calendar--md]': "size() === 'md'",
    '[class.mk-calendar--lg]': "size() === 'lg'",
    '[class.mk-calendar--full]': 'fullWidth()',
    '[class.mk-calendar--range]': 'rangeMode()',
    '[class.mk-calendar--invalid]': 'isInvalid()',
    '[attr.aria-invalid]': 'isInvalid() || null',
  },
})
export class MkCalendar implements ControlValueAccessor, Validator {
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
  /** Disable the whole calendar. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force the invalid visual + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Predicate marking individual days as disabled. */
  readonly disabledDate = input<((d: Date) => boolean) | null>(null);
  /** Control size. */
  readonly size = input<MkSize>('md');
  /**
   * Stretch to fill the container instead of sizing to content.
   *
   * Off by default, because the common host is a date-picker popover that must
   * stay a compact widget. Turn it on when the calendar is laid out as part of
   * a page — a sidebar or a column — where sizing to content leaves the space
   * beside it empty. Cells share the width evenly and `--_cell-size` becomes
   * their minimum rather than their fixed size.
   */
  readonly fullWidth = input(false, { transform: booleanAttribute });

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

  /** Disabled state driven by forms (`setDisabledState`). */
  protected readonly cvaDisabled = signal(false);

  /** The day that currently owns the roving tabindex; also drives the view. */
  protected readonly focusedDate = signal<Date>(this.initialFocus());
  /** Hovered day used to preview a range before the end is picked. */
  protected readonly hoveredDate = signal<Date | null>(null);

  /** Disabled by the `disabled` input or by the bound form control. */
  protected readonly isControlDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(() => this.invalid());

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

  // --- ControlValueAccessor ---------------------------------------------------
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Date | null): void {
    this.value.set(value instanceof Date ? startOfDay(value) : null);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  /** Marks the control touched when focus leaves the calendar entirely. */
  protected onFocusout(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.onTouched();
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
    if (this.isControlDisabled()) return true;
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

  /**
   * `aria-selected` state of a day's gridcell. Single-date mode mirrors
   * `isSelected`; range mode exposes the committed endpoints and the days
   * between them (hover previews stay visual-only so the accessibility tree
   * doesn't churn while the pointer moves).
   */
  protected isAriaSelected(d: Date): boolean {
    if (!this.rangeMode()) return this.isSelected(d);
    const s = this.rangeStart();
    const e = this.rangeEnd();
    if (s && isSameDay(d, s)) return true;
    if (e && isSameDay(d, e)) return true;
    if (!s || !e) return false;
    const [lo, hi] = isAfter(e, s) ? [s, e] : [e, s];
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
    if (!this.rangeMode()) {
      this.value.set(day);
      this.onChange(day);
    }
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

  // --- Validator ------------------------------------------------------------
  private readonly validatorChange = mkValidatorChange(() => {
    this.min();
    this.max();
    this.disabledDate();
  });

  /**
   * Reports `mkMinDate` / `mkMaxDate` for a date outside `[min]`/`[max]`, and
   * `mkDateFilter` for one rejected by `[disabledDate]`.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (!(v instanceof Date) || Number.isNaN(v.getTime())) return null;
    const day = startOfDay(v);
    const min = this.min();
    if (min && isBefore(day, startOfDay(min))) return { mkMinDate: { min, actual: v } };
    const max = this.max();
    if (max && isAfter(day, startOfDay(max))) return { mkMaxDate: { max, actual: v } };
    return this.disabledDate()?.(v) ? { mkDateFilter: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
