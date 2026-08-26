import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
  viewChild,
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
import { MkAnchoredPanel } from '@mk-kit/ui/core';
import { MkFormField } from '@mk-kit/ui/forms';
import { MkCalendar } from '../calendar/calendar';
import {
  formatDate,
  isSameDay,
  parseISODate,
  startOfDay,
} from '../datetime/date-utils';

/** A selectable time-of-day option in the panel's list. */
interface MkTimeOption {
  /** Minutes since midnight. */
  minutes: number;
  /** Display label (respects `hour12`). */
  label: string;
  /** Stable id for `aria-activedescendant`. */
  id: string;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Minutes since local midnight, ignoring seconds. */
function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Same instant floored to the minute — bounds compare at minute precision. */
function toMinute(d: Date): number {
  const c = new Date(d);
  c.setSeconds(0, 0);
  return c.getTime();
}

/** Put `minutes` since midnight onto `day`'s local date. */
function combine(day: Date, minutes: number): Date {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0,
  );
}

/** Parse `14:30`, `2:30 pm`, `9` … into minutes since midnight, or null. */
function parseTime(text: string): number | null {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i.exec(text);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === 'pm' && h !== 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
  }
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * DateTimePicker — one field for a date **and** a time of day. The panel pairs
 * an `mk-calendar` with a time list generated from `step`; the value is a
 * single `Date` carrying both parts in local time (seconds and milliseconds
 * zeroed). Implements `ControlValueAccessor` and a two-way `value` model, so it
 * works with `[(ngModel)]`, reactive forms and `[(value)]`.
 *
 * Interaction: picking a day keeps the panel open and — when a value already
 * exists — moves that value to the new day, preserving its time; picking a
 * time commits and closes. With no value yet, the day is held until a time is
 * chosen (so a half-picked datetime is never emitted). Typing also works:
 * `2026-08-26 14:30`, `2026-08-26T09:05`, `Aug 26, 2026 2:30 pm` and a bare
 * ISO date (→ midnight) are parsed on Enter/blur.
 *
 * `min` / `max` bound the whole instant at minute precision: the calendar
 * greys out days outside the range and the time list hides times outside it
 * on the boundary days. Validation reports `mkMinDate` / `mkMaxDate`.
 *
 * When nested in an `mk-form-field` it adopts the field's id and aria wiring.
 *
 * ```html
 * <mk-datetime-picker [(value)]="startsAt" [step]="15" [min]="now" clearable />
 * <mk-datetime-picker [(value)]="startsAt" hour12 />
 * ```
 */
