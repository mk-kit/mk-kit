import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import type { MkTone } from '../../core/types';

/**
 * ProgressRing — a circular progress indicator. Determinate by default (an arc
 * proportional to `value`); set `indeterminate` for a spinner-style preloader
 * when progress is unknown. Themed by `tone`, sized by `size`.
 *
 * ```html
 * <mk-progress-ring [value]="uploaded()" showLabel />
 * <mk-progress-ring indeterminate tone="neutral" [size]="24" />
 * <mk-progress-ring [value]="72" tone="success"><mk-icon name="check" /></mk-progress-ring>
 * ```
 */
@Component({
  selector: 'mk-progress-ring',
  templateUrl: './progress-ring.html',
  styleUrl: './progress-ring.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-progress-ring',
    '[class.mk-progress-ring--indeterminate]': 'indeterminate()',
    '[attr.data-tone]': 'tone()',
    role: 'progressbar',
    '[attr.aria-valuenow]': 'indeterminate() ? null : clampedValue()',
    '[attr.aria-valuemin]': 'indeterminate() ? null : 0',
    '[attr.aria-valuemax]': 'indeterminate() ? null : max()',
    '[attr.aria-label]': 'label() || null',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class MkProgressRing {
  /** Current progress value (clamped to `[0, max]`). Ignored when indeterminate. */
  readonly value = input(0, { transform: numberAttribute });
  /** Maximum value. Default `100`. */
  readonly max = input(100, { transform: numberAttribute });
  /** Diameter in px. Default `48`. */
  readonly size = input(48, { transform: numberAttribute });
  /** Ring thickness in px. Default `4`. */
  readonly thickness = input(4, { transform: numberAttribute });
  /** Semantic colour of the progress arc. */
  readonly tone = input<MkTone>('primary');
  /** Show a rotating arc for unknown-duration work (a circular preloader). */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Show the percentage in the centre. */
  readonly showLabel = input(false, { transform: booleanAttribute });
  /** Accessible label (recommended, especially when indeterminate). */
  readonly label = input<string>('');

  protected readonly clampedValue = computed(() =>
    Math.min(Math.max(this.value(), 0), this.max()),
  );
  protected readonly fraction = computed(() =>
    this.max() > 0 ? this.clampedValue() / this.max() : 0,
  );
  protected readonly percent = computed(() => Math.round(this.fraction() * 100));

  protected readonly radius = computed(() => (this.size() - this.thickness()) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
  /** Dash offset that reveals `fraction` of the circle. */
  protected readonly dashOffset = computed(() =>
    this.circumference() * (1 - this.fraction()),
  );
  protected readonly center = computed(() => this.size() / 2);
}
