/**
 * FORM COMPONENTS group barrel for @mkornas/ui.
 * Re-exports every public component and type in the form group.
 */
export * from './form-field';
export * from './form-error-summary';
export * from './input';
export * from './input-group';
export * from './submit-input';
export * from './i18n-input';
export * from './select';
export * from './autocomplete';
export * from './mention';
export * from './multi-select';
export * from './tag-input';
export * from './password-input';
export * from './transfer-list';
export * from './repeater';
export * from './tree-select';
export * from './file-upload';
export * from './code-editor';
export * from './rating';
export * from './number-input';
export * from './numeric-keypad';
export * from './on-screen-keyboard';
export * from './otp';
export * from './phone-input';
export * from './postal-code-input';
export * from './currency-input';
export * from './card-number-input';
export * from './iban-input';
export * from './tax-id-input';
export * from './signature-pad';
export * from './button-toggle';
// Checkbox moved to its own entry (`@mkornas/ui/checkbox`) so non-forms
// consumers (mk-table row selection) don't drag the whole forms group;
// re-exported here for backward compatibility.
export * from '@mkornas/ui/checkbox';
export * from './radio';
export * from './switch';
export * from './slider';
export * from './color-picker';
export * from './range-slider';
// Shared JSON/code highlighter — moved to core; re-exported for compat.
export { mkHighlight } from '@mkornas/ui/core';
