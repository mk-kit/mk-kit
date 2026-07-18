import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  contentChild,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MkDrag, MkDropList, mkMoveItemInArray } from '@mkornas/ui/dnd';
import type { MkDropEvent } from '@mkornas/ui/dnd';

/** A single asset displayed as a tile in {@link MkMediaGallery}. */
export interface MkMediaItem {
  /** Stable identity used for tracking, selection and reorder events. */
  id: string;
  /** Full-size image URL (used for the thumbnail when `thumb` is omitted). */
  src: string;
  /** Optional dedicated thumbnail URL shown in the grid. */
  thumb?: string;
  /** Display name shown under the thumbnail; also names the selection checkbox. */
  name: string;
  /** Alternative text describing the image; falls back to `name` for labels. */
  alt?: string;
  /** Optional caption/meta line shown under the name (e.g. "1.2 MB · JPG"). */
  meta?: string;
}

/** Emitted by {@link MkMediaGallery} after a tile has been reordered. */
export interface MkMediaReorderEvent {
  /** Index the item was dragged from. */
  from: number;
  /** Index the item was dropped at. */
  to: number;
  /** The full item array after the move (same reference as the updated model). */
  items: MkMediaItem[];
}

/**
 * Marks an `<ng-template>` as the per-tile action bar for {@link MkMediaGallery}.
 * The template's implicit context is the {@link MkMediaItem}, so consumers can
 * destructure it with `let-item`. The gallery renders it into each tile's
 * top-right action bar (revealed on hover / focus-within, always visible on
 * touch devices); the consumer supplies the buttons and their handlers.
 *
 * ```html
 * <mk-media-gallery [items]="assets()">
 *   <ng-template mkMediaActions let-item>
 *     <button mkButton size="sm" variant="ghost" (click)="edit(item)">Edit</button>
 *   </ng-template>
 * </mk-media-gallery>
 * ```
 */
@Directive({
  selector: '[mkMediaActions]',
})
export class MkMediaActions {
  /** The projected action-bar template, rendered once per tile. */
  readonly template = inject<TemplateRef<{ $implicit: MkMediaItem }>>(TemplateRef);
}

/**
 * Media gallery — a management grid of image tiles for admin media libraries.
 * Each tile shows a square thumbnail (a labelled preview button emitting
 * {@link itemClick}), the item's name and optional meta line, an optional
 * selection checkbox (two-way `selection` model of selected ids) and an
 * optional consumer-projected action bar ({@link MkMediaActions}).
 *
 * With `reorderable`, tiles become draggable via the dnd group's
 * `[mkDropList]` / `[mkDrag]` directives — pointer and keyboard dragging
 * (WCAG 2.1.1) both included. Each drop immutably updates the two-way `items`
 * model and emits {@link reordered}.
 *
 * Clicking a tile always means "open/preview" — selection only toggles through
 * the checkbox, never on tile click.
 *
 * ```html
 * <mk-media-gallery
 *   [(items)]="assets"
 *   [(selection)]="selectedIds"
 *   selectable
 *   reorderable
 *   [columns]="5"
 *   (itemClick)="openPreview($event)"
 *   (reordered)="persistOrder($event)"
 * >
 *   <ng-template mkMediaActions let-item>
 *     <button mkButton size="sm" variant="ghost" (click)="edit(item)">Edit</button>
 *     <button mkButton size="sm" variant="ghost" tone="danger" (click)="remove(item)">
 *       Delete
 *     </button>
 *   </ng-template>
 * </mk-media-gallery>
 * ```
 */
@Component({
  selector: 'mk-media-gallery',
  exportAs: 'mkMediaGallery',
  templateUrl: './media-gallery.html',
  styleUrl: './media-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkDropList, MkDrag, NgTemplateOutlet],
  host: {
    class: 'mk-media-gallery',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class MkMediaGallery {
  /** Localized strings (region label, checkbox/preview labels, empty state). */
  protected readonly i18n = inject(MK_I18N);

  /** The gallery's items (two-way). Replaced immutably on every reorder drop. */
  readonly items = model<MkMediaItem[]>([]);

  /** Ids of the currently selected items (two-way). */
  readonly selection = model<string[]>([]);

  /** Show a selection checkbox on every tile. */
  readonly selectable = input(false, { transform: booleanAttribute });

  /** Allow drag-and-drop (pointer + keyboard) reordering of the tiles. */
  readonly reorderable = input(false, { transform: booleanAttribute });

  /** Number of grid columns. */
  readonly columns = input(4, { transform: numberAttribute });

  /** Accessible name of the gallery region. Defaults to `i18n.mediaLibrary`. */
  readonly ariaLabel = input<string>(this.i18n.mediaLibrary);

  /** Emitted when a tile's preview button is activated (click/Enter/Space). */
  readonly itemClick = output<MkMediaItem>();

  /** Emitted after a drop has updated the `items` model. */
  readonly reordered = output<MkMediaReorderEvent>();

  /** Optional consumer-projected per-tile action bar (`$implicit` = item). */
  protected readonly actions = contentChild(MkMediaActions);

  /** Whether the item with `id` is currently selected. */
  protected isSelected(id: string): boolean {
    return this.selection().includes(id);
  }

  /** Sync the two-way `selection` model with the checkbox's native state. */
  protected onCheckboxChange(item: MkMediaItem, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selection();
    if (checked) {
      if (!current.includes(item.id)) this.selection.set([...current, item.id]);
    } else {
      this.selection.set(current.filter((id) => id !== item.id));
    }
  }

  /** Emit {@link itemClick} for the tile's preview button. */
  protected onPreviewClick(item: MkMediaItem): void {
    this.itemClick.emit(item);
  }

  /**
   * Apply a drop from the dnd module: move the item on a copy of `items`,
   * write the copy back to the two-way model and emit {@link reordered}.
   */
  protected onDrop(event: MkDropEvent<MkMediaItem>): void {
    const from = event.previousIndex;
    const to = event.currentIndex;
    if (from === to) return;
    const next = [...this.items()];
    mkMoveItemInArray(next, from, to);
    this.items.set(next);
    this.reordered.emit({ from, to, items: next });
  }

  /**
   * Keep events from the tile's nested controls (checkbox, action buttons)
   * inside those controls: without this, Space/Enter on the checkbox or an
   * action button would bubble to the surrounding `[mkDrag]` host and pick the
   * tile up instead, and a pointer press would start a drag session. Native
   * behavior is untouched — only propagation stops.
   */
  protected stopEvent(event: Event): void {
    event.stopPropagation();
  }
}
