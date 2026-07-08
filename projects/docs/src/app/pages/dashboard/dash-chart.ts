import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Lightweight, dependency-free area+line chart rendered as inline SVG and
 * themed entirely with `--mk-*` tokens. Used by the dashboard example.
 */
@Component({
  selector: 'dash-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      class="dash-chart"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      @for (g of gridlines; track g) {
        <line x1="0" [attr.y1]="g" x2="100" [attr.y2]="g" class="dash-chart__grid" />
      }
      <path [attr.d]="area()" class="dash-chart__area" />
      <polyline
        [attr.points]="line()"
        class="dash-chart__line"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .dash-chart {
        width: 100%;
        height: 180px;
        overflow: visible;
      }
      .dash-chart__grid {
        stroke: var(--mk-border);
        stroke-width: 0.25;
      }
      .dash-chart__area {
        fill: var(--mk-primary);
        opacity: 0.12;
      }
      .dash-chart__line {
        fill: none;
        stroke: var(--mk-primary);
        stroke-width: 2;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
    `,
  ],
})
export class DashChart {
  /** Series values (evenly spaced along the x-axis). */
  readonly data = input<number[]>([]);
  /** Accessible description of the series. */
  readonly ariaLabel = input('Trend chart');

  protected readonly gridlines = [10, 20, 30];

  private readonly points = computed(() => {
    const d = this.data();
    const n = d.length;
    if (n < 2) return [];
    const max = Math.max(...d, 1);
    return d.map((v, i) => ({
      x: (i / (n - 1)) * 100,
      y: 38 - (v / max) * 34,
    }));
  });

  protected readonly line = computed(() =>
    this.points()
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' '),
  );

  protected readonly area = computed(() => {
    const p = this.points();
    if (!p.length) return '';
    return (
      'M0,40 ' +
      p.map((pt) => `L${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ') +
      ' L100,40 Z'
    );
  });
}
