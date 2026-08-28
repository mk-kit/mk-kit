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
  signal,
  viewChild,
  viewChildren,
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
import { mkInjectFieldTouched } from '@mk-kit/ui/core';
import { MkFormField } from '@mk-kit/ui/forms';
import {
  endOfMonth,
  formatDate,
  isAfter,
  isBefore,
  startOfMonth,
} from '../datetime/date-utils';

/** Selection granularity for {@link MkMonthPicker}. */
export type MkMonthPickerMode = 'month' | 'year';

interface Cell {
  label: string;
  /** Year (both modes) and month index (month mode only). */
  year: number;
  month: number;
  disabled: boolean;
  selected: boolean;
}

/**
 * MonthPicker — a compact field + popover for picking a **month** (`MMM yyyy`)
 * or a **year**. The panel shows a 12-month grid (with year nav) or a 12-year
 * grid (with decade nav). Value is a `Date` at the first day of the selection.
 * Implements `ControlValueAccessor` + a two-way `value` model; the panel renders
 * in the top layer so it is never clipped.
 *
 * ```html
 * <mk-month-picker [(value)]="month" />
 * <mk-month-picker mode="year" [(value)]="year" />
 * ```
 */
@Component({
  selector: 'mk-month-picker',
  templateUrl: './month-picker.html',
  styleUrl: './month-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-month-picker',
    '[class.mk-month-picker--sm]': "effectiveSize() === 'sm'",
    '[class.mk-month-picker--lg]': "effectiveSize() === 'lg'",
    '[class.mk-month-picker--open]': 'open()',
    '[class.mk-month-picker--invalid]': 'isInvalid()',
    '[class.mk-month-picker--disabled]': 'isDisabled()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkMonthPicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkMonthPicker),
      multi: true,
    },
  ],
})
export class MkMonthPicker implements ControlValueAccessor, Validator {
  protected readonly i18n = inject(MK_I18N);
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly cellRefs =
    viewChildren<ElementRef<HTMLButtonElement>>('cell');

  /** Two-way selected date (first of the month / year). */
  readonly value = model<Date | null>(null);
  /** Pick a month or a whole year. */
  readonly mode = input<MkMonthPickerMode>('month');
  /** Earliest selectable date. */
  readonly min = input<Date | null, Date | null | undefined>(null, {
    // Signal Forms binds the schema's `min()` limit here, `undefined` when unset.
    transform: (v) => v ?? null,
  });
  /** Latest selectable date. */
  readonly max = input<Date | null, Date | null | undefined>(null, {
    // Signal Forms binds the schema's `max()` limit here, `undefined` when unset.
    transform: (v) => v ?? null,
  });
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('');
  /** Display pattern (defaults to `MMM yyyy` / `yyyy`). */
  readonly displayFormat = input<string>('');
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Show a clear button when a value is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Force invalid styling. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly open = signal(false);
  /** The year currently shown in the panel (base for the month/decade grid). */
  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly activeIndex = signal(0);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly triggerId = this.field?.controlId ?? mkUniqueId('mk-month-picker');
  readonly panelId = mkUniqueId('mk-month-picker-panel');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  protected readonly resolvedPlaceholder = computed(
    () =>
      this.placeholder() ||
      (this.mode() === 'year' ? this.i18n.selectYear : this.i18n.selectMonth),
  );
  private readonly pattern = computed(
    () => this.displayFormat() || (this.mode() === 'year' ? 'yyyy' : 'MMM yyyy'),
  );
  protected readonly displayLabel = computed(() => {
    const v = this.value();
    return v ? formatDate(v, this.pattern(), this.i18n.dateNames) : '';
  });

  /** The decade start when in year mode. */
  private readonly decadeStart = computed(
    () => Math.floor(this.viewYear() / 12) * 12,
  );

  /** Header label (year, or decade range). */
  protected readonly headerLabel = computed(() => {
    if (this.mode() === 'year') {
      const s = this.decadeStart();
      return `${s} – ${s + 11}`;
    }
    return `${this.viewYear()}`;
  });

  /** Abbreviated month labels for the grid, from the active locale. */
  private readonly months = this.i18n.dateNames.monthsShort;

  /** The 12 grid cells (months or years). */
  protected readonly cells = computed<Cell[]>(() => {
    const value = this.value();
    if (this.mode() === 'year') {
      const start = this.decadeStart();
      return Array.from({ length: 12 }, (_, i) => {
        const year = start + i;
        const date = new Date(year, 0, 1);
        return {
          label: `${year}`,
          year,
          month: 0,
          disabled: this.outOfRange(date, new Date(year, 11, 31)),
          selected: value?.getFullYear() === year,
        };
      });
    }
    const year = this.viewYear();
    return this.months.map((label, m) => {
      const date = new Date(year, m, 1);
      return {
        label,
        year,
        month: m,
        disabled: this.outOfRange(date, endOfMonth(date)),
        selected: value?.getFullYear() === year && value?.getMonth() === m,
      };
    });
  });

  constructor() {
    // Keep the panel's view year in sync with the selected value.
    effect(() => {
      const v = this.value();
      if (v) this.viewYear.set(v.getFullYear());
    });
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  protected openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    const v = this.value();
    if (v) this.viewYear.set(v.getFullYear());
    // Focus the selected (or first enabled) cell once the panel is in the DOM.
    const cells = this.cells();
    const sel = cells.findIndex((c) => c.selected);
    this.activeIndex.set(sel >= 0 ? sel : cells.findIndex((c) => !c.disabled));
    this.open.set(true);
    afterNextRender(() => this.focusActive(), { injector: this.injector });
  }

  protected close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.triggerRef()?.nativeElement.focus();
  }

  protected shiftView(delta: number): void {
    const step = this.mode() === 'year' ? 12 : 1;
    this.viewYear.set(this.viewYear() + delta * step);
  }

  protected selectCell(cell: Cell): void {
    if (cell.disabled) return;
    const date = new Date(cell.year, this.mode() === 'year' ? 0 : cell.month, 1);
    this.value.set(date);
    this.onChange(date);
    this.close(true);
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this.onChange(null);
    this.triggerRef()?.nativeElement.focus();
  }

  protected onGridKeydown(event: KeyboardEvent): void {
    const cols = 3;
    const total = this.cells().length;
    let next = this.activeIndex();
    switch (event.key) {
      case 'ArrowRight': next += 1; break;
      case 'ArrowLeft': next -= 1; break;
      case 'ArrowDown': next += cols; break;
      case 'ArrowUp': next -= cols; break;
      case 'Home': next = 0; break;
      case 'End': next = total - 1; break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.activeIndex.set(Math.max(0, Math.min(total - 1, next)));
    this.focusActive();
  }

  private focusActive(): void {
    this.cellRefs()[this.activeIndex()]?.nativeElement.focus();
  }

  protected onFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.host.nativeElement.contains(related)) return;
    if (related && this.panelRef()?.nativeElement.contains(related)) return;
    this.close();
    this.onTouched();
  }

  private outOfRange(start: Date, end: Date): boolean {
    const min = this.min();
    const max = this.max();
    if (min && isBefore(end, min)) return true;
    if (max && isAfter(start, max)) return true;
    return false;
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: Date | null): void {
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
   * compared at month granularity.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (!(v instanceof Date) || Number.isNaN(v.getTime())) return null;
    const month = startOfMonth(v);
    const min = this.min();
    if (min && isBefore(month, startOfMonth(min))) return { mkMinDate: { min, actual: v } };
    const max = this.max();
    if (max && isAfter(month, startOfMonth(max))) return { mkMaxDate: { max, actual: v } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
