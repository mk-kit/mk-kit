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
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkFormField } from '../form-field/form-field';
import { MkCalendar } from '../calendar/calendar';
import { formatDate, isBefore, startOfDay } from '../datetime/date-utils';

/** A selected date range. Either endpoint may be `null` while incomplete. */
export interface MkDateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * DateRangePicker — select a start + end date from a single calendar popover.
 * The first click sets the start, the second sets the end (endpoints are
 * swapped if picked in reverse), and the hovered range is previewed live.
 * Implements `ControlValueAccessor` and a two-way `value` model of
 * {@link MkDateRange}.
 *
 * ```html
 * <mk-date-range-picker [(value)]="range" [min]="minDate" clearable />
 * ```
 */
@Component({
  selector: 'mk-date-range-picker',
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkCalendar],
  host: {
    class: 'mk-date-range-picker',
    '[class.mk-date-range-picker--sm]': "effectiveSize() === 'sm'",
    '[class.mk-date-range-picker--md]': "effectiveSize() === 'md'",
    '[class.mk-date-range-picker--lg]': "effectiveSize() === 'lg'",
    '[class.mk-date-range-picker--open]': 'open()',
    '[class.mk-date-range-picker--invalid]': 'isInvalid()',
    '[class.mk-date-range-picker--disabled]': 'isDisabled()',
    '(document:pointerdown)': 'onDocumentPointerdown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkDateRangePicker),
      multi: true,
    },
  ],
})
export class MkDateRangePicker implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');

  /** Two-way selected range. */
  readonly value = model<MkDateRange>({ start: null, end: null });
  /** Earliest selectable date (inclusive). */
  readonly min = input<Date | null>(null);
  /** Latest selectable date (inclusive). */
  readonly max = input<Date | null>(null);
  /** Predicate marking individual days as disabled. */
  readonly disabledDate = input<((d: Date) => boolean) | null>(null);
  /** Placeholder shown when no range is selected. */
  readonly placeholder = input<string>('Select range…');
  /** Pattern used to render each endpoint. */
  readonly displayFormat = input<string>('MMM d, yyyy');
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Show a clear button when a range is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Force invalid styling + `aria-invalid`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** First column of the calendar week (0 = Sunday). */
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly open = signal(false);
  /** In-progress start endpoint (drives calendar highlighting). */
  protected readonly selStart = signal<Date | null>(null);
  /** In-progress end endpoint. */
  protected readonly selEnd = signal<Date | null>(null);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: MkDateRange) => void = () => {};
  private onTouched: () => void = () => {};

  readonly triggerId = this.field?.controlId ?? mkUniqueId('mk-date-range');
  readonly panelId = mkUniqueId('mk-date-range-panel');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(() => this.field?.required() ?? false);
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly showClear = computed(() => {
    const v = this.value();
    return this.clearable() && !!(v.start || v.end) && !this.isDisabled();
  });

  /** Display label, e.g. `Jul 1, 2026 – Jul 9, 2026`. */
  protected readonly displayLabel = computed(() => {
    const { start, end } = this.value();
    const fmt = this.displayFormat();
    if (!start && !end) return '';
    const s = start ? formatDate(start, fmt) : '…';
    const e = end ? formatDate(end, fmt) : '…';
    return `${s} – ${e}`;
  });

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  protected openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    const v = this.value();
    this.selStart.set(v.start);
    this.selEnd.set(v.end);
    this.open.set(true);
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

  protected close(): void {
    if (this.open()) this.open.set(false);
  }

  protected onPick(date: Date): void {
    const start = this.selStart();
    const end = this.selEnd();
    const day = startOfDay(date);

    if (!start || (start && end)) {
      // Begin a fresh range.
      this.selStart.set(day);
      this.selEnd.set(null);
      return;
    }

    // Complete the range, swapping if picked in reverse.
    if (isBefore(day, start)) {
      this.selStart.set(day);
      this.selEnd.set(start);
    } else {
      this.selEnd.set(day);
    }
    this.commit();
    this.close();
    this.triggerRef()?.nativeElement.focus();
  }

  protected clear(): void {
    this.selStart.set(null);
    this.selEnd.set(null);
    this.setValue({ start: null, end: null });
    this.triggerRef()?.nativeElement.focus();
  }

  private commit(): void {
    this.setValue({ start: this.selStart(), end: this.selEnd() });
  }

  private setValue(range: MkDateRange): void {
    this.value.set(range);
    this.onChange(range);
  }

  protected onDocumentPointerdown(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  protected onFocusOut(event: Event): void {
    const related = (event as FocusEvent).relatedTarget as Node | null;
    if (related && this.host.nativeElement.contains(related)) return;
    this.close();
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: MkDateRange | null): void {
    this.value.set(value ?? { start: null, end: null });
  }
  registerOnChange(fn: (value: MkDateRange) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
