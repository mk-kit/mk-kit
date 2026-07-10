import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { mkArcPath, mkFormatCompact } from './chart-utils';

/**
 * Gauge — a single-metric radial dial (a KPI: "68% of quota"). Dependency-free
 * SVG: a track arc with a value arc filled proportionally to `value` on the
 * `[min, max]` scale, and a centred value + label. The sweep is configurable
 * (`arc`, default 270°). Exposes `role="meter"` for assistive tech.
 *
 * ```html
 * <mk-gauge [value]="68" label="of quota" unit="%" />
 * ```
 */
@Component({
  selector: 'mk-gauge',
  templateUrl: './gauge.html',
  styleUrl: './gauge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-gauge',
    role: 'meter',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuetext]': 'centerText()',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkGauge {
  /** The current value. */
  readonly value = input(0, { transform: numberAttribute });
  /** Scale minimum. */
  readonly min = input(0, { transform: numberAttribute });
  /** Scale maximum. */
  readonly max = input(100, { transform: numberAttribute });
  /** Sweep of the arc in degrees (30–360). */
  readonly arc = input(270, { transform: numberAttribute });
  /** Intrinsic size (viewBox units; the SVG scales to its container). */
  readonly size = input(180, { transform: numberAttribute });
  /** Arc thickness. */
  readonly thickness = input(14, { transform: numberAttribute });
  /** Value-arc colour. */
  readonly color = input('var(--mk-primary)');
  /** Track (background arc) colour. */
  readonly trackColor = input('var(--mk-border-subtle)');
  /** Label under the value. */
  readonly label = input('');
  /** Unit appended to the value (e.g. `%`). */
  readonly unit = input('');
  /** Override the centred value text. */
  readonly valueText = input('');

  private readonly TAU = Math.PI * 2;

  protected readonly cx = computed(() => this.size() / 2);
  protected readonly cy = computed(() => this.size() / 2);
  private readonly rOuter = computed(() => this.size() / 2 - 2);
  private readonly rInner = computed(() =>
    Math.max(1, this.rOuter() - this.thickness()),
  );

  /** Value clamped to [min, max] then normalised to 0–1. */
  protected readonly fraction = computed(() => {
    const span = this.max() - this.min() || 1;
    return Math.max(0, Math.min(1, (this.value() - this.min()) / span));
  });

  private readonly sweep = computed(
    () => (Math.max(30, Math.min(360, this.arc())) * Math.PI) / 180,
  );
  /** Arc starts after half the gap, measured clockwise from 6 o'clock. */
  private readonly startAngle = computed(
    () => Math.PI + (this.TAU - this.sweep()) / 2,
  );

  protected readonly trackPath = computed(() =>
    mkArcPath(
      this.cx(),
      this.cy(),
      this.rOuter(),
      this.rInner(),
      this.startAngle(),
      this.startAngle() + this.sweep(),
    ),
  );

  protected readonly valuePath = computed(() => {
    const frac = this.fraction();
    if (frac <= 0) return '';
    return mkArcPath(
      this.cx(),
      this.cy(),
      this.rOuter(),
      this.rInner(),
      this.startAngle(),
      this.startAngle() + this.sweep() * frac,
    );
  });

  protected readonly centerText = computed(
    () => this.valueText() || `${mkFormatCompact(this.value())}${this.unit()}`,
  );

  protected readonly resolvedLabel = computed(() => {
    const l = this.label() ? ` ${this.label()}` : '';
    return `${this.centerText()}${l}`;
  });
}
