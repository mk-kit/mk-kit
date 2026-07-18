import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';

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
 * ```
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

  /** Emits once the picture has finished loading. */
  readonly loaded = output<void>();
  /** Emits when the picture fails to load and the fallback panel is shown. */
  readonly errored = output<void>();

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
