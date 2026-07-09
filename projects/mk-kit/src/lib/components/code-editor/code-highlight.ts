/**
 * Dependency-free syntax highlighting for {@link MkCodeEditor}. Each function
 * takes source text and returns an HTML string of `<span class="mk-tok-…">`
 * tokens. Input is HTML-escaped first, so the result is safe to render.
 */

/** Escape the three characters that could break out of HTML text content. */
export function mkEscapeHtml(src: string): string {
  return src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Highlight a JSON document. Recognises object keys, strings, numbers, the
 * `true`/`false`/`null` literals and structural punctuation. Invalid JSON is
 * still highlighted token-by-token (the editor validates separately).
 */
export function mkHighlightJson(src: string): string {
  const esc = mkEscapeHtml(src);
  return esc.replace(
    // 1: string (+ optional following colon → key) · 2: colon
    // 3: keyword · 4: number · 5: punctuation
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],:])/g,
    (match, str, colon, keyword, num, punc) => {
      if (str !== undefined) {
        if (colon !== undefined) {
          return `<span class="mk-tok-key">${str}</span><span class="mk-tok-punc">${colon}</span>`;
        }
        return `<span class="mk-tok-str">${str}</span>`;
      }
      if (keyword !== undefined) return `<span class="mk-tok-kw">${keyword}</span>`;
      if (num !== undefined) return `<span class="mk-tok-num">${num}</span>`;
      if (punc !== undefined) return `<span class="mk-tok-punc">${punc}</span>`;
      return match;
    },
  );
}

/** Highlight `src` for `language`, falling back to escaped plain text. */
export function mkHighlight(src: string, language: string): string {
  return language === 'json' ? mkHighlightJson(src) : mkEscapeHtml(src);
}
