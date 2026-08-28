import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
  untracked,
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
import { MK_I18N } from '@mk-kit/ui/core';
import type { MkSize } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { mkValidatorChange } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core';
import { MkFormField } from '../form-field/form-field';

/**
 * OTP — a segmented one-time-code input: N single-character boxes with automatic
 * focus advance, Backspace-to-previous, Arrow navigation and full-code paste.
 * `ControlValueAccessor` + two-way `value` model over the concatenated string.
 *
 * ```html
 * <mk-otp [(value)]="code" [length]="6" />
 * ```
 */
@Component({
  selector: 'mk-otp',
  templateUrl: './otp.html',
  styleUrl: './otp.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-otp',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[class.mk-otp--sm]': "effectiveSize() === 'sm'",
    '[class.mk-otp--lg]': "effectiveSize() === 'lg'",
    '[class.mk-otp--invalid]': 'isInvalid()',
    '[class.mk-otp--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkOtp),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkOtp),
      multi: true,
    },
  ],
})
export class MkOtp implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  protected readonly i18n = inject(MK_I18N);
  private readonly cells =
    viewChildren<ElementRef<HTMLInputElement>>('cell');

  /** Number of character boxes. */
  readonly length = input(6, { transform: numberAttribute });
  /** Restrict input to digits (`number`) or allow any char (`text`). */
  readonly type = input<'number' | 'text'>('number');
  /** Mask entered characters (password style). */
  readonly mask = input(false, { transform: booleanAttribute });
  /** Two-way concatenated value. */
  readonly value = model('');
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force invalid styling when standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored inside an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Accessible label for the group. */
  readonly ariaLabel = input(this.i18n.oneTimeCode);

  readonly cellId = mkUniqueId('mk-otp');
  private readonly chars = signal<string[]>([]);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly indexes = computed(() =>
    Array.from({ length: this.length() }, (_, i) => i),
  );
  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  /** Required state from the surrounding field (`aria-required` on the cells). */
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  /** Hint/error ids from the surrounding field (`aria-describedby` on the cells). */
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly inputMode = computed(() =>
    this.type() === 'number' ? 'numeric' : 'text',
  );

  /**
   * Cell ids. The first cell adopts the surrounding field's `controlId` so the
   * field's `<label for>` resolves to a real element.
   */
  protected cellIdFor(i: number): string {
    if (i === 0 && this.field) return this.field.controlId;
    return `${this.cellId}-${i}`;
  }

  constructor() {
    // Keep the boxes in sync with external value / length changes.
    effect(() => {
      const v = this.value();
      const len = this.length();
      if (
        v !== untracked(this.chars).join('') ||
        untracked(this.chars).length !== len
      ) {
        this.chars.set(this.split(v, len));
      }
    });
  }

  protected charAt(i: number): string {
    return this.chars()[i] ?? '';
  }

  protected onCellInput(i: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = this.sanitize(input.value);
    if (raw.length > 1) {
      this.fillFrom(i, raw);
      return;
    }
    const arr = [...this.chars()];
    arr[i] = raw;
    input.value = raw; // keep the box showing a single char
    this.commit(arr);
    if (raw) this.focusCell(i + 1);
  }

  protected onCellKeydown(i: number, event: KeyboardEvent): void {
    const key = event.key;
    if (key === 'Backspace') {
      if (!this.charAt(i)) {
        event.preventDefault();
        const arr = [...this.chars()];
        if (i > 0) arr[i - 1] = '';
        this.commit(arr);
        this.focusCell(i - 1);
      }
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      this.focusCell(i - 1);
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      this.focusCell(i + 1);
    }
  }

  protected onPaste(i: number, event: ClipboardEvent): void {
    event.preventDefault();
    const text = this.sanitize(event.clipboardData?.getData('text') ?? '');
    if (text) this.fillFrom(i, text);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private fillFrom(start: number, text: string): void {
    const arr = [...this.chars()];
    let i = start;
    for (const ch of text) {
      if (i >= this.length()) break;
      arr[i++] = ch;
    }
    this.commit(arr);
    this.focusCell(Math.min(i, this.length() - 1));
  }

  private commit(arr: string[]): void {
    this.chars.set(arr);
    const value = arr.join('');
    this.value.set(value);
    this.onChange(value);
  }

  private focusCell(i: number): void {
    const cell = this.cells()[Math.max(0, Math.min(this.length() - 1, i))];
    cell?.nativeElement.focus();
    cell?.nativeElement.select();
  }

  private sanitize(text: string): string {
    const trimmed = text.trim();
    return this.type() === 'number' ? trimmed.replace(/\D/g, '') : trimmed;
  }

  private split(v: string, len: number): string[] {
    const arr = new Array(len).fill('');
    for (let i = 0; i < Math.min(len, v.length); i++) arr[i] = v[i];
    return arr;
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    const v = value ?? '';
    this.value.set(v);
    // Seed the cells synchronously (don't wait for the sync effect).
    this.chars.set(this.split(v, this.length()));
  }
  registerOnChange(fn: (value: string) => void): void {
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
    this.length();
  });

  /**
   * Reports `minlength` for a partially entered code. An empty value passes;
   * compose with `Validators.required` to reject it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    if (typeof v !== 'string' || !v) return null;
    const requiredLength = this.length();
    if (v.length >= requiredLength) return null;
    return { minlength: { requiredLength, actualLength: v.length } };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
