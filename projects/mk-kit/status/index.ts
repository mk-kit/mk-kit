/**
 * @mk-kit/ui/status — the small status indicators every other group leans on:
 * spinner, badge (+ overlay) and empty state. They lived in `@mk-kit/ui/data`
 * until 0.53; that entry still re-exports them, but `feedback` imports them
 * from here so a dialog or toast service no longer drags the whole data group
 * (charts, viewers, kanban → dnd) into an app's initial bundle.
 */
export * from './spinner';
export * from './badge';
export * from './empty-state';
