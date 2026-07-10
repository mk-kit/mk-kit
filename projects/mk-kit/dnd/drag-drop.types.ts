import type { MkDrag } from './drag';
import type { MkDropList } from './drop-list';

/** Layout axis a drop list lays its items along. */
export type MkDropListOrientation = 'vertical' | 'horizontal';

/**
 * Emitted by `[mkDropList]` (`mkDropListDropped`) when an item is dropped.
 *
 * Mirrors the shape of Angular CDK's `CdkDragDrop` so the exported
 * {@link mkMoveItemInArray} / {@link mkTransferArrayItem} helpers can be used
 * exactly as their CDK counterparts:
 *
 * ```ts
 * onDrop(e: MkDropEvent) {
 *   if (e.previousContainer === e.container) {
 *     mkMoveItemInArray(e.container.mkDropListData(), e.previousIndex, e.currentIndex);
 *   } else {
 *     mkTransferArrayItem(
 *       e.previousContainer.mkDropListData(),
 *       e.container.mkDropListData(),
 *       e.previousIndex, e.currentIndex,
 *     );
 *   }
 * }
 * ```
 *
 * @typeParam T item data type.
 */
export interface MkDropEvent<T = unknown> {
  /** Index of the item within `previousContainer`'s data before the drop. */
  previousIndex: number;
  /** Index the item should occupy within `container`'s data after the drop. */
  currentIndex: number;
  /** The `MkDrag` directive instance that was moved. */
  item: MkDrag<T>;
  /** The list the item came from. */
  previousContainer: MkDropList<T>;
  /** The list the item was dropped into (same as `previousContainer` for a re-sort). */
  container: MkDropList<T>;
  /** `true` for pointer (mouse/touch/pen) drops, `false` for keyboard drops. */
  isPointerEvent: boolean;
}
