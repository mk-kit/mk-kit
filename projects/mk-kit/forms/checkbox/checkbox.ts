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
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import type { MkSize, MkTone } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { mkValidatorChange } from '@mkornas/ui/core';
import { MkFormField } from '../form-field/form-field';

/**
 * Checkbox — a themed checkbox built on a visually-hidden native
 * `input[type=checkbox]` (so keyboard + form semantics are native) with a
 * custom box. Supports an `indeterminate` state and projects its label.
 *
 * Implements `ControlValueAccessor` with a two-way `checked` model, so it works
 * with `[(ngModel)]`, reactive forms and `[(checked)]`.
 *
 * ```html
 * <mk-checkbox [(ngModel)]="accepted">Accept terms</mk-checkbox>
 * <mk-checkbox [(checked)]="all" [indeterminate]="some()" tone="success">
 *   Select all
 * </mk-checkbox>
 * ```
 */
@Component({
  selector: 'mk-checkbox',
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-checkbox',
    '[class.mk-checkbox--sm]': "size() === 'sm'",
    '[class.mk-checkbox--md]': "size() === 'md'",
    '[class.mk-checkbox--lg]': "size() === 'lg'",
    '[class.mk-checkbox--checked]': 'checked()',
    '[class.mk-checkbox--indeterminate]': 'indeterminate()',
    '[class.mk-checkbox--disabled]': 'isDisabled()',
    '[class.mk-checkbox--invalid]': 'isInvalid()',
    '[attr.data-tone]': 'tone()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkCheckbox),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkCheckbox),
      multi: true,
    },
  ],
})
export class MkCheckbox implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });

  /** Two-way checked state. */
  readonly checked = model(false);
  /** Two-way indeterminate ("mixed") state; cleared when the user toggles. */
  readonly indeterminate = model(false);
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force the invalid visual + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Mark required (adds `aria-required`). */
  readonly required = input(false, { transform: booleanAttribute });
  /** Control size. */
  readonly size = input<MkSize>('md');
  /** Semantic color tone for the checked box. */
  readonly tone = input<MkTone>('primary');
  /** Accessible label when no text content is projected. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });

  private readonly cvaDisabled = signal(false);
  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-checkbox');

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isRequired = computed(
    () => this.required() || (this.field?.isRequired() ?? false),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  protected onNativeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.indeterminate.set(false);
    this.checked.set(target.checked);
    this.onChange(target.checked);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: unknown): void {
    this.checked.set(!!value);
  }
  registerOnChange(fn: (value: boolean) => void): void {
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
    this.required();
  });

  /**
   * Reports `required` for an unchecked box when `[required]` is set, so
   * `required` on the element behaves like `Validators.requiredTrue`.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required()) return null;
    return control.value === true ? null : { required: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
