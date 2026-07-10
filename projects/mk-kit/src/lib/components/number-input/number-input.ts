import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
import { MK_I18N } from '../../core/i18n/mk-i18n';
import type { MkSize } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkFormField } from '../form-field/form-field';

/**
 * NumberInput — a numeric field with −/+ stepper buttons, clamping and keyboard
 * stepping (Arrow keys / Page keys). Implements the ARIA `spinbutton` pattern
 * and `ControlValueAccessor` over `number | null`, with a two-way `value` model.
 *
 * ```html
 * <mk-number-input [(value)]="qty" [min]="0" [max]="99" [step]="1" />
 * ```
 */
@Component({
  selector: 'mk-number-input',
  templateUrl: './number-input.html',
  styleUrl: './number-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-number-input',
    '[class.mk-number-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-number-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-number-input--invalid]': 'isInvalid()',
    '[class.mk-number-input--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkNumberInput),
      multi: true,
    },
  ],
})
export class MkNumberInput implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  protected readonly i18n = inject(MK_I18N);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Minimum value. */
  readonly min = input<number | null>(null);
  /** Maximum value. */
  readonly max = input<number | null>(null);
  /** Step increment for buttons + Arrow keys. */
  readonly step = input(1, { transform: numberAttribute });
  /** Two-way value. */
  readonly value = model<number | null>(null);
  /** Placeholder when empty. */
  readonly placeholder = input('');
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force invalid styling when standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored inside an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly inputId = this.field?.controlId ?? mkUniqueId('mk-number');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

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

  /** Text mirror of the value for the input. */
  protected readonly display = computed(() => {
    const v = this.value();
    return v == null ? '' : String(v);
  });

  protected readonly canDecrement = computed(() => {
    if (this.isDisabled()) return false;
    const min = this.min();
    return min == null || (this.value() ?? min) > min;
  });
  protected readonly canIncrement = computed(() => {
    if (this.isDisabled()) return false;
    const max = this.max();
    return max == null || (this.value() ?? max) < max;
  });

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value.trim();
    if (text === '' || text === '-') {
      this.commit(null, false);
      return;
    }
    const parsed = Number(text);
    if (!Number.isNaN(parsed)) this.commit(parsed, false);
  }

  protected onBlur(): void {
    // Clamp to bounds on blur and normalise the displayed text.
    const v = this.value();
    if (v != null) this.commit(this.clamp(v), true);
    this.onTouched();
  }

  protected step_(delta: number): void {
    if (this.isDisabled()) return;
    const cur = this.value();
    // From empty, the first press lands on the minimum (or 0), not min ± step.
    const next =
      cur == null ? (this.min() ?? 0) : cur + delta * this.step();
    this.commit(this.clamp(next), true);
    this.inputRef()?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.step_(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.step_(-1);
    }
  }

  private clamp(v: number): number {
    const min = this.min();
    const max = this.max();
    if (min != null && v < min) return min;
    if (max != null && v > max) return max;
    return v;
  }

  private commit(v: number | null, syncInput: boolean): void {
    this.value.set(v);
    this.onChange(v);
    if (syncInput) {
      const input = this.inputRef()?.nativeElement;
      if (input) input.value = v == null ? '' : String(v);
    }
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: number | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
