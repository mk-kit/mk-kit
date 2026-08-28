import { Pipe, type PipeTransform } from '@angular/core';

/**
 * `mkInitials` — "Ada Lovelace" → "AL", the same rule `mk-avatar` uses for
 * its fallback: first letter of the first and last word, upper-cased. A
 * single word yields its first `max` letters ("Ada" → "AD"); more than two
 * words with `max` > 2 take one letter per word from the start ("Jean
 * Luc Picard" with `max: 3` → "JLP"). Leading/trailing/duplicate whitespace
 * is ignored, and grapheme-aware slicing keeps emoji and accents intact.
 * Pure: `null`, `undefined` and blank input render as `''`.
 *
 * ```html
 * {{ user.name | mkInitials }}      <!-- Grace Hopper → GH -->
 * {{ user.name | mkInitials:1 }}    <!-- Grace Hopper → G -->
 * {{ 'Jean Luc Picard' | mkInitials:3 }} <!-- JLP -->
 * ```
 */
@Pipe({ name: 'mkInitials', pure: true })
export class MkInitialsPipe implements PipeTransform {
  /**
   * @param value Full name.
   * @param max Maximum number of letters; default `2`, minimum `1`.
   */
  transform(value: string | null | undefined, max = 2): string {
    if (value === null || value === undefined) return '';
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const limit = Math.max(1, Math.floor(max) || 1);
    let letters: string[];
    if (words.length === 1) {
      letters = graphemes(words[0]).slice(0, limit);
    } else if (limit >= words.length) {
      letters = words.map((w) => graphemes(w)[0]);
    } else if (limit === 1) {
      letters = [graphemes(words[0])[0]];
    } else {
      // First (limit - 1) words plus the last word: "Ada King Lovelace" → "AL".
      letters = [
        ...words.slice(0, limit - 1).map((w) => graphemes(w)[0]),
        graphemes(words[words.length - 1])[0],
      ];
    }
    return letters.join('').toLocaleUpperCase();
  }
}

/** Split into user-perceived characters (code points as a fallback). */
function graphemes(word: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter().segment(word)].map((s) => s.segment);
  }
  return Array.from(word);
}
