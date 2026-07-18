import {
  Directive,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

/** Result of applying a mask: the formatted string and its raw token chars. */
export interface MkMaskResult {
  masked: string;
  unmasked: string;
}

/** Token → predicate for the character it accepts. */
const MK_MASK_TOKENS: Record<string, RegExp> = {
  '0': /[0-9]/, // digit
  A: /[A-Za-z]/, // letter
  '*': /[0-9A-Za-z]/, // alphanumeric
};

const ALNUM = /[0-9A-Za-z]/;

/**
 * Format `value` against a mask `pattern`. Pattern tokens: `0` = digit,
 * `A` = letter, `*` = alphanumeric; any other character is a literal that is
 * inserted automatically. Characters that don't fit the current token are
 * skipped, so pasted / mistyped input is coerced into shape.
 *
 * Returns the `masked` (display) string and the `unmasked` string (only the
 * token characters — the value you usually store).
 */
export function mkApplyMask(value: string, pattern: string): MkMaskResult {
  let masked = '';
  let unmasked = '';
  let vi = 0;
  for (let pi = 0; pi < pattern.length; pi++) {
    const pc = pattern[pi];
    const rule = MK_MASK_TOKENS[pc];
    if (rule) {
      while (vi < value.length && !rule.test(value[vi])) vi++;
      if (vi >= value.length) break;
      masked += value[vi];
      unmasked += value[vi];
      vi++;
    } else {
      // Stop rather than emit a trailing literal with no content after it.
      if (vi >= value.length) break;
      masked += pc;
      if (value[vi] === pc) vi++;
    }
  }
  return { masked, unmasked };
}

/**
 * Compute where the caret belongs after re-masking: after the same number of
 * value (alphanumeric) characters the caret used to sit behind, absorbing any
 * literal(s) that immediately follow — so typing "1" in "(0)" lands the caret
 * after the "(". Shared by {@link MkMask} and the masked form controls.
 */
export function mkMaskCaret(
  oldValue: string,
  oldCaret: number,
  masked: string,
): number {
  const before = oldValue.slice(0, oldCaret);
  const target = (before.match(/[0-9A-Za-z]/g) ?? []).length;
  let pos = 0;
  let seen = 0;
  while (pos < masked.length && seen < target) {
    if (ALNUM.test(masked[pos])) seen++;
    pos++;
  }
  while (pos < masked.length && !ALNUM.test(masked[pos])) pos++;
  return pos;
}

/**
 * Mask — formats an `<input>` as the user types against a token pattern
 * (phone, card, date, custom). Apply it to any text input; read the raw value
 * via `(unmaskedChange)` (or the exported `unmasked` getter) and the formatted
 * value via `(maskedChange)`.
 *
 * ```html
 * <input mkInput mkMask="(000) 000-0000" (unmaskedChange)="phone.set($event)" />
 * <input mkInput mkMask="0000 0000 0000 0000" />
 * ```
 */
@Directive({
  selector: '[mkMask]',
  exportAs: 'mkMask',
  host: {
    '(input)': 'onInput()',
    '[attr.inputmode]': 'inputMode()',
  },
})
export class MkMask {
  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef);

  /** The mask pattern (token string). */
  readonly pattern = input.required<string>({ alias: 'mkMask' });
  /** Override the derived `inputmode` (`numeric` for digit-only masks). */
  readonly maskInputmode = input<string | null>(null, {
    alias: 'mkMaskInputmode',
  });

  /** Mobile keyboard hint: numeric for digit-only patterns unless overridden. */
  protected readonly inputMode = computed(
    () => this.maskInputmode() ?? (/[A*]/.test(this.pattern()) ? 'text' : 'numeric'),
  );

  /** The formatted value, on every change. */
  readonly maskedChange = output<string>();
  /** The raw value (token characters only), on every change. */
  readonly unmaskedChange = output<string>();

  private _masked = '';
  private _unmasked = '';

  /** The current formatted value. */
  get value(): string {
    return this._masked;
  }
  /** The current raw value (token characters only). */
  get unmasked(): string {
    return this._unmasked;
  }

  protected onInput(): void {
    const el = this.host.nativeElement;
    const oldValue = el.value;
    const oldCaret = el.selectionStart ?? oldValue.length;
    const { masked, unmasked } = mkApplyMask(oldValue, this.pattern());

    el.value = masked;
    this.setCaret(el, oldValue, oldCaret, masked);

    if (masked === this._masked) return;
    this._masked = masked;
    this._unmasked = unmasked;
    this.maskedChange.emit(masked);
    this.unmaskedChange.emit(unmasked);
  }

  /** Position the caret after the same number of value chars as before. */
  private setCaret(
    el: HTMLInputElement,
    oldValue: string,
    oldCaret: number,
    masked: string,
  ): void {
    const pos = mkMaskCaret(oldValue, oldCaret, masked);
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      // Some input types (e.g. number, email) don't support selection.
    }
  }
}
