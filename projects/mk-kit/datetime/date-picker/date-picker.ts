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
import { mkInjectFieldTouched } from '@mk-kit/ui/core';
import { MkFormField } from '@mk-kit/ui/forms';
import { MkCalendar } from '../calendar/calendar';
import {
  clampDate,
  formatDate,
  isAfter,
  isBefore,
  parseISODate,
  startOfDay,
} from '../datetime/date-utils';

/**
 * DatePicker — a text field paired with a calendar popover. Type a date (parsed
 * on blur/Enter) or pick one from the `mk-calendar`. Implements
 * `ControlValueAccessor` and a two-way `value` model, so it works with
 * `[(ngModel)]`, reactive forms and `[(value)]`.
 *
 * The calendar opens below the field, closes on Escape / outside click / after
 * a selection, and wires `aria-expanded` / `aria-haspopup` / `aria-invalid`.
 * When nested in an `mk-form-field` it adopts the field's id and aria wiring.
 *
 * ```html
 * <mk-date-picker [(value)]="date" [min]="minDate" clearable />
 * ```
 */
@Component({
  selector: 'mk-date-picker',
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkCalendar, MkAnchoredPanel],
  host: {
    class: 'mk-date-picker',
    '[class.mk-date-picker--sm]': "effectiveSize() === 'sm'",
    '[class.mk-date-picker--md]': "effectiveSize() === 'md'",
    '[class.mk-date-picker--lg]': "effectiveSize() === 'lg'",
    '[class.mk-date-picker--open]': 'open()',
    '[class.mk-date-picker--invalid]': 'isInvalid()',
    '[class.mk-date-picker--disabled]': 'isDisabled()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkDatePicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkDatePicker),
      multi: true,
    },
  ],
})
export class MkDatePicker implements ControlValueAccessor, Validator {
  protected readonly i18n = inject(MK_I18N);
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly inputRef =
    viewChild<ElementRef<HTMLInputElement>>('textInput');
  /** The calendar panel — lives in the top layer once opened. */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** Two-way selected date. */
  readonly value = model<Date | null>(null);
  /** Earliest selectable date (inclusive). */
  /** Accessible name when the picker is used without an `mk-form-field` label. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });
  protected readonly ariaLabelAttr = computed(() => (this.field ? null : this.ariaLabel() || null));
  readonly min = input<Date | null, Date | null | undefined>(null, {
    // Signal Forms binds the schema's `min()` limit here, `undefined` when unset.
    transform: (v) => v ?? null,
  });
  /** Latest selectable date (inclusive). */
  readonly max = input<Date | null, Date | null | undefined>(null, {
    // Signal Forms binds the schema's `max()` limit here, `undefined` when unset.
    transform: (v) => v ?? null,
  });
  /** Predicate marking individual days as disabled (threaded to the calendar). */
  readonly disabledDate = input<((d: Date) => boolean) | null>(null);
  /** Placeholder shown when empty. */
  readonly placeholder = input(this.i18n.selectDate);
  /** Pattern used to render the selected date in the field. */
  readonly displayFormat = input<string>('MMM d, yyyy');
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Show a clear button when a date is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Force invalid styling + `aria-invalid`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Mark required (adds `aria-required`). Set by Signal Forms' `[formField]` from the schema. */
  readonly required = input(false, { transform: booleanAttribute });
  /** First column of the calendar week (0 = Sunday). */
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly open = signal(false);
  /** Editable text mirror of the field. */
  protected readonly inputText = signal('');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-date-picker');
  readonly panelId = mkUniqueId('mk-date-picker-panel');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(
    () => this.required() || (this.field?.isRequired() ?? false),
  );
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly showClear = computed(
    () => this.clearable() && !!this.value() && !this.isDisabled(),
  );

  constructor() {
    // Keep the text field in sync with the model (typing does not touch value).
    effect(() => {
      const v = this.value();
      this.inputText.set(
        v ? formatDate(v, this.displayFormat(), this.i18n.dateNames) : '',
      );
    });
  }

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
    if (this.open()) this.open.set(false);
  }

  protected onCalendarPick(date: Date | null): void {
    this.setValue(date);
    this.close();
    this.inputRef()?.nativeElement.focus();
  }

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
      this.setValue(clampDate(parsed, this.min(), this.max()));
    } else {
      // Invalid entry — revert to the current model's display. The signal may
      // already hold that string (the model did not change), so the `[value]`
      // binding would not re-apply it: write the DOM value directly as well.
      const v = this.value();
      const text = v ? formatDate(v, this.displayFormat(), this.i18n.dateNames) : '';
      this.inputText.set(text);
      const el = this.inputRef()?.nativeElement;
      if (el) el.value = text;
    }
  }

  private parse(text: string): Date | null {
    const iso = parseISODate(text);
    if (iso) return iso;
    const ms = Date.parse(text);
    return Number.isNaN(ms) ? null : startOfDay(new Date(ms));
  }

  private setValue(date: Date | null): void {
    this.value.set(date);
    this.onChange(date);
  }

  protected onFocusOut(event: Event): void {
    const related = (event as FocusEvent).relatedTarget as Node | null;
    // Ignore focus moving into the field or the (top-layer) calendar panel.
    if (related && this.host.nativeElement.contains(related)) return;
    if (related && this.panelRef()?.nativeElement.contains(related)) return;
    this.commitInput();
    this.close();
    this.onTouched();
  }

  /**
   * Escape pressed inside the (teleported) calendar panel — close and return
   * focus to the input. `preventDefault` + `stopPropagation` keep any outer
   * Escape handling (e.g. a containing dialog) from also firing.
   */
  protected onPanelEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.close();
    this.inputRef()?.nativeElement.focus();
  }

  /**
   * Focus left the teleported panel. The host `(focusout)` never sees this —
   * the panel lives under `document.body` — so Tab-out of the calendar is
   * handled here: close unless focus moved back into the field or the panel.
   */
  protected onPanelFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    // Focus fell to a non-focusable spot (body) — keep open; an outside
    // pointerdown is dismissed by the anchored panel itself.
    if (!related) return;
    if (this.host.nativeElement.contains(related)) return;
    if (this.panelRef()?.nativeElement.contains(related)) return;
    this.commitInput();
    this.close();
    this.onTouched();
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
   * Reports `mkMinDate` / `mkMaxDate` against the `[min]` and `[max]` inputs.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (!(v instanceof Date) || Number.isNaN(v.getTime())) return null;
    const day = startOfDay(v);
    const min = this.min();
    if (min && isBefore(day, startOfDay(min))) return { mkMinDate: { min, actual: v } };
    const max = this.max();
    if (max && isAfter(day, startOfDay(max))) return { mkMaxDate: { max, actual: v } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
