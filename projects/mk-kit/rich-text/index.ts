/**
 * RICH TEXT entry for @mk-kit/ui.
 *
 * A small WYSIWYG form control (`<mk-rich-text>`) over a sanitised HTML
 * string, plus the low-level contenteditable engine and the allow-list
 * sanitiser it is built on. The block editor composes the same engine for its
 * paragraph, heading, quote and list blocks.
 *
 * NOTE: this barrel deliberately does not export an HTML-escape helper — the
 * block-editor entry exports `mkEscapeHtml` and the root umbrella re-exports
 * both entries.
 */
export { MkRichText } from './rich-text';
export { MkRichTextEngine, type MkRichTextSplit } from './rich-text-engine';
export { sanitizeInlineHtml } from './sanitize';
