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
  viewChildren,
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
import { MK_I18N } from '@mkornas/ui/core';

/** A `[low, high]` value pair. */
export type MkRange = [number, number];

/**
 * RangeSlider — a two-thumb slider selecting a `[low, high]` range. Each thumb is
 * a `role="slider"` (Arrow / Page / Home / End keys); the thumbs can't cross.
 * Implements `ControlValueAccessor` over a `[number, number]` tuple with a
 * two-way `value` model.
 *
 * ```html
 * <mk-range-slider [min]="0" [max]="1000" [step]="10" [(value)]="priceRange" />
 * ```
 */
@Component({
  selector: 'mk-range-slider',
  templateUrl: './range-slider.html',
  styleUrl: './range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-range-slider',
    '[class.mk-range-slider--sm]': "size() === 'sm'",
    '[class.mk-range-slider--lg]': "size() === 'lg'",
    '[class.mk-range-slider--disabled]': 'isDisabled()',
    '[class.mk-range-slider--invalid]': 'isInvalid()',
    '[attr.data-tone]': 'tone()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkRangeSlider),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkRangeSlider),
      multi: true,
    },
  ],
})
export class MkRangeSlider implements ControlValueAccessor, Validator, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly field = inject(MkFormField, { optional: true });
  protected readonly i18n = inject(MK_I18N);
  private readonly trackRef = viewChildren<ElementRef<HTMLElement>>('track');
  private readonly thumbRefs = viewChildren<ElementRef<HTMLElement>>('thumb');

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
  /** Control size. */
  readonly size = input<MkSize>('md');
  /** Semantic tone for the filled range + thumbs. */
  readonly tone = input<MkTone>('primary');
  /** Accessible label for the low thumb. */
  readonly minLabel = input(this.i18n.minimum);
  /** Accessible label for the high thumb. */
  readonly maxLabel = input(this.i18n.maximum);
  /** Two-way `[low, high]` value. */
  readonly value = model<MkRange>([0, 100]);

  private activeThumb: 0 | 1 | null = null;
  /** Element the drag listeners are attached to (only while dragging). */
  private dragTarget: HTMLElement | null = null;
  /** Track geometry cached at pointerdown — no layout reads per move. */
  private dragRect: DOMRect | null = null;
  /** Text direction cached at pointerdown (keyboard keeps live reads). */
  private dragRtl = false;
  private readonly cvaDisabled = signal(false);
  private onChange: (value: MkRange) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly low = computed(() => this.value()[0]);
  protected readonly high = computed(() => this.value()[1]);

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);

  private pct(v: number): number {
    const span = this.max() - this.min();
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((v - this.min()) / span) * 100));
  }

  protected readonly lowPercent = computed(() => this.pct(this.low()));
  protected readonly highPercent = computed(() => this.pct(this.high()));

  private get bigStep(): number {
    return Math.max(this.step(), (this.max() - this.min()) / 10);
  }

  protected onKeydown(thumb: 0 | 1, event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;
    const current = this.value()[thumb];
    // In RTL the track is mirrored, so Left/Right must follow the visual
    // direction (Right moves the thumb right → towards min). Up/Down,
    // Page and Home/End are direction-agnostic.
    const horizontal = this.isRtl() ? -this.step() : this.step();
    let next = current;
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
        next = thumb === 0 ? this.min() : this.low();
        break;
      case 'End':
        next = thumb === 1 ? this.max() : this.high();
        break;
      default:
        return;
    }
    e.preventDefault();
    this.setThumb(thumb, next, true);
  }

  protected onPointerDown(event: Event): void {
    if (this.isDisabled()) return;
    const e = event as PointerEvent;
    const track = this.trackRef()[0]?.nativeElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    // Cache the geometry + direction for the whole gesture: pointer capture
    // means no scrolling can happen mid-drag, so one layout read suffices.
    this.dragRect = rect;
    this.dragRtl = this.isRtl();
    const raw = this.rawFromClientX(e.clientX);
    if (raw == null) {
      this.dragRect = null;
      return;
    }
    // Grab whichever thumb is closer to the pointer.
    const thumb: 0 | 1 =
      Math.abs(raw - this.low()) <= Math.abs(raw - this.high()) ? 0 : 1;
    this.activeThumb = thumb;
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
    this.thumbRefs()[thumb]?.nativeElement.focus();
    this.setThumb(thumb, raw);
    event.preventDefault();
  }

  private readonly onDragMove = (event: PointerEvent): void => {
    if (this.activeThumb == null) return;
    const raw = this.rawFromClientX(event.clientX);
    if (raw != null) this.setThumb(this.activeThumb, raw);
  };

  private readonly onDragEnd = (): void => {
    this.endDrag(true);
  };

  private endDrag(markTouched: boolean): void {
    const target = this.dragTarget;
    if (target) {
      target.removeEventListener('pointermove', this.onDragMove);
      target.removeEventListener('pointerup', this.onDragEnd);
      target.removeEventListener('pointercancel', this.onDragEnd);
    }
    this.dragTarget = null;
    this.dragRect = null;
    if (this.activeThumb == null) return;
    this.activeThumb = null;
    if (markTouched) this.onTouched();
  }

  ngOnDestroy(): void {
    this.endDrag(false);
  }

  /** Whether the rendered track is right-to-left. */
  private isRtl(): boolean {
    const track = this.trackRef()[0]?.nativeElement;
    return (
      !!track &&
      typeof getComputedStyle === 'function' &&
      getComputedStyle(track).direction === 'rtl'
    );
  }

  /** Pointer-drag path only — uses the geometry cached at pointerdown. */
  private rawFromClientX(clientX: number): number | null {
    const rect = this.dragRect;
    if (!rect || rect.width <= 0) return null;
    const offset = this.dragRtl ? rect.right - clientX : clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, offset / rect.width));
    return this.min() + ratio * (this.max() - this.min());
  }

  private setThumb(thumb: 0 | 1, raw: number, markTouched = false): void {
    const snapped = this.clampSnap(raw);
    const [lo, hi] = this.value();
    // Keep low ≤ high (no crossing).
    const next: MkRange =
      thumb === 0 ? [Math.min(snapped, hi), hi] : [lo, Math.max(snapped, lo)];
    if (next[0] !== lo || next[1] !== hi) {
      this.value.set(next);
      this.onChange(next);
    }
    if (markTouched) this.onTouched();
  }

  private clampSnap(raw: number): number {
    const step = this.step() > 0 ? this.step() : 1;
    const min = this.min();
    const snapped = Math.round((raw - min) / step) * step + min;
    return Math.min(this.max(), Math.max(min, Number(snapped.toFixed(6))));
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
  writeValue(value: MkRange | null): void {
    if (Array.isArray(value) && value.length === 2) {
      const lo = this.clampSnap(Number(value[0]));
      const hi = this.clampSnap(Number(value[1]));
      this.value.set([Math.min(lo, hi), Math.max(lo, hi)]);
    }
  }
  registerOnChange(fn: (value: MkRange) => void): void {
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
   * Reports `min` / `max` for either endpoint falling outside the track. The
   * slider clamps what the user can produce, so this only fires for a range
   * written in from the model side.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (!Array.isArray(v) || v.length !== 2) return null;
    const lo = Number(v[0]);
    const hi = Number(v[1]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
    const min = this.min();
    if (lo < min) return { min: { min, actual: lo } };
    const max = this.max();
    if (hi > max) return { max: { max, actual: hi } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
