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
  type OnDestroy,
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
import type { MkSize, MkTone } from '@mk-kit/ui/core';
import { mkValidatorChange } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core/signal-forms';
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
export class MkSlider implements ControlValueAccessor, Validator, OnDestroy {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
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
  /** Mark required (adds `aria-required`). Set by Signal Forms' `[formField]` from the schema. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Control size (track/thumb thickness). */
  readonly size = input<MkSize>('md');
  /** Semantic color tone for the filled track + thumb. */
  readonly tone = input<MkTone>('primary');
  /** Accessible label for the thumb. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });
  /** Two-way current value. */
  readonly value = model<number>(0);

  private dragging = false;
  /** Element the drag listeners are attached to (only while dragging). */
  private dragTarget: HTMLElement | null = null;
  /** Track geometry cached at pointerdown — no layout reads per move. */
  private dragRect: DOMRect | null = null;
  /** Text direction cached at pointerdown (keyboard keeps live reads). */
  private dragRtl = false;
  private readonly cvaDisabled = signal(false);
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isRequired = computed(
    () => this.required() || (this.field?.isRequired() ?? false),
  );
  protected readonly isInvalid = computed(
    () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
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
    // In RTL the track is mirrored, so Left/Right must follow the visual
    // direction (Right moves the thumb right → towards min). Up/Down,
    // Page and Home/End are direction-agnostic.
    const horizontal = this.isRtl() ? -this.step() : this.step();
    let next = this.value();
    switch (e.key) {
      case 'ArrowRight':
        next += horizontal;
        break;
      case 'ArrowUp':
        next += this.step();
        break;
      case 'ArrowLeft':
        next -= horizontal;
        break;
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
    const track = this.trackRef()?.nativeElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    // Cache the geometry + direction for the whole gesture: pointer capture
    // means no scrolling can happen mid-drag, so one layout read suffices.
    this.dragRect = rect;
    this.dragRtl = this.isRtl();
    this.dragging = true;
    const target = (e.currentTarget as HTMLElement | null) ?? track;
    this.dragTarget = target;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already lifted (fast tap) — nothing left to capture.
    }
    // Capture routes the pointer stream to this element for the drag only —
    // no document-wide listeners outliving the gesture.
    target.addEventListener('pointermove', this.onDragMove);
    target.addEventListener('pointerup', this.onDragEnd);
    target.addEventListener('pointercancel', this.onDragEnd);
    this.thumbRef()?.nativeElement.focus();
    this.updateFromClientX(e.clientX);
    event.preventDefault();
  }

  private readonly onDragMove = (event: PointerEvent): void => {
    if (!this.dragging) return;
    this.updateFromClientX(event.clientX);
  };

  private readonly onDragEnd = (): void => {
    this.endDrag(true);
  };

  /** Blur while dragging releases the drag (template binding). */
  protected onPointerUp(): void {
    this.endDrag(true);
  }

  private endDrag(markTouched: boolean): void {
    const target = this.dragTarget;
    if (target) {
      target.removeEventListener('pointermove', this.onDragMove);
      target.removeEventListener('pointerup', this.onDragEnd);
      target.removeEventListener('pointercancel', this.onDragEnd);
    }
    this.dragTarget = null;
    this.dragRect = null;
    if (!this.dragging) return;
    this.dragging = false;
    if (markTouched) this.onTouched();
  }

  ngOnDestroy(): void {
    this.endDrag(false);
  }

  /** Whether the rendered track is right-to-left. */
  private isRtl(): boolean {
    const track = this.trackRef()?.nativeElement;
    return (
      !!track &&
      typeof getComputedStyle === 'function' &&
      getComputedStyle(track).direction === 'rtl'
    );
  }

  /** Pointer-drag path only — uses the geometry cached at pointerdown. */
  private updateFromClientX(clientX: number): void {
    const rect = this.dragRect;
    if (!rect || rect.width <= 0) return;
    const offset = this.dragRtl ? rect.right - clientX : clientX - rect.left;
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
