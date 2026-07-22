import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  ValidatorFn,
  type Validator,
} from '@angular/forms';
import type { MkSize } from '@mkornas/ui/core';
import { mkValidatorChange } from '@mkornas/ui/core';
import { MK_I18N, mkUniqueId } from '@mkornas/ui/core';
import { mkApplyMask, mkMaskCaret } from '@mkornas/ui/directives';
import { MkFormField } from '../form-field/form-field';
import {
  MK_POSTAL_FORMATS,
  MkPostalFormat,
  mkPostalFormat,
} from './postal-formats';

/**
 * Reactive-forms validator for a postal code in a given country. Empty values
 * pass (compose with `Validators.required`); countries without a built-in
 * format pass everything.
 *
 * ```ts
 * zip: ['', [Validators.required, mkPostalCodeValidator('PL')]]
 * ```
 */
export function mkPostalCodeValidator(
  country: string,
  formats: readonly MkPostalFormat[] = MK_POSTAL_FORMATS,
): ValidatorFn {
  const upper = country.toUpperCase();
  const format = formats.find((f) => f.code === upper);
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    if (!value || !format || format.pattern.test(value)) return null;
    return {
      postalCode: { country: upper, example: format.example },
    };
  };
}

/**
 * PostalCodeInput — a postal/ZIP code field that masks, uppercases and
 * validates itself for the given `country` (35+ built-in formats: `PL`
 * `00-000`, `US` `00000[-0000]`, `CA` `A0A 0A0`, `NL` `0000 AA`, …).
 * Free-format countries (e.g. `GB`) skip the mask and validate against the
 * national pattern instead, normalising the inward-code space on blur.
 *
 * The placeholder defaults to a valid example for the country. `valid()`
 * (via `exportAs`) reports `true`/`false` for a complete/incomplete code and
 * `null` when empty or the country is unknown; invalid styling engages after
 * the field is touched.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so
 * `[(ngModel)]`, reactive forms and `[(value)]` all work.
 *
 * ```html
 * <mk-postal-code-input country="PL" [(ngModel)]="zip" />
 * <mk-postal-code-input [country]="form.value.country" [(value)]="zip" />
 * ```
 */
@Component({
  selector: 'mk-postal-code-input',
  templateUrl: './postal-code-input.html',
  styleUrl: './postal-code-input.scss',
  exportAs: 'mkPostalCodeInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-postal-code-input',
    '[class.mk-postal-code-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-postal-code-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-postal-code-input--invalid]': 'isInvalid()',
    '[class.mk-postal-code-input--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkPostalCodeInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkPostalCodeInput),
      multi: true,
    },
  ],
})
export class MkPostalCodeInput implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** ISO 3166-1 alpha-2 country whose format applies. */
  readonly country = input<string>('US');
  /** The format table (defaults to the built-in set) — extend to add countries. */
  readonly formats = input<readonly MkPostalFormat[]>(MK_POSTAL_FORMATS);
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder; defaults to a valid example for the country. */
  readonly placeholder = input<string>('');
  /** Two-way formatted value (e.g. `00-950`, `K1A 0B1`). */
  readonly value = model<string>('');

  private readonly touched = signal(false);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-postal');

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

  /** The active format, or `undefined` for unknown countries (free text). */
  protected readonly format = computed<MkPostalFormat | undefined>(() => {
    const code = this.country().toUpperCase();
    return this.formats().find((f) => f.code === code) ?? mkPostalFormat(code);
  });

  /**
   * `true`/`false` for a complete/incomplete code, `null` when empty or the
   * country has no known format.
   */
  readonly valid = computed<boolean | null>(() => {
    const v = this.value().trim();
    const fmt = this.format();
    if (!v || !fmt) return null;
    return fmt.pattern.test(v);
  });

  protected readonly isInvalid = computed(
    () =>
      this.invalid() ||
      (this.field?.hasError() ?? false) ||
      (this.touched() && this.valid() === false),
  );

  protected readonly effectivePlaceholder = computed(
    () => this.placeholder() || (this.format()?.example ?? ''),
  );

  /** Numeric keyboard for digit-only masks. */
  protected readonly inputMode = computed(() => {
    const mask = this.format()?.mask;
    return mask && !/[A*]/.test(mask) ? 'numeric' : 'text';
  });

  protected readonly maxLength = computed(() => {
    const fmt = this.format();
    if (fmt?.mask) return fmt.mask.length;
    return fmt ? fmt.example.length + 2 : 12;
  });

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const rawValue = el.value;
    const caret = el.selectionStart ?? rawValue.length;
    const upper = rawValue.toUpperCase();
    const mask = this.format()?.mask;

    let next = upper;
    if (mask) {
      next = mkApplyMask(upper, mask).masked;
      el.value = next;
      const pos = mkMaskCaret(rawValue, caret, next);
      el.setSelectionRange(pos, pos);
    } else if (next !== rawValue) {
      // Uppercasing preserves length, so the caret can stay where it was.
      el.value = next;
      el.setSelectionRange(caret, caret);
    }
    this.commit(next);
  }

  protected onBlur(): void {
    this.touched.set(true);
    const fmt = this.format();
    const v = this.value();
    // Free-format codes (GB, …): insert the missing space before the final
    // 3-character inward part, so "SW1A1AA" normalises to "SW1A 1AA".
    if (fmt && !fmt.mask && v && !v.includes(' ') && v.length >= 5) {
      const spaced = `${v.slice(0, -3)} ${v.slice(-3)}`;
      if (fmt.pattern.test(spaced)) this.commit(spaced);
    }
    this.onTouched();
  }

  private commit(next: string): void {
    if (next === this.value()) return;
    this.value.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    const text = (value ?? '').toUpperCase();
    const mask = this.format()?.mask;
    this.value.set(mask ? mkApplyMask(text, mask).masked : text);
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
  private readonly validatorChange = mkValidatorChange(() => {
    this.country();
    this.formats();
  });

  /**
   * Reports `postalCode` for a code not matching `[country]`'s format — the
   * same error `mkPostalCodeValidator()` produces. Empty values and countries
   * without a built-in format pass.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const raw = control.value;
    const v = typeof raw === 'string' ? raw.trim() : '';
    const format = this.format();
    if (!v || !format || format.pattern.test(v)) return null;
    return { postalCode: { country: format.code, example: format.example } };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
