import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import type { MkSize, MkTone } from '@mkornas/ui/core';

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
  styleUrl: './spinner.scss',
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
  protected readonly i18n = inject(MK_I18N);

  /** Size scale. */
  readonly size = input<MkSize>('md');
  /** Semantic color tone. */
  readonly tone = input<MkTone>('primary');
  /** Visually-hidden status label announced to screen readers. */
  readonly label = input(this.i18n.loading);
}