@Component({
  selector: 'mk-datetime-picker',
  templateUrl: './datetime-picker.html',
  styleUrl: './datetime-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkCalendar, MkAnchoredPanel],
  host: {
    class: 'mk-datetime-picker',
    '[class.mk-datetime-picker--sm]': "effectiveSize() === 'sm'",
    '[class.mk-datetime-picker--md]': "effectiveSize() === 'md'",
    '[class.mk-datetime-picker--lg]': "effectiveSize() === 'lg'",
    '[class.mk-datetime-picker--open]': 'open()',
    '[class.mk-datetime-picker--invalid]': 'isInvalid()',
    '[class.mk-datetime-picker--disabled]': 'isDisabled()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkDateTimePicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkDateTimePicker),
      multi: true,
    },
  ],
})
export class MkDateTimePicker implements ControlValueAccessor, Validator {
  protected readonly i18n = inject(MK_I18N);
  private readonly field = inject(MkFormField, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly inputRef =
    viewChild<ElementRef<HTMLInputElement>>('textInput');
  /** The panel — lives in the top layer once opened. */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly timesRef = viewChild<ElementRef<HTMLElement>>('times');

  /** Two-way selected date-time (local; seconds and ms are zero). */
  readonly value = model<Date | null>(null);
  /** Earliest selectable instant (inclusive, minute precision). */
  readonly min = input<Date | null>(null);
  /** Latest selectable instant (inclusive, minute precision). */
  readonly max = input<Date | null>(null);
  /** Predicate marking individual days as disabled (threaded to the calendar). */
  readonly disabledDate = input<((d: Date) => boolean) | null>(null);
  /** Placeholder shown when empty. */
  readonly placeholder = input(this.i18n.selectDateTime);
  /**
   * Pattern used to render the value in the field. Defaults to
   * `'MMM d, yyyy HH:mm'`, or `'MMM d, yyyy h:mm a'` when `hour12` is set.
   */
  readonly displayFormat = input<string | null>(null);
  /** Interval between generated time options, in minutes. */
  readonly step = input(30, { transform: numberAttribute });
  /** Display 12-hour times with AM/PM (the model is a `Date` either way). */
  readonly hour12 = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Show a clear button when a value is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Force invalid styling + `aria-invalid`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** First column of the calendar week (0 = Sunday). */
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly open = signal(false);
  /** Editable text mirror of the field. */
  protected readonly inputText = signal('');
  /** Keyboard-active option in the time list (index into `options`). */
  protected readonly activeIndex = signal(-1);
  /** Day picked in the calendar while there is no value yet. */
  private readonly pendingDay = signal<Date | null>(null);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-datetime-picker');
  readonly panelId = mkUniqueId('mk-datetime-picker-panel');
  readonly listId = mkUniqueId('mk-datetime-picker-times');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly showClear = computed(
    () => this.clearable() && !!this.value() && !this.isDisabled(),
  );
  protected readonly effectiveFormat = computed(
    () =>
      this.displayFormat() ??
      (this.hour12() ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy HH:mm'),
  );

  /** The day the calendar shows as selected: the value's day, else the pending one. */
  protected readonly calendarValue = computed<Date | null>(() => {
    const v = this.value();
    return v ? startOfDay(v) : this.pendingDay();
  });
  /** Day-granular bounds for the calendar (inclusive). */
  protected readonly calendarMin = computed(() => {
    const m = this.min();
    return m ? startOfDay(m) : null;
  });
  protected readonly calendarMax = computed(() => {
    const m = this.max();
    return m ? startOfDay(m) : null;
  });

  /**
   * Generated time options. On the `min` / `max` boundary day the list only
   * offers times inside the bound; on other days every step is listed.
   */
  protected readonly options = computed<MkTimeOption[]>(() => {
    const step = Math.max(1, Math.floor(this.step()));
    const day = this.calendarValue();
    const min = this.min();
    const max = this.max();
    const lo = day && min && isSameDay(day, min) ? minutesOfDay(min) : 0;
    const hi = day && max && isSameDay(day, max) ? minutesOfDay(max) : 24 * 60 - 1;
    const out: MkTimeOption[] = [];
    for (let mins = 0; mins < 24 * 60; mins += step) {
      if (mins < lo || mins > hi) continue;
      out.push({
        minutes: mins,
        label: this.displayTime(mins),
        id: `${this.listId}-opt-${mins}`,
      });
    }
    return out;
  });

  protected readonly selectedIndex = computed(() => {
    const v = this.value();
    if (!v) return -1;
    const mins = minutesOfDay(v);
    return this.options().findIndex((o) => o.minutes === mins);
  });

  constructor() {
    // Keep the text field in sync with the model (typing does not touch value).
    effect(() => {
      const v = this.value();
      this.inputText.set(
        v ? formatDate(v, this.effectiveFormat(), this.i18n.dateNames) : '',
      );
    });
  }

  // --- Display / parsing ------------------------------------------------------

  private displayTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (this.hour12()) {
      const ap = h < 12 ? 'AM' : 'PM';
      return `${h % 12 || 12}:${pad2(m)} ${ap}`;
    }
    return `${pad2(h)}:${pad2(m)}`;
  }

  /**
   * Accepts `YYYY-MM-DD[ T]HH:mm[ am|pm]`, a bare ISO date (→ midnight), any
   * `Date.parse`-able date followed by a time, or a full `Date.parse`-able
   * string. Seconds are dropped.
   */
  private parse(text: string): Date | null {
    const iso = /^(\d{4}-\d{2}-\d{2})(?:[T\s]+(.+))?$/.exec(text);
    if (iso) {
      const day = parseISODate(iso[1]);
      if (!day) return null;
      if (!iso[2]) return day;
      const mins = parseTime(iso[2]);
      return mins === null ? null : combine(day, mins);
    }
    const split = /^(.*\S)[\s,]+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)$/i.exec(text);
    if (split) {
      const mins = parseTime(split[2]);
      const ms = Date.parse(split[1]);
      if (mins !== null && !Number.isNaN(ms)) {
        return combine(startOfDay(new Date(ms)), mins);
      }
    }
    const ms = Date.parse(text);
    if (Number.isNaN(ms)) return null;
    const d = new Date(ms);
    d.setSeconds(0, 0);
    return d;
  }

  private clamp(d: Date): Date {
    const min = this.min();
    const max = this.max();
    if (min && toMinute(d) < toMinute(min)) return combine(min, minutesOfDay(min));
    if (max && toMinute(d) > toMinute(max)) return combine(max, minutesOfDay(max));
    return d;
  }

