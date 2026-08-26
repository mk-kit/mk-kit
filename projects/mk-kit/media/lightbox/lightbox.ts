import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MK_I18N, MK_OVERLAY_DATA, MkOverlayRef } from '@mk-kit/ui/core';
import type { MkLightboxData, MkLightboxItem } from './lightbox.service';

/**
 * Internal overlay component backing {@link MkLightboxService}. Renders the
 * current image near-fullscreen over the overlay scrim with a caption bar,
 * an `imageOf` counter, a close button and looping previous/next navigation.
 *
 * Keyboard: `ArrowLeft`/`ArrowRight` navigate, `Home`/`End` jump to the first
 * or last image. `Escape` and backdrop clicks are handled by the overlay
 * itself (`closeOnEscape` / `closeOnBackdropClick`), so they are deliberately
 * not re-handled here.
 *
 * Open it via the service — not by placing `<mk-lightbox>` in a template:
 *
 * ```ts
 * inject(MkLightboxService).open(items, 2);
 * ```
 */
@Component({
  selector: 'mk-lightbox',
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Bound (not static) so it merges with the overlay's own panel classes —
    // a static host `class` would overwrite `mk-overlay-panel` on the host.
    '[class.mk-lightbox]': 'true',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkLightbox {
  private readonly ref = inject(MkOverlayRef);
  private readonly data = inject<MkLightboxData | null>(MK_OVERLAY_DATA);
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** The images being paged through. */
  protected readonly items: readonly MkLightboxItem[] = this.data?.items ?? [];
  /** Total number of images. */
  protected readonly total = this.items.length;

  /** Index of the currently displayed image. */
  protected readonly index = signal(
    Math.min(Math.max(this.data?.startIndex ?? 0, 0), Math.max(this.total - 1, 0)),
  );
  /** The currently displayed item. */
  protected readonly current = computed(() => this.items[this.index()]);
  /** Localised "Image i of n" counter text. */
  protected readonly counter = computed(() =>
    this.i18n.imageOf(this.index() + 1, this.total),
  );

  /** `true` while the current image is still loading. */
  protected readonly loading = signal(true);
  /** `true` when the current image failed to load. */
  protected readonly failed = signal(false);

  /** Show the previous image, wrapping from the first to the last. */
  protected previous(): void {
    this.goTo((this.index() - 1 + this.total) % this.total);
  }

  /** Show the next image, wrapping from the last back to the first. */
  protected next(): void {
    this.goTo((this.index() + 1) % this.total);
  }

  /** Jump to `index`, resetting the loading/error state. */
  protected goTo(index: number): void {
    if (this.total === 0 || index === this.index()) return;
    this.index.set(index);
    this.loading.set(true);
    this.failed.set(false);
  }

  /** Close the surrounding overlay. */
  protected close(): void {
    this.ref.close();
  }

  /** Current image finished loading — hide the spinner. */
  protected onLoad(): void {
    this.loading.set(false);
  }

  /** Current image failed — show the localised failure message instead. */
  protected onError(): void {
    this.loading.set(false);
    this.failed.set(true);
  }

  /**
   * Host keydown handler. Escape is intentionally not handled here — the
   * overlay's `closeOnEscape` already closes the lightbox.
   */
  protected onKeydown(event: Event): void {
    const key = (event as KeyboardEvent).key;
    switch (key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previous();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
      case 'Home':
        event.preventDefault();
        this.goTo(0);
        break;
      case 'End':
        event.preventDefault();
        this.goTo(this.total - 1);
        break;
    }
  }
}
