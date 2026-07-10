import {
  ChangeDetectionStrategy,
  Component,
  type Signal,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize, MkTone } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
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
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkRadioGroup),
      multi: true,
    },
  ],
})
export class MkRadioGroup implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });

  /** Two-way selected value. */
  readonly value = model<unknown>(null);
  /** Disable the whole group. */
  readonly disabled = input(false, { transform: booleanAttribute });
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
    () => this.required() || (this.field?.required() ?? false),
  );
  protected readonly isInvalid = computed(() => this.field?.hasError() ?? false);
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
}
