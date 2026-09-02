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
  signal,
  type Signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import type { MkSize, MkTone } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { mkValidatorChange } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core/signal-forms';
import { MkFormField } from '../form-field/form-field';
import type { MkRadio } from './radio';

/**
 * RadioGroup — an ARIA `radiogroup` that coordinates projected `mk-radio`
 * children. It manages a single selected value with roving tabindex and
 * Arrow-key navigation (Up/Left = previous, Down/Right = next, wrapping and
 * skipping disabled radios).
 *
 * Implements `ControlValueAccessor` with a two-way `value` model.
 *
 * ```html
 * <mk-radio-group [(ngModel)]="plan" aria-label="Plan">
 *   <mk-radio [value]="'free'">Free</mk-radio>
 *   <mk-radio [value]="'pro'">Pro</mk-radio>
 * </mk-radio-group>
 * ```
 */
@Component({
  selector: 'mk-radio-group',
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-radio-group',
    role: 'radiogroup',
    '[class.mk-radio-group--horizontal]': "orientation() === 'horizontal'",
    '[class.mk-radio-group--disabled]': 'isDisabled()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'isInvalid() || null',
    '[attr.aria-required]': 'isRequired() || null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkRadioGroup),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkRadioGroup),
      multi: true,
    },
  ],
})
export class MkRadioGroup implements ControlValueAccessor, Validator {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();

  /** Two-way selected value. */
  readonly value = model<unknown>(null);
  /** Disable the whole group. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force the invalid visual + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Mark required (adds `aria-required`). */
  readonly required = input(false, { transform: booleanAttribute });
  /** Size applied to all child radios. */
  readonly size = input<MkSize>('md');
  /** Semantic color tone applied to all child radios. */
  readonly tone = input<MkTone>('primary');
  /** Shared `name` grouping (defaults to a generated unique name). */
  readonly name = input<string>(mkUniqueId('mk-radio'));
  /** Layout direction; also sets arrow-key mapping expectations. */
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');

  private readonly radios = signal<MkRadio[]>([]);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly isRequired = computed(
    () => this.required() || (this.field?.isRequired() ?? false),
  );
  protected readonly isInvalid = computed(
    () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** Whether a radio currently matches the selected value. */
  readonly hasChecked = computed(() =>
    this.radios().some((r) => r.value() === this.value()),
  );

  /** Register a child radio (called from `mk-radio` on init). */
  register(radio: MkRadio): void {
    this.radios.update((list) => [...list, radio]);
  }

  /** Unregister a child radio (called on destroy). */
  unregister(radio: MkRadio): void {
    this.radios.update((list) => list.filter((r) => r !== radio));
  }

  /** True when `radio` matches the group's current value. */
  isChecked(radio: MkRadio): boolean {
    return radio.value() === this.value();
  }

  /** The radio that should be tabbable when nothing is selected. */
  readonly firstEnabled: Signal<MkRadio | null> = computed(
    () => this.radios().find((r) => !r.isDisabled()) ?? null,
  );

  /** Select a radio's value (guarded by disabled state). */
  select(radio: MkRadio): void {
    if (this.isDisabled() || radio.isDisabled()) return;
    this.value.set(radio.value());
    this.onChange(radio.value());
    this.onTouched();
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;
    const enabled = this.radios().filter((r) => !r.isDisabled());
    if (!enabled.length) return;

    const key = e.key;
    const current = enabled.findIndex((r) => this.isChecked(r));
    let next: number;
    if (key === 'ArrowDown' || key === 'ArrowRight') {
      next = current < 0 ? 0 : (current + 1) % enabled.length;
    } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
      next =
        current < 0
          ? enabled.length - 1
          : (current - 1 + enabled.length) % enabled.length;
    } else if (key === ' ' || key === 'Enter') {
      next = current < 0 ? 0 : current;
    } else {
      return;
    }
    e.preventDefault();
    const radio = enabled[next];
    this.select(radio);
    radio.focus();
  }

  /**
   * Marks the control touched once focus leaves it entirely, so a form that
   * gates its errors on `touched` behaves the same here as on a native input.
   */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: unknown): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: unknown) => void): void {
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
   * Reports `required` when `[required]` is set and no radio is selected.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required()) return null;
    const v = control.value;
    return v === null || v === undefined || v === '' ? { required: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
