/**
 * Layout data for {@link MkOnScreenKeyboard}.
 *
 * A layout is a set of rows per layer. String entries are literal character
 * keys (lowercase base form); object entries are action keys. Shifted
 * characters come from `shiftMap` when present, else `toUpperCase()` — which
 * handles Polish diacritics for free (`ą` → `Ą`).
 */

/** Non-character keys. `span` stretches the key across extra grid columns. */
export interface MkKeyboardActionKey {
  readonly action: 'shift' | 'backspace' | 'space' | 'enter' | 'layer';
  readonly span?: number;
}

export type MkKeyboardKey = string | MkKeyboardActionKey;

export interface MkKeyboardLayout {
  /** Letter layer. */
  readonly base: ReadonlyArray<ReadonlyArray<MkKeyboardKey>>;
  /** Alternate layer (digits live in the base top row; this holds diacritics + symbols). */
  readonly alt: ReadonlyArray<ReadonlyArray<MkKeyboardKey>>;
  /** Overrides for shifted characters; missing keys fall back to `toUpperCase()`. */
  readonly shiftMap?: Readonly<Record<string, string>>;
}

const SHIFT: MkKeyboardActionKey = { action: 'shift' };
const BACKSPACE: MkKeyboardActionKey = { action: 'backspace' };
const LAYER: MkKeyboardActionKey = { action: 'layer' };
const SPACE: MkKeyboardActionKey = { action: 'space', span: 5 };
const ENTER: MkKeyboardActionKey = { action: 'enter', span: 2 };

/**
 * QWERTY with a Polish alternate layer (programmer-Polish convention: base
 * letters are plain QWERTY, diacritics sit on the `?ąę` layer along with the
 * common symbols).
 */
export const MK_KEYBOARD_LAYOUT_QWERTY_PL: MkKeyboardLayout = {
  base: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    [SHIFT, 'z', 'x', 'c', 'v', 'b', 'n', 'm', BACKSPACE],
    [LAYER, ',', SPACE, '.', ENTER],
  ],
  alt: [
    ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'],
    ['@', '#', '%', '&', '*', '(', ')', '-', '_'],
    ['+', '=', '/', ':', ';', '!', '?', "'", '"'],
    [SHIFT, '€', '$', '~', '„', '”', '…', BACKSPACE],
    [LAYER, ',', SPACE, '.', ENTER],
  ],
};
