import type { MkDrag } from './drag';
import type { MkDropList } from './drop-list';
import type { MkDropZone } from './drop-zone';

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

/**
 * Where an item is over a `[mkDropZone]`, emitted on enter and on every
 * pointer frame (`mkDropZoneEntered` / `mkDropZoneMoved`). Keyboard entries
 * report the zone's centre.
 *
 * @typeParam T item data type.
 * @typeParam Z zone data type (`mkDropZoneData`).
 */
export interface MkDropZoneHover<T = unknown, Z = unknown> {
  /** The `MkDrag` directive instance being dragged. */
  item: MkDrag<T>;
  /** The zone under the pointer. */
  zone: MkDropZone<Z>;
  /** Pointer position in client (viewport) coordinates. */
  x: number;
  y: number;
  /** Pointer position relative to the zone's top-left corner, in CSS pixels. */
  offsetX: number;
  offsetY: number;
  /** Pointer position as a 0–1 fraction of the zone's width / height (clamped). */
  fractionX: number;
  fractionY: number;
  /** `true` for pointer (mouse/touch/pen) hovers, `false` for keyboard steps. */
  isPointerEvent: boolean;
}

/**
 * Emitted by `[mkDropZone]` (`mkDropZoneDropped`) when an item is released on
 * it. Carries the same position fields as {@link MkDropZoneHover} plus where
 * the item came from — the consumer removes it from that list (or not: a
 * "focus on this" zone may leave the card where it is).
 */
export interface MkDropZoneEvent<T = unknown, Z = unknown> extends MkDropZoneHover<T, Z> {
  /** The list the item came from. */
  previousContainer: MkDropList<T>;
  /** Index of the item within `previousContainer`'s data. */
  previousIndex: number;
}
