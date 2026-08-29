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
import { MK_I18N, mkUniqueId, mkValidatorChange } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core';
import { mkApplyMask, mkMaskCaret } from '@mk-kit/ui/directives';
import { MkFormField } from '../form-field/form-field';
import { isNip } from '@mk-kit/validators';

/**
 * Per-country business tax-identifier format for {@link MkTaxIdInput}.
 *
 * `mask` is an `mkApplyMask` pattern (`0` = digit; every built-in format is
 * digits only). `compact` validates the unmasked value — the form value —
 * and `validate` adds the national checksum where one exists and is
 * unambiguous. Formats without a `validate` are pattern-checked only.
 */
export interface MkTaxIdFormat {
  /** ISO 3166-1 alpha-2 code, uppercase. */
  country: string;
  /** Local name of the identifier, e.g. `NIP`. */
  label: string;
  /** Input mask; `0` = digit. */
  mask: string;
  /** Regex the complete unmasked (compact) value must match. */
  compact: RegExp;
  /** Example of a valid identifier, used as the default placeholder. */
  example: string;
  /** National checksum over the compact value; omitted when there is none. */
  validate?: (compact: string) => boolean;
}

/**
 * Polish NIP checksum — delegates to `isNip` from `@mk-kit/validators`
 * (weights 6-5-7-2-3-4-5-6-7 mod 11; a remainder of 10 is invalid).
 */
export function mkNipChecksum(compact: string): boolean {
  return /^\d{10}$/.test(compact) && isNip(compact);
}

/**
 * The built-in tax-identifier formats (alphabetical by ISO code). Only Poland
 * carries a checksum; the rest are length/shape checks, which is what the
 * national registries publish without ambiguity.
 */
export const MK_TAX_ID_FORMATS: readonly MkTaxIdFormat[] = [
  {
    country: 'CZ',
    label: 'DIČ',
    mask: '0000000000',
    compact: /^\d{8,10}$/,
    example: '25123891',
  },
  {
    country: 'DE',
    label: 'USt-IdNr.',
    mask: '000000000',
    compact: /^\d{9}$/,
    example: '123456789',
  },
  {
    country: 'IT',
    label: 'Partita IVA',
    mask: '00000000000',
    compact: /^\d{11}$/,
    example: '00743110157',
  },
  {
    country: 'PL',
    label: 'NIP',
    mask: '000-000-00-00',
    compact: /^\d{10}$/,
    example: '123-456-32-18',
    validate: mkNipChecksum,
  },
  {
    country: 'SK',
    label: 'IČ DPH',
    mask: '0000000000',
    compact: /^\d{10}$/,
    example: '2020317068',
  },
];

/** Look up the built-in format for an ISO country code (case-insensitive). */
export function mkTaxIdFormat(country: string): MkTaxIdFormat | undefined {
  const upper = country.toUpperCase();
  return MK_TAX_ID_FORMATS.find((f) => f.country === upper);
}

