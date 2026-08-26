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
  output,
  signal,
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
import { MK_I18N, MkLiveAnnouncer, mkUniqueId, mkValidatorChange } from '@mk-kit/ui/core';
import { MkIcon } from '@mk-kit/ui/icon';

export type MkNumericKeypadMode = 'pin' | 'quantity' | 'amount';

/** A key on the pad: a digit, or one of the three action keys. */
type PadKey = { id: string; label: string; action: 'digit' | 'clear' | 'decimal' | 'backspace' };

/**
 * Numeric keypad — a touch-first 3×4 digit pad for PIN entry, quantity entry
 * and money amounts (POS-style). `ControlValueAccessor` + two-way `value`
 * model; the value is a **string** in `pin` mode (leading zeros preserved)
 * and a **number | null** in `quantity`/`amount` mode.
 *
 * - `pin`: masked echo row by default; `(submit)` fires automatically when
 *   `length` digits are entered.
 * - `quantity`: integer entry; the bottom-left key clears.
 * - `amount`: decimal entry (value uses `.`; the echo shows
 *   `decimalSeparator`); capped at `fractionDigits` fraction digits.
 *
 * A physical keyboard works anywhere inside the pad: digits, Backspace,
 * Delete (clear), Enter (submit) and the decimal separator. Arrow keys move
 * between the on-screen keys (roving tabindex).
 *
 * ```html
 * <mk-numeric-keypad mode="pin" [length]="4" (submit)="unlock($event)" />
 * <mk-numeric-keypad mode="quantity" [min]="1" [(value)]="qty" />
 * ```
 */
@Component({
  selector: 'mk-numeric-keypad',
  templateUrl: './numeric-keypad.html',
  styleUrl: './numeric-keypad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkIcon],
  host: {
    class: 'mk-numeric-keypad',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.mk-numeric-keypad--disabled]': 'isDisabled()',
    '[class.mk-numeric-keypad--invalid]': 'invalid()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkNumericKeypad),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkNumericKeypad),
      multi: true,
    },
  ],
})
export class MkNumericKeypad implements ControlValueAccessor, Validator {
  protected readonly i18n = inject(MK_I18N);
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly keyEls = viewChildren<ElementRef<HTMLButtonElement>>('key');

  /** Entry mode. Decides the value type and the bottom-left key. */
  readonly mode = input<MkNumericKeypadMode>('quantity');
  /** PIN length (`pin` mode only). Reaching it emits `submit`. */
  readonly length = input(4, { transform: numberAttribute });
  /** Lower bound reported through the validator (`quantity`/`amount`). */
  readonly min = input<number | null>(null);
  /** Upper bound reported through the validator (`quantity`/`amount`). */
  readonly max = input<number | null>(null);
  /** Mask the echo row in `pin` mode. Default `true`. */
  readonly mask = input(true, { transform: booleanAttribute });
  /** Show the echo row above the keys. Default `true`. */
  readonly showValue = input(true, { transform: booleanAttribute });
  /** Echo-row separator for `amount` mode. The VALUE always uses `.`. */
  readonly decimalSeparator = input(',');
  /** Max fraction digits accepted in `amount` mode. */
  readonly fractionDigits = input(2, { transform: numberAttribute });
  /** Disable the pad. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force invalid styling. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Accessible label for the pad. */
  readonly ariaLabel = input(this.i18n.numericKeypadLabel);
  /** Two-way value: `string` in `pin` mode, `number | null` otherwise. */
  readonly value = model<string | number | null>(null);

  /** Enter key / full PIN. Emits the current value. */
  readonly submit = output<string | number | null>();

  readonly padId = mkUniqueId('mk-numeric-keypad');

