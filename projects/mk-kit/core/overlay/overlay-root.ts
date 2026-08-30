import { DOCUMENT, InjectionToken, inject } from '@angular/core';

/**
 * Resolves the element overlay surfaces are appended to. A function (not an
 * element) because the root may be created lazily, after DI is set up.
 */
export type MkOverlayRootFn = () => HTMLElement;

/**
 * Where mk-kit mounts everything that leaves the component tree: overlay
 * containers (dialogs), anchored panels (selects, menus, tooltips), toast /
 * snackbar containers and the tour surfaces. Defaults to `document.body`.
 *
 * Override it to confine those surfaces to another element — `@mk-kit/ui/embed`
 * points it at a themed shadow-DOM host so overlays opened by embedded custom
 * elements stay isolated from the host page's stylesheet:
 *
 * ```ts
 * { provide: MK_OVERLAY_ROOT, useValue: () => myOverlayHost }
 * ```
 */
export const MK_OVERLAY_ROOT = new InjectionToken<MkOverlayRootFn>('MK_OVERLAY_ROOT', {
  providedIn: 'root',
  factory: () => {
    const doc = inject(DOCUMENT);
    return () => doc.body;
  },
});

/**
 * The direct child of `document.body` an overlay-root descendant lives under,
 * crossing shadow boundaries on the way up — `null` when the node is not under
 * `body` at all. The overlay service uses it to keep the overlay's own host
 * out of the elements it makes `inert` behind a modal.
 */
export function mkBodyLevelAncestor(node: Node, body: HTMLElement): Element | null {
  let current: Node = node;
  for (;;) {
    const root = current.getRootNode();
    if (root instanceof ShadowRoot) {
      current = root.host;
      continue;
    }
    let el: Node = current;
    while (el.parentNode && el.parentNode !== body) el = el.parentNode;
    return el.parentNode === body ? (el as Element) : null;
  }
}
