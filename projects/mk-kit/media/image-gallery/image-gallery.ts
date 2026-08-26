import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkImage, type MkImageRounded } from '../image/image';
import {
  MkLightboxService,
  type MkLightboxItem,
} from '../lightbox/lightbox.service';

/** A single picture inside an {@link MkImageGallery}. */
export interface MkGalleryItem {
  /** Full-size image URL (what the lightbox opens). */
  src: string;
  /** Optional smaller thumbnail URL for the tile; falls back to `src`. */
  thumb?: string;
  /** Alt text; also drives the tile's accessible label. */
  alt?: string;
  /** Optional caption forwarded to the lightbox. */
  caption?: string;
}

/** Tile arrangement of an {@link MkImageGallery}. */
export type MkImageGalleryLayout = 'grid' | 'masonry' | 'strip';

/** Payload of the {@link MkImageGallery.itemClick} output. */
export interface MkGalleryItemClick {
  /** The clicked picture. */
  item: MkGalleryItem;
  /** Its index within `items`. */
  index: number;
}

/**
 * Image gallery — a wall of clickable picture tiles built on {@link MkImage}.
 * Choose a uniform `grid`, a natural-ratio `masonry` flow, or a snap-scrolling
 * horizontal `strip`. Clicking a tile opens the shared {@link MkLightboxService}
 * at that picture (full-size `src`, not the thumb) and always emits
 * `itemClick`. With `max` set, only the first `max` tiles render and the last
 * one carries a "+N" overflow scrim that opens the rest in the lightbox.
 *
 * ```html
 * <mk-image-gallery
 *   [items]="[
 *     { src: '/photos/1.jpg', thumb: '/thumbs/1.jpg', alt: 'Harbour at dawn' },
 *     { src: '/photos/2.jpg', alt: 'Old town square', caption: 'Kraków' },
 *   ]"
 *   [columns]="4"
 *   [max]="8"
 *   aspectRatio="4 / 3"
 *   (itemClick)="onItemClick($event)"
 * />
 * ```
 */
@Component({
  selector: 'mk-image-gallery',
  exportAs: 'mkImageGallery',
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkImage],
  host: {
    class: 'mk-image-gallery',
    '[attr.data-layout]': 'layout()',
    '[attr.data-rounded]': 'rounded()',
    '[style.--_cols]': 'columns()',
  },
})
export class MkImageGallery {
  private readonly lightboxService = inject(MkLightboxService);
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** Pictures to show. */
  readonly items = input.required<readonly MkGalleryItem[]>();
  /** Tile arrangement. */
  readonly layout = input<MkImageGalleryLayout>('grid');
  /** Grid/masonry column count; also sets the visible tile count of a strip. */
  readonly columns = input(3, { transform: numberAttribute });
  /** When set, show only the first `max` tiles plus a "+N" overflow tile. */
  readonly max = input<number | null>(null);
  /** Open the shared lightbox on tile click. */
  readonly lightbox = input(true, { transform: booleanAttribute });
  /** CSS aspect-ratio of grid/strip tiles (masonry keeps natural ratios). */
  readonly aspectRatio = input<string>('1 / 1');
  /** Corner rounding of the tiles. */
  readonly rounded = input<MkImageRounded>('md');

  /** Emits on every tile click (also when the lightbox opens). */
  readonly itemClick = output<MkGalleryItemClick>();

  /** Tiles actually rendered — the first `max` when `max` is set. */
  protected readonly visibleItems = computed(() => {
    const items = this.items();
    const max = this.max();
    return max != null && items.length > max
      ? items.slice(0, Math.max(0, max))
      : items;
  });

  /** How many pictures the trailing "+N" tile stands for (0 = no overflow). */
  protected readonly overflowCount = computed(
    () => this.items().length - this.visibleItems().length,
  );

  /** Frame ratio forwarded to the tiles (`'auto'` in masonry). */
  protected readonly tileAspectRatio = computed(() =>
    this.layout() === 'masonry' ? 'auto' : this.aspectRatio(),
  );

  /**
   * Accessible label of tile `index`: `viewImage(alt)` when the picture has
   * alt text, else positional `imageOf(...)`; the overflow tile appends "+N".
   */
  protected tileLabel(index: number): string {
    const items = this.items();
    const alt = items[index]?.alt;
    const base = alt
      ? this.i18n.viewImage(alt)
      : this.i18n.imageOf(index + 1, items.length);
    const overflow = this.overflowCount();
    const isOverflowTile =
      overflow > 0 && index === this.visibleItems().length - 1;
    return isOverflowTile ? `${base} (+${overflow})` : base;
  }

  protected onTileClick(index: number): void {
    const items = this.items();
    if (this.lightbox()) {
      const lightboxItems: MkLightboxItem[] = items.map(
        ({ src, alt, caption }) => ({ src, alt, caption }),
      );
      this.lightboxService.open(lightboxItems, index);
    }
    this.itemClick.emit({ item: items[index], index });
  }
}
