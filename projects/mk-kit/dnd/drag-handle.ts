import { Directive, ElementRef, inject } from '@angular/core';

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
 * ```html
 * <div mkDrag [mkDragData]="row">
 *   <span mkDragHandle aria-hidden="true">⠿</span>
 *   {{ row.name }}
 * </div>
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
}
