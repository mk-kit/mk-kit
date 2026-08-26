import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  untracked,
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
import { mkValidatorChange } from '@mk-kit/ui/core';
import { MK_I18N, mkUniqueId } from '@mk-kit/ui/core';
import { mkMaskCaret } from '@mk-kit/ui/directives';
import { MkFormField } from '../form-field/form-field';

/** Locale-derived formatting facts used while editing. */
interface LocaleInfo {
  /** Grouping separator, e.g. `,` / ` ` / `.`. */
  group: string;
  /** Decimal separator, e.g. `.` / `,`. */
  decimal: string;
  /** Currency symbol text (empty in plain-decimal mode). */
  symbol: string;
  /** Whether the symbol renders before the number. */
  symbolPrefix: boolean;
  /** The currency's default fraction digits (2 for USD, 0 for JPY, …). */
  fractionDigits: number;
}

/**
 * CurrencyInput — a money/amount field that formats itself with
 * `Intl.NumberFormat`: thousands grouping live as the user types, the
 * currency symbol as a fixed prefix/suffix (per locale), fraction digits
 * padded to the currency's convention on blur (`1234,5` → `1 234,50 zł`).
 * The form value is always a plain `number` (or `null` when empty) — the
 * locale formatting never leaks into the data.
 *
 * `currency` takes an ISO 4217 code; omit it for a plain grouped decimal.
 * `locale` defaults to the runtime locale. `decimals` overrides the
 * currency's fraction digits; `min`/`max` clamp on blur.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so
 * `[(ngModel)]`, reactive forms and `[(value)]` all work.
 *
 * ```html
 * <mk-currency-input currency="PLN" [(ngModel)]="price" />
 * <mk-currency-input currency="USD" [min]="0" [(value)]="budget" />
 * ```
 */
