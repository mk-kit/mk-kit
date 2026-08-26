import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import type { MkSize } from '@mk-kit/ui/core';
import { MkAvatar } from '../avatar/avatar';

/** Layout direction of a {@link MkProfileCard}. */
export type MkProfileCardOrientation = 'vertical' | 'horizontal';

/**
 * Profile meta row — a stats strip projected into a {@link MkProfileCard}
 * between the body and the actions. Direct children are laid out as
 * evenly-spaced, centre-aligned cells with subtle separators between them.
 *
 * ```html
 * <div mkProfileMeta>
 *   <div><strong>128</strong> posts</div>
 *   <div><strong>2.4k</strong> followers</div>
 * </div>
 * ```
 */
@Component({
  selector: '[mkProfileMeta]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-profile-meta' },
  styles: [
    `:host {
       display: flex;
       align-items: stretch;
       width: 100%;
       min-width: 0;
     }
     :host(:empty) {
       display: none;
     }
     :host ::ng-deep > * {
       flex: 1 1 0;
       min-width: 0;
       padding-inline: var(--mk-space-2);
       text-align: center;
       font-size: var(--mk-font-size-sm);
       color: var(--mk-text-muted);
     }
     :host ::ng-deep > * + * {
       border-inline-start: var(--mk-border-width) solid var(--mk-border-subtle);
     }`,
  ],
})
export class MkProfileMeta {}

/**
 * Profile actions row — buttons projected into the footer area of a
 * {@link MkProfileCard}. Centred in vertical orientation; pinned to the end
 * in horizontal orientation.
 *
 * ```html
 * <div mkProfileActions>
 *   <button mkButton>Follow</button>
 *   <button mkButton variant="outline">Message</button>
 * </div>
 * ```
 */
@Component({
  selector: '[mkProfileActions]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-profile-actions' },
  styles: [
    `:host {
       display: flex;
       align-items: center;
       justify-content: center;
       flex-wrap: wrap;
       gap: var(--mk-space-2);
     }
     :host(:empty) {
       display: none;
     }`,
  ],
})
export class MkProfileActions {}

/**
 * Profile card — a person/entity summary on a bordered surface: an optional
 * cover banner, an {@link MkAvatar} (with automatic initials fallback derived
 * from `name`), the display name, a muted subtitle, free-form body content and
 * two optional slots for a meta/stats row and an actions row.
 *
 * Orientations:
 * - `vertical` (default) — centred column; when `coverSrc` is set a 3:1 banner
 *   spans the card top and the avatar overlaps its bottom edge with a
 *   surface-coloured ring.
 * - `horizontal` — avatar on the left, text in the middle, actions pinned to
 *   the end. The cover banner is intentionally NOT rendered in this
 *   orientation (a side-by-side row has no top edge for it to crown).
 *
 * The name renders as emphasised generic text (like `mk-card-title`, no
 * hard-coded heading level) so the card never disrupts the document outline.
 *
 * ```html
 * <mk-profile-card
 *   name="Ada Lovelace"
 *   subtitle="Analytical Engine Programmer"
 *   avatarSrc="/ada.jpg"
 *   coverSrc="/cover.jpg">
 *   First programmer. Wrote notes G through... well, all of them.
 *   <div mkProfileMeta>
 *     <div><strong>128</strong> posts</div>
 *     <div><strong>2.4k</strong> followers</div>
 *     <div><strong>310</strong> following</div>
 *   </div>
 *   <div mkProfileActions>
 *     <button mkButton>Follow</button>
 *     <button mkButton variant="outline">Message</button>
 *   </div>
 * </mk-profile-card>
 * ```
 */
@Component({
  selector: 'mk-profile-card',
  exportAs: 'mkProfileCard',
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAvatar],
  host: {
    class: 'mk-profile-card',
    role: 'group',
    '[class.mk-profile-card--vertical]': "orientation() === 'vertical'",
    '[class.mk-profile-card--horizontal]': "orientation() === 'horizontal'",
    '[class.mk-profile-card--has-cover]': 'showCover()',
    '[attr.data-avatar-size]': 'avatarSize()',
    '[attr.aria-labelledby]': 'nameId',
  },
})
export class MkProfileCard {
  /** Display name. Also drives the avatar's initials fallback and alt text. */
  readonly name = input.required<string>();
  /** Muted supporting line under the name (role, handle, email…). */
  readonly subtitle = input<string>('');
  /** Avatar image URL; when empty the avatar falls back to initials. */
  readonly avatarSrc = input<string>('');
  /**
   * Cover banner image URL rendered as a ~3:1 band across the card top
   * (vertical orientation only). When set, the avatar overlaps the banner's
   * bottom edge with a surface-coloured ring.
   */
  readonly coverSrc = input<string>('');
  /** Layout: centred column (`vertical`) or avatar-left row (`horizontal`). */
  readonly orientation = input<MkProfileCardOrientation>('vertical');
  /** Avatar size scale, forwarded to {@link MkAvatar}. */
  readonly avatarSize = input<MkSize>('lg');

  /** Id of the name element, wired to the host's `aria-labelledby`. */
  protected readonly nameId = mkUniqueId('mk-profile-card-name');

  /** Cover renders only in vertical orientation. */
  protected readonly showCover = computed(
    () => this.orientation() === 'vertical' && !!this.coverSrc(),
  );
}