  // --- Panel ---------------------------------------------------------------

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  protected openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
    const sel = this.selectedIndex();
    this.activeIndex.set(sel >= 0 ? sel : this.nearestIndex(new Date()));
    afterNextRender(
      {
        write: () => {
          const el = this.panelRef()?.nativeElement.querySelector<HTMLElement>(
            '.mk-calendar__day[tabindex="0"]',
          );
          el?.focus();
          this.scrollActiveIntoView();
        },
      },
      { injector: this.injector },
    );
  }

  protected close(): void {
    if (this.open()) {
      this.open.set(false);
      this.activeIndex.set(-1);
    }
  }

  /** Index of the first option at or after `d`'s time of day (for the initial highlight). */
  private nearestIndex(d: Date): number {
    const mins = minutesOfDay(d);
    const i = this.options().findIndex((o) => o.minutes >= mins);
    return i >= 0 ? i : Math.max(0, this.options().length - 1);
  }

  protected onCalendarPick(day: Date | null): void {
    if (!day) return;
    const current = this.value();
    if (current) {
      this.setValue(this.clamp(combine(day, minutesOfDay(current))));
    } else {
      this.pendingDay.set(startOfDay(day));
    }
    // Hand focus to the time list so the second half of the pick is one
    // keystroke away; the highlighted option follows the (new) value.
    const sel = this.selectedIndex();
    this.activeIndex.set(sel >= 0 ? sel : this.nearestIndex(current ?? new Date()));
    afterNextRender(
      {
        write: () => {
          this.timesRef()?.nativeElement.focus();
          this.scrollActiveIntoView();
        },
      },
      { injector: this.injector },
    );
  }

  protected selectTime(index: number): void {
    const opt = this.options()[index];
    if (!opt) return;
    const day = this.calendarValue() ?? startOfDay(new Date());
    this.setValue(this.clamp(combine(day, opt.minutes)));
    this.close();
    this.inputRef()?.nativeElement.focus();
  }

  protected onListKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        this.activeIndex.set(0);
        this.scrollActiveIntoView();
        break;
      case 'End':
        e.preventDefault();
        this.activeIndex.set(this.options().length - 1);
        this.scrollActiveIntoView();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.activeIndex() >= 0) this.selectTime(this.activeIndex());
        break;
    }
  }

  private moveActive(delta: number): void {
    const len = this.options().length;
    if (!len) return;
    const next = (this.activeIndex() + delta + len) % len;
    this.activeIndex.set(next);
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    afterNextRender(
      {
        write: () => {
          const el = this.timesRef()?.nativeElement.querySelector<HTMLElement>(
            '.mk-datetime-picker__option--active',
          );
          el?.scrollIntoView({ block: 'nearest' });
        },
      },
      { injector: this.injector },
    );
  }

  // --- Field ----------------------------------------------------------------

  protected onInput(event: Event): void {
    this.inputText.set((event.target as HTMLInputElement).value);
  }

  protected onInputKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        this.commitInput();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.openPanel();
        break;
      case 'Escape':
        if (this.open()) {
          e.preventDefault();
          this.close();
        }
        break;
    }
  }

  protected clear(): void {
    this.pendingDay.set(null);
    this.setValue(null);
    this.inputRef()?.nativeElement.focus();
  }

  private commitInput(): void {
    const text = this.inputText().trim();
    if (!text) {
      this.setValue(null);
      return;
    }
    const parsed = this.parse(text);
    if (parsed) {
      this.setValue(this.clamp(parsed));
    } else {
      // Invalid entry — revert to the current model's display. The signal may
      // already hold that string (the model did not change), so the `[value]`
      // binding would not re-apply it: write the DOM value directly as well.
      const v = this.value();
      const text = v ? formatDate(v, this.effectiveFormat(), this.i18n.dateNames) : '';
      this.inputText.set(text);
      const el = this.inputRef()?.nativeElement;
      if (el) el.value = text;
    }
  }

  private setValue(date: Date | null): void {
    if (date) this.pendingDay.set(null);
    this.value.set(date);
    this.onChange(date);
  }

  protected onFocusOut(event: Event): void {
    const related = (event as FocusEvent).relatedTarget as Node | null;
    // Ignore focus moving into the field or the (top-layer) panel.
    if (related && this.host.nativeElement.contains(related)) return;
    if (related && this.panelRef()?.nativeElement.contains(related)) return;
    this.commitInput();
    this.close();
    this.onTouched();
  }

  /**
   * Escape pressed inside the (teleported) panel — close and return focus to
   * the input. `preventDefault` + `stopPropagation` keep any outer Escape
   * handling (e.g. a containing dialog) from also firing.
   */
  protected onPanelEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.close();
    this.inputRef()?.nativeElement.focus();
  }

  /**
   * Focus left the teleported panel. The host `(focusout)` never sees this —
   * the panel lives under `document.body` — so Tab-out is handled here: close
   * unless focus moved back into the field or stayed inside the panel.
   */
  protected onPanelFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related) return;
    if (this.host.nativeElement.contains(related)) return;
    if (this.panelRef()?.nativeElement.contains(related)) return;
    this.commitInput();
    this.close();
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: Date | null): void {
    this.pendingDay.set(null);
    this.value.set(value ?? null);
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

  // --- Validator ------------------------------------------------------------
  private readonly validatorChange = mkValidatorChange(() => {
    this.min();
    this.max();
  });

  /**
   * Reports `mkMinDate` / `mkMaxDate` against the `[min]` and `[max]` inputs,
   * comparing whole instants at minute precision.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (!(v instanceof Date) || Number.isNaN(v.getTime())) return null;
    const t = toMinute(v);
    const min = this.min();
    if (min && t < toMinute(min)) return { mkMinDate: { min, actual: v } };
    const max = this.max();
    if (max && t > toMinute(max)) return { mkMaxDate: { max, actual: v } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
