import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
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
import { MK_I18N, mkUniqueId } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core/signal-forms';
import { MkMask, mkApplyMask } from '@mk-kit/ui/directives';
import { MkFormField } from '../form-field/form-field';
import { detectCardBrand, isLuhn } from '@mk-kit/validators';

/** Card networks {@link MkCardNumberInput} recognises. */
export type MkCardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb';

/** Human-readable names for the recognised brands. */
export const MK_CARD_BRAND_NAMES: Record<MkCardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
};

/** Detect the card network from the leading digits — `detectCardBrand` from `@mk-kit/validators`. */
export function mkDetectCardBrand(digits: string): MkCardBrand | null {
  return detectCardBrand(digits);
}

/** Luhn (mod 10) checksum over a digit string — `isLuhn` from `@mk-kit/validators`. */
export function mkLuhnCheck(digits: string): boolean {
  return /^\d+$/.test(digits) && isLuhn(digits);
}

/** Grouping masks per brand (digit counts differ). */
const BRAND_MASKS: Partial<Record<MkCardBrand, string>> = {
  amex: '0000 000000 00000',
  diners: '0000 000000 0000',
};
const DEFAULT_MASK = '0000 0000 0000 0000';

/**
 * CardNumberInput — a payment-card number field that groups digits with the
 * detected network's layout (16-digit `0000 0000 0000 0000`, Amex
 * `0000 000000 00000`, Diners `0000 000000 0000`), shows the brand as a
 * badge, and validates the complete number with the Luhn checksum.
 *
 * The form value is the raw digit string (no spaces). `brand()` exposes the
 * detected network (also via `(brandChange)`), and `valid()` reports
 * `true`/`false` for a complete number passing/failing Luhn and `null` while
 * empty or incomplete; invalid styling engages after the field was touched.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so
 * `[(ngModel)]`, reactive forms and `[(value)]` all work.
 *
 * ```html
 * <mk-card-number-input [(ngModel)]="cardNumber" />
 * ```
 */
@Component({
  selector: 'mk-card-number-input',
  templateUrl: './card-number-input.html',
  styleUrl: './card-number-input.scss',
  exportAs: 'mkCardNumberInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkMask],
  host: {
    class: 'mk-card-number-input',
    '[class.mk-card-number-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-card-number-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-card-number-input--invalid]': 'isInvalid()',
    '[class.mk-card-number-input--disabled]': 'isDisabled()',
    '[attr.data-brand]': 'brand()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkCardNumberInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkCardNumberInput),
      multi: true,
    },
  ],
})
export class MkCardNumberInput implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** Show the detected brand as a badge inside the field. */
  readonly showBrand = input(true, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('0000 0000 0000 0000');
  /** Two-way card number, digits only (no spaces). */
  readonly value = model<string>('');
  /** Emits whenever the detected brand changes. */
  readonly brandChange = output<MkCardBrand | null>();

  private readonly touched = signal(false);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private lastBrand: MkCardBrand | null = null;

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-card');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isRequired = computed(
    () => this.field?.isRequired() ?? false,
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** The detected card network, `null` while unrecognised. */
  readonly brand = computed<MkCardBrand | null>(() =>
    mkDetectCardBrand(this.value()),
  );
  /** Human-readable brand name (empty while unrecognised). */
  protected readonly brandName = computed(() => {
    const b = this.brand();
    return b ? MK_CARD_BRAND_NAMES[b] : '';
  });

  /** The grouping mask for the current brand. */
  protected readonly mask = computed(() => {
    const b = this.brand();
    return (b && BRAND_MASKS[b]) || DEFAULT_MASK;
  });
  /** Digits the current brand's complete number has. */
  private readonly expectedLength = computed(
    () => (this.mask().match(/0/g) ?? []).length,
  );

  /** Formatted (grouped) number shown in the field. */
  protected readonly masked = computed(
    () => mkApplyMask(this.value(), this.mask()).masked,
  );

  /**
   * `true` for a complete number passing Luhn, `false` for a complete number
   * failing it, `null` while empty or incomplete.
   */
  readonly valid = computed<boolean | null>(() => {
    const digits = this.value();
    if (!digits) return null;
    if (digits.length < this.expectedLength()) return null;
    return mkLuhnCheck(digits);
  });

  protected readonly isInvalid = computed(
    () =>
      (this.invalid() && this.fieldTouched()) ||
      (this.field?.hasError() ?? false) ||
      (this.touched() && this.valid() === false),
  );

  protected onDigitsChange(unmasked: string): void {
    if (unmasked === this.value()) return;
    this.value.set(unmasked);
    this.onChange(unmasked);
    const brand = this.brand();
    if (brand !== this.lastBrand) {
      this.lastBrand = brand;
      this.brandChange.emit(brand);
    }
  }

  protected onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set((value ?? '').replace(/\D/g, ''));
    this.lastBrand = this.brand();
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // --- Validator ------------------------------------------------------------
  /**
   * Reports `cardNumber` for a number failing the Luhn checksum (which
   * includes a half-typed one). An empty value passes; compose with
   * `Validators.required` to reject it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const raw = control.value;
    const digits = typeof raw === 'string' ? raw.replace(/\D/g, '') : '';
    if (!digits) return null;
    return mkLuhnCheck(digits) ? null : { cardNumber: true };
  }
}
