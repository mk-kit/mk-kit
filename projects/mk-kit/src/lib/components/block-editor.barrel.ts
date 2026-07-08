/**
 * BLOCK EDITOR group barrel for @mk-kit/ui.
 *
 * Public surface for the Gutenberg-style block content editor and its
 * read-only renderer. Built-in block edit components stay internal — consumers
 * interact through the editor, the registry and the serializers.
 */

// Editor + renderer components
export { MkBlockEditor } from './block-editor/block-editor';
export { MkBlockRenderer } from './block-editor/block-renderer';

// Document model
export {
  type MkBlock,
  type MkBlockDocument,
  MK_BLOCK_DOCUMENT_VERSION,
  mkEmptyDocument,
  mkBlockId,
  mkCloneBlock,
} from './block-editor/block-model';

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
} from './block-editor/block-registry';

// Serializers
export {
  mkBlocksToHtml,
  mkBlocksToText,
  mkEscapeHtml,
  mkEscapeAttr,
  mkIsSafeUrl,
  sanitizeInlineHtml,
} from './block-editor/block-serializer';
