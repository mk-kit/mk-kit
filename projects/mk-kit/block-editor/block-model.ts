/**
 * Block document model for the mk-kit block editor.
 *
 * The model is deliberately small and 100% JSON-serialisable so a document can
 * be persisted to a database, sent over the wire, and re-hydrated without any
 * class instances or functions. All editor state lives in these plain objects.
 */

/**
 * A single content block.
 *
 * `type` keys into the {@link MkBlockDefinition} registry that knows how to
 * edit, serialise and render it. `data` is a free-form, JSON-safe bag of the
 * block's own state (e.g. `{ html }` for a paragraph, `{ src, alt }` for an
 * image). `children` enables nested layout blocks (a Columns block stores its
 * columns' contents here).
 */
export interface MkBlock {
  /** Stable unique id (used for keying, focus and drag/move). */
  id: string;
  /** Registry type key, e.g. `paragraph`, `heading`, `columns`. */
  type: string;
  /** JSON-serialisable per-block state. */
  data: Record<string, any>;
  /** Nested blocks for layout/container blocks (e.g. columns). */
  children?: MkBlock[];
}

/** A full editor document: a version stamp plus an ordered list of blocks. */
export interface MkBlockDocument {
  /** Schema version, bumped when the persisted shape changes. */
  version: number;
  /** Top-level blocks, in document order. */
  blocks: MkBlock[];
}

/** Current document schema version. */
export const MK_BLOCK_DOCUMENT_VERSION = 1;

/** An empty, valid document. */
export function mkEmptyDocument(): MkBlockDocument {
  return { version: MK_BLOCK_DOCUMENT_VERSION, blocks: [] };
}

let blockCounter = 0;

/**
 * Generates a reasonably unique, JSON-safe block id. Combines a monotonic
 * counter with a short random suffix so ids are unique even across documents
 * merged at runtime.
 */
export function mkBlockId(prefix = 'blk'): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${++blockCounter}-${rand}`;
}

/** Deep-clones a block (and its subtree), assigning fresh ids. */
export function mkCloneBlock(block: MkBlock): MkBlock {
  return {
    id: mkBlockId(block.type),
    type: block.type,
    data: structuredCloneSafe(block.data),
    children: block.children?.map(mkCloneBlock),
  };
}

/** Structured clone with a JSON fallback for older runtimes. */
function structuredCloneSafe<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value ?? null));
  }
}
