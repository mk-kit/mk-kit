import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MkSize, MkTone } from '../../core/types';

/** Visual treatment for a {@link MkTag}. */
export type MkTagVariant = 'solid' | 'soft' | 'outline';

/**
 * Tag — a non-interactive label for categories, keywords or metadata. Unlike
 * {@link MkChip} it carries no interaction; use it purely for display.
 *
 * ```html
 * <mk-tag>Design</mk-tag>
 * <mk-tag tone="info" variant="outline">Beta</mk-tag>
 * ```
 */
@Component({
  selector: 'mk-tag',
  templateUrl: './tag.html',
  styleUrl: './tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-tag',
    '[class.mk-tag--sm]': "size() === 'sm'",
    '[class.mk-tag--md]': "size() === 'md'",
    '[class.mk-tag--lg]': "size() === 'lg'",
    '[class.mk-tag--solid]': "variant() === 'solid'",
    '[class.mk-tag--soft]': "variant() === 'soft'",
    '[class.mk-tag--outline]': "variant() === 'outline'",
    '[attr.data-tone]': 'tone()',
  },
})
export class MkTag {
  /** Semantic color tone. */
  readonly tone = input<MkTone>('neutral');
  /** Visual treatment. */
  readonly variant = input<MkTagVariant>('soft');
  /** Size scale. */
  readonly size = input<MkSize>('md');
}
