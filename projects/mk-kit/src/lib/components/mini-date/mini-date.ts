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
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkFormField } from '../form-field/form-field';
import {
  clampDate,
  getMonthNames,
  isSameDay,
  startOfDay,
} from '../datetime/date-utils';

/** Which segment a part represents. */
type MkDateSegment = 'day' | 'month' | 'year';

/** Segment display order. */
export type MkMiniDateOrder = 'dmy' | 'mdy' | 'ymd';

/** A rendered segment descriptor (view-model for one spinbutton). */
interface MkDatePart {
  key: MkDateSegment;
  /** Text shown in the segment, or the placeholder when empty. */
  display: string;
  /** Whether the segment currently holds a value. */
  filled: boolean;
  valueNow: number | null;
  valueMin: number;
  valueMax: number;
  valueText: string;
  label: string;
}

/** Number of days in month `m` (1–12) of `year`. */
function daysInMonth(m: number, year: number): number {
  return new Date(year, m, 0).getDate();
}

/**
 * MiniDate — a compact, popover-free inline date editor with segmented
 * day / month / year spin fields (like a native `<input type="date">` but
 * themed and signal-driven). Each segment is an ARIA `spinbutton`: Arrow
 * Up/Down step the value (day wraps within the month), Arrow Left/Right move
 * between segments, and typing digits fills the focused segment and
 * auto-advances (OTP-style). Implements `ControlValueAccessor` and a two-way
 * `value` model over a real `Date | null`.
 *
 * A non-null `Date` is emitted only when all three segments are set and valid;
 * the day is clamped to the month's length (e.g. Feb 31 → 28/29) and the
 * result is clamped to `[min, max]`.
 *
 * ```html
 * <mk-mini-date [(value)]="date" order="dmy" [min]="minDate" />
 * ```
 */
