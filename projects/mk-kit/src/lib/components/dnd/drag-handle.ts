import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
} from '@angular/core';

/**
 * Optional grip that restricts where a pointer drag of the enclosing
 * `[mkDrag]` may begin. Place it on the element the user should press to drag;
 * without any handle the whole item is draggable.
 *
 * ```html
 * <div mkDrag [mkDragData]="row">
 *   <span mkDragHandle aria-hidden="true">⠿</span>
 *   {{ row.name }}
 * </div>
 * ```
 */
@Component({
  selector: '[mkDragHandle]',
  exportAs: 'mkDragHandle',
  template: '<ng-content />',
  styleUrl: './drag-handle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-drag-handle',
  },
})
export class MkDragHandle {
  /** The handle's host element. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}
