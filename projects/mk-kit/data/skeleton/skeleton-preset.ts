import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MkSkeleton } from './skeleton';

/** Ready-made loading layouts for {@link MkSkeletonPreset}. */
export type MkSkeletonPresetKind = 'paragraph' | 'card' | 'list' | 'table';

/**
 * SkeletonPreset — composite loading placeholders assembled from
 * {@link MkSkeleton}: a `paragraph`, a media `card`, an avatar `list` or a
 * `table`. Announces "Loading" to assistive tech; swap it for real content once
 * loaded.
 *
 * ```html
 * <mk-skeleton-preset preset="card" />
 * <mk-skeleton-preset preset="list" [rows]="5" />
 * <mk-skeleton-preset preset="table" [rows]="4" [columns]="5" />
 * ```
 */
@Component({
  selector: 'mk-skeleton-preset',
  templateUrl: './skeleton-preset.html',
  styleUrl: './skeleton-preset.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkSkeleton],
  host: {
    class: 'mk-skeleton-preset',
    role: 'status',
    'aria-busy': 'true',
    '[attr.aria-label]': 'loadingLabel()',
    '[attr.data-preset]': 'preset()',
  },
})
export class MkSkeletonPreset {
  protected readonly i18n = inject(MK_I18N);

  /** Which layout to render. */
  readonly preset = input<MkSkeletonPresetKind>('paragraph');
  /** Number of rows (paragraph lines / list items / table body rows). */
  readonly rows = input(3, { transform: numberAttribute });
  /** Number of columns (table only). */
  readonly columns = input(4, { transform: numberAttribute });
  /** Accessible loading label. */
  readonly loadingLabel = input(this.i18n.loading);

  protected readonly rowRange = computed(() =>
    Array.from({ length: Math.max(1, this.rows()) }, (_, i) => i),
  );
  protected readonly colRange = computed(() =>
    Array.from({ length: Math.max(1, this.columns()) }, (_, i) => i),
  );
}
