/**
 * Dependency-free markdown parsing and rendering for `<mk-markdown>` — a small
 * hand-written CommonMark subset aimed at admin-app content (changelogs, AI
 * output, user notes). {@link mkParseMarkdown} produces a typed AST and
 * {@link mkRenderMarkdown} serialises it to an HTML string that is safe by
 * construction: every character of source text is HTML-escaped and the only
 * tags in the output are the ones the renderer itself generates.
 *
 * SUPPORTED SYNTAX
 * - ATX headings `#` … `######` (optional closing hashes are stripped)
 * - Paragraphs; hard line breaks via two trailing spaces
 * - Emphasis: bold `**x**`, italic `*x*` / `_x_` (word-bounded for `_`),
 *   strikethrough `~~x~~`, and `***x***` for bold-italic
 * - Inline code `` `x` `` (multi-backtick fences for literal backticks)
 * - Links `[text](url)` — http/https/mailto/relative URLs only; anything else
 *   (`javascript:` etc.) has its href dropped and renders as plain text
 * - Images `![alt](src)` — same URL policy; unsafe sources render as alt text
 * - Fenced code blocks ``` with an optional language (highlighted through
 *   `mkHighlight` for its known languages, plain escaped code otherwise)
 * - Tight unordered (`-`, `*`, `+`) and ordered (`1.`, `1)`) lists, nested by
 *   2-space indent; a blank line ends the list (loose lists unsupported)
 * - Blockquotes `>` (nestable; no lazy continuation)
 * - Horizontal rules (`---`, `***`, `___`)
 * - GitHub pipe tables with `:---:` alignment colons and `\|` cell escapes
 * - Backslash escapes for ASCII punctuation (`\*`, `\|`, …)
 * - Bare `http(s)://` URLs autolink only when the `autolink` option is on
 *
 * NOT SUPPORTED (by design)
 * - Raw inline HTML — always escaped and shown as text. This is the whole
 *   sanitisation story: with no HTML passthrough there is no XSS surface.
 * - Footnotes, setext headings (`===` / `---` underlines — a `---` line is
 *   always a horizontal rule here), reference-style links, loose lists.
 */
import { mkHighlight } from '@mk-kit/ui/core';

/** Column alignment of a table, from the delimiter row's colons. */
export type MkMarkdownAlign = 'left' | 'center' | 'right' | null;

/** Inline (phrasing) node of the markdown AST. */
export type MkMarkdownInline =
  | { kind: 'text'; text: string }
  | { kind: 'softbreak' }
  | { kind: 'break' }
  | { kind: 'code'; code: string }
  | { kind: 'strong'; children: MkMarkdownInline[] }
  | { kind: 'em'; children: MkMarkdownInline[] }
  | { kind: 'del'; children: MkMarkdownInline[] }
  | { kind: 'link'; href: string; children: MkMarkdownInline[] }
  | { kind: 'image'; src: string; alt: string };

/** One `<li>`: tight inline content plus an optional nested list. */
export interface MkMarkdownListItem {
  children: MkMarkdownInline[];
  sublist: MkMarkdownList | null;
}

/** An ordered or unordered (tight) list block. */
export interface MkMarkdownList {
  kind: 'list';
  ordered: boolean;
  /** First ordinal of an ordered list (`3.` starts at 3). Always 1 for bullets. */
  start: number;
  items: MkMarkdownListItem[];
}

/** Block-level node of the markdown AST. */
export type MkMarkdownBlock =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: MkMarkdownInline[] }
  | { kind: 'paragraph'; children: MkMarkdownInline[] }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'blockquote'; children: MkMarkdownBlock[] }
  | { kind: 'hr' }
  | MkMarkdownList
  | {
      kind: 'table';
      align: MkMarkdownAlign[];
      header: MkMarkdownInline[][];
      rows: MkMarkdownInline[][][];
    };

export interface MkMarkdownParseOptions {
  /** Turn bare `http(s)://…` URLs into links. Off by default. */
  autolink?: boolean;
}

export interface MkMarkdownRenderOptions {
  /** `'_blank'` renders `target="_blank" rel="noopener noreferrer"` on links. */
  linkTarget?: '' | '_blank';
}

/* ------------------------------------------------------------------ *
 *  Escaping & URL safety
 * ------------------------------------------------------------------ */

