import {
  ChangeDetectionStrategy,
  computed,
  Component,
  booleanAttribute,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';

/** How the picture is scaled inside its frame (`object-fit`). */
export type MkImageFit = 'cover' | 'contain';
/** Corner rounding applied to the frame of an {@link MkImage}. */
export type MkImageRounded = 'none' | 'md' | 'lg' | 'circle';
/** Load lifecycle of an {@link MkImage}. */
export type MkImageState = 'loading' | 'loaded' | 'error';

/**
 * Image — an enhanced image block. While the picture loads it shows a skeleton
 * shimmer, and when loading fails it swaps to a localised fallback panel
 * (icon + text, never colour alone). The picture is wrapped in a `<figure>`
 * with an optional `<figcaption>`, and changing `src` restarts the whole load
 * cycle.
 *
 * ```html
 * <mk-image
 *   src="/photos/harbour.jpg"
 *   alt="Harbour at dawn"
 *   aspectRatio="16 / 9"
 *   caption="The old harbour, photographed at dawn"
 *   (loaded)="onLoaded()"
 *   (errored)="onErrored()"
 * />
 *
 * <!-- The hero: eager, high priority, and sized per breakpoint so a phone
 *      does not download the desktop file. -->
 * <mk-image
 *   src="/photos/hero-1600.jpg"
 *   srcset="/photos/hero-800.jpg 800w, /photos/hero-1600.jpg 1600w"
 *   sizes="100vw"
 *   alt=""
 *   aspectRatio="16 / 9"
 *   priority
 * />
 * ```
 *
 * `aspectRatio` is what keeps this from shifting layout: the frame reserves
 * its box before the picture arrives, so nothing below it moves.
 */
@Component({
  selector: 'mk-image',
  exportAs: 'mkImage',
  templateUrl: './image.html',
  styleUrl: './image.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-image',
    '[attr.data-fit]': 'fit()',
    '[attr.data-rounded]': 'rounded()',
    '[attr.data-state]': 'state()',
  },
})
export class MkImage {
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** Image URL. Changing it resets the block to its loading state. */
  readonly src = input.required<string>();
  /** Alt text, always reflected onto the `<img>`. Keep `''` for decorative images. */
  readonly alt = input<string>('');
  /** Any CSS `aspect-ratio` value for the frame, e.g. `'1 / 1'` or `'16 / 9'`. */
  readonly aspectRatio = input<string>('auto');
  /** How the picture fills the frame. */
  readonly fit = input<MkImageFit>('cover');
  /** Corner rounding of the frame. */
  readonly rounded = input<MkImageRounded>('md');
  /** Caption rendered in a `<figcaption>` below the picture. */
  readonly caption = input<string>('');
  /** Defer fetching until near the viewport (`loading="lazy"` vs `"eager"`). */
  readonly lazy = input(true, { transform: booleanAttribute });
  /**
   * Mark this as the page's LCP image: fetched eagerly at high priority and
   * decoded synchronously, and `lazy` is ignored. Use it on exactly ONE image
   * per page — the hero. Marking several is worse than marking none, because
   * they then compete for the same bandwidth the real LCP image needs.
   *
   * This does NOT emit a `<link rel=preload>`; the tag has to be in the HTML
   * the server sends to beat the preload scanner, which a component rendered
   * later cannot guarantee. Pair it with a preload hint for a background or
   * late-rendered hero.
   */
  readonly priority = input(false, { transform: booleanAttribute });
  /**
   * Responsive candidates, passed through verbatim to the `<img>`. Serving a
   * 2048px file into a 600px slot is one of the most common LCP mistakes, and
   * this is the fix; pair with {@link sizes}.
   */
  readonly srcset = input<string>('');
  /** `sizes` attribute — how wide the image renders at each breakpoint. */
  readonly sizes = input<string>('');

  /** Emits once the picture has finished loading. */
  readonly loaded = output<void>();
  /** Emits when the picture fails to load and the fallback panel is shown. */
  readonly errored = output<void>();

  /** `loading` attribute: priority always wins over `lazy`. */
  protected readonly loadingAttr = computed(() =>
    this.priority() ? 'eager' : this.lazy() ? 'lazy' : 'eager',
  );

  /** Load lifecycle; snaps back to `'loading'` whenever `src` changes. */
  protected readonly state = linkedSignal<string, MkImageState>({
    source: this.src,
    computation: () => 'loading',
  });

  protected onLoad(): void {
    this.state.set('loaded');
    this.loaded.emit();
  }

  protected onError(): void {
    this.state.set('error');
    this.errored.emit();
  }
}
