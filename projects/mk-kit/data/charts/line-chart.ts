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
import { MK_I18N } from '@mkornas/ui/core';
import { mkChartAutoWidth } from './chart-autowidth';
import {
  MkChartSeries,
  MkPoint,
  mkAreaPath,
  mkChartColor,
  mkFormatCompact,
  mkLinePath,
  mkNiceTicks,
} from './chart-utils';

const MARGIN = { top: 14, right: 16, bottom: 30, left: 44 };

/** Closed path filling between an upper (`top`) and lower (`bottom`) line. */
function stackedAreaPath(
  top: readonly MkPoint[],
  bottom: readonly MkPoint[],
): string {
  if (!top.length) return '';
  const topLine = top
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
    .join(' ');
  const botLine = [...bottom]
    .reverse()
    .map((p) => `L${p.x} ${p.y}`)
    .join(' ');
  return `${topLine} ${botLine} Z`;
}

/**
 * LineChart — a line (or `area`) chart for change over time / ordered
 * categories, with one or more series. Dependency-free SVG on the validated
 * `--mk-chart-*` palette; ships a legend for ≥ 2 series, a value axis, a
 * hover crosshair with a shared tooltip, and a screen-reader data table.
 *
 * ```html
 * <mk-line-chart area
 *   [categories]="months"
 *   [series]="[{ name: 'Sessions', data: sessions() }]" />
 * ```
 */