/** Escape text for safe placement in HTML content or a quoted attribute. */
function escapeHtml(src: string): string {
  return src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * True for URLs safe in `href`/`src`: http(s), mailto and relative paths /
 * anchors (same policy as rich-text's sanitiser, minus tel/data). Any other
 * scheme — `javascript:`, `data:`, `vbscript:`, … — is rejected.
 */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === '') return false;
  if (/^(https?:|mailto:)/i.test(trimmed)) return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false; // any other scheme
  return true; // relative path, anchor, query
}

/* ------------------------------------------------------------------ *
 *  Inline parsing
 * ------------------------------------------------------------------ */

/** Backslash escapes: any ASCII punctuation character. */
const ESCAPE_RE = /^\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/;
/** Inline code span: N backticks, content, N backticks (not followed by `). */
const CODE_SPAN_RE = /^(`+)([\s\S]+?)\1(?!`)/;
/** URL part of a link/image: bare of whitespace, one balanced-paren level. */
const URL_PART = String.raw`((?:[^()\s]|\([^()\s]*\))*)`;
/** Image: `![alt](src "ignored title")`. */
const IMAGE_RE = new RegExp(String.raw`^!\[([^\]]*)\]\(\s*${URL_PART}(?:\s+[^)]*)?\s*\)`);
/** Link: `[label](url "ignored title")` — label may hold one `[…]` level. */
const LINK_RE = new RegExp(
  String.raw`^\[((?:[^[\]\\]|\\[\s\S]|\[[^\]]*\])*)\]\(\s*${URL_PART}(?:\s+[^)]*)?\s*\)`,
);
const STRONG_EM_RE = /^\*\*\*(?!\s)([\s\S]+?(?<=\S))\*\*\*(?!\*)/;
const STRONG_RE = /^\*\*(?!\s)([\s\S]+?(?<=\S))\*\*(?!\*)/;
const EM_STAR_RE = /^\*(?![\s*])([\s\S]+?(?<=[^\s*]))\*(?!\*)/;
const EM_UNDERSCORE_RE = /^_(?!\s)([\s\S]+?(?<=\S))_(?![0-9A-Za-z_])/;
const DEL_RE = /^~~(?!\s)([\s\S]+?(?<=\S))~~/;
const AUTOLINK_RE = /^https?:\/\/[^\s<>]+/i;

