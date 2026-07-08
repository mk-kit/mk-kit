import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MkSize, MkTone } from '../../core/types';

/**
 * Spinner — a circular indeterminate loading indicator. Exposes `role="status"`
 * with a visually-hidden label so assistive tech announces the loading state.
 * The animation slows under `prefers-reduced-motion`.
 *
 * ```html
 * <mk-spinner />
 * <mk-spinner size="lg" tone="neutral" label="Fetching results" />
 * ```
 */
@Component({
  selector: 'mk-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-spinner',
    role: 'status',
    '[class.mk-spinner--sm]': "size() === 'sm'",
    '[class.mk-spinner--md]': "size() === 'md'",
    '[class.mk-spinner--lg]': "size() === 'lg'",
    '[attr.data-tone]': 'tone()',
  },
})
export class MkSpinner {
  /** Size scale. */
  readonly size = input<MkSize>('md');
  /** Semantic color tone. */
  readonly tone = input<MkTone>('primary');
  /** Visually-hidden status label announced to screen readers. */
  readonly label = input('Loading');
}
