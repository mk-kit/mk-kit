/**
 * @mk-kit/ui/kanban — the board (columns + drag-and-drop cards). Its own
 * entry since 0.53 because it is the only `data` component that needs
 * `@mk-kit/ui/dnd`; keeping it in `data` shipped dnd to every page that
 * rendered a badge.
 */
export * from './kanban';
