import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '@mkornas/ui/core';
import { MkFormField } from '../form-field/form-field';
import { MK_I18N } from '@mkornas/ui/core';

/**
 * Rating — a star rating input (and read-only display). Implements the ARIA
 * slider pattern: one focusable control, Arrow keys adjust, Home/End jump.
 * Click or hover a star to set the value. `ControlValueAccessor` + two-way
 * `value` model over a number.
 *
 * ```html
 * <mk-rating [(value)]="score" [max]="5" />
 * <mk-rating [value]="4" readonly />
 * ```
 */
@Component({
  selector: 'mk-rating',
  templateUrl: './rating.html',
  styleUrl: './rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-rating',
    '[class.mk-rating--sm]': "size() === 'sm'",
    '[class.mk-rating--lg]': "size() === 'lg'",
    '[class.mk-rating--readonly]': 'readonly() || isDisabled()',
    '[attr.role]': "readonly() || isDisabled() ? 'img' : 'slider'",
    '[attr.tabindex]': 'readonly() || isDisabled() ? null : 0',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuemin]': "readonly() || isDisabled() ? null : 0",
    '[attr.aria-valuemax]': "readonly() || isDisabled() ? null : max()",
    '[attr.aria-valuenow]': "readonly() || isDisabled() ? null : value()",
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-readonly]': 'readonly() || null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '(keydown)': 'onKeydown($event)',
    '(mouseleave)': 'hover.set(-1)',
    '(blur)': 'onBlur()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkRating),
      multi: true,
    },
  ],
})
export class MkRating implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  protected readonly i18n = inject(MK_I18N);

  /** Number of stars. */
  readonly max = input(5, { transform: numberAttribute });
  /** Two-way rating value (0–max). */
  readonly value = model(0);
  /** Read-only display (no interaction). */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Size scale. */
  readonly size = input<MkSize>('md');
  /** Accessible label. */
  readonly ariaLabel = input(this.i18n.ratingLabel);

  protected readonly hover = signal(-1);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  /** The stars to render (1-based indices). */
  protected readonly stars = computed(() =>
    Array.from({ length: this.max() }, (_, i) => i + 1),
  );

  /** The value shown right now (hover preview wins). */
  protected readonly displayValue = computed(() =>
    this.hover() >= 0 ? this.hover() : this.value(),
  );

  protected readonly valueText = computed(
    () => this.i18n.ratingValueText(this.value(), this.max()),
  );

  protected setValue(v: number): void {
    if (this.readonly() || this.isDisabled()) return;
    // Clicking the only-filled star clears back to zero.
    const next = v === this.value() ? v - 1 : v;
    this.value.set(next);
    this.onChange(next);
  }

  protected onStarEnter(v: number): void {
    if (this.readonly() || this.isDisabled()) return;
    this.hover.set(v);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.readonly() || this.isDisabled()) return;
    let next = this.value();
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(this.max(), next + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(0, next - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next !== this.value()) {
      this.value.set(next);
      this.onChange(next);
    }
  }

  protected onBlur(): void {
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: number | null): void {
    this.value.set(value ?? 0);
  }
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
