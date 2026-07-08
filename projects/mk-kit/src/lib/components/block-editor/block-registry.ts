import { InjectionToken } from '@angular/core';
import { type MkBlock, mkBlockId } from './block-model';

/**
 * Describes one registerable block type — the extensibility layer of the
 * editor. Mirrors Gutenberg's `registerBlockType`: consumers supply an array of
 * these (via the `blocks` input or the {@link MK_BLOCK_DEFINITIONS} token) to
 * add, remove or reconfigure the palette. The built-in set is
 * {@link MK_DEFAULT_BLOCKS}.
 */
export interface MkBlockDefinition {
  /** Unique type key that {@link MkBlock.type} references. */
  type: string;
  /** Human label shown in the inserter and block toolbar. */
  label: string;
  /** Optional icon (emoji or short text glyph) shown in the inserter. */
  icon?: string;
  /** Inserter grouping heading, e.g. `Text`, `Media`, `Layout`. */
  group?: string;
  /** Short description shown in the inserter. */
  description?: string;
  /** Factory returning a fresh, ready-to-edit block of this type. */
  create(): MkBlock;
  /** May this block be placed inside a Columns column? Default `true`. */
  allowedInColumns?: boolean;
  /** Keywords to match against when filtering the inserter. */
  keywords?: string[];
  /** Block types this one can transform into (by type key). */
  transforms?: string[];
}

/** Convenience factory: builds a `create()`-ready block with fresh id. */
function block(type: string, data: Record<string, any> = {}, children?: MkBlock[]): MkBlock {
  return { id: mkBlockId(type), type, data, ...(children ? { children } : {}) };
}

/**
 * The default palette of built-in block definitions. Grouped for the inserter.
 * Consumers can spread this and append custom definitions, or replace it.
 */
export const MK_DEFAULT_BLOCKS: MkBlockDefinition[] = [
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: '¶',
    group: 'Text',
    description: 'Rich text with inline formatting.',
    keywords: ['text', 'body', 'p'],
    transforms: ['heading', 'quote', 'code'],
    create: () => block('paragraph', { html: '' }),
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: 'H',
    group: 'Text',
    description: 'A section title (H1–H4).',
    keywords: ['title', 'h1', 'h2', 'h3'],
    transforms: ['paragraph'],
    create: () => block('heading', { html: '', level: 2 }),
  },
  {
    type: 'list',
    label: 'List',
    icon: '•',
    group: 'Text',
    description: 'Bulleted or numbered list.',
    keywords: ['ul', 'ol', 'bullet', 'numbered'],
    create: () => block('list', { ordered: false, items: [''] }),
  },
  {
    type: 'quote',
    label: 'Quote',
    icon: '“',
    group: 'Text',
    description: 'A blockquote with optional citation.',
    keywords: ['blockquote', 'citation'],
    transforms: ['paragraph'],
    create: () => block('quote', { html: '', citation: '' }),
  },
  {
    type: 'code',
    label: 'Code',
    icon: '</>',
    group: 'Text',
    description: 'Preformatted, monospace code.',
    keywords: ['pre', 'snippet', 'monospace'],
    create: () => block('code', { code: '', language: '' }),
  },
  {
    type: 'image',
    label: 'Image',
    icon: '🖼',
    group: 'Media',
    description: 'Upload or link an image.',
    keywords: ['photo', 'picture', 'img', 'upload'],
    create: () => block('image', { src: '', alt: '', caption: '', align: 'center', width: 100 }),
  },
  {
    type: 'embed',
    label: 'Embed',
    icon: '▶',
    group: 'Media',
    description: 'YouTube, Vimeo or any URL.',
    keywords: ['youtube', 'vimeo', 'video', 'iframe', 'url'],
    create: () => block('embed', { url: '' }),
  },
  {
    type: 'button',
    label: 'Button',
    icon: '⬚',
    group: 'Media',
    description: 'A call-to-action link button.',
    keywords: ['cta', 'link', 'action'],
    create: () => block('button', { label: 'Click me', href: '', tone: 'primary', variant: 'solid', align: 'left' }),
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: '—',
    group: 'Layout',
    description: 'A horizontal separator.',
    keywords: ['hr', 'separator', 'rule'],
    create: () => block('divider', {}),
  },
  {
    type: 'columns',
    label: 'Columns',
    icon: '▥',
    group: 'Layout',
    description: 'A responsive multi-column layout.',
    keywords: ['grid', 'layout', 'row', 'column'],
    allowedInColumns: false,
    create: () =>
      block(
        'columns',
        { count: 2, ratio: '50-50', gap: 4, align: 'stretch', justify: 'start' },
        [block('column', {}, []), block('column', {}, [])],
      ),
  },
];

