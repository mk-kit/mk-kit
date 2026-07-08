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
  MkChartSeries,
  mkChartColor,
  mkFormatCompact,
  mkNiceTicks,
} from './chart-utils';

interface BarRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  seriesIndex: number;
  categoryIndex: number;
  value: number;
}

const MARGIN = { top: 14, right: 14, bottom: 30, left: 44 };

/**
 * BarChart — a vertical bar chart for comparing a measure across categories,
 * with one or more series (grouped or `stacked`). Dependency-free SVG themed by
 * the validated `--mk-chart-*` palette; ships a legend for ≥ 2 series, a value
 * axis with gridlines, per-bar hover tooltips and a screen-reader data table.
 *
 * ```html
 * <mk-bar-chart
 *   [categories]="['Q1','Q2','Q3','Q4']"
 *   [series]="[{ name: 'Revenue', data: [12,19,15,22] }]" />
 * ```
 */
@Component({
  selector: 'mk-bar-chart',
  templateUrl: './bar-chart.html',
  styleUrl: './charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-bar-chart',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkBarChart {
  /** Category labels along the x axis. */
  readonly categories = input<readonly string[]>([]);
  /** One or more data series (values align to `categories`). */
  readonly series = input<readonly MkChartSeries[]>([]);
  /** Intrinsic width (viewBox units; the SVG scales to its container). */
  readonly width = input(480, { transform: numberAttribute });
  /** Intrinsic height. */
  readonly height = input(260, { transform: numberAttribute });
  /** Stack series into one column per category instead of grouping. */
  readonly stacked = input(false, { transform: booleanAttribute });
  /** Show gridlines behind the bars. */
  readonly showGrid = input(true, { transform: booleanAttribute });
  /** Force the legend on/off (defaults to on when there are ≥ 2 series). */
  readonly showLegend = input<boolean | undefined>(undefined);
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  protected readonly hovered = signal<BarRect | null>(null);

  protected readonly plot = computed(() => ({
    x: MARGIN.left,
    y: MARGIN.top,
    w: Math.max(this.width() - MARGIN.left - MARGIN.right, 1),
    h: Math.max(this.height() - MARGIN.top - MARGIN.bottom, 1),
  }));

  protected readonly colors = computed(() =>
    this.series().map((s, i) => s.color ?? mkChartColor(i)),
  );

  protected readonly legendVisible = computed(
    () => this.showLegend() ?? this.series().length > 1,
  );

  private readonly maxValue = computed(() => {
    const series = this.series();
    const cats = this.categories();
    if (!series.length || !cats.length) return 1;
    if (this.stacked()) {
      let max = 0;
      for (let c = 0; c < cats.length; c++) {
        let sum = 0;
        for (const s of series) sum += Math.max(s.data[c] ?? 0, 0);
        max = Math.max(max, sum);
      }
      return max || 1;
    }
    return Math.max(1, ...series.flatMap((s) => s.data.map((v) => v || 0)));
  });

  protected readonly ticks = computed(() =>
    mkNiceTicks(0, this.maxValue(), 5),
  );
  private readonly tickMax = computed(() => {
    const t = this.ticks();
    return t[t.length - 1] || 1;
  });

  /** Gridline + axis label rows. */
  protected readonly gridRows = computed(() => {
    const { y, h } = this.plot();
    return this.ticks().map((value) => ({
      value,
      label: mkFormatCompact(value),
      y: y + h - (value / this.tickMax()) * h,
    }));
  });

  /** x-axis band metadata per category. */
  protected readonly bands = computed(() => {
    const cats = this.categories();
    const { x, w, y, h } = this.plot();
    const bandW = w / (cats.length || 1);
    return cats.map((label, i) => ({
      label,
      x: x + i * bandW,
      cx: x + i * bandW + bandW / 2,
      w: bandW,
      y: y + h,
    }));
  });

  /** All bar rectangles (grouped or stacked). */
  protected readonly bars = computed<BarRect[]>(() => {
    const series = this.series();
    const cats = this.categories();
    const colors = this.colors();
    const { y, h, w, x } = this.plot();
    const bandW = w / (cats.length || 1);
    const toY = (v: number) => y + h - (v / this.tickMax()) * h;
    const out: BarRect[] = [];

    if (this.stacked()) {
      const barW = bandW * 0.6;
      for (let c = 0; c < cats.length; c++) {
        let acc = 0;
        for (let s = 0; s < series.length; s++) {
          const v = Math.max(series[s].data[c] ?? 0, 0);
          if (v <= 0) continue;
          const yTop = toY(acc + v);
          const yBottom = toY(acc);
          out.push({
            x: x + c * bandW + (bandW - barW) / 2,
            y: yTop,
            w: barW,
            h: Math.max(yBottom - yTop, 0),
            color: colors[s],
            seriesIndex: s,
            categoryIndex: c,
            value: series[s].data[c] ?? 0,
          });
          acc += v;
        }
      }
    } else {
      const n = series.length || 1;
      const groupW = bandW * 0.7;
      const barW = groupW / n;
      for (let c = 0; c < cats.length; c++) {
        for (let s = 0; s < series.length; s++) {
          const v = series[s].data[c] ?? 0;
          const yTop = toY(Math.max(v, 0));
          out.push({
            x: x + c * bandW + (bandW - groupW) / 2 + s * barW,
            y: yTop,
            w: Math.max(barW - 2, 1),
            h: Math.max(y + h - yTop, 0),
            color: colors[s],
            seriesIndex: s,
            categoryIndex: c,
            value: v,
          });
        }
      }
    }
    return out;
  });

  /** Legend entries. */
  protected readonly legend = computed(() =>
    this.series().map((s, i) => ({ name: s.name, color: this.colors()[i] })),
  );

  /** Tooltip position (percent of viewBox) + content for the hovered bar. */
  protected readonly tooltip = computed(() => {
    const b = this.hovered();
    if (!b) return null;
    return {
      left: ((b.x + b.w / 2) / this.width()) * 100,
      top: (b.y / this.height()) * 100,
      category: this.categories()[b.categoryIndex],
      series: this.series()[b.seriesIndex]?.name ?? '',
      color: b.color,
      value: mkFormatCompact(b.value),
      multi: this.series().length > 1,
    };
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const s = this.series();
    const cats = this.categories();
    if (!s.length || !cats.length) return 'Bar chart, no data';
    return `Bar chart of ${s.map((x) => x.name).join(', ')} across ${cats.length} categories`;
  });

  protected setHover(bar: BarRect | null): void {
    this.hovered.set(bar);
  }
}
