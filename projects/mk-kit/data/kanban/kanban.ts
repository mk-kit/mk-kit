import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  input,
  model,
  output,
} from '@angular/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MkDrag, MkDropList, mkMoveItemInArray } from '@mkornas/ui/dnd';
import type { MkDropEvent } from '@mkornas/ui/dnd';

/** Stable empty fallback so out-of-range lookups don't allocate per call. */
const NO_CONNECTIONS: string[] = [];

/** A single draggable card on a {@link MkKanban} board. */
export interface MkKanbanCard {
  /** Stable identity used for tracking and move events. */
  id: unknown;
  /** Text shown by the default card renderer. */
  title: string;
  /** Arbitrary extra fields for custom card templates. */
  [key: string]: unknown;
}

/** A column (bucket) of {@link MkKanbanCard}s on a {@link MkKanban} board. */
export interface MkKanbanColumn {
  /** Stable identity used for tracking and move events. */
  id: unknown;
  /** Heading shown in the column header and used as its aria-label. */
  title: string;
  /** The ordered cards contained in this column. */
  cards: MkKanbanCard[];
}

/**
 * Emitted by {@link MkKanban} after a card has been moved (between or within
 * columns) and the two-way `columns` model has been updated.
 */
export interface MkKanbanCardMovedEvent {
  /** The card that was moved. */
  card: MkKanbanCard;
  /** `id` of the column the card came from. */
  from: unknown;
  /** `id` of the column the card was dropped into. */
  to: unknown;
  /** The card's index within the source column before the move. */
  fromIndex: number;
  /** The card's index within the destination column after the move. */
  toIndex: number;
}

/**
 * Kanban board — a horizontal row of columns whose cards can be dragged and
 * reordered within a column or transferred between columns. Built on the dnd
 * group's connected `[mkDropList]` / `[mkDrag]` directives, so it inherits both
 * pointer and keyboard dragging (WCAG 2.1.1) for free.
 *
 * Bind `columns` two-way; the model is updated immutably on each drop. Project
 * an `<ng-template>` to render custom card content — it receives the card as
 * `$implicit` and the owning column as `column`:
 *
 * ```html
 * <mk-kanban [(columns)]="board" (cardMoved)="onMoved($event)">
 *   <ng-template #cardTemplate let-card let-column="column">
 *     <strong>{{ card.title }}</strong>
 *   </ng-template>
 * </mk-kanban>
 * ```
 */
@Component({
  selector: 'mk-kanban',
  templateUrl: './kanban.html',
  styleUrl: './kanban.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkDropList, MkDrag, NgTemplateOutlet],
  host: { class: 'mk-kanban' },
})
export class MkKanban {
  /** The board's columns and their cards (two-way). Updated on every drop. */
  readonly columns = model<MkKanbanColumn[]>([]);

  /** Disable all dragging on the board. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emitted after the model is updated when a card is moved. */
  readonly cardMoved = output<MkKanbanCardMovedEvent>();

  /** Optional consumer-projected card renderer (`$implicit` = card). */
  protected readonly cardTemplate = contentChild<TemplateRef<unknown>>(TemplateRef);

  /** Board-scoped prefix so this board's drop-list ids never collide. */
  private readonly boardId = mkUniqueId('mk-kanban');

  /** Column count as its own computed so id arrays survive card-only updates. */
  private readonly columnCount = computed(() => this.columns().length);

  /** Stable drop-list id per column, positionally matched to `columns()`. */
  protected readonly listIds = computed(() =>
    Array.from({ length: this.columnCount() }, (_, i) => `${this.boardId}-col-${i}`),
  );

  /**
   * Per-column connected-target ids (every other column's list). One stable
   * array per column, recomputed only when the column count changes — a fresh
   * array per change-detection pass would dirty each `MkDropList`'s
   * `connectedTo` input identity on every cycle.
   */
  private readonly connections = computed(() => {
    const ids = this.listIds();
    return ids.map((_, i) => ids.filter((_, j) => j !== i));
  });

  /** Ids of every other column's list — the connected transfer targets for `i`. */
  protected connectedTo(index: number): string[] {
    return this.connections()[index] ?? NO_CONNECTIONS;
  }

  /**
   * Apply a drop from the dnd module. Reads the source/target columns from the
   * event's containers (matched by their drop-list ids), updates the two-way
   * `columns` model immutably, then emits {@link cardMoved}.
   */
  protected onDrop(event: MkDropEvent<MkKanbanCard>): void {
    const ids = this.listIds();
    const fromCol = ids.indexOf(event.previousContainer.id());
    const toCol = ids.indexOf(event.container.id());
    if (fromCol === -1 || toCol === -1) return;
    this.moveCard(fromCol, toCol, event.previousIndex, event.currentIndex);
  }

  /**
   * Immutably move the card at `fromIndex` of column `fromCol` to `toIndex` of
   * column `toCol`, updating the model and emitting {@link cardMoved}. Column
   * indices refer to positions in `columns()`.
   */
  private moveCard(
    fromCol: number,
    toCol: number,
    fromIndex: number,
    toIndex: number,
  ): void {
    const cols = this.columns();
    const source = cols[fromCol];
    const target = cols[toCol];
    if (!source || !target) return;
    const card = source.cards[fromIndex];
    if (!card) return;

    const next = cols.map((col, i) => {
      if (fromCol === toCol && i === fromCol) {
        const cards = [...col.cards];
        mkMoveItemInArray(cards, fromIndex, toIndex);
        return { ...col, cards };
      }
      if (i === fromCol) {
        return { ...col, cards: col.cards.filter((_, idx) => idx !== fromIndex) };
      }
      if (i === toCol) {
        const cards = [...col.cards];
        cards.splice(Math.max(0, Math.min(toIndex, cards.length)), 0, card);
        return { ...col, cards };
      }
      return col;
    });

    this.columns.set(next);
    this.cardMoved.emit({
      card,
      from: source.id,
      to: target.id,
      fromIndex,
      toIndex,
    });
  }
}
