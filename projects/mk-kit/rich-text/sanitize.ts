/**
 * Allow-list sanitiser for inline rich-text HTML — the security backbone of
 * both `<mk-rich-text>` and the block editor's text blocks.
 *
 * SECURITY MODEL: rich-text surfaces store HTML authored through the editor's
 * restricted formatting commands. Before that markup is emitted, persisted or
 * re-rendered it is passed through {@link sanitizeInlineHtml}, an allow-list
 * cleaner that strips scripts, event handlers and dangerous URLs. Angular's
 * `DomSanitizer` re-sanitises at display time where applicable. This module is
 * dependency-free so it can run on a server (SSG/SSR) — never feed its output
 * back into `innerHTML` without sanitising again.
 */

const ALLOWED_INLINE_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'code', 'a', 'br', 'span', 'mark', 'sub', 'sup',
]);

/** Escapes a value for safe placement in a double-quoted attribute. */
function escapeAttr(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** True for URL schemes safe to place in `href`/`src`. */
function isSafeUrl(url: string): boolean {
  const trimmed = String(url ?? '').trim();
  if (trimmed === '') return false;
  // Allow relative, http(s), mailto, tel and data:image.
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return true;
  if (/^data:image\//i.test(trimmed)) return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false; // any other scheme
  return true; // relative / anchor / protocol-relative-ish
}

/**
 * Allow-list cleaner for inline rich text. Keeps a small set of formatting
 * tags, strips everything else's tags (preserving their text), removes event
 * handler attributes and unsafe `href`s. Not a substitute for `DomSanitizer`,
 * but makes the serialised string safe by construction.
 */
export function sanitizeInlineHtml(html: string): string {
  if (!html) return '';
  let out = String(html);
  // Drop script/style blocks entirely.
  out = out.replace(/<\s*(script|style)[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  // Rewrite each tag: keep allow-listed ones with a scrubbed attribute set.
  out = out.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, (tag) => {
    const closing = /^<\s*\//.test(tag);
    const name = (tag.match(/^<\s*\/?\s*([a-z0-9]+)/i)?.[1] ?? '').toLowerCase();
    if (!ALLOWED_INLINE_TAGS.has(name)) return '';
    if (closing) return `</${name}>`;
    if (name === 'a') {
      const href = tag.match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const url = href?.[1] ?? href?.[2] ?? '';
      if (url && isSafeUrl(url)) {
        return `<a href="${escapeAttr(url)}" rel="noopener noreferrer nofollow" target="_blank">`;
      }
      return '<a>';
    }
    return `<${name}>`;
  });
  return out;
}
