import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  contentChild,
  input,
  model,
  output,
} from '@angular/core';
import { MkDrag } from './drag';
import { mkMoveItemInArray } from './drag-drop-utils';
import { MkDropList } from './drop-list';
import type { MkDropEvent, MkDropListOrientation } from './drag-drop.types';

/**
 * Thin convenience wrapper over a single `[mkDropList]` for the common
 * "reorderable list" case. Bind `items` two-way and provide an `<ng-template>`
 * to render each row; drops are applied to the model for you (via
 * {@link mkMoveItemInArray}).
 *
 * For connected buckets / kanban, use `[mkDropList]` + `[mkDrag]` directly.
 *
 * ```html
 * <mk-sortable-list [(items)]="rows">
 *   <ng-template let-row let-i="index">
 *     <span mkDragHandle aria-hidden="true">⠿</span> {{ i + 1 }}. {{ row.name }}
 *   </ng-template>
 * </mk-sortable-list>
 * ```
 *
 * @typeParam T item data type.
 */
@Component({
  selector: 'mk-sortable-list',
  templateUrl: './sortable-list.html',
  styleUrl: './sortable-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkDropList, MkDrag, NgTemplateOutlet],
})
export class MkSortableList<T = unknown> {
  /** The ordered items (two-way). Reordered in place on drop. */
  readonly items = model<T[]>([]);

  /** Layout axis of the list. */
  readonly orientation = input<MkDropListOrientation>('vertical');

  /** Disable reordering. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** `@for` tracking function. Defaults to identity (track by item). */
  readonly trackBy = input<(index: number, item: T) => unknown>(
    (_, item) => item,
  );

  /** Emitted after the model has been reordered. */
  readonly sorted = output<MkDropEvent<T>>();

  /** The row template projected as `<ng-template>`. */
  protected readonly itemTemplate = contentChild.required(TemplateRef);

  protected onDrop(event: MkDropEvent<T>): void {
    const next = [...this.items()];
    mkMoveItemInArray(next, event.previousIndex, event.currentIndex);
    this.items.set(next);
    this.sorted.emit(event);
  }
}
