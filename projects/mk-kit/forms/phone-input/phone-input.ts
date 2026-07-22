import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '@mkornas/ui/core';
import { MK_I18N, MkAnchoredPanel, mkUniqueId } from '@mkornas/ui/core';
import { MkMask, mkApplyMask } from '@mkornas/ui/directives';
import { MkFormField } from '../form-field/form-field';
import {
  MK_PHONE_COUNTRIES,
  MkPhoneCountry,
  mkCountryFlag,
} from './phone-countries';

/** Structured value emitted by {@link MkPhoneInput} in `parts` mode. */
export interface MkPhoneValue {
  /** ISO 3166-1 alpha-2 country code, e.g. `PL`. */
  country: string;
  /** Dialing prefix with the leading `+`, e.g. `+48`. */
  dialCode: string;
  /** National number, digits only. */
  national: string;
  /** The full E.164 number, e.g. `+48601234567`. */
  e164: string;
}

/** A country row prepared for the dropdown list. */
interface CountryOption {
  country: MkPhoneCountry;
  name: string;
  flag: string;
}

/**
 * PhoneInput — an international telephone field: a searchable country-prefix
 * dropdown (flag + dial code) next to a national-number input that formats
 * itself with the selected country's mask as the user types.
 *
 * The form value is either a single E.164 string (`"+48601234567"`, default)
 * or a structured object (`valueFormat="parts"`) carrying the country, dial
 * code and national number separately; both modes read back either shape and
 * `null` when empty. Pasting a full international number (`+44…`) into the
 * number field switches the country automatically.
 *
 * Implements `ControlValueAccessor` and exposes two-way `value` and `country`
 * models, so `[(ngModel)]`, reactive forms, `[(value)]` and `[(country)]` all
 * work.
 *
 * ```html
 * <mk-phone-input [(ngModel)]="phone" country="PL" />
 * <mk-phone-input valueFormat="parts" [preferredCountries]="['PL','DE','CZ']"
 *   [(value)]="phoneParts" />
 * ```
 */
