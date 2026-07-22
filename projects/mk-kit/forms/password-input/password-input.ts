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
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import type { MkSize } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { mkValidatorChange } from '@mkornas/ui/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MkFormField } from '../form-field/form-field';

/** A single password rule with its current pass/fail state. */
export interface MkPasswordRule {
  readonly key: 'length' | 'uppercase' | 'number' | 'symbol';
  readonly label: string;
  readonly met: boolean;
}

/**
 * PasswordInput — a password field with a reveal toggle, an optional strength
 * meter and an optional rules checklist. Implements `ControlValueAccessor` over
 * `string` with a two-way `value` model, and wires label / description /
 * validity a11y automatically when nested in an `mk-form-field`.
 *
 * ```html
 * <mk-password-input [(value)]="pw" showStrength showRules [minLength]="10" />
 * ```
 */
@Component({
  selector: 'mk-password-input',
  templateUrl: './password-input.html',
  styleUrl: './password-input.scss',
  exportAs: 'mkPasswordInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-password-input',
    '[class.mk-password-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-password-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-password-input--invalid]': 'isInvalid()',
    '[class.mk-password-input--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkPasswordInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkPasswordInput),
      multi: true,
    },
  ],
})
export class MkPasswordInput implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  protected readonly i18n = inject(MK_I18N);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Two-way value. */
  readonly value = model<string>('');
  /** Placeholder when empty. */
  readonly placeholder = input('');
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Control size. Ignored inside an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling when standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Show the 0–4 strength meter below the field. */
  readonly showStrength = input(false, { transform: booleanAttribute });
  /** Show the rules checklist below the field. */
  readonly showRules = input(false, { transform: booleanAttribute });
  /** Minimum length used by the strength score and rules. */
  readonly minLength = input(8, { transform: numberAttribute });

  protected readonly inputId =
    this.field?.controlId ?? mkUniqueId('mk-password');
  protected readonly strengthId = `${this.inputId}-strength`;
  protected readonly rulesId = `${this.inputId}-rules`;

  /** Whether the password characters are currently visible. */
  protected readonly revealed = signal(false);

  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
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
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);

  /** The four rules and whether the current value satisfies each. */
  protected readonly rules = computed<MkPasswordRule[]>(() => {
    const v = this.value();
    return [
      {
        key: 'length',
        label: this.i18n.passwordRuleMinLength(this.minLength()),
        met: v.length >= this.minLength(),
      },
      {
        key: 'uppercase',
        label: this.i18n.passwordRuleUppercase,
        met: /[A-Z]/.test(v),
      },
      { key: 'number', label: this.i18n.passwordRuleNumber, met: /[0-9]/.test(v) },
      {
        key: 'symbol',
        label: this.i18n.passwordRuleSymbol,
        met: /[^A-Za-z0-9]/.test(v),
      },
    ];
  });

  /**
   * Password strength as a 0–4 score, counting distinct character classes
   * (lowercase, uppercase, digit, symbol) plus a length ≥ minLength bonus,
   * capped at 4.
   */
  protected readonly strength = computed(() => {
    const v = this.value();
    if (!v) return 0;
    let score = 0;
    if (v.length >= this.minLength()) score++;
    if (/[a-z]/.test(v)) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return Math.min(4, score);
  });

  protected readonly strengthLabel = computed(() =>
    this.i18n.passwordStrength(this.strength()),
  );

  /** The 4 meter segments, marked filled up to the current score. */
  protected readonly segments = computed(() => {
    const score = this.strength();
    return [0, 1, 2, 3].map((i) => i < score);
  });

  /** Combined `aria-describedby` for the input, or `null`. */
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    const fieldIds = this.field?.describedBy();
    if (fieldIds) ids.push(fieldIds);
    if (this.showStrength()) ids.push(this.strengthId);
    if (this.showRules()) ids.push(this.rulesId);
    return ids.length ? ids.join(' ') : null;
  });

  protected toggleReveal(): void {
    if (this.isDisabled()) return;
    this.revealed.update((r) => !r);
    this.inputRef()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.value.set(text);
    this.onChange(text);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
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
    this.minLength();
  });

  /**
   * Reports `minlength` for a password shorter than `[minLength]` — the same
   * requirement the rules list shows. An empty value passes; compose with
   * `Validators.required` to reject it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (typeof v !== 'string' || !v) return null;
    const requiredLength = this.minLength();
    if (v.length >= requiredLength) return null;
    return { minlength: { requiredLength, actualLength: v.length } };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
