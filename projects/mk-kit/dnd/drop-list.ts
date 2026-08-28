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
import { mkUniqueId } from '@mk-kit/ui/core';
import { MkDragDropRegistry } from './drag-drop-registry';
import { MkDrag } from './drag';
import type { MkDropEvent, MkDropListOrientation } from './drag-drop.types';

/**
 * Roles on which `aria-orientation` is permitted (WAI-ARIA 1.2). On any other
 * role the attribute is invalid, so the list only exposes it for these.
 */
const ORIENTATION_ROLES = new Set([
  'listbox',
  'menu',
  'radiogroup',
  'scrollbar',
  'select',
  'separator',
  'slider',
  'tablist',
  'toolbar',
  'tree',
  'treegrid',
]);

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
 * Semantics follow the host element and its items, so the tree is always
 * valid ARIA:
 *
 * - any host other than `<ul>`/`<ol>` is a `role="group"` (named by
 *   `mkDropListLabel`) of `role="button"` items;
 * - a `<ul>`/`<ol>` whose `<li mkDrag>` items all carry a *focusable*
 *   `[mkDragHandle]` stays a plain list — the handles are the controls;
 * - a `<ul>`/`<ol>` whose items are themselves the keyboard targets becomes a
 *   `listbox` of `option`s (an `<li>` may not be a `button`); give it a
 *   `mkDropListLabel`, listboxes need a name.
 *
 * A `role` you set in the template is kept, and `aria-orientation` is only
 * exposed on roles that allow it (`listbox`, `toolbar`, `tree`, …) — the
 * keyboard model handles both axes regardless.
 *
 * ```html
 * <div mkDropList [mkDropListData]="todo()" mkDropListLabel="To do"
 *      mkDropListId="todo" [mkDropListConnectedTo]="['done']"
 *      (mkDropListDropped)="drop($event)">
 *   @for (t of todo(); track t.id) {
 *     <div mkDrag [mkDragData]="t">{{ t.title }}</div>
 *   }
 * </div>
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
    '[attr.role]': 'role()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'mkDropListLabelledBy() || null',
    '[attr.aria-orientation]': 'orientationAllowed() ? mkDropListOrientation() : null',
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

  /**
   * Id of the element that names the list (`aria-labelledby`), e.g. a
   * visible heading. Takes precedence over `mkDropListLabel` as the
   * accessible name; the label is still used in announcements.
   */
  readonly mkDropListLabelledBy = input<string>('');

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

  /** A `role` written in the template — always kept. */
  private readonly explicitRole = this.element.getAttribute('role');
  private readonly isNativeList = /^(UL|OL)$/.test(this.element.tagName);

  /**
   * The role the host exposes. One set in the template wins. A `<ul>`/`<ol>`
   * keeps its implicit `list` role (`null` — nothing is written) while every
   * item hands the keyboard drag to a focusable handle, and becomes a
   * `listbox` (its items `option`s) otherwise. Any other element is a `group`.
   */
  readonly role = computed<string | null>(() => {
    if (this.explicitRole) return this.explicitRole;
    if (!this.isNativeList) return 'group';
    return this.drags().every((d) => d.keyboardHandle()) ? null : 'listbox';
  });

  /** Whether `aria-orientation` is valid on the effective role. */
  protected readonly orientationAllowed = computed(() =>
    ORIENTATION_ROLES.has(this.role() ?? ''),
  );

  /** A static `aria-label` written in the template, kept when no label input is set. */
  private readonly staticAriaLabel = this.element.getAttribute('aria-label');

  /**
   * Accessible name of the list: `mkDropListLabel`, else the template's own.
   * Omitted while `mkDropListLabelledBy` names the list, so the referenced
   * element is the single source of the name.
   */
  protected readonly ariaLabel = computed(() =>
    this.mkDropListLabelledBy()
      ? null
      : this.mkDropListLabel() || this.staticAriaLabel || null,
  );

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
