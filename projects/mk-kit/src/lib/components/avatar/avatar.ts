import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import type { MkSize } from '../../core/types';

/** Outline shape of an {@link MkAvatar}. */
export type MkAvatarShape = 'circle' | 'rounded';
/** Presence status shown as a corner dot on an {@link MkAvatar}. */
export type MkAvatarStatus = 'online' | 'offline' | 'away' | 'busy';

/**
 * Avatar — a user/entity image that gracefully falls back to initials derived
 * from `name`, or to a projected icon. The whole avatar is exposed as a single
 * labelled image to assistive tech.
 *
 * ```html
 * <mk-avatar name="Ada Lovelace" src="/ada.jpg" status="online" />
 * <mk-avatar name="Grace Hopper" />          <!-- initials fallback -->
 * <mk-avatar><svg>…</svg></mk-avatar>        <!-- icon fallback -->
 * ```
 */
@Component({
  selector: 'mk-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-avatar',
    role: 'img',
    '[class.mk-avatar--sm]': "size() === 'sm'",
    '[class.mk-avatar--md]': "size() === 'md'",
    '[class.mk-avatar--lg]': "size() === 'lg'",
    '[class.mk-avatar--circle]': "shape() === 'circle'",
    '[class.mk-avatar--rounded]': "shape() === 'rounded'",
    '[attr.aria-label]': 'label()',
    '[attr.data-status]': 'status() ?? null',
  },
})
export class MkAvatar {
  /** Image URL. When it fails to load the avatar falls back automatically. */
  readonly src = input<string>();
  /** Display name; drives the initials fallback and the default alt text. */
  readonly name = input<string>();
  /** Explicit accessible label. Defaults to `name`, else "Avatar". */
  readonly alt = input<string>();
  /** Size scale. */
  readonly size = input<MkSize>('md');
  /** Outline shape. */
  readonly shape = input<MkAvatarShape>('circle');
  /** Presence indicator dot; omit for none. */
  readonly status = input<MkAvatarStatus>();

  /** True once the provided image has failed to load. */
  private readonly imgFailed = signal(false);

  protected readonly showImage = computed(
    () => !!this.src() && !this.imgFailed(),
  );

  /** Up-to-two-letter initials derived from `name`. */
  protected readonly initials = computed(() => {
    const parts = (this.name() ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly label = computed(() => {
    const base = this.alt() || this.name() || 'Avatar';
    return this.status() ? `${base} (${this.status()})` : base;
  });

  protected onError(): void {
    this.imgFailed.set(true);
  }
}
