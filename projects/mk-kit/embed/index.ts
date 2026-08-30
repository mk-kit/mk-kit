/**
 * @mk-kit/ui/embed — ship mk-kit-based components as standalone custom
 * elements: shadow-DOM isolation from the host page's stylesheet, `--mk-*`
 * theming that still crosses the boundary, one lazily created zoneless
 * application shared by every element, and overlays (dialogs, selects,
 * toasts) confined to a themed shadow host of their own.
 */
export * from './shadow-css';
export * from './embed';