@Component({
  selector: 'mk-phone-input',
  templateUrl: './phone-input.html',
  styleUrl: './phone-input.scss',
  exportAs: 'mkPhoneInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel, MkMask],
  host: {
    class: 'mk-phone-input',
    '[class.mk-phone-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-phone-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-phone-input--invalid]': 'isInvalid()',
    '[class.mk-phone-input--disabled]': 'isDisabled()',
    '[class.mk-phone-input--open]': 'open()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkPhoneInput),
      multi: true,
    },
  ],
})
export class MkPhoneInput implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly nationalRef =
    viewChild<ElementRef<HTMLInputElement>>('national');

  /** The selectable country set (defaults to the built-in list). */
  readonly countries = input<readonly MkPhoneCountry[]>(MK_PHONE_COUNTRIES);
  /** ISO codes pinned, in order, to the top of the dropdown. */
  readonly preferredCountries = input<readonly string[]>([]);
  /** Shape of the form value: an E.164 string or a structured object. */
  readonly valueFormat = input<'e164' | 'parts'>('e164');
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder for the national-number field. */
  readonly placeholder = input<string>('');
  /** Two-way selected ISO country code. */
  readonly country = model<string>('US');
  /** Two-way form value (`string` in `e164` mode, {@link MkPhoneValue} in `parts`). */
  readonly value = model<string | MkPhoneValue | null>(null);

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(-1);
  private readonly nationalDigits = signal('');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string | MkPhoneValue | null) => void = () => {};
  private onTouched: () => void = () => {};

  /** The last value this component itself wrote into the `value` model. */
  private lastDerived: string | MkPhoneValue | null = null;
  private lastCountry = '';

  readonly listId = mkUniqueId('mk-phone-list');
  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-phone');
  readonly searchId = `${this.inputId}-search`;

  private readonly displayNames = (() => {
    try {
      return new Intl.DisplayNames(undefined, { type: 'region' });
    } catch {
      return null;
    }
  })();

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
  protected readonly labelledBy = computed(
    () => this.field?.labelId ?? null,
  );
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** The currently selected country (falls back to the first in the set). */
  protected readonly selectedCountry = computed<MkPhoneCountry>(() => {
    const code = this.country().toUpperCase();
    const list = this.countries();
    return list.find((c) => c.code === code) ?? list[0];
  });
  protected readonly selectedFlag = computed(() =>
    mkCountryFlag(this.selectedCountry().code),
  );
  protected readonly selectedName = computed(() =>
    this.countryName(this.selectedCountry().code),
  );

  /** Masked national number shown in the field. */
  protected readonly nationalMasked = computed(
    () => mkApplyMask(this.nationalDigits(), this.selectedCountry().mask).masked,
  );

  /** Countries sorted preferred-first, then A→Z by localised name. */
  private readonly sortedCountries = computed<CountryOption[]>(() => {
    const preferred = this.preferredCountries().map((c) => c.toUpperCase());
    const rank = (code: string) => {
      const i = preferred.indexOf(code);
      return i === -1 ? preferred.length : i;
    };
    return this.countries()
      .map((country) => ({
        country,
        name: this.countryName(country.code),
        flag: mkCountryFlag(country.code),
      }))
      .sort(
        (a, b) =>
          rank(a.country.code) - rank(b.country.code) ||
          a.name.localeCompare(b.name),
      );
  });

  /** Dropdown rows matching the search query. */
  protected readonly filtered = computed<CountryOption[]>(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.sortedCountries();
    if (!q) return all;
    const digits = q.replace(/^\+/, '');
    return all.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.country.code.toLowerCase() === q ||
        (/^\d+$/.test(digits) && o.country.dialCode.startsWith(digits)),
    );
  });

  constructor() {
    // Parse values assigned from outside ([(value)] writes we didn't derive).
    effect(() => {
      const v = this.value();
      if (v === this.lastDerived) return;
      untracked(() => {
        this.applyExternalValue(v);
        this.deriveValue(false);
      });
    });
    // Re-derive when the country is changed from outside ([country]="…").
    effect(() => {
      const c = this.country();
      if (c === this.lastCountry) return;
      untracked(() => {
        this.lastCountry = c;
        this.deriveValue(false);
      });
    });
  }

  /** Localised display name for an ISO country code. */
  protected countryName(code: string): string {
    try {
      return this.displayNames?.of(code) ?? code;
    } catch {
      return code;
    }
  }

  protected optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  // --- National number field ------------------------------------------------

  protected onNationalChange(unmasked: string): void {
    this.nationalDigits.set(unmasked);
    this.deriveValue(true);
  }

  /** Pasting a full `+…` number switches country + fills the national part. */
  protected onNationalPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!text.trim().startsWith('+')) return;
    event.preventDefault();
    this.applyE164(text);
    this.deriveValue(true);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  // --- Country dropdown -----------------------------------------------------

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openList();
  }

  private openList(): void {
    this.open.set(true);
    this.query.set('');
    const list = this.filtered();
    const selected = list.findIndex(
      (o) => o.country.code === this.selectedCountry().code,
    );
    this.activeIndex.set(selected >= 0 ? selected : 0);
    // The panel renders on the next change-detection pass.
    setTimeout(() => this.searchRef()?.nativeElement.focus());
  }

  protected close(refocusTrigger = false): void {
    if (!this.open()) return;
    this.open.set(false);
    this.activeIndex.set(-1);
    this.onTouched();
    if (refocusTrigger) this.triggerRef()?.nativeElement.focus();
  }

  protected onTriggerKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) && !this.open()) {
      e.preventDefault();
      this.openList();
    }
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(this.filtered().length ? 0 : -1);
  }

  protected onSearchKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    const count = this.filtered().length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (count) this.activeIndex.set((this.activeIndex() + 1) % count);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (count)
          this.activeIndex.set((this.activeIndex() - 1 + count) % count);
        break;
      case 'Home':
        e.preventDefault();
        if (count) this.activeIndex.set(0);
        break;
      case 'End':
        e.preventDefault();
        if (count) this.activeIndex.set(count - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.activeIndex() >= 0) this.selectCountry(this.activeIndex());
        break;
      case 'Escape':
        e.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  protected selectCountry(index: number): void {
    const option = this.filtered()[index];
    if (!option) return;
    this.lastCountry = option.country.code;
    this.country.set(option.country.code);
    this.deriveValue(true);
    this.close();
    this.nationalRef()?.nativeElement.focus();
  }

  // --- Value plumbing -------------------------------------------------------

  /** Compute the outward value and push it to the model (+ form when `emit`). */
  private deriveValue(emit: boolean): void {
    const digits = this.nationalDigits();
    let next: string | MkPhoneValue | null = null;
    if (digits) {
      const c = this.selectedCountry();
      const e164 = `+${c.dialCode}${digits}`;
      next =
        this.valueFormat() === 'parts'
          ? {
              country: c.code,
              dialCode: `+${c.dialCode}`,
              national: digits,
              e164,
            }
          : e164;
    }
    if (this.sameValue(next, this.lastDerived) && this.value() === this.lastDerived) {
      return;
    }
    this.lastDerived = next;
    this.value.set(next);
    if (emit) this.onChange(next);
  }

  private sameValue(
    a: string | MkPhoneValue | null,
    b: string | MkPhoneValue | null,
  ): boolean {
    if (a === b) return true;
    if (!a || !b || typeof a === 'string' || typeof b === 'string') return false;
    return a.country === b.country && a.national === b.national;
  }

  /** Interpret an externally-assigned value (writeValue or `[value]`). */
  private applyExternalValue(v: string | MkPhoneValue | null): void {
    if (v == null || v === '') {
      this.nationalDigits.set('');
      return;
    }
    if (typeof v === 'string') {
      if (v.trim().startsWith('+')) this.applyE164(v);
      else this.nationalDigits.set(v.replace(/\D/g, ''));
      return;
    }
    if (v.country) {
      this.lastCountry = v.country.toUpperCase();
      this.country.set(this.lastCountry);
    }
    this.nationalDigits.set((v.national ?? '').replace(/\D/g, ''));
  }

  /** Split an E.164-ish string into a country + national digits. */
  private applyE164(text: string): void {
    const digits = text.replace(/\D/g, '');
    if (!digits) {
      this.nationalDigits.set('');
      return;
    }
    const matches = this.countries().filter((c) =>
      digits.startsWith(c.dialCode),
    );
    if (matches.length) {
      const longest = Math.max(...matches.map((c) => c.dialCode.length));
      const best =
        matches.find(
          (c) =>
            c.dialCode.length === longest &&
            c.code === this.selectedCountry().code,
        ) ?? matches.find((c) => c.dialCode.length === longest)!;
      this.lastCountry = best.code;
      this.country.set(best.code);
      this.nationalDigits.set(digits.slice(best.dialCode.length));
    } else {
      this.nationalDigits.set(digits);
    }
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | MkPhoneValue | null): void {
    this.applyExternalValue(value);
    this.deriveValue(false);
  }
  registerOnChange(fn: (value: string | MkPhoneValue | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
