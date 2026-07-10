/* eslint-disable @typescript-eslint/no-explicit-any -- item-type params use
   `any` to accept drags of any data type without generic-variance friction. */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MkDragDropRegistry } from './drag-drop-registry';
import { MkDrag } from './drag';
import type { MkDropEvent, MkDropListOrientation } from './drag-drop.types';

/**
 * A drop container for reorderable `[mkDrag]` items.
 *
 * - **Sort list:** a single `[mkDropList]` over an array — items reorder within it.
 * - **Buckets / kanban:** several `[mkDropList]`s wired together with
 *   `mkDropListConnectedTo` so items transfer between them (both by pointer and
 *   by keyboard at the ends of a list).
 *
 * The array bound to `mkDropListData` is **not** mutated for you — handle
 * `mkDropListDropped` and call {@link mkMoveItemInArray} / {@link mkTransferArrayItem}.
 *
 * ```html
 * <ul mkDropList [mkDropListData]="todo()"
 *     mkDropListId="todo" [mkDropListConnectedTo]="['done']"
 *     (mkDropListDropped)="drop($event)">
 *   @for (t of todo(); track t.id) {
 *     <li mkDrag [mkDragData]="t">{{ t.title }}</li>
 *   }
 * </ul>
 * ```
 *
 * @typeParam T item data type.
 */
@Component({
  selector: '[mkDropList]',
  exportAs: 'mkDropList',
  templateUrl: './drop-list.html',
  styleUrl: './drop-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-drop-list',
    '[attr.aria-orientation]': 'mkDropListOrientation()',
    '[attr.aria-disabled]': 'mkDropListDisabled() || null',
    '[class.mk-drop-list--horizontal]': "mkDropListOrientation() === 'horizontal'",
    '[class.mk-drop-list--disabled]': 'mkDropListDisabled()',
    '[class.mk-drop-list--receiving]': '_receiving()',
  },
})
export class MkDropList<T = unknown> {
  private readonly registry = inject(MkDragDropRegistry);

  /** The list's host element (drop target bounds). */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** The array backing the list. Bound, never mutated by the directive. */
  readonly mkDropListData = input<readonly T[]>([]);

  /** Stable id used to connect lists. Auto-generated when omitted. */
  readonly mkDropListId = input<string>();

  /** Ids of other lists items may be transferred into. */
  readonly mkDropListConnectedTo = input<readonly string[]>([]);

  /**
   * Human-readable name used in screen-reader announcements when an item is
   * moved into this list (e.g. `"In progress"`). Falls back to the list `id`
   * — which may be auto-generated gibberish — so set it wherever users can
   * move items across lists by keyboard.
   */
  readonly mkDropListLabel = input<string>('');

  /** Layout axis; controls pointer hit-testing and arrow-key direction. */
  readonly mkDropListOrientation = input<MkDropListOrientation>('vertical');

  /** Disable dropping into (and dragging out of) this list. */
  readonly mkDropListDisabled = input(false, { transform: booleanAttribute });

  /** Fires when an item is dropped into this list (pointer or keyboard). */
  readonly mkDropListDropped = output<MkDropEvent<T>>();

  /** Resolved id (input or generated). */
  readonly id = computed(() => this.mkDropListId() ?? this.autoId);
  private readonly autoId = mkUniqueId('mk-drop-list');

  /** Announceable name: the label when set, otherwise the resolved id. */
  readonly label = computed(() => this.mkDropListLabel() || this.id());

  /** Connected-list ids, normalised to a plain array. */
  readonly connectedTo = computed<readonly string[]>(
    () => this.mkDropListConnectedTo() ?? [],
  );

  /** The `mkDrag` items projected into this list, in DOM order. */
  private readonly drags = contentChildren(MkDrag);

  /** Highlight while a drag is hovering this list. */
  protected readonly _receiving = signal(false);

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      this.registry.register(id, this);
      onCleanup(() => this.registry.unregister(id, this));
    });
  }

  /** Number of drag items currently in the list. */
  size(): number {
    return this.drags().length;
  }

  /** Index of `drag` among this list's items, or -1. */
  indexOf(drag: MkDrag<any>): number {
    return this.drags().indexOf(drag);
  }

  /** Host elements of this list's items, excluding `exclude`, in DOM order. */
  itemElementsExcept(exclude: MkDrag<any>): HTMLElement[] {
    return this.drags()
      .filter((d) => d !== exclude)
      .map((d) => d.element);
  }

  /** Toggle the "receiving" highlight (called by the active drag). */
  setReceiving(value: boolean): void {
    this._receiving.set(value);
  }

  /** Emit a drop into this list. Called by the active `MkDrag`. */
  emitDrop(event: MkDropEvent<any>): void {
    this.mkDropListDropped.emit(event as MkDropEvent<T>);
  }
}
