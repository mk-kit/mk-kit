import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
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
 * The list renders as a named `group` of `button` items: pass `label` (or
 * `labelledBy` pointing at a visible heading) so screen readers say what is
 * being reordered — the i18n `sortableListLabel` ("Sortable list") is the
 * fallback.
 *
 * ```html
 * <mk-sortable-list [(items)]="rows" label="Steps">
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
  private readonly i18n = inject(MK_I18N);

  /** The ordered items (two-way). Reordered in place on drop. */
  readonly items = model<T[]>([]);

  /**
   * Accessible name of the list (`aria-label`), also used in the
   * "moved into …" announcements. Defaults to the i18n `sortableListLabel`.
   */
  readonly label = input<string>();

  /**
   * Id of an element that names the list (`aria-labelledby`), e.g. a visible
   * heading. Wins over `label` as the accessible name.
   */
  readonly labelledBy = input<string>();

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

  /** `label`, else the i18n default. */
  protected readonly resolvedLabel = computed(
    () => this.label() || this.i18n.sortableListLabel,
  );

  protected onDrop(event: MkDropEvent<T>): void {
    const next = [...this.items()];
    mkMoveItemInArray(next, event.previousIndex, event.currentIndex);
    this.items.set(next);
    this.sorted.emit(event);
  }
}
