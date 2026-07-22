import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
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
import type { MkSize } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { mkValidatorChange } from '@mkornas/ui/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MkAnchoredPanel } from '@mkornas/ui/core';
import { MkFormField } from '@mkornas/ui/forms';
import { MkCalendar } from '../calendar/calendar';
import {
  endOfWeek,
  formatDate,
  getISOWeek,
  isAfter,
  isBefore,
  startOfDay,
  startOfWeek,
} from '../datetime/date-utils';

/** A selected calendar week (its first and last day, at midnight). */
export interface MkWeek {
  start: Date;
  end: Date;
}

/**
 * WeekPicker — pick a whole calendar week from a popover calendar. Hovering a
 * day previews its entire week; clicking selects it. The value is an
 * {@link MkWeek} (`{ start, end }`, aligned to `firstDayOfWeek`). Implements
 * `ControlValueAccessor` and a two-way `value` model; the panel renders in the
 * top layer so it is never clipped.
 *
 * ```html
 * <mk-week-picker [(value)]="week" [firstDayOfWeek]="1" clearable />
 * ```
 */
@Component({
  selector: 'mk-week-picker',
  templateUrl: './week-picker.html',
  styleUrl: './week-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkCalendar, MkAnchoredPanel],
  host: {
    class: 'mk-week-picker',
    '[class.mk-week-picker--sm]': "effectiveSize() === 'sm'",
    '[class.mk-week-picker--lg]': "effectiveSize() === 'lg'",
    '[class.mk-week-picker--open]': 'open()',
    '[class.mk-week-picker--invalid]': 'isInvalid()',
    '[class.mk-week-picker--disabled]': 'isDisabled()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkWeekPicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkWeekPicker),
      multi: true,
    },
  ],
})
export class MkWeekPicker implements ControlValueAccessor, Validator {
  protected readonly i18n = inject(MK_I18N);
  private readonly field = inject(MkFormField, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** Two-way selected week. */
  readonly value = model<MkWeek | null>(null);
  /** Earliest selectable date (inclusive). */
  readonly min = input<Date | null>(null);
  /** Latest selectable date (inclusive). */
  readonly max = input<Date | null>(null);
  /** First column of the calendar week (0 = Sunday). Also anchors the week. */
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  /** Placeholder shown when empty. */
  readonly placeholder = input(this.i18n.selectWeek);
  /** Pattern used to render each endpoint of the week range. */
  readonly displayFormat = input<string>('MMM d');
  /** Prefix the label with the ISO week number, e.g. `W28 · …`. */
  readonly showWeekNumber = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Show a clear button when a week is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Force invalid styling + `aria-invalid`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly open = signal(false);
  /** The week currently previewed under the pointer (drives highlighting). */
  private readonly hoverWeek = signal<MkWeek | null>(null);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: MkWeek | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly triggerId = this.field?.controlId ?? mkUniqueId('mk-week-picker');
  readonly panelId = mkUniqueId('mk-week-picker-panel');

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
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly showClear = computed(
    () => this.clearable() && !!this.value() && !this.isDisabled(),
  );

  /** The week to highlight: the hovered one while previewing, else the value. */
  protected readonly highlightWeek = computed(
    () => this.hoverWeek() ?? this.value(),
  );

  /** Display label, e.g. `W28 · Jul 6 – Jul 12, 2026`. */
  protected readonly displayLabel = computed(() => {
    const week = this.value();
    if (!week) return '';
    const fmt = this.displayFormat();
    const names = this.i18n.dateNames;
    const range = `${formatDate(week.start, fmt, names)} – ${formatDate(
      week.end,
      `${fmt}, yyyy`,
      names,
    )}`;
    return this.showWeekNumber() ? `W${getISOWeek(week.start)} · ${range}` : range;
  });

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  protected openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
    afterNextRender(
      {
        write: () => {
          const el = this.panelRef()?.nativeElement.querySelector<HTMLElement>(
            '.mk-calendar__day[tabindex="0"]',
          );
          el?.focus();
        },
      },
      { injector: this.injector },
    );
  }

  protected close(): void {
    if (this.open()) {
      this.open.set(false);
      this.hoverWeek.set(null);
    }
  }

  /** A day inside the calendar was activated — select its whole week. */
  protected onPick(date: Date): void {
    const week = this.weekOf(date);
    this.value.set(week);
    this.onChange(week);
    this.close();
    this.triggerRef()?.nativeElement.focus();
  }

  /** Preview the hovered day's week. */
  protected onHover(date: Date | null): void {
    this.hoverWeek.set(date ? this.weekOf(date) : null);
  }

  protected clear(): void {
    this.value.set(null);
    this.onChange(null);
    this.triggerRef()?.nativeElement.focus();
  }

  private weekOf(date: Date): MkWeek {
    const fdow = this.firstDayOfWeek();
    return { start: startOfWeek(date, fdow), end: endOfWeek(date, fdow) };
  }

  /** Reference date the calendar should open on (the selected week's start). */
  protected readonly calendarValue = computed(() => this.value()?.start ?? null);

  protected onFocusOut(event: Event): void {
    const related = (event as FocusEvent).relatedTarget as Node | null;
    if (related && this.host.nativeElement.contains(related)) return;
    if (related && this.panelRef()?.nativeElement.contains(related)) return;
    this.close();
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: MkWeek | null): void {
    // Re-anchor any incoming date to a full week for consistent highlighting.
    if (value?.start) this.value.set(this.weekOf(value.start));
    else this.value.set(null);
  }
  registerOnChange(fn: (value: MkWeek | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  /** Expose the raw highlight endpoints to the template. */
  protected highlightStart = computed(() => this.highlightWeek()?.start ?? null);
  protected highlightEnd = computed(() => this.highlightWeek()?.end ?? null);

  // --- Validator ------------------------------------------------------------
  private readonly validatorChange = mkValidatorChange(() => {
    this.min();
    this.max();
  });

  /**
   * Reports `mkMinDate` / `mkMaxDate` when the selected week starts before
   * `[min]` or ends after `[max]`.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    const start = v?.start;
    const end = v?.end;
    if (!(start instanceof Date) || !(end instanceof Date)) return null;
    const min = this.min();
    if (min && isBefore(startOfDay(start), startOfDay(min))) {
      return { mkMinDate: { min, actual: start } };
    }
    const max = this.max();
    if (max && isAfter(startOfDay(end), startOfDay(max))) {
      return { mkMaxDate: { max, actual: end } };
    }
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
