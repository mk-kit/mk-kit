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
import type { MkSize } from '@mk-kit/ui/core';
import { MK_I18N, mkUniqueId } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core/signal-forms';
import { mkMaskCaret } from '@mk-kit/ui/directives';
import { MkFormField } from '../form-field/form-field';
import { IBAN_LENGTHS, ibanMod97, isIban } from '@mk-kit/validators';

/**
 * IBAN lengths per country — re-exported from `@mk-kit/validators`
 * (`IBAN_LENGTHS`, the SWIFT registry).
 */
export const MK_IBAN_LENGTHS: Readonly<Record<string, number>> = IBAN_LENGTHS;

/** Longest IBAN in the registry (Malta, 31) rounded up to the ISO 13616 maximum. */
const IBAN_MAX = 34;

/** ISO 7064 MOD 97-10 over a compact (uppercase, no separators) IBAN. */
export function mkIbanChecksum(compact: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(compact) && ibanMod97(compact) === 1;
}

/**
 * Shape, the registry length for the country and the checksum — delegates
 * to `isIban` from `@mk-kit/validators`. Unlike that function this one keeps
 * the input kit's stricter rule that the country must be in the table.
 */
export function mkIbanIsValid(compact: string): boolean {
  return MK_IBAN_LENGTHS[compact.slice(0, 2)] !== undefined && isIban(compact);
}

/**
 * Reactive-forms validator for an IBAN (any supported country). Empty values
 * pass (compose with `Validators.required`); the error carries the country
 * and its expected length when known.
 *
 * ```ts
 * account: ['', [Validators.required, mkIbanValidator()]]
 * ```
 */
export function mkIbanValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = typeof control.value === 'string' ? control.value : '';
    const compact = raw.replace(/\s+/g, '').toUpperCase();
    if (!compact || mkIbanIsValid(compact)) return null;
    const country = compact.slice(0, 2);
    return {
      iban: { country, expectedLength: MK_IBAN_LENGTHS[country] ?? null },
    };
  };
}

/**
 * IbanInput — an international bank account number field: uppercases and
 * groups the number in blocks of four as the user types (`PL61 1090 1014 …`),
 * caps input at the country's exact length (65 countries built in) and
 * validates with the ISO 13616 mod-97 checksum.
 *
 * The form value is the compact electronic format (uppercase, no spaces).
 * `valid()` (via `exportAs`) reports `true`/`false` for a complete number
 * passing/failing validation and `null` while empty or incomplete; invalid
 * styling engages after the field was touched.
 * `mkIbanValidator()` covers reactive forms.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so
 * `[(ngModel)]`, reactive forms and `[(value)]` all work.
 *
 * ```html
 * <mk-iban-input [(ngModel)]="account" />
 * ```
 */
@Component({
  selector: 'mk-iban-input',
  templateUrl: './iban-input.html',
  styleUrl: './iban-input.scss',
  exportAs: 'mkIbanInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-iban-input',
    '[class.mk-iban-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-iban-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-iban-input--invalid]': 'isInvalid()',
    '[class.mk-iban-input--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkIbanInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkIbanInput),
      multi: true,
    },
  ],
})
export class MkIbanInput implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('PL61 1090 1014 0000 0712 1981 2874');
  /** Two-way IBAN in compact electronic format (uppercase, no spaces). */
  readonly value = model<string>('');

  private readonly touched = signal(false);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-iban');

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

  /** The value grouped in blocks of four for display. */
  protected readonly grouped = computed(
    () => this.value().replace(/(.{4})(?=.)/g, '$1 '),
  );

  /** The expected length for the typed country, when known. */
  private readonly expectedLength = computed<number | null>(() => {
    const country = this.value().slice(0, 2);
    return country.length === 2 ? (MK_IBAN_LENGTHS[country] ?? null) : null;
  });

  /**
   * `true` for a complete IBAN passing the mod-97 check, `false` for a
   * complete-but-wrong one (or an unknown country once 2+ chars are typed and
   * the field was left), `null` while empty or still incomplete.
   */
  readonly valid = computed<boolean | null>(() => {
    const compact = this.value();
    if (!compact) return null;
    const expected = this.expectedLength();
    if (expected === null) return compact.length >= 2 ? false : null;
    if (compact.length < expected) return null;
    return mkIbanChecksum(compact);
  });

  protected readonly isInvalid = computed(
    () =>
      (this.invalid() && this.fieldTouched()) ||
      (this.field?.hasError() ?? false) ||
      (this.touched() && this.valid() === false),
  );

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const rawValue = el.value;
    const caret = el.selectionStart ?? rawValue.length;

    let compact = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
    compact = compact.slice(0, this.expectedLengthFor(compact));

    const next = compact.replace(/(.{4})(?=.)/g, '$1 ');
    el.value = next;
    const pos = mkMaskCaret(rawValue, caret, next);
    el.setSelectionRange(pos, pos);

    if (compact !== this.value()) {
      this.value.set(compact);
      this.onChange(compact);
    }
  }

  private expectedLengthFor(compact: string): number {
    return MK_IBAN_LENGTHS[compact.slice(0, 2)] ?? IBAN_MAX;
  }

  protected onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set((value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
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
   * Reports `iban` for a number failing the mod-97 checksum — the same error
   * `mkIbanValidator()` produces, so the two are interchangeable. An empty
   * value passes; compose with `Validators.required` to reject it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const raw = control.value;
    const compact = typeof raw === 'string' ? raw.replace(/\s+/g, '').toUpperCase() : '';
    if (!compact || mkIbanIsValid(compact)) return null;
    const country = compact.slice(0, 2);
    return { iban: { country, expectedLength: MK_IBAN_LENGTHS[country] ?? null } };
  }
}
