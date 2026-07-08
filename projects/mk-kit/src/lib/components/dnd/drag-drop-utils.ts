/**
 * Pure array helpers for applying an {@link MkDropEvent}. They mutate the passed
 * array(s) in place and also return the (target) array, mirroring the behaviour
 * of Angular CDK's `moveItemInArray` / `transferArrayItem`.
 */

function clampIndex(index: number, max: number): number {
  return Math.max(0, Math.min(index, max));
}

/**
 * Move an item within a single array from `fromIndex` to `toIndex`.
 * Mutates and returns `array`.
 *
 * ```ts
 * mkMoveItemInArray(rows, e.previousIndex, e.currentIndex);
 * ```
 */
export function mkMoveItemInArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (array.length === 0) return array;
  const from = clampIndex(fromIndex, array.length - 1);
  const to = clampIndex(toIndex, array.length - 1);
  if (from === to) return array;
  const item = array[from];
  const delta = to < from ? -1 : 1;
  for (let i = from; i !== to; i += delta) {
    array[i] = array[i + delta];
  }
  array[to] = item;
  return array;
}

/**
 * Move an item from one array (`from`) to another (`to`), removing it from
 * `from[fromIndex]` and inserting it at `to[toIndex]`. Mutates both arrays and
 * returns the target (`to`) array.
 *
 * ```ts
 * mkTransferArrayItem(todo, done, e.previousIndex, e.currentIndex);
 * ```
 */
export function mkTransferArrayItem<T>(
  from: T[],
  to: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (from.length === 0) return to;
  const source = clampIndex(fromIndex, from.length - 1);
  const target = clampIndex(toIndex, to.length);
  const [item] = from.splice(source, 1);
  to.splice(target, 0, item);
  return to;
}