/** Strip everything the mask would insert, leaving the compact value. */
function compactOf(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

/**
 * Full validity for a country: shape plus the national checksum when the
 * format defines one. Masked and compact input are both accepted; unknown
 * countries have no rule to fail, so they pass.
 */
export function mkTaxIdIsValid(value: string, country: string): boolean {
  const format = mkTaxIdFormat(country);
  if (!format) return true;
  const compact = compactOf(value);
  return format.compact.test(compact) && (format.validate?.(compact) ?? true);
}

/**
 * Reactive-forms validator for a business tax identifier in a given country.
 * Empty values pass (compose with `Validators.required`); countries without a
 * built-in format pass everything.
 *
 * ```ts
 * nip: ['', [Validators.required, mkTaxIdValidator('PL')]]
 * ```
 */
export function mkTaxIdValidator(country: string): ValidatorFn {
  const format = mkTaxIdFormat(country);
  return (control: AbstractControl): ValidationErrors | null => {
    const compact = compactOf(control.value);
    if (!compact || !format || mkTaxIdIsValid(compact, format.country)) {
      return null;
    }
    return {
      taxId: {
        country: format.country,
        label: format.label,
        example: format.example,
      },
    };
  };
}

/**
 * TaxIdInput — a business tax-identifier field that masks and validates itself
 * for the given `country` (`PL` NIP `000-000-00-00`, `DE` USt-IdNr., `CZ` DIČ,
 * `IT` Partita IVA, `SK` IČ DPH). Poland's NIP is checksum-verified; the other
 * built-ins are shape-verified.
 *
 * Like `MkIbanInput`, the form value is the **compact** identifier (digits
 * only, e.g. `1234563218`) while the field *displays* it masked
 * (`123-456-32-18`) — so what is stored is what an API or invoice expects, and
 * `writeValue()` accepts either form. The placeholder defaults to a valid
 * example for the country. `valid()` (via `exportAs`) reports `true`/`false`
 * for a complete identifier passing/failing validation and `null` while empty,
 * still incomplete or the country is unknown; invalid styling engages after
 * the field was touched. `mkTaxIdValidator()` covers reactive forms.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so
 * `[(ngModel)]`, reactive forms and `[(value)]` all work.
 *
 * ```html
 * <mk-tax-id-input [(ngModel)]="nip" />
 * <mk-tax-id-input [country]="form.value.country" [(value)]="taxId" />
 * ```
 */
@Component({
  selector: 'mk-tax-id-input',
  templateUrl: './tax-id-input.html',
  styleUrl: './tax-id-input.scss',
  exportAs: 'mkTaxIdInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-tax-id-input',
    '[class.mk-tax-id-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-tax-id-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-tax-id-input--invalid]': 'isInvalid()',
    '[class.mk-tax-id-input--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkTaxIdInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkTaxIdInput),
      multi: true,
    },
  ],
})
export class MkTaxIdInput implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** ISO 3166-1 alpha-2 country whose format applies. */
  readonly country = input<string>('PL');
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder; defaults to a valid example for the country. */
  readonly placeholder = input<string>('');
  /** Two-way identifier in compact form (digits only, e.g. `1234563218`). */
  readonly value = model<string>('');

  private readonly touched = signal(false);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-tax-id');

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

  /** The active format, or `undefined` for unknown countries (free digits). */
  protected readonly format = computed<MkTaxIdFormat | undefined>(() =>
    mkTaxIdFormat(this.country()),
  );

  /** The compact value rendered through the country's mask. */
  protected readonly masked = computed(() => {
    const format = this.format();
    return format ? mkApplyMask(this.value(), format.mask).masked : this.value();
  });

  protected readonly effectivePlaceholder = computed(
    () => this.placeholder() || (this.format()?.example ?? ''),
  );

  protected readonly maxLength = computed(() => this.format()?.mask.length ?? 20);

  /**
   * `true` for a complete identifier passing its format (and checksum),
   * `false` for a complete-but-wrong one, `null` while empty, still shorter
   * than the mask allows, or the country has no known format.
   */
  readonly valid = computed<boolean | null>(() => {
    const compact = this.value();
    const format = this.format();
    if (!compact || !format) return null;
    if (format.compact.test(compact)) return format.validate?.(compact) ?? true;
    const digits = format.mask.replace(/[^0]/g, '').length;
    return compact.length < digits ? null : false;
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
    const format = this.format();

    const applied = format
      ? mkApplyMask(rawValue, format.mask)
      : { masked: rawValue.replace(/\D/g, ''), unmasked: rawValue.replace(/\D/g, '') };

    el.value = applied.masked;
    const pos = mkMaskCaret(rawValue, caret, applied.masked);
    el.setSelectionRange(pos, pos);

    if (applied.unmasked !== this.value()) {
      this.value.set(applied.unmasked);
      this.onChange(applied.unmasked);
    }
  }

  protected onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  /** Accepts both the masked (`123-456-32-18`) and compact (`1234563218`) form. */
  writeValue(value: string | null): void {
    const digits = compactOf(value ?? '');
    const format = this.format();
    this.value.set(
      format ? mkApplyMask(digits, format.mask).unmasked : digits,
    );
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
  });

  /**
   * Reports `taxId` for an identifier not matching `[country]`'s format or
   * failing its checksum — the same error `mkTaxIdValidator()` produces, so
   * the two are interchangeable. Empty values and unknown countries pass;
   * compose with `Validators.required` to reject an empty one.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const compact = compactOf(control.value);
    const format = this.format();
    if (!compact || !format || mkTaxIdIsValid(compact, format.country)) {
      return null;
    }
    return {
      taxId: {
        country: format.country,
        label: format.label,
        example: format.example,
      },
    };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
