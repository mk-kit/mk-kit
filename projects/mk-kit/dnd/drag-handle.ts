import { Directive, ElementRef, inject } from '@angular/core';

/** Elements that take keyboard focus natively (no `tabindex` needed). */
const NATIVELY_FOCUSABLE = /^(BUTTON|INPUT|SELECT|TEXTAREA)$/;

/**
 * Optional grip that restricts where a pointer drag of the enclosing
 * `[mkDrag]` may begin. Place it on the element the user should press to drag;
 * without any handle the whole item is draggable.
 *
 * A directive (not a component), so it composes onto anything — a `<span>`,
 * a `<button>`, or another component's host such as `<mk-icon mkDragHandle />`.
 * Its look (grab cursor, muted colour, `touch-action: none`) ships as the
 * global `.mk-drag-handle` class in the theme stylesheet.
 *
 * **Decorative grip** — a non-focusable element (`<span>`, `<mk-icon>`): the
 * item itself stays the keyboard target (`role="button"`, focusable), so the
 * grip should be `aria-hidden`:
 *
 * ```html
 * <div mkDrag [mkDragData]="row">
 *   <span mkDragHandle aria-hidden="true">⠿</span>
 *   {{ row.name }}
 * </div>
 * ```
 *
 * **Focusable grip** — a `<button>` (or any element with `tabindex`): the
 * handle becomes the keyboard target instead. The item is then a plain
 * container (no role, not focusable), so rows may hold inputs, links and
 * other buttons without nesting interactive controls, and `<li>` items keep
 * valid list semantics. Give it an accessible name:
 *
 * ```html
 * <li mkDrag [mkDragData]="row">
 *   <button type="button" mkDragHandle [attr.aria-label]="'Reorder ' + row.name">⠿</button>
 *   <input mkInput [(ngModel)]="row.name" />
 * </li>
 * ```
 */
@Directive({
  selector: '[mkDragHandle]',
  exportAs: 'mkDragHandle',
  host: {
    class: 'mk-drag-handle',
  },
})
export class MkDragHandle {
  /** The handle's host element. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * Whether the handle can take keyboard focus itself — a native control
   * (`<button>`, …), a link with `href`, or any element with a `tabindex`.
   * A focusable handle carries the keyboard drag for its `[mkDrag]`.
   */
  isFocusable(): boolean {
    const el = this.element;
    return (
      NATIVELY_FOCUSABLE.test(el.tagName) ||
      (el.tagName === 'A' && el.hasAttribute('href')) ||
      el.hasAttribute('tabindex')
    );
  }
}
