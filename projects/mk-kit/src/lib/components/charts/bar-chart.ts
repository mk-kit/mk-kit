import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { MK_I18N } from '../../core/i18n/mk-i18n';
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

interface GridLine {
  value: number;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
}

interface Band {
  label: string;
  labelX: number;
  labelY: number;
}

/** Bar orientation. */
export type MkBarOrientation = 'vertical' | 'horizontal';

/**
 * BarChart — compares a measure across categories with one or more series
 * (grouped or `stacked`), `vertical` (default) or `horizontal`. Dependency-free
 * SVG on the validated `--mk-chart-*` palette; ships a legend for ≥ 2 series, a
 * value axis with gridlines, per-bar hover tooltips and a screen-reader table.
 *
 * ```html
 * <mk-bar-chart orientation="horizontal"
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
  protected readonly i18n = inject(MK_I18N);

  /** Category labels along the category axis. */
  readonly categories = input<readonly string[]>([]);
  /** One or more data series (values align to `categories`). */
  readonly series = input<readonly MkChartSeries[]>([]);
  /** Bar direction. */
  readonly orientation = input<MkBarOrientation>('vertical');
  /** Intrinsic width (viewBox units; the SVG scales to its container). */
  readonly width = input(480, { transform: numberAttribute });
  /** Intrinsic height. */
  readonly height = input(260, { transform: numberAttribute });
  /** Stack series into one bar per category instead of grouping. */
  readonly stacked = input(false, { transform: booleanAttribute });
  /** Show gridlines behind the bars. */
  readonly showGrid = input(true, { transform: booleanAttribute });
  /** Force the legend on/off (defaults to on when there are ≥ 2 series). */
  readonly showLegend = input<boolean | undefined>(undefined);
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  protected readonly hovered = signal<BarRect | null>(null);

  protected readonly horizontal = computed(
    () => this.orientation() === 'horizontal',
  );

  private readonly margin = computed(() =>
    this.horizontal()
      ? { top: 10, right: 18, bottom: 28, left: 72 }
      : { top: 14, right: 14, bottom: 30, left: 44 },
  );

  protected readonly plot = computed(() => {
    const m = this.margin();
    return {
      x: m.left,
      y: m.top,
      w: Math.max(this.width() - m.left - m.right, 1),
      h: Math.max(this.height() - m.top - m.bottom, 1),
    };
  });

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

  protected readonly ticks = computed(() => mkNiceTicks(0, this.maxValue(), 5));
  private readonly tickMax = computed(() => {
    const t = this.ticks();
    return t[t.length - 1] || 1;
  });

  /** Pixel position along the value axis for a value. */
  private readonly valuePos = computed(() => {
    const { x, y, w, h } = this.plot();
    const max = this.tickMax();
    return this.horizontal()
      ? (v: number) => x + (v / max) * w
      : (v: number) => y + h - (v / max) * h;
  });

  /** Gridlines + value-axis labels (orientation-aware). */
  protected readonly gridRows = computed<GridLine[]>(() => {
    const { x, y, w, h } = this.plot();
    const pos = this.valuePos();
    return this.ticks().map((value) => {
      const label = mkFormatCompact(value);
      if (this.horizontal()) {
        const gx = pos(value);
        return { value, label, x1: gx, y1: y, x2: gx, y2: y + h, labelX: gx, labelY: y + h + 16 };
      }
      const gy = pos(value);
      return { value, label, x1: x, y1: gy, x2: x + w, y2: gy, labelX: x - 8, labelY: gy };
    });
  });

  /** Category-axis labels. */
  protected readonly bands = computed<Band[]>(() => {
    const cats = this.categories();
    const { x, y, w, h } = this.plot();
    if (this.horizontal()) {
      const bandH = h / (cats.length || 1);
      return cats.map((label, i) => ({
        label,
        labelX: x - 8,
        labelY: y + i * bandH + bandH / 2,
      }));
    }
    const bandW = w / (cats.length || 1);
    return cats.map((label, i) => ({
      label,
      labelX: x + i * bandW + bandW / 2,
      labelY: this.height() - 10,
    }));
  });

  /** All bar rectangles (grouped or stacked, vertical or horizontal). */
  protected readonly bars = computed<BarRect[]>(() => {
    const series = this.series();
    const cats = this.categories();
    const colors = this.colors();
    const { x, y, w, h } = this.plot();
    const pos = this.valuePos();
    const base = this.horizontal() ? x : y + h;
    const out: BarRect[] = [];
    const bandSize = (this.horizontal() ? h : w) / (cats.length || 1);

    const push = (
      c: number,
      s: number,
      value: number,
      along: number, // offset within the band (cross-axis)
      thick: number,
      startVal: number,
    ) => {
      const bandStart = (this.horizontal() ? y : x) + c * bandSize + along;
      const p0 = pos(startVal);
      const p1 = pos(startVal + Math.max(value, 0));
      if (this.horizontal()) {
        out.push({ x: Math.min(p0, p1), y: bandStart, w: Math.abs(p1 - p0), h: thick, color: colors[s], seriesIndex: s, categoryIndex: c, value });
      } else {
        out.push({ x: bandStart, y: Math.min(p0, p1), w: thick, h: Math.abs(p1 - p0), color: colors[s], seriesIndex: s, categoryIndex: c, value });
      }
    };

    if (this.stacked()) {
      const barThick = bandSize * 0.6;
      const along = (bandSize - barThick) / 2;
      for (let c = 0; c < cats.length; c++) {
        let acc = 0;
        for (let s = 0; s < series.length; s++) {
          const v = Math.max(series[s].data[c] ?? 0, 0);
          if (v <= 0) continue;
          push(c, s, v, along, barThick, acc);
          acc += v;
        }
      }
    } else {
      const n = series.length || 1;
      const groupThick = bandSize * 0.7;
      const barThick = groupThick / n;
      for (let c = 0; c < cats.length; c++) {
        for (let s = 0; s < series.length; s++) {
          const v = series[s].data[c] ?? 0;
          const along = (bandSize - groupThick) / 2 + s * barThick;
          push(c, s, v, along, Math.max(barThick - 2, 1), 0);
        }
      }
    }
    // `base` referenced to satisfy the linter when value axes start at 0.
    void base;
    return out;
  });

  protected readonly legend = computed(() =>
    this.series().map((s, i) => ({ name: s.name, color: this.colors()[i] })),
  );

  /** Tooltip position (percent of viewBox) + content for the hovered bar. */
  protected readonly tooltip = computed(() => {
    const b = this.hovered();
    if (!b) return null;
    const [px, py] = this.horizontal()
      ? [b.x + b.w, b.y + b.h / 2]
      : [b.x + b.w / 2, b.y];
    return {
      left: (px / this.width()) * 100,
      top: (py / this.height()) * 100,
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
