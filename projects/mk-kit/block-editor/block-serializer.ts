import { sanitizeInlineHtml } from '@mk-kit/ui/rich-text';
import type { MkBlock, MkBlockDocument } from './block-model';

/**
 * Pure HTML/text serialisers for a {@link MkBlockDocument}.
 *
 * SECURITY MODEL: text blocks (`paragraph`, `heading`, `quote`, `list`) store
 * HTML authored through the editor's restricted formatting commands. Before it
 * ever reaches a string of markup here it is passed through
 * {@link sanitizeInlineHtml} (from `@mk-kit/ui/rich-text`), an allow-list
 * cleaner that strips scripts, event handlers and dangerous URLs.
 * `mk-block-renderer` additionally re-sanitises through Angular's
 * `DomSanitizer` at display time. These serialisers are dependency-free so
 * they can run on a server (SSG/SSR) — never feed their output back into
 * `innerHTML` without sanitising again.
 */

// Re-exported for backward compatibility — the implementation moved to the
// rich-text entry alongside the editing surface it protects.
export { sanitizeInlineHtml };

/** Escapes text for safe placement in element content. */
export function mkEscapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escapes a value for safe placement in a double-quoted attribute. */
export function mkEscapeAttr(value: string): string {
  return mkEscapeHtml(value).replace(/"/g, '&quot;');
}

/** True for URL schemes safe to place in `href`/`src`. */
export function mkIsSafeUrl(url: string): boolean {
  const trimmed = String(url ?? '').trim();
  if (trimmed === '') return false;
  // Allow relative, http(s), mailto, tel and data:image.
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return true;
  if (/^data:image\//i.test(trimmed)) return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false; // any other scheme
  return true; // relative / anchor / protocol-relative-ish
}

/** Maps a ratio preset like `66-33` to a CSS `grid-template-columns` value. */
export function mkRatioToColumns(ratio: string, count: number): string {
  const parts = String(ratio ?? '')
    .split('-')
    .map((n) => parseFloat(n))
    .filter((n) => !isNaN(n) && n > 0);
  if (parts.length >= 2) return parts.map((n) => `${n}fr`).join(' ');
  return `repeat(${Math.max(1, count || 1)}, 1fr)`;
}

const HEADING_LEVELS = new Set([1, 2, 3, 4]);

/** Serialises one block to a semantic HTML string. */
function blockToHtml(b: MkBlock): string {
  switch (b.type) {
    case 'paragraph':
      return `<p>${sanitizeInlineHtml(b.data['html'] ?? '')}</p>`;

    case 'heading': {
      const level = HEADING_LEVELS.has(b.data['level']) ? b.data['level'] : 2;
      return `<h${level}>${sanitizeInlineHtml(b.data['html'] ?? '')}</h${level}>`;
    }

    case 'list': {
      const ordered = !!b.data['ordered'];
      const tag = ordered ? 'ol' : 'ul';
      const items: string[] = Array.isArray(b.data['items']) ? b.data['items'] : [];
      const li = items.map((it) => `<li>${sanitizeInlineHtml(it ?? '')}</li>`).join('');
      return `<${tag}>${li}</${tag}>`;
    }

    case 'quote': {
      const cite = String(b.data['citation'] ?? '').trim();
      const citeHtml = cite ? `<cite>${mkEscapeHtml(cite)}</cite>` : '';
      return `<blockquote><p>${sanitizeInlineHtml(b.data['html'] ?? '')}</p>${citeHtml}</blockquote>`;
    }

    case 'code': {
      const code = mkEscapeHtml(b.data['code'] ?? '');
      const lang = String(b.data['language'] ?? '').trim();
      const cls = lang ? ` class="language-${mkEscapeAttr(lang)}"` : '';
      return `<pre><code${cls}>${code}</code></pre>`;
    }

    case 'image': {
      const src = String(b.data['src'] ?? '');
      if (!mkIsSafeUrl(src) || !src) return '';
      const align = String(b.data['align'] ?? 'center');
      const width = Number(b.data['width']) || 100;
      const alt = mkEscapeAttr(b.data['alt'] ?? '');
      const caption = String(b.data['caption'] ?? '').trim();
      const figStyle = `text-align:${align === 'left' ? 'left' : align === 'right' ? 'right' : 'center'};margin:1rem 0;`;
      const img = `<img src="${mkEscapeAttr(src)}" alt="${alt}" style="max-width:${Math.min(100, Math.max(10, width))}%;height:auto;border-radius:.5rem;" loading="lazy">`;
      const cap = caption ? `<figcaption style="font-size:.875rem;opacity:.75;margin-top:.5rem;">${mkEscapeHtml(caption)}</figcaption>` : '';
      return `<figure style="${figStyle}">${img}${cap}</figure>`;
    }

    case 'button': {
      const href = String(b.data['href'] ?? '');
      const label = mkEscapeHtml(b.data['label'] ?? 'Button');
      const align = String(b.data['align'] ?? 'left');
      const safe = mkIsSafeUrl(href) && href ? mkEscapeAttr(href) : '#';
      const wrapStyle = `text-align:${align};margin:1rem 0;`;
      const btnStyle =
        'display:inline-block;padding:.6rem 1.1rem;border-radius:.5rem;text-decoration:none;font-weight:600;';
      return `<div style="${wrapStyle}"><a href="${safe}" class="mk-cta mk-cta--${mkEscapeAttr(b.data['tone'] ?? 'primary')}" style="${btnStyle}" rel="noopener noreferrer">${label}</a></div>`;
    }

    case 'divider':
      return '<hr>';

    case 'embed': {
      const url = String(b.data['url'] ?? '');
      const embedUrl = String(b.data['embedUrl'] ?? '');
      const ratio = Number(b.data['aspectRatio']) || 16 / 9;
      if (embedUrl && mkIsSafeUrl(embedUrl)) {
        const pad = (100 / ratio).toFixed(3);
        return (
          `<div class="mk-embed" style="position:relative;width:100%;padding-top:${pad}%;margin:1rem 0;">` +
          `<iframe src="${mkEscapeAttr(embedUrl)}" title="Embedded content" loading="lazy" ` +
          `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" ` +
          `referrerpolicy="strict-origin-when-cross-origin" allowfullscreen ` +
          `style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:.5rem;"></iframe></div>`
        );
      }
      if (mkIsSafeUrl(url) && url) {
        return `<p class="mk-embed-fallback"><a href="${mkEscapeAttr(url)}" rel="noopener noreferrer" target="_blank">${mkEscapeHtml(url)}</a></p>`;
      }
      return '';
    }

    case 'columns': {
      const count = Number(b.data['count']) || (b.children?.length ?? 2);
      const cols = mkRatioToColumns(b.data['ratio'] ?? '', count);
      const gap = (Number(b.data['gap']) || 4) * 0.25;
      const align = String(b.data['align'] ?? 'stretch');
      const justify = String(b.data['justify'] ?? 'start');
      const justifyMap: Record<string, string> = {
        start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between',
      };
      const style =
        `display:grid;grid-template-columns:${cols};gap:${gap}rem;align-items:${align};` +
        `justify-content:${justifyMap[justify] ?? 'flex-start'};margin:1rem 0;`;
      const columns = (b.children ?? [])
        .map((col) => `<div class="mk-column">${(col.children ?? []).map(blockToHtml).join('')}</div>`)
        .join('');
      return `<div class="mk-columns" style="${style}">${columns}</div>`;
    }

    case 'column':
      return (b.children ?? []).map(blockToHtml).join('');

    default:
      return '';
  }
}

/**
 * Serialises a document to clean, semantic, self-contained HTML — the "rich
 * HTML content" you persist and publish for a blog post or content page.
 * Layout blocks become responsive grid wrappers with inline styles.
 */
export function mkBlocksToHtml(doc: MkBlockDocument | null | undefined): string {
  if (!doc?.blocks?.length) return '';
  return doc.blocks.map(blockToHtml).join('\n');
}

/** Strips all tags, collapsing a block to its text content. */
function stripTags(html: string): string {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collects the plain-text content of a block subtree. */
function blockToText(b: MkBlock): string {
  switch (b.type) {
    case 'paragraph':
    case 'heading':
    case 'quote':
      return stripTags(b.data['html'] ?? '');
    case 'list':
      return (Array.isArray(b.data['items']) ? b.data['items'] : [])
        .map((i: string) => stripTags(i))
        .filter(Boolean)
        .join(' · ');
    case 'code':
      return String(b.data['code'] ?? '').trim();
    case 'image':
      return String(b.data['caption'] ?? b.data['alt'] ?? '').trim();
    case 'button':
      return String(b.data['label'] ?? '').trim();
    case 'embed':
      return String(b.data['url'] ?? '').trim();
    case 'columns':
    case 'column':
      return (b.children ?? [])
        .map((c) => (c.type === 'column' ? blockToText(c) : blockToText(c)))
        .filter(Boolean)
        .join(' ');
    default:
      return '';
  }
}

/**
 * Serialises a document to plain text — handy for previews, excerpts, search
 * indexes and meta descriptions.
 */
export function mkBlocksToText(doc: MkBlockDocument | null | undefined): string {
  if (!doc?.blocks?.length) return '';
  return doc.blocks
    .map(blockToText)
    .filter((t) => t.length > 0)
    .join('\n\n');
}
