import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import type { MkSize, MkTone } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';

/**
 * Progress bar — a determinate (0–100) or indeterminate progress indicator
 * with `role="progressbar"`. `aria-valuenow` is omitted while indeterminate.
 * The indeterminate animation respects `prefers-reduced-motion`.
 *
 * ```html
 * <mk-progress-bar [value]="uploaded()" label="Uploading" showValue />
 * <mk-progress-bar indeterminate label="Loading" />
 * ```
 */
@Component({
  selector: 'mk-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-progress-bar',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[class.mk-progress-bar--sm]': "size() === 'sm'",
    '[class.mk-progress-bar--md]': "size() === 'md'",
    '[class.mk-progress-bar--lg]': "size() === 'lg'",
    '[class.mk-progress-bar--indeterminate]': 'indeterminate()',
    '[attr.data-tone]': 'tone()',
    '[attr.aria-valuenow]': 'indeterminate() ? null : clamped()',
    '[attr.aria-labelledby]': 'label() ? labelId : null',
    '[attr.aria-label]': "label() ? null : 'Progress'",
  },
})
export class MkProgressBar {
  /** Completion percentage 0–100 (ignored while indeterminate). */
  readonly value = input(0, { transform: numberAttribute });
  /** Show an animated indeterminate bar with no known completion. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Semantic color tone of the fill. */
  readonly tone = input<MkTone>('primary');
  /** Track thickness. */
  readonly size = input<MkSize>('md');
  /** Optional visible caption; also labels the bar for assistive tech. */
  readonly label = input<string>();
  /** Show the numeric percentage next to the label (determinate only). */
  readonly showValue = input(false, { transform: booleanAttribute });

  protected readonly labelId = mkUniqueId('mk-progress-label');

  /** Value clamped into the valid 0–100 range and rounded. */
  protected readonly clamped = computed(() =>
    Math.round(Math.min(100, Math.max(0, this.value()))),
  );

  /**
   * Inline transform for the determinate fill. Scaling instead of animating
   * `width` keeps the transition compositor-only (no layout per frame).
   */
  protected readonly fillTransform = computed(
    () => `scaleX(${this.clamped() / 100})`,
  );
}