  /** Raw entry buffer ('' = empty; amount keeps a '.' while typing). */
  private readonly buffer = signal('');
  private readonly cvaDisabled = signal(false);
  /** Roving-tabindex position inside the flattened key list. */
  protected readonly focusIndex = signal(0);
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly keys = computed<PadKey[]>(() => {
    const digit = (d: string): PadKey => ({ id: d, label: d, action: 'digit' });
    const corner: PadKey =
      this.mode() === 'amount'
        ? { id: 'decimal', label: this.decimalSeparator(), action: 'decimal' }
        : { id: 'clear', label: this.i18n.keypadClear, action: 'clear' };
    return [
      ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit),
      corner,
      digit('0'),
      { id: 'backspace', label: this.i18n.keypadBackspace, action: 'backspace' },
    ];
  });

  /** Echo text: masked dots are rendered separately in `pin` mode. */
  protected readonly echoText = computed(() => {
    const raw = this.buffer();
    if (this.mode() === 'amount') {
      return raw ? raw.replace('.', this.decimalSeparator()) : '0';
    }
    return raw || '0';
  });
  protected readonly isPinMasked = computed(() => this.mode() === 'pin' && this.mask());
  protected readonly pinDots = computed(() =>
    Array.from({ length: this.length() }, (_, i) => i < this.buffer().length),
  );

  protected keyAriaLabel(key: PadKey): string | null {
    // Digits read themselves from their text content.
    return key.action === 'digit' ? null : key.label;
  }

  protected onKeyClick(key: PadKey): void {
    if (this.isDisabled()) return;
    switch (key.action) {
      case 'digit':
        this.pushDigit(key.id);
        break;
      case 'decimal':
        this.pushDecimal();
        break;
      case 'clear':
        this.commit('');
        break;
      case 'backspace':
        this.commit(this.buffer().slice(0, -1));
        break;
    }
  }

  /** Physical-keyboard entry + arrow-key roving over the on-screen keys. */
  protected onGridKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      if (!this.isDisabled()) this.pushDigit(key);
    } else if (key === '.' || key === ',' || key === this.decimalSeparator()) {
      event.preventDefault();
      if (!this.isDisabled()) this.pushDecimal();
    } else if (key === 'Backspace') {
      event.preventDefault();
      if (!this.isDisabled()) this.commit(this.buffer().slice(0, -1));
    } else if (key === 'Delete') {
      event.preventDefault();
      if (!this.isDisabled()) this.commit('');
    } else if (key === 'Enter') {
      event.preventDefault();
      this.submit.emit(this.value());
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      this.focusKey(this.focusIndex() + 1);
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      this.focusKey(this.focusIndex() - 1);
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      this.focusKey(this.focusIndex() + 3);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      this.focusKey(this.focusIndex() - 3);
    } else if (key === 'Home') {
      event.preventDefault();
      this.focusKey(0);
    } else if (key === 'End') {
      event.preventDefault();
      this.focusKey(this.keys().length - 1);
    }
  }

  protected onKeyFocus(index: number): void {
    this.focusIndex.set(index);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private focusKey(index: number): void {
    const clamped = Math.max(0, Math.min(this.keys().length - 1, index));
    this.focusIndex.set(clamped);
    this.keyEls()[clamped]?.nativeElement.focus();
  }

  private pushDigit(digit: string): void {
    const raw = this.buffer();
    if (this.mode() === 'pin') {
      if (raw.length >= this.length()) return;
      const next = raw + digit;
      this.commit(next);
      if (this.isPinMasked()) {
        this.announcer.announce(
          this.i18n.keypadDigitsEntered(next.length, this.length()),
          'polite',
        );
      }
      if (next.length === this.length()) this.submit.emit(next);
      return;
    }
    const frac = raw.split('.')[1];
    if (frac !== undefined && frac.length >= this.fractionDigits()) return;
    // '0' → '05' would silently read as 5; replace the bare zero instead.
    this.commit(raw === '0' ? digit : raw + digit);
  }

  private pushDecimal(): void {
    if (this.mode() !== 'amount') return;
    const raw = this.buffer();
    if (raw.includes('.')) return;
    this.commit((raw || '0') + '.');
  }

  private commit(raw: string): void {
    this.buffer.set(raw);
    const value =
      this.mode() === 'pin'
        ? raw
        : raw === '' || raw === '.'
          ? null
          : Number(raw);
    this.value.set(value);
    this.onChange(value);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | number | null): void {
    const raw =
      value === null || value === undefined || value === ''
        ? ''
        : String(value);
    this.buffer.set(raw);
    this.value.set(this.mode() === 'pin' ? raw : raw === '' ? null : Number(raw));
  }
  registerOnChange(fn: (value: string | number | null) => void): void {
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
    this.mode();
    this.length();
    this.min();
    this.max();
  });

  /**
   * `pin`: reports `minlength` while the code is incomplete (empty passes —
   * compose with `Validators.required`). `quantity`/`amount`: reports
   * `min`/`max` against the bounds.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (this.mode() === 'pin') {
      if (typeof v !== 'string' || !v) return null;
      const requiredLength = this.length();
      return v.length >= requiredLength
        ? null
        : { minlength: { requiredLength, actualLength: v.length } };
    }
    if (typeof v !== 'number' || Number.isNaN(v)) return null;
    const min = this.min();
    if (min !== null && v < min) return { min: { min, actual: v } };
    const max = this.max();
    if (max !== null && v > max) return { max: { max, actual: v } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
