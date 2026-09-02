export * from './dialog';
export * from './confirm-dialog';
// The prompt dialog is reached through `MkDialogService.prompt()` only, so
// that its forms dependency stays out of apps that never prompt.
export type { MkPromptDialogData } from './prompt-dialog';
export * from './dialog.service';