@Component({
  selector: 'mk-currency-input',
  templateUrl: './currency-input.html',
  styleUrl: './currency-input.scss',
  exportAs: 'mkCurrencyInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-currency-input',
    '[class.mk-currency-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-currency-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-currency-input--invalid]': 'isInvalid()',
    '[class.mk-currency-input--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkCurrencyInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkCurrencyInput),
      multi: true,
    },
  ],
})
export class MkCurrencyInput implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** ISO 4217 currency code (`PLN`, `USD`, …). Empty = plain decimal. */
  readonly currency = input<string>('');
  /** BCP 47 locale for separators/symbol; defaults to the runtime locale. */
  readonly locale = input<string | undefined>(undefined);
  /** Max fraction digits; defaults to the currency's convention (else 2). */
  readonly decimals = input<number | null>(null);
  /** Clamp the value to at least this on blur. */
  readonly min = input<number | null>(null);
  /** Clamp the value to at most this on blur. */
  readonly max = input<number | null>(null);
  /** Allow a leading minus sign. */
  readonly allowNegative = input(true, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('');
  /** Two-way numeric value (`null` when empty). */
  readonly value = model<number | null>(null);

  /** The text currently shown in the field. */
  protected readonly display = signal('');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  /** The last value this component itself pushed into the `value` model. */
  private lastEmitted: number | null = null;

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-currency');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(
    () => this.field?.isRequired() ?? false,
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** Separators, symbol and fraction convention for the current setup. */
  protected readonly localeInfo = computed<LocaleInfo>(() => {
    const locale = this.locale();
    const currency = this.currency().toUpperCase();
    let group = ',';
    let decimal = '.';
    try {
      for (const part of new Intl.NumberFormat(locale).formatToParts(12345.6)) {
        if (part.type === 'group') group = part.value;
        if (part.type === 'decimal') decimal = part.value;
      }
    } catch {
      /* keep defaults */
    }
    let symbol = '';
    let symbolPrefix = true;
    let fractionDigits = 2;
    if (currency) {
      try {
        const fmt = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
        });
        fractionDigits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
        const parts = fmt.formatToParts(1);
        const idx = parts.findIndex((p) => p.type === 'currency');
        symbol = idx >= 0 ? parts[idx].value : currency;
        symbolPrefix =
          idx >= 0 ? !parts.slice(0, idx).some((p) => p.type === 'integer') : true;
      } catch {
        symbol = currency;
      }
    }
    return { group, decimal, symbol, symbolPrefix, fractionDigits };
  });

  /** Effective max fraction digits. */
  private readonly maxDecimals = computed(
    () => this.decimals() ?? this.localeInfo().fractionDigits,
  );

  constructor() {
    // Re-render when the value is assigned from outside ([(value)] writes we
    // didn't emit). Our own emits leave the display as typed.
    effect(() => {
      const v = this.value();
      untracked(() => {
        if (v === this.lastEmitted) return;
        this.lastEmitted = v;
        this.display.set(this.formatSettled(v));
      });
    });
    // Re-render when the locale/currency/decimals setup changes.
    effect(() => {
      this.localeInfo();
      this.maxDecimals();
      untracked(() => this.display.set(this.formatSettled(this.value())));
    });
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const oldValue = el.value;
    const caret = el.selectionStart ?? oldValue.length;
    const canonical = this.parseCanonical(oldValue);
    const next = this.formatEditing(canonical);

    el.value = next;
    const pos = mkMaskCaret(oldValue, caret, next);
    el.setSelectionRange(pos, pos);
    this.display.set(next);

    const num = this.toNumber(canonical);
    if (num !== this.value()) {
      this.lastEmitted = num;
      this.value.set(num);
      this.onChange(num);
    }
  }

  protected onBlur(): void {
    let v = this.value();
    if (v != null) {
      const min = this.min();
      const max = this.max();
      if (min != null && v < min) v = min;
      if (max != null && v > max) v = max;
      const factor = 10 ** this.maxDecimals();
      v = Math.round(v * factor) / factor;
      if (v !== this.value()) {
        this.lastEmitted = v;
        this.value.set(v);
        this.onChange(v);
      }
    }
    this.display.set(this.formatSettled(v));
    this.onTouched();
  }

  /**
   * Reduce whatever is in the field to a canonical `-?digits(.digits)?`
   * string. Accepts the locale decimal separator plus `.`/`,` when they are
   * not the grouping separator; drops everything else.
   */
  private parseCanonical(text: string): string {
    const { group, decimal } = this.localeInfo();
    const negative =
      this.allowNegative() && text.trimStart().startsWith('-') ? '-' : '';
    const decimalChars = new Set([decimal]);
    for (const c of ['.', ',']) {
      if (c !== group) decimalChars.add(c);
    }
    let intPart = '';
    let fracPart: string | null = null;
    for (const ch of text) {
      if (/\d/.test(ch)) {
        if (fracPart === null) intPart += ch;
        else if (fracPart.length < this.maxDecimals()) fracPart += ch;
      } else if (decimalChars.has(ch) && fracPart === null) {
        fracPart = '';
      }
    }
    if (this.maxDecimals() === 0) fracPart = null;
    return `${negative}${intPart}${fracPart !== null ? `.${fracPart}` : ''}`;
  }

  /** Canonical string → number (`null` for empty / lone `-`). */
  private toNumber(canonical: string): number | null {
    if (!/\d/.test(canonical)) return null;
    return Number(canonical);
  }

  /** Grouped editing text preserving a partially-typed fraction (`1 234,5`). */
  private formatEditing(canonical: string): string {
    if (!canonical) return '';
    const { group, decimal } = this.localeInfo();
    const negative = canonical.startsWith('-');
    const [intPart, fracPart] = canonical.replace('-', '').split('.');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
    let out = `${negative ? '-' : ''}${grouped}`;
    if (fracPart !== undefined) out += `${decimal}${fracPart}`;
    return out;
  }

  /** Settled (blur / programmatic) text with padded fraction digits. */
  private formatSettled(v: number | null): string {
    if (v == null) return '';
    const digits = this.maxDecimals();
    try {
      return new Intl.NumberFormat(this.locale(), {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(v);
    } catch {
      return String(v);
    }
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: number | null): void {
    const v = typeof value === 'number' && !Number.isNaN(value) ? value : null;
    this.lastEmitted = v;
    this.value.set(v);
    this.display.set(this.formatSettled(v));
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

  // --- Validator ------------------------------------------------------------
  private readonly validatorChange = mkValidatorChange(() => {
    this.min();
    this.max();
  });

  /**
   * Reports `min` / `max` against the `[min]` and `[max]` inputs, using the
   * same error shapes as `Validators.min` / `Validators.max`.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (typeof v !== 'number' || Number.isNaN(v)) return null;
    const min = this.min();
    if (min != null && v < min) return { min: { min, actual: v } };
    const max = this.max();
    if (max != null && v > max) return { max: { max, actual: v } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
