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
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize, MkTone } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkFormField } from '../form-field/form-field';

/**
 * Switch — a toggle with `role="switch"` and an animated knob. Operable with
 * Space/Enter, projects its label, and supports size + tone.
 *
 * Implements `ControlValueAccessor` with a two-way `checked` model, so it works
 * with `[(ngModel)]`, reactive forms and `[(checked)]`.
 *
 * ```html
 * <mk-switch [(ngModel)]="notify">Email notifications</mk-switch>
 * <mk-switch [(checked)]="dark" tone="success" size="lg">Dark mode</mk-switch>
 * ```
 */
@Component({
  selector: 'mk-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-switch',
    '[class.mk-switch--sm]': "size() === 'sm'",
    '[class.mk-switch--md]': "size() === 'md'",
    '[class.mk-switch--lg]': "size() === 'lg'",
    '[class.mk-switch--checked]': 'checked()',
    '[class.mk-switch--disabled]': 'isDisabled()',
    '[attr.data-tone]': 'tone()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkSwitch),
      multi: true,
    },
  ],
})
export class MkSwitch implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });

  /** Two-way checked (on/off) state. */
  readonly checked = model(false);
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Control size. */
  readonly size = input<MkSize>('md');
  /** Semantic color tone for the "on" track. */
  readonly tone = input<MkTone>('primary');
  /** Accessible label when no text content is projected. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });

  private readonly cvaDisabled = signal(false);
  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  readonly labelId = mkUniqueId('mk-switch-label');

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(() => this.field?.hasError() ?? false);
  protected readonly isRequired = computed(() => this.field?.required() ?? false);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly labelledBy = computed(() => {
    if (this.ariaLabel()) return null;
    return this.field?.labelId ?? this.labelId;
  });

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.checked.update((v) => !v);
    this.onChange(this.checked());
    this.onTouched();
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
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
}