@Component({
  selector: 'mk-line-chart',
  templateUrl: './line-chart.html',
  styleUrl: './charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-line-chart',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkLineChart {
  /** Measured host width (falls back to `width` before first measure). */
  private readonly autoWidth = mkChartAutoWidth(computed(() => this.width()));
  /** The viewBox width the geometry is drawn against. */
  protected readonly drawWidth = computed(() =>
    this.responsive() ? this.autoWidth() : this.width(),
  );
  protected readonly i18n = inject(MK_I18N);

  /** Ordered category labels along the x axis. */
  readonly categories = input<readonly string[]>([]);
  /** One or more data series (values align to `categories`). */
  readonly series = input<readonly MkChartSeries[]>([]);
  /** Intrinsic width in viewBox units — the fallback before the host is
   *  measured, and the fixed drawing width when `responsive` is off. */
  readonly width = input(480, { transform: numberAttribute });
  /**
   * Match the viewBox width to the host's actual width so `height` means
   * pixels and a wide container no longer stretches the chart vertically.
   * Set false to pin the drawing to `width` (the pre-0.8 behaviour).
   */
  readonly responsive = input(true, { transform: booleanAttribute });
  /** Intrinsic height. */
  readonly height = input(260, { transform: numberAttribute });
  /** Fill the area under each line. */
  readonly area = input(false, { transform: booleanAttribute });
  /** Stack the series (cumulative bands) — implies filled areas. */
  readonly stacked = input(false, { transform: booleanAttribute });
  /** Draw a dot at every data point. */
  readonly showDots = input(false, { transform: booleanAttribute });
  /** Show gridlines. */
  readonly showGrid = input(true, { transform: booleanAttribute });
  /** Force the legend on/off (defaults to on when there are ≥ 2 series). */
  readonly showLegend = input<boolean | undefined>(undefined);
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  protected readonly hoverIndex = signal<number | null>(null);

  protected readonly plot = computed(() => ({
    x: MARGIN.left,
    y: MARGIN.top,
    w: Math.max(this.drawWidth() - MARGIN.left - MARGIN.right, 1),
    h: Math.max(this.height() - MARGIN.top - MARGIN.bottom, 1),
  }));

  protected readonly colors = computed(() =>
    this.series().map((s, i) => s.color ?? mkChartColor(i)),
  );
  protected readonly legendVisible = computed(
    () => this.showLegend() ?? this.series().length > 1,
  );

  private readonly extent = computed<[number, number]>(() => {
    const series = this.series();
    if (!series.length) return [0, 1];
    if (this.stacked()) {
      const n = Math.max(0, ...series.map((s) => s.data.length));
      let max = 0;
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (const s of series) sum += Math.max(s.data[i] ?? 0, 0);
        max = Math.max(max, sum);
      }
      return [0, max || 1];
    }
    const values = series.flatMap((s) => s.data);
    if (!values.length) return [0, 1];
    return [Math.min(...values, 0), Math.max(...values)];
  });

  protected readonly ticks = computed(() => {
    const [lo, hi] = this.extent();
    return mkNiceTicks(lo, hi, 5);
  });
  private readonly domain = computed<[number, number]>(() => {
    const t = this.ticks();
    return [t[0], t[t.length - 1]];
  });

  private readonly toY = computed(() => {
    const { y, h } = this.plot();
    const [lo, hi] = this.domain();
    const span = hi - lo || 1;
    return (v: number) => y + h - ((v - lo) / span) * h;
  });
  private readonly xAt = computed(() => {
    const cats = this.categories();
    const { x, w } = this.plot();
    const step = cats.length > 1 ? w / (cats.length - 1) : 0;
    return (i: number) => (cats.length > 1 ? x + i * step : x + w / 2);
  });

  protected readonly gridRows = computed(() => {
    const { y, h } = this.plot();
    const [lo, hi] = this.domain();
    const span = hi - lo || 1;
    return this.ticks().map((value) => ({
      value,
      label: mkFormatCompact(value),
      y: y + h - ((value - lo) / span) * h,
    }));
  });

  /** Per-series rendered geometry (points + line + area paths). */
  protected readonly rendered = computed(() => {
    const toY = this.toY();
    const xAt = this.xAt();
    const series = this.series();

    if (this.stacked()) {
      const n = Math.max(0, ...series.map((s) => s.data.length));
      const running = new Array<number>(n).fill(0);
      return series.map((s, si) => {
        const bottom: MkPoint[] = running.map((v, i) => ({ x: xAt(i), y: toY(v) }));
        for (let i = 0; i < n; i++) running[i] += Math.max(s.data[i] ?? 0, 0);
        const top: MkPoint[] = running.map((v, i) => ({ x: xAt(i), y: toY(v) }));
        return {
          name: s.name,
          color: this.colors()[si],
          points: top,
          line: mkLinePath(top),
          area: stackedAreaPath(top, bottom),
        };
      });
    }

    const baseline = toY(this.domain()[0]);
    return series.map((s, si) => {
      const points: MkPoint[] = s.data.map((v, i) => ({ x: xAt(i), y: toY(v) }));
      return {
        name: s.name,
        color: this.colors()[si],
        points,
        line: mkLinePath(points),
        area: mkAreaPath(points, baseline),
      };
    });
  });

  /** Whether to paint the filled areas. */
  protected readonly fillAreas = computed(() => this.area() || this.stacked());

  /** Transparent hit bands (one per category) driving the shared tooltip. */
  protected readonly hitBands = computed(() => {
    const cats = this.categories();
    const { x, w, y, h } = this.plot();
    const bandW = cats.length ? w / cats.length : w;
    return cats.map((_, i) => ({
      index: i,
      x: this.xAt()(i) - bandW / 2,
      y,
      w: bandW,
      h,
    }));
  });

  protected readonly crosshairX = computed(() => {
    const i = this.hoverIndex();
    return i == null ? null : this.xAt()(i);
  });

  protected readonly legend = computed(() =>
    this.series().map((s, i) => ({ name: s.name, color: this.colors()[i] })),
  );

  /** Hovered-point markers + tooltip payload for the active category. */
  protected readonly activePoints = computed(() => {
    const i = this.hoverIndex();
    if (i == null) return [];
    return this.rendered().map((r) => ({
      color: r.color,
      name: r.name,
      x: r.points[i]?.x ?? 0,
      y: r.points[i]?.y ?? 0,
      value: this.series().find((s) => s.name === r.name)?.data[i] ?? 0,
    }));
  });

  protected readonly tooltip = computed(() => {
    const i = this.hoverIndex();
    const pts = this.activePoints();
    if (i == null || !pts.length) return null;
    const topY = Math.min(...pts.map((p) => p.y));
    return {
      left: (this.xAt()(i) / this.drawWidth()) * 100,
      top: (topY / this.height()) * 100,
      category: this.categories()[i],
      rows: pts.map((p) => ({
        color: p.color,
        name: p.name,
        value: mkFormatCompact(p.value),
      })),
      multi: this.series().length > 1,
    };
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const s = this.series();
    if (!s.length) return 'Line chart, no data';
    return `Line chart of ${s.map((x) => x.name).join(', ')} over ${this.categories().length} points`;
  });

  protected setHover(index: number | null): void {
    this.hoverIndex.set(index);
  }
}
