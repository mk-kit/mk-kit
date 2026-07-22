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
import type { MkSize, MkTone } from '@mkornas/ui/core';
import { mkValidatorChange } from '@mkornas/ui/core';
import { MkFormField } from '../form-field/form-field';

/**
 * Slider — a single-value range slider with `role="slider"`, a filled track and
 * a draggable thumb (pointer events). Fully keyboard operable: Arrow keys step,
 * Page Up/Down take larger steps, Home/End jump to the bounds.
 *
 * Implements `ControlValueAccessor` with a two-way `value` model, so it works
 * with `[(ngModel)]`, reactive forms and `[(value)]`.
 *
 * ```html
 * <mk-slider [min]="0" [max]="100" [step]="5" [(ngModel)]="volume" />
 * ```
 */
@Component({
  selector: 'mk-slider',
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-slider',
    '[class.mk-slider--sm]': "size() === 'sm'",
    '[class.mk-slider--md]': "size() === 'md'",
    '[class.mk-slider--lg]': "size() === 'lg'",
    '[class.mk-slider--disabled]': 'isDisabled()',
    '[attr.data-tone]': 'tone()',
    '(document:pointermove)': 'onPointerMove($event)',
    '(document:pointerup)': 'onPointerUp()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkSlider),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkSlider),
      multi: true,
    },
  ],
})
export class MkSlider implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  private readonly trackRef = viewChild<ElementRef<HTMLElement>>('track');
  private readonly thumbRef = viewChild<ElementRef<HTMLElement>>('thumb');

  /** Minimum value. */
  readonly min = input(0, { transform: numberAttribute });
  /** Maximum value. */
  readonly max = input(100, { transform: numberAttribute });
  /** Step increment (must be > 0). */
  readonly step = input(1, { transform: numberAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force the invalid visual + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size (track/thumb thickness). */
  readonly size = input<MkSize>('md');
  /** Semantic color tone for the filled track + thumb. */
  readonly tone = input<MkTone>('primary');
  /** Accessible label for the thumb. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });
  /** Two-way current value. */
  readonly value = model<number>(0);

  private dragging = false;
  private readonly cvaDisabled = signal(false);
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly labelledBy = computed(() => {
    if (this.ariaLabel()) return null;
    return this.field?.labelId ?? null;
  });
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** Fill percentage (0–100) for the track + thumb position. */
  protected readonly percent = computed(() => {
    const span = this.max() - this.min();
    if (span <= 0) return 0;
    const ratio = (this.value() - this.min()) / span;
    return Math.min(100, Math.max(0, ratio * 100));
  });

  private get bigStep(): number {
    return Math.max(this.step(), (this.max() - this.min()) / 10);
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;
    let next = this.value();
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next += this.step();
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next -= this.step();
        break;
      case 'PageUp':
        next += this.bigStep;
        break;
      case 'PageDown':
        next -= this.bigStep;
        break;
      case 'Home':
        next = this.min();
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }
    e.preventDefault();
    this.setValue(next, true);
  }

  protected onPointerDown(event: Event): void {
    if (this.isDisabled()) return;
    const e = event as PointerEvent;
    this.dragging = true;
    this.thumbRef()?.nativeElement.focus();
    this.updateFromClientX(e.clientX);
    event.preventDefault();
  }

  protected onPointerMove(event: Event): void {
    if (!this.dragging) return;
    this.updateFromClientX((event as PointerEvent).clientX);
  }

  protected onPointerUp(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.onTouched();
  }

  private updateFromClientX(clientX: number): void {
    const track = this.trackRef()?.nativeElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rtl =
      typeof getComputedStyle === 'function' &&
      getComputedStyle(track).direction === 'rtl';
    const offset = rtl ? rect.right - clientX : clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, offset / rect.width));
    const raw = this.min() + ratio * (this.max() - this.min());
    this.setValue(raw);
  }

  private setValue(raw: number, markTouched = false): void {
    const clamped = this.clampSnap(raw);
    if (clamped !== this.value()) {
      this.value.set(clamped);
      this.onChange(clamped);
    }
    if (markTouched) this.onTouched();
  }

  private clampSnap(raw: number): number {
    const step = this.step() > 0 ? this.step() : 1;
    const min = this.min();
    const max = this.max();
    const snapped = Math.round((raw - min) / step) * step + min;
    return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: unknown): void {
    const num = typeof value === 'number' ? value : Number(value);
    this.value.set(this.clampSnap(Number.isFinite(num) ? num : this.min()));
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

  // --- Validator ------------------------------------------------------------
  private readonly validatorChange = mkValidatorChange(() => {
    this.min();
    this.max();
  });

  /**
   * Reports `min` / `max` for a value outside the track. The slider clamps
   * what the user can produce, so this only fires for a value written in
   * from the model side.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    const min = this.min();
    if (v < min) return { min: { min, actual: v } };
    const max = this.max();
    if (v > max) return { max: { max, actual: v } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
