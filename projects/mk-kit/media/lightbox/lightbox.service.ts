import { Injectable, inject } from '@angular/core';
import { MK_I18N, MkOverlayService } from '@mk-kit/ui/core';
import { MkLightbox } from './lightbox';

/** A single image shown by {@link MkLightboxService}. */
export interface MkLightboxItem {
  /** Image URL. */
  src: string;
  /** Alternative text for the image. */
  alt?: string;
  /** Optional caption rendered below the image. */
  caption?: string;
}

/** Data injected into {@link MkLightbox} via `MK_OVERLAY_DATA`. */
export interface MkLightboxData {
  /** The images to page through. */
  items: readonly MkLightboxItem[];
  /** Index of the image shown first (already clamped into range). */
  startIndex: number;
}

/**
 * Fullscreen image lightbox — opens a set of images in a modal overlay with
 * looping previous/next navigation, captions, a counter, keyboard support
 * (Arrow keys, Home/End, Escape) and focus trapping, all powered by
 * {@link MkOverlayService}.
 *
 * ```ts
 * private readonly lightbox = inject(MkLightboxService);
 *
 * viewPhoto(index: number): void {
 *   this.lightbox.open(
 *     [
 *       { src: '/photos/1.jpg', alt: 'Harbour at dawn', caption: 'Dawn' },
 *       { src: '/photos/2.jpg', alt: 'Old town square' },
 *     ],
 *     index,
 *   );
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkLightboxService {
  private readonly overlay = inject(MkOverlayService);
  private readonly i18n = inject(MK_I18N);

  /**
   * Open the lightbox over the page. Does nothing when `items` is empty.
   * `startIndex` is clamped into `[0, items.length - 1]`.
   */
  open(items: readonly MkLightboxItem[], startIndex = 0): void {
    if (items.length === 0) return;
    const start = Math.min(
      Math.max(Math.trunc(startIndex), 0),
      items.length - 1,
    );
    this.overlay.open<MkLightbox, void, MkLightboxData>(MkLightbox, {
      data: { items, startIndex: start },
      hasBackdrop: true,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      trapFocus: true,
      role: 'dialog',
      ariaLabel: this.i18n.imageOf(start + 1, items.length),
      panelClass: 'mk-lightbox-panel',
    });
  }
}
