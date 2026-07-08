import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import {
  MkChartSlice,
  mkArcPath,
  mkChartColor,
  mkFormatCompact,
} from './chart-utils';

interface SliceGeom {
  name: string;
  value: number;
  color: string;
  path: string;
  percent: number;
  midAngle: number;
  index: number;
}

/**
 * DonutChart — proportions of a whole as a ring (or a full pie when
 * `thickness` covers the radius). Dependency-free SVG on the validated
 * `--mk-chart-*` palette; ships a value/percent legend, per-slice hover
 * tooltips, an optional centre label, and a screen-reader data table.
 *
 * ```html
 * <mk-donut-chart centerLabel="1,240" centerSublabel="Total"
 *   [slices]="[{ name: 'Direct', value: 540 }, { name: 'Search', value: 700 }]" />
 * ```
 */
@Component({
  selector: 'mk-donut-chart',
  templateUrl: './donut-chart.html',
  styleUrl: './charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-donut-chart',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkDonutChart {
  /** The slices; each `value` contributes to the whole. */
  readonly slices = input<readonly MkChartSlice[]>([]);
  /** Diameter in viewBox units (the SVG scales to its container). */
  readonly size = input(220, { transform: numberAttribute });
  /** Ring thickness. Set `0` (or ≥ radius) for a full pie. */
  readonly thickness = input(34, { transform: numberAttribute });
  /** Show the legend with values + percentages. */
  readonly showLegend = input(true, { transform: booleanAttribute });
  /** Big centre label (e.g. a total). Donut only. */
  readonly centerLabel = input<string>('');
  /** Small centre caption under the label. */
  readonly centerSublabel = input<string>('');
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  protected readonly hovered = signal<number | null>(null);

  protected readonly total = computed(() =>
    this.slices().reduce((sum, s) => sum + Math.max(s.value, 0), 0),
  );

  protected readonly center = computed(() => this.size() / 2);
  protected readonly outerRadius = computed(() => this.size() / 2 - 2);
  protected readonly innerRadius = computed(() => {
    const outer = this.outerRadius();
    const t = this.thickness();
    return t <= 0 || t >= outer ? 0 : outer - t;
  });

  protected readonly geom = computed<SliceGeom[]>(() => {
    const total = this.total();
    if (total <= 0) return [];
    const cx = this.center();
    const cy = this.center();
    const outer = this.outerRadius();
    const inner = this.innerRadius();
    let angle = 0;
    return this.slices().map((s, i) => {
      const frac = Math.max(s.value, 0) / total;
      const start = angle;
      // Leave the smallest gap so a single 100% slice still renders as a ring.
      const end = angle + frac * Math.PI * 2 * 0.99999;
      angle += frac * Math.PI * 2;
      return {
        name: s.name,
        value: s.value,
        color: s.color ?? mkChartColor(i),
        path: mkArcPath(cx, cy, outer, inner, start, end),
        percent: Math.round(frac * 100),
        midAngle: (start + end) / 2,
        index: i,
      };
    });
  });

  protected readonly legend = computed(() =>
    this.geom().map((g) => ({
      name: g.name,
      color: g.color,
      value: mkFormatCompact(g.value),
      percent: g.percent,
    })),
  );

  protected readonly tooltip = computed(() => {
    const i = this.hovered();
    if (i == null) return null;
    const g = this.geom().find((x) => x.index === i);
    if (!g) return null;
    const r = (this.outerRadius() + this.innerRadius()) / 2;
    const x = this.center() + r * Math.sin(g.midAngle);
    const y = this.center() - r * Math.cos(g.midAngle);
    return {
      left: (x / this.size()) * 100,
      top: (y / this.size()) * 100,
      name: g.name,
      color: g.color,
      value: mkFormatCompact(g.value),
      percent: g.percent,
    };
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const s = this.slices();
    if (!s.length) return 'Donut chart, no data';
    return `Donut chart with ${s.length} slices totalling ${mkFormatCompact(this.total())}`;
  });

  protected setHover(index: number | null): void {
    this.hovered.set(index);
  }
}
