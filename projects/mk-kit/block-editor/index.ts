/**
 * BLOCK EDITOR group barrel for @mkornas/ui.
 *
 * Public surface for the Gutenberg-style block content editor and its
 * read-only renderer. Built-in block edit components stay internal — consumers
 * interact through the editor, the registry and the serializers.
 */

// Editor + renderer components
export {
  MkBlockEditor,
  type MkBlockValueFormat,
} from './block-editor';
export { MkBlockRenderer } from './block-renderer';

// Document model
export {
  type MkBlock,
  type MkBlockDocument,
  MK_BLOCK_DOCUMENT_VERSION,
  mkEmptyDocument,
  mkBlockId,
  mkCloneBlock,
} from './block-model';

// Registry / config (extensibility layer)
export {
  type MkBlockDefinition,
  type MkBlockUploadHandler,
  type MkEmbedProvider,
  MK_DEFAULT_BLOCKS,
  MK_DEFAULT_EMBED_PROVIDERS,
  MK_BLOCK_DEFINITIONS,
  MK_BLOCK_UPLOAD_HANDLER,
  MK_BLOCK_EMBED_PROVIDERS,
  mkMergeBlockDefinitions,
} from './block-registry';

// Serializers + HTML parser (round-trip: MkBlockDocument ⇄ HTML)
export {
  mkBlocksToHtml,
  mkBlocksToText,
  mkEscapeHtml,
  mkEscapeAttr,
  mkIsSafeUrl,
  sanitizeInlineHtml,
} from './block-serializer';
export { mkHtmlToBlocks } from './block-parser';
