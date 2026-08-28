import { Pipe, type PipeTransform } from '@angular/core';

/** Options accepted by {@link MkTruncatePipe}. */
export interface MkTruncateOptions {
  /** Suffix appended when text is cut. Default `'…'` (a single ellipsis character). */
  ellipsis?: string;
  /**
   * Cut at the last whitespace before the limit instead of mid-word
   * (falls back to a hard cut when the first word alone is longer).
   * Default `false`.
   */
  wordBoundary?: boolean;
}

/**
 * `mkTruncate` — shorten text to `length` characters and append an ellipsis.
 * The ellipsis counts toward the limit, so the output never exceeds
 * `length` characters; counting is grapheme-aware (emoji and accented
 * letters are one character). Text that already fits is returned as-is.
 * Pure: `null` and `undefined` render as `''`.
 *
 * ```html
 * {{ post.body | mkTruncate:80 }}                          <!-- hard cut at 80 -->
 * {{ post.body | mkTruncate:80:{ wordBoundary: true } }}   <!-- cut at the last space -->
 * {{ hash | mkTruncate:12:{ ellipsis: '...' } }}
 * ```
 */
@Pipe({ name: 'mkTruncate', pure: true })
export class MkTruncatePipe implements PipeTransform {
  /**
   * @param value Text to shorten.
   * @param length Maximum characters in the output, ellipsis included. Default `50`.
   * @param options Ellipsis string and word-boundary mode.
   */
  transform(
    value: string | null | undefined,
    length = 50,
    options: MkTruncateOptions = {},
  ): string {
    if (value === null || value === undefined) return '';
    const text = String(value);
    const limit = Math.max(0, Math.floor(length) || 0);
    const chars = graphemes(text);
    if (chars.length <= limit) return text;
    const ellipsis = options.ellipsis ?? '…';
    const budget = Math.max(0, limit - graphemes(ellipsis).length);
    let cut = chars.slice(0, budget).join('');
    if (options.wordBoundary) {
      // Only back up to a boundary when the cut lands inside a word.
      const next = chars[budget] ?? '';
      if (next && !/\s/.test(next)) {
        const at = cut.search(/\s+\S*$/);
        if (at > 0) cut = cut.slice(0, at);
      }
    }
    return cut.replace(/\s+$/, '') + ellipsis;
  }
}

/** Split into user-perceived characters (code points as a fallback). */
function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter().segment(text)].map((s) => s.segment);
  }
  return Array.from(text);
}