/**
 * Multi-provider injection token for adding block definitions app-wide. Each
 * provided array is merged over {@link MK_DEFAULT_BLOCKS} (by `type`). The
 * editor's `blocks` input takes final precedence.
 *
 * ```ts
 * providers: [
 *   { provide: MK_BLOCK_DEFINITIONS, multi: true, useValue: [myCalloutBlock] },
 * ]
 * ```
 */
export const MK_BLOCK_DEFINITIONS = new InjectionToken<MkBlockDefinition[][]>(
  'MK_BLOCK_DEFINITIONS',
);

/**
 * Async handler that persists an uploaded {@link File} and resolves to its URL.
 * Provide app-wide via this token, or per-editor via the `uploadHandler` input.
 * When absent, the Image block falls back to an inline `data:` URL.
 */
export type MkBlockUploadHandler = (file: File) => Promise<string>;

/** App-wide upload handler token (overridable by the editor's input). */
export const MK_BLOCK_UPLOAD_HANDLER = new InjectionToken<MkBlockUploadHandler>(
  'MK_BLOCK_UPLOAD_HANDLER',
);

/**
 * An allow-listed embed provider. `test` matches a pasted URL; `toEmbedUrl`
 * returns the safe iframe `src` (which is the ONLY value ever passed to
 * `DomSanitizer.bypassSecurityTrustResourceUrl`). Non-matching URLs fall back
 * to a plain link card — raw HTML is never injected.
 */
export interface MkEmbedProvider {
  /** Display name, e.g. `YouTube`. */
  name: string;
  /** Matches URLs this provider handles. */
  test: RegExp;
  /** Transforms a matched page URL into an embeddable iframe `src`. */
  toEmbedUrl(url: string): string | null;
  /** Aspect ratio `width / height` for the responsive frame. Default 16/9. */
  aspectRatio?: number;
  /** Allow list for the iframe `sandbox` attribute. */
  sandbox?: string;
}

/** Default embed providers: YouTube + Vimeo. */
export const MK_DEFAULT_EMBED_PROVIDERS: MkEmbedProvider[] = [
  {
    name: 'YouTube',
    test: /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
    aspectRatio: 16 / 9,
    toEmbedUrl(url: string): string | null {
      const m = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
      );
      return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
    },
  },
  {
    name: 'Vimeo',
    test: /vimeo\.com\/(?:video\/)?(\d+)/i,
    aspectRatio: 16 / 9,
    toEmbedUrl(url: string): string | null {
      const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
      return m ? `https://player.vimeo.com/video/${m[1]}` : null;
    },
  },
];

/** App-wide embed providers token (merged with the editor's input). */
export const MK_BLOCK_EMBED_PROVIDERS = new InjectionToken<MkEmbedProvider[][]>(
  'MK_BLOCK_EMBED_PROVIDERS',
);

/**
 * Merges default definitions with app-token definitions and per-editor input,
 * de-duplicating by `type` (later sources win).
 */
export function mkMergeBlockDefinitions(
  defaults: MkBlockDefinition[],
  ...sources: (MkBlockDefinition[] | null | undefined)[]
): MkBlockDefinition[] {
  const byType = new Map<string, MkBlockDefinition>();
  for (const def of defaults) byType.set(def.type, def);
  for (const source of sources) {
    if (!source) continue;
    for (const def of source) byType.set(def.type, def);
  }
  return [...byType.values()];
}