@Component({
  selector: 'mk-mini-date',
  templateUrl: './mini-date.html',
  styleUrl: './mini-date.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'mkMiniDate',
  host: {
    class: 'mk-mini-date',
    role: 'group',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'isInvalid() || null',
    '[attr.aria-required]': 'isRequired() || null',
    '[class.mk-mini-date--sm]': "effectiveSize() === 'sm'",
    '[class.mk-mini-date--lg]': "effectiveSize() === 'lg'",
    '[class.mk-mini-date--invalid]': 'isInvalid()',
    '[class.mk-mini-date--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkMiniDate),
      multi: true,
    },
  ],
})
export class MkMiniDate implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  private readonly segEls =
    viewChildren<ElementRef<HTMLElement>>('seg');

  /** Minimum selectable date (inclusive). */
  readonly min = input<Date | null>(null);
  /** Maximum selectable date (inclusive). */
  readonly max = input<Date | null>(null);
  /** Two-way value — a real `Date`, or `null` while incomplete. */
  readonly value = model<Date | null>(null);
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force invalid styling when standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored inside an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Segment order. */
  readonly order = input<MkMiniDateOrder>('dmy');
  /** Lowest selectable year (for the year spinbutton range). */
  readonly yearMin = input(1900, { transform: numberAttribute });
  /** Highest selectable year (for the year spinbutton range). */
  readonly yearMax = input(2100, { transform: numberAttribute });

  readonly segId = mkUniqueId('mk-mini-date');
  private readonly monthNames = getMonthNames();

  // --- Segment state --------------------------------------------------------
  private readonly daySeg = signal<number | null>(null);
  private readonly monthSeg = signal<number | null>(null);
  private readonly yearSeg = signal<number | null>(null);
  /** Per-segment digit buffer used for OTP-style typing/auto-advance. */
  private buffer = '';
  private bufferKey: MkDateSegment | null = null;

  private readonly cvaDisabled = signal(false);
  private onChange: (value: Date | null) => void = () => {};
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
  protected readonly isRequired = computed(() => this.field?.required() ?? false);
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** Days available in the current month/year (defaults to a leap year). */
  private readonly monthLength = computed(() =>
    daysInMonth(this.monthSeg() ?? 1, this.yearSeg() ?? 2000),
  );

  /** Ordered, rendered segment descriptors. */
  protected readonly parts = computed<MkDatePart[]>(() => {
    const byKey: Record<MkDateSegment, MkDatePart> = {
      day: {
        key: 'day',
        display: this.pad(this.daySeg(), 2, 'dd'),
        filled: this.daySeg() != null,
        valueNow: this.daySeg(),
        valueMin: 1,
        valueMax: this.monthLength(),
        valueText: this.daySeg() != null ? String(this.daySeg()) : 'Empty',
        label: 'Day',
      },
      month: {
        key: 'month',
        display:
          this.monthSeg() != null
            ? this.monthNames[this.monthSeg()! - 1].slice(0, 3)
            : 'mmm',
        filled: this.monthSeg() != null,
        valueNow: this.monthSeg(),
        valueMin: 1,
        valueMax: 12,
        valueText:
          this.monthSeg() != null
            ? this.monthNames[this.monthSeg()! - 1]
            : 'Empty',
        label: 'Month',
      },
      year: {
        key: 'year',
        display: this.pad(this.yearSeg(), 4, 'yyyy'),
        filled: this.yearSeg() != null,
        valueNow: this.yearSeg(),
        valueMin: this.yearMin(),
        valueMax: this.yearMax(),
        valueText: this.yearSeg() != null ? String(this.yearSeg()) : 'Empty',
        label: 'Year',
      },
    };
    return this.order()
      .split('')
      .map((c) =>
        c === 'd' ? byKey.day : c === 'm' ? byKey.month : byKey.year,
      );
  });

  // --- Interaction ----------------------------------------------------------
  protected onSegKeydown(key: MkDateSegment, index: number, e: KeyboardEvent): void {
    if (this.isDisabled()) return;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.step(key, 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.step(key, -1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.focusSeg(index - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.focusSeg(index + 1);
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        this.setSegment(key, null);
        this.resetBuffer();
        if (e.key === 'Backspace') this.focusSeg(index - 1);
        break;
      default:
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          this.typeDigit(key, index, e.key);
        }
    }
  }

  protected onSegFocus(key: MkDateSegment): void {
    // A fresh focus starts a new typing buffer for that segment.
    if (this.bufferKey !== key) this.resetBuffer();
  }

  protected onBlur(): void {
    this.onTouched();
  }

  /** Step a segment by `delta`; the day wraps within the current month. */
  protected step(key: MkDateSegment, delta: number): void {
    if (key === 'day') {
      const len = this.monthLength();
      const cur = this.daySeg() ?? (delta > 0 ? 0 : len + 1);
      const next = ((cur - 1 + delta) % len + len) % len + 1;
      this.setSegment('day', next);
    } else if (key === 'month') {
      const cur = this.monthSeg() ?? (delta > 0 ? 0 : 13);
      const next = ((cur - 1 + delta) % 12 + 12) % 12 + 1;
      this.setSegment('month', next);
    } else {
      const base = this.yearSeg() ?? new Date().getFullYear() - delta;
      const next = Math.min(this.yearMax(), Math.max(this.yearMin(), base + delta));
      this.setSegment('year', next);
    }
    this.resetBuffer();
  }

  /** OTP-style digit entry with auto-advance to the next segment when full. */
  private typeDigit(key: MkDateSegment, index: number, digit: string): void {
    if (this.bufferKey !== key) this.buffer = '';
    this.bufferKey = key;
    const maxDigits = key === 'year' ? 4 : 2;
    const max =
      key === 'day'
        ? this.monthLength()
        : key === 'month'
          ? 12
          : this.yearMax();

    let buf = this.buffer + digit;
    let num = Number(buf);
    // If the running value overflows the max, restart the buffer with this digit.
    if (num > max || buf.length > maxDigits) {
      buf = digit;
      num = Number(buf);
    }
    this.buffer = buf;
    this.setSegment(key, num === 0 ? null : num);

    // Advance when the segment is saturated (full width, or another digit
    // could only overflow the max).
    const full = buf.length >= maxDigits || num * 10 > max;
    if (full) {
      this.resetBuffer();
      this.focusSeg(index + 1);
    }
  }

  /** Set a segment, then rebuild + emit the composite date. */
  protected setSegment(key: MkDateSegment, value: number | null): void {
    if (key === 'day') this.daySeg.set(value);
    else if (key === 'month') this.monthSeg.set(value);
    else this.yearSeg.set(value);
    this.recompute();
  }

  /**
   * Rebuild the `Date` from the three segments and emit it. Emits `null` unless
   * all three are set; clamps the day to the month length and the whole date to
   * `[min, max]`, writing any clamp back into the segments.
   */
  private recompute(): void {
    const d = this.daySeg();
    const m = this.monthSeg();
    const y = this.yearSeg();
    if (d == null || m == null || y == null) {
      this.emit(null);
      return;
    }
    const len = daysInMonth(m, y);
    const clampedDay = Math.min(d, len);
    if (clampedDay !== d) this.daySeg.set(clampedDay);

    const raw = new Date(y, m - 1, clampedDay);
    const bounded = clampDate(startOfDay(raw), this.min(), this.max());
    if (!isSameDay(bounded, raw)) this.split(bounded);
    this.emit(startOfDay(bounded));
  }

  private emit(v: Date | null): void {
    this.value.set(v);
    this.onChange(v);
  }

  /** Populate the three segments from a `Date`. */
  private split(date: Date): void {
    this.daySeg.set(date.getDate());
    this.monthSeg.set(date.getMonth() + 1);
    this.yearSeg.set(date.getFullYear());
  }

  private resetBuffer(): void {
    this.buffer = '';
    this.bufferKey = null;
  }

  private focusSeg(index: number): void {
    const els = this.segEls();
    const el = els[Math.max(0, Math.min(els.length - 1, index))];
    el?.nativeElement.focus();
    this.resetBuffer();
  }

  private pad(v: number | null, width: number, placeholder: string): string {
    return v == null ? placeholder : String(v).padStart(width, '0');
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: Date | null): void {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      this.split(value);
    } else {
      this.daySeg.set(null);
      this.monthSeg.set(null);
      this.yearSeg.set(null);
    }
    this.value.set(value ?? null);
    this.resetBuffer();
  }
  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
