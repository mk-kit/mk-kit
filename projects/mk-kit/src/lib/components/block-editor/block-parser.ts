/**
 * HTML → {@link MkBlockDocument} parser — the inverse of {@link mkBlocksToHtml}.
 *
 * Lets the block editor back a **string-typed richtext field** (e.g. a CMS
 * `richtext` column that stores an HTML string): seed the editor from stored
 * HTML, and serialise back to HTML on change. Best-effort and forgiving — any
 * HTML parses, with unrecognised block-level wrappers recursed into and loose
 * inline runs grouped into paragraphs. Round-trips the blocks `mkBlocksToHtml`
 * emits (paragraph, heading, list, quote, code, image, divider, button, embed,
 * columns).
 *
 * Uses the DOM (`DOMParser`) — available in browsers and jsdom. In a pure Node
 * context without a DOM it falls back to a single sanitised paragraph.
 */
import {
  MK_BLOCK_DOCUMENT_VERSION,
  type MkBlock,
  type MkBlockDocument,
  mkBlockId,
  mkEmptyDocument,
} from './block-model';
import { mkEscapeHtml, sanitizeInlineHtml } from './block-serializer';

const HEADING_LEVEL: Record<string, number> = {
  h1: 1, h2: 2, h3: 3, h4: 4, h5: 4, h6: 4,
};

/** Block-level tags handled as their own block (others recurse or group). */
const BLOCK_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre',
  'figure', 'img', 'hr', 'div', 'section', 'article', 'table',
]);

function block(type: string, data: Record<string, unknown>, children?: MkBlock[]): MkBlock {
  const b: MkBlock = { id: mkBlockId(type), type, data };
  if (children) b.children = children;
  return b;
}

function parseRoot(html: string): ParentNode | null {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(html, 'text/html').body;
  }
  if (typeof document !== 'undefined') {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    return tpl.content;
  }
  return null;
}

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

function isBlockElement(node: Node): boolean {
  return (
    node.nodeType === ELEMENT_NODE &&
    BLOCK_TAGS.has((node as Element).tagName.toLowerCase())
  );
}

/** HTML for one node in an inline run (encoded text, element markup). */
function nodeHtml(node: Node): string {
  if (node.nodeType === TEXT_NODE) return mkEscapeHtml(node.textContent ?? '');
  if (node.nodeType === ELEMENT_NODE) return (node as Element).outerHTML;
  return '';
}

function style(el: Element, prop: string): string {
  return (el as HTMLElement).style?.getPropertyValue(prop)?.trim() ?? '';
}

/** Walk a parent's children into blocks, grouping loose inline runs. */
function collectBlocks(root: ParentNode, out: MkBlock[]): void {
  let inline: Node[] = [];
  const flush = () => {
    if (!inline.length) return;
    const html = inline.map(nodeHtml).join('').trim();
    if (html) out.push(block('paragraph', { html: sanitizeInlineHtml(html) }));
    inline = [];
  };

  for (const node of Array.from(root.childNodes)) {
    if (isBlockElement(node)) {
      flush();
      appendElement(node as Element, out);
    } else if (node.nodeType === TEXT_NODE && !node.textContent?.trim()) {
      // ignore whitespace between blocks
    } else {
      inline.push(node);
    }
  }
  flush();
}

/** Map a block-level element to one or more blocks (appended to `out`). */
function appendElement(el: Element, out: MkBlock[]): void {
  const tag = el.tagName.toLowerCase();

  if (tag === 'p') {
    out.push(block('paragraph', { html: sanitizeInlineHtml(el.innerHTML) }));
    return;
  }
  if (tag in HEADING_LEVEL) {
    out.push(block('heading', {
      level: HEADING_LEVEL[tag],
      html: sanitizeInlineHtml(el.innerHTML),
    }));
    return;
  }
  if (tag === 'ul' || tag === 'ol') {
    const items = Array.from(el.querySelectorAll(':scope > li')).map((li) =>
      sanitizeInlineHtml(li.innerHTML),
    );
    out.push(block('list', { ordered: tag === 'ol', items: items.length ? items : [''] }));
    return;
  }
  if (tag === 'blockquote') {
    const cite = el.querySelector('cite');
    const p = el.querySelector('p');
    const body = p ? p.innerHTML : el.innerHTML;
    out.push(block('quote', {
      html: sanitizeInlineHtml(body),
      citation: cite?.textContent?.trim() ?? '',
    }));
    return;
  }
  if (tag === 'pre') {
    const codeEl = el.querySelector('code') ?? el;
    const lang = (codeEl.className.match(/language-([\w-]+)/) ?? [])[1] ?? '';
    out.push(block('code', { code: codeEl.textContent ?? '', language: lang }));
    return;
  }
  if (tag === 'figure' || tag === 'img') {
    const img = tag === 'img' ? (el as HTMLImageElement) : el.querySelector('img');
    if (img) {
      const width = parseInt(style(img, 'max-width'), 10);
      const align =
        style(el, 'text-align') === 'left'
          ? 'left'
          : style(el, 'text-align') === 'right'
            ? 'right'
            : 'center';
      out.push(block('image', {
        src: img.getAttribute('src') ?? '',
        alt: img.getAttribute('alt') ?? '',
        caption: el.querySelector('figcaption')?.textContent?.trim() ?? '',
        align,
        width: Number.isFinite(width) && width > 0 ? width : 100,
      }));
    }
    return;
  }
  if (tag === 'hr') {
    out.push(block('divider', {}));
    return;
  }

  // <div> / generic containers: recognise the wrappers mkBlocksToHtml emits,
  // otherwise recurse into the children.
  if (el.classList.contains('mk-columns')) {
    const columns = Array.from(el.querySelectorAll(':scope > .mk-column')).map(
      (colEl) => {
        const children: MkBlock[] = [];
        collectBlocks(colEl, children);
        return block('column', {}, children);
      },
    );
    out.push(block('columns', { count: columns.length || 2 }, columns));
    return;
  }
  const cta = el.querySelector(':scope > a.mk-cta, a.mk-cta');
  if (cta) {
    const tone = (cta.className.match(/mk-cta--([\w-]+)/) ?? [])[1] ?? 'primary';
    out.push(block('button', {
      label: cta.textContent?.trim() ?? 'Button',
      href: cta.getAttribute('href') ?? '',
      align: style(el, 'text-align') || 'left',
      tone,
    }));
    return;
  }
  if (el.classList.contains('mk-embed')) {
    const iframe = el.querySelector('iframe');
    out.push(block('embed', {
      url: '',
      embedUrl: iframe?.getAttribute('src') ?? '',
      aspectRatio: 16 / 9,
    }));
    return;
  }

  // Unknown container — recurse into its children.
  collectBlocks(el, out);
}

/**
 * Parse an HTML string into a {@link MkBlockDocument}. Empty / whitespace input
 * yields an empty document.
 */
export function mkHtmlToBlocks(html: string): MkBlockDocument {
  const source = String(html ?? '');
  if (!source.trim()) return mkEmptyDocument();

  const root = parseRoot(source);
  if (!root) {
    // No DOM (server) — degrade to a single sanitised paragraph.
    return {
      version: MK_BLOCK_DOCUMENT_VERSION,
      blocks: [block('paragraph', { html: sanitizeInlineHtml(source) })],
    };
  }

  const blocks: MkBlock[] = [];
  collectBlocks(root, blocks);
  return { version: MK_BLOCK_DOCUMENT_VERSION, blocks };
}
