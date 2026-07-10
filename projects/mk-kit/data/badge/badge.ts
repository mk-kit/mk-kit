import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import type { MkSize, MkTone } from '@mkornas/ui/core';

/** Visual treatment for a {@link MkBadge}. */
export type MkBadgeVariant = 'solid' | 'soft' | 'outline';

/**
 * Badge — a compact status pill, typically for counts or short state labels.
 * Set `dot` for a minimal notification indicator with no text.
 *
 * ```html
 * <mk-badge tone="success">Active</mk-badge>
 * <mk-badge tone="danger" variant="solid">3</mk-badge>
 * <mk-badge tone="danger" dot aria-label="Unread messages" />
 * ```
 */
@Component({
  selector: 'mk-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-badge',
    '[class.mk-badge--sm]': "size() === 'sm'",
    '[class.mk-badge--md]': "size() === 'md'",
    '[class.mk-badge--lg]': "size() === 'lg'",
    '[class.mk-badge--solid]': "variant() === 'solid'",
    '[class.mk-badge--soft]': "variant() === 'soft'",
    '[class.mk-badge--outline]': "variant() === 'outline'",
    '[class.mk-badge--dot]': 'dot()',
    '[attr.data-tone]': 'tone()',
  },
})
export class MkBadge {
  /** Semantic color tone. */
  readonly tone = input<MkTone>('primary');
  /** Visual treatment. */
  readonly variant = input<MkBadgeVariant>('soft');
  /** Size scale. */
  readonly size = input<MkSize>('md');
  /** Render as a tiny dot (no text) for notification indicators. */
  readonly dot = input(false, { transform: booleanAttribute });
}