/** Parse a run of inline markdown into AST nodes. */
function parseInlines(src: string, autolink: boolean): MkMarkdownInline[] {
  const out: MkMarkdownInline[] = [];
  let text = '';
  const flush = (): void => {
    if (text !== '') {
      out.push({ kind: 'text', text });
      text = '';
    }
  };

  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    const ch = rest[0];
    let m: RegExpMatchArray | null;

    // Line breaks (paragraph lines are joined with '\n'; two or more trailing
    // spaces before the newline mark a hard break).
    if ((m = rest.match(/^[ \t]*\n/))) {
      flush();
      out.push(/ {2,}\n$/.test(m[0]) ? { kind: 'break' } : { kind: 'softbreak' });
      i += m[0].length;
      continue;
    }

    if (ch === '\\' && (m = rest.match(ESCAPE_RE))) {
      text += m[1];
      i += m[0].length;
      continue;
    }

    if (ch === '`' && (m = rest.match(CODE_SPAN_RE))) {
      let code = m[2].replace(/\n/g, ' ');
      // CommonMark: strip one space from both ends when both exist
      // (enables `` ` `` for a literal backtick).
      if (code.length > 2 && code.startsWith(' ') && code.endsWith(' ') && code.trim() !== '') {
        code = code.slice(1, -1);
      }
      flush();
      out.push({ kind: 'code', code });
      i += m[0].length;
      continue;
    }

    if (ch === '!' && (m = rest.match(IMAGE_RE))) {
      flush();
      if (isSafeUrl(m[2])) {
        out.push({ kind: 'image', src: m[2].trim(), alt: m[1] });
      } else if (m[1] !== '') {
        out.push({ kind: 'text', text: m[1] }); // unsafe source → alt text
      }
      i += m[0].length;
      continue;
    }

    if (ch === '[' && (m = rest.match(LINK_RE))) {
      flush();
      const children = parseInlines(m[1], autolink);
      if (isSafeUrl(m[2])) {
        out.push({ kind: 'link', href: m[2].trim(), children });
      } else {
        out.push(...children); // unsafe URL → href dropped, text kept
      }
      i += m[0].length;
      continue;
    }

    if (ch === '*') {
      if ((m = rest.match(STRONG_EM_RE))) {
        flush();
        out.push({
          kind: 'strong',
          children: [{ kind: 'em', children: parseInlines(m[1], autolink) }],
        });
        i += m[0].length;
        continue;
      }
      if ((m = rest.match(STRONG_RE))) {
        flush();
        out.push({ kind: 'strong', children: parseInlines(m[1], autolink) });
        i += m[0].length;
        continue;
      }
      if ((m = rest.match(EM_STAR_RE))) {
        flush();
        out.push({ kind: 'em', children: parseInlines(m[1], autolink) });
        i += m[0].length;
        continue;
      }
    }

    // `_` emphasis only at a word boundary (no intra-word `snake_case`).
    if (ch === '_' && (i === 0 || !/[0-9A-Za-z_]/.test(src[i - 1])) && (m = rest.match(EM_UNDERSCORE_RE))) {
      flush();
      out.push({ kind: 'em', children: parseInlines(m[1], autolink) });
      i += m[0].length;
      continue;
    }

    if (ch === '~' && (m = rest.match(DEL_RE))) {
      flush();
      out.push({ kind: 'del', children: parseInlines(m[1], autolink) });
      i += m[0].length;
      continue;
    }

    if (autolink && (ch === 'h' || ch === 'H') && (i === 0 || /[\s([]/.test(src[i - 1])) && (m = rest.match(AUTOLINK_RE))) {
      // Trim trailing punctuation that usually belongs to the sentence.
      const url = m[0].replace(/[.,;:!?'")\]]+$/, '');
      if (url.length > 'https://'.length) {
        flush();
        out.push({ kind: 'link', href: url, children: [{ kind: 'text', text: url }] });
        i += url.length;
        continue;
      }
    }

    text += ch;
    i += 1;
  }
  flush();
  return out;
}

/* ------------------------------------------------------------------ *
 *  Block parsing
 * ------------------------------------------------------------------ */

const FENCE_OPEN_RE = /^ {0,3}(`{3,})[ \t]*(\S*)[^`]*$/;
const HEADING_RE = /^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/;
const HR_RE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE_RE = /^ {0,3}>/;
const BULLET_ITEM_RE = /^([ \t]*)([-*+])[ \t]+(.*)$/;
const ORDERED_ITEM_RE = /^([ \t]*)(\d{1,9})[.)][ \t]+(.*)$/;
const TABLE_DELIM_RE = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;

function isBlank(line: string): boolean {
  return line.trim() === '';
}

/** True when `line` starts a construct that interrupts a paragraph. */
function interruptsParagraph(line: string, next: string | undefined): boolean {
  return (
    isBlank(line) ||
    FENCE_OPEN_RE.test(line) ||
    HEADING_RE.test(line) ||
    HR_RE.test(line) ||
    QUOTE_RE.test(line) ||
    BULLET_ITEM_RE.test(line) ||
    ORDERED_ITEM_RE.test(line) ||
    isTableStart(line, next)
  );
}

/** True when `line` + `next` open a pipe table (header row + delimiter row). */
function isTableStart(line: string, next: string | undefined): boolean {
  if (next === undefined || !line.includes('|') || !TABLE_DELIM_RE.test(next)) return false;
  if (!next.includes('|')) return false; // require at least one pipe in the delimiter
  return splitTableRow(line).length === splitTableRow(next).length;
}

/** Split a pipe-table row into raw cell strings, honouring `\|` escapes. */
function splitTableRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  // Strip a trailing unescaped pipe.
  if (/(?<!\\)\|$/.test(row)) row = row.slice(0, -1);
  const cells: string[] = [];
  let cell = '';
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '\\' && i + 1 < row.length) {
      cell += ch + row[i + 1];
      i++;
    } else if (ch === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseAlign(cell: string): MkMarkdownAlign {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  if (left) return 'left';
  return null;
}

/** Parse consecutive list lines starting at `lines[start]` into a (nested) list. */
function parseList(
  lines: string[],
  start: number,
  autolink: boolean,
): { list: MkMarkdownList; next: number } {
  const stack: MkMarkdownList[] = [];
  let i = start;
  while (i < lines.length) {
    const m = lines[i].match(BULLET_ITEM_RE) ?? lines[i].match(ORDERED_ITEM_RE);
    if (!m) break;
    const ordered = /\d/.test(m[2]);
    const indent = m[1].replace(/\t/g, '  ').length;
    let depth = Math.min(Math.floor(indent / 2), stack.length);
    if (stack.length === 0) depth = 0;

    if (depth === stack.length && depth > 0) {
      // One level deeper: open a sublist on the previous item.
      const parent = stack[depth - 1];
      const lastItem = parent.items[parent.items.length - 1];
      const sublist: MkMarkdownList = {
        kind: 'list',
        ordered,
        start: ordered ? Number(m[2]) : 1,
        items: [],
      };
      lastItem.sublist = sublist;
      stack.push(sublist);
    } else {
      while (stack.length - 1 > depth) stack.pop();
      if (stack.length === 0) {
        stack.push({ kind: 'list', ordered, start: ordered ? Number(m[2]) : 1, items: [] });
      }
    }
    stack[stack.length - 1].items.push({
      children: parseInlines(m[3].replace(/[ \t]+$/, ''), autolink),
      sublist: null,
    });
    i++;
  }
  return { list: stack[0], next: i };
}

/** Parse an array of source lines into blocks (recursive for blockquotes). */
function parseBlockLines(lines: string[], autolink: boolean): MkMarkdownBlock[] {
  const blocks: MkMarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i++;
      continue;
    }

    // Fenced code block.
    let m = line.match(FENCE_OPEN_RE);
    if (m) {
      const fence = m[1];
      const language = (m[2].match(/^[A-Za-z0-9#+.-]*/)?.[0] ?? '').toLowerCase();
      const body: string[] = [];
      i++;
      while (i < lines.length) {
        const closing = lines[i].match(/^ {0,3}(`{3,})[ \t]*$/);
        if (closing && closing[1].length >= fence.length) {
          i++;
          break;
        }
        body.push(lines[i]);
        i++;
      }
      blocks.push({ kind: 'code', language, code: body.join('\n') });
      continue;
    }

    // Horizontal rule (before list: `- - -` is an hr, `- x` a list).
    if (HR_RE.test(line)) {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }

    // ATX heading.
    m = line.match(HEADING_RE);
    if (m) {
      const content = (m[2] ?? '').replace(/[ \t]+#+[ \t]*$/, '').trim();
      blocks.push({
        kind: 'heading',
        level: m[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        children: parseInlines(content, autolink),
      });
      i++;
      continue;
    }

    // Blockquote: consecutive `>` lines, one marker level stripped, recursed.
    if (QUOTE_RE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        inner.push(lines[i].replace(/^ {0,3}> ?/, ''));
        i++;
      }
      blocks.push({ kind: 'blockquote', children: parseBlockLines(inner, autolink) });
      continue;
    }

    // List (tight; ends at the first non-item line).
    if (BULLET_ITEM_RE.test(line) || ORDERED_ITEM_RE.test(line)) {
      const { list, next } = parseList(lines, i, autolink);
      blocks.push(list);
      i = next;
      continue;
    }

    // Pipe table.
    if (isTableStart(line, lines[i + 1])) {
      const header = splitTableRow(line).map((c) => parseInlines(c, autolink));
      const align = splitTableRow(lines[i + 1]).map(parseAlign);
      const rows: MkMarkdownInline[][][] = [];
      i += 2;
      while (i < lines.length && !isBlank(lines[i]) && lines[i].includes('|')) {
        const cells = splitTableRow(lines[i]);
        rows.push(
          header.map((_, col) => parseInlines(cells[col] ?? '', autolink)),
        );
        i++;
      }
      blocks.push({ kind: 'table', align, header, rows });
      continue;
    }

    // Paragraph: gather until a blank line or another block construct.
    const para: string[] = [line];
    i++;
    while (i < lines.length && !interruptsParagraph(lines[i], lines[i + 1])) {
      para.push(lines[i]);
      i++;
    }
    const content = para.map((l) => l.replace(/^[ \t]+/, '')).join('\n').replace(/[ \t]+$/, '');
    blocks.push({ kind: 'paragraph', children: parseInlines(content, autolink) });
  }

  return blocks;
}

/**
 * Parse markdown source into a typed AST. Pure and dependency-free — safe to
 * run on a server. Unsafe link/image URLs are already dropped at this stage,
 * so the AST never carries a `javascript:` (or other non-allow-listed) URL.
 */
export function mkParseMarkdown(
  src: string,
  options: MkMarkdownParseOptions = {},
): MkMarkdownBlock[] {
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').split('\n');
  return parseBlockLines(lines, options.autolink ?? false);
}

/* ------------------------------------------------------------------ *
 *  Rendering
 * ------------------------------------------------------------------ */

const ALIGN_CLASS: Record<'left' | 'center' | 'right', string> = {
  left: '', // left is the document default — no class needed
  center: ' class="mk-markdown--center"',
  right: ' class="mk-markdown--right"',
};

function renderInlines(nodes: MkMarkdownInline[], options: MkMarkdownRenderOptions): string {
  let out = '';
  for (const node of nodes) {
    switch (node.kind) {
      case 'text':
        out += escapeHtml(node.text);
        break;
      case 'softbreak':
        out += '\n';
        break;
      case 'break':
        out += '<br>';
        break;
      case 'code':
        out += `<code>${escapeHtml(node.code)}</code>`;
        break;
      case 'strong':
        out += `<strong>${renderInlines(node.children, options)}</strong>`;
        break;
      case 'em':
        out += `<em>${renderInlines(node.children, options)}</em>`;
        break;
      case 'del':
        out += `<del>${renderInlines(node.children, options)}</del>`;
        break;
      case 'link': {
        const target =
          options.linkTarget === '_blank'
            ? ' target="_blank" rel="noopener noreferrer"'
            : '';
        out += `<a href="${escapeHtml(node.href)}"${target}>${renderInlines(node.children, options)}</a>`;
        break;
      }
      case 'image':
        out += `<img src="${escapeHtml(node.src)}" alt="${escapeHtml(node.alt)}">`;
        break;
    }
  }
  return out;
}

function renderList(list: MkMarkdownList, options: MkMarkdownRenderOptions): string {
  const tag = list.ordered ? 'ol' : 'ul';
  const start = list.ordered && list.start !== 1 ? ` start="${list.start}"` : '';
  const items = list.items
    .map((item) => {
      const sub = item.sublist ? renderList(item.sublist, options) : '';
      return `<li>${renderInlines(item.children, options)}${sub}</li>`;
    })
    .join('');
  return `<${tag}${start}>${items}</${tag}>`;
}

/**
 * Render a parsed AST to an HTML string. The output contains only tags this
 * renderer generates (all source text is escaped), so it is safe to bind to
 * `[innerHTML]` — Angular's sanitizer keeps every element/attribute used here.
 * Fenced code is highlighted via `mkHighlight` for its known languages.
 */
export function mkRenderMarkdown(
  blocks: MkMarkdownBlock[],
  options: MkMarkdownRenderOptions = {},
): string {
  let out = '';
  for (const block of blocks) {
    switch (block.kind) {
      case 'heading':
        out += `<h${block.level}>${renderInlines(block.children, options)}</h${block.level}>`;
        break;
      case 'paragraph':
        out += `<p>${renderInlines(block.children, options)}</p>`;
        break;
      case 'code': {
        const lang = block.language
          ? ` class="language-${escapeHtml(block.language)}"`
          : '';
        out += `<pre class="mk-markdown__code"><code${lang}>${mkHighlight(block.code, block.language)}</code></pre>`;
        break;
      }
      case 'blockquote':
        out += `<blockquote>${mkRenderMarkdown(block.children, options)}</blockquote>`;
        break;
      case 'hr':
        out += '<hr>';
        break;
      case 'list':
        out += renderList(block, options);
        break;
      case 'table': {
        const alignAttr = (col: number): string => {
          const align = block.align[col];
          return align ? ALIGN_CLASS[align] : '';
        };
        const head = block.header
          .map((cell, c) => `<th${alignAttr(c)}>${renderInlines(cell, options)}</th>`)
          .join('');
        const body = block.rows
          .map(
            (row) =>
              `<tr>${row
                .map((cell, c) => `<td${alignAttr(c)}>${renderInlines(cell, options)}</td>`)
                .join('')}</tr>`,
          )
          .join('');
        out += `<table><thead><tr>${head}</tr></thead>${body ? `<tbody>${body}</tbody>` : ''}</table>`;
        break;
      }
    }
  }
  return out;
}
