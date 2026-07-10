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
  mkChartColor,
  mkFormatCompact,
  mkLinearScale,
  mkNiceTicks,
} from './chart-utils';

/** A single plotted point. `size` (optional) turns it into a bubble. */
export interface MkScatterPoint {
  x: number;
  y: number;
  /** Value driving the bubble radius when `bubble` sizing is used. */
  size?: number;
  /** Optional label shown in the tooltip. */
  label?: string;
}

/** A named group of scatter points sharing a colour. */
export interface MkScatterSeries {
  name: string;
  color?: string;
  points: readonly MkScatterPoint[];
}

const MARGIN = { top: 14, right: 16, bottom: 34, left: 48 };

interface RenderedPoint {
  cx: number;
  cy: number;
  r: number;
  color: string;
  seriesName: string;
  x: number;
  y: number;
  label?: string;
}

/**
 * ScatterChart — plot (x, y) points across two numeric axes to reveal
 * correlation and clusters. Give each point a `size` to render a bubble chart.
 * Dependency-free SVG on the validated `--mk-chart-*` palette; ships nice-tick
 * axes, a legend for ≥ 2 series, a per-point hover tooltip and a screen-reader
 * data table.
 *
 * ```html
 * <mk-scatter-chart
 *   xLabel="Spend" yLabel="Revenue"
 *   [series]="[{ name: 'Q3', points: pts() }]" />
 * ```
 */
@Component({
  selector: 'mk-scatter-chart',
  templateUrl: './scatter-chart.html',
  styleUrl: './charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-scatter-chart',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkScatterChart {
  protected readonly i18n = inject(MK_I18N);

  /** One or more point series. */
  readonly series = input<readonly MkScatterSeries[]>([]);
  /** Intrinsic width (viewBox units; the SVG scales to its container). */
  readonly width = input(480, { transform: numberAttribute });
  /** Intrinsic height. */
  readonly height = input(300, { transform: numberAttribute });
  /** Radius of each point when not sizing by `size`. */
  readonly pointRadius = input(4, { transform: numberAttribute });
  /** Size points by their `size` value (bubble chart). */
  readonly bubble = input(false, { transform: booleanAttribute });
  /** Largest bubble radius when `bubble` is on. */
  readonly maxRadius = input(20, { transform: numberAttribute });
  /** Show gridlines. */
  readonly showGrid = input(true, { transform: booleanAttribute });
  /** Force the legend on/off (defaults to on when there are ≥ 2 series). */
  readonly showLegend = input<boolean | undefined>(undefined);
  /** x-axis title. */
  readonly xLabel = input<string>('');
  /** y-axis title. */
  readonly yLabel = input<string>('');
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  protected readonly hoverKey = signal<string | null>(null);

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

  private readonly allPoints = computed(() =>
    this.series().flatMap((s) => s.points),
  );

  private readonly xExtent = computed<[number, number]>(() => {
    const xs = this.allPoints().map((p) => p.x);
    return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 1];
  });
  private readonly yExtent = computed<[number, number]>(() => {
    const ys = this.allPoints().map((p) => p.y);
    return ys.length ? [Math.min(...ys), Math.max(...ys)] : [0, 1];
  });

  protected readonly xTicks = computed(() =>
    mkNiceTicks(this.xExtent()[0], this.xExtent()[1], 5),
  );
  protected readonly yTicks = computed(() =>
    mkNiceTicks(this.yExtent()[0], this.yExtent()[1], 5),
  );

  private readonly xScale = computed(() => {
    const t = this.xTicks();
    const { x, w } = this.plot();
    return mkLinearScale(t[0], t[t.length - 1], x, x + w);
  });
  private readonly yScale = computed(() => {
    const t = this.yTicks();
    const { y, h } = this.plot();
    // Invert: larger values sit higher on the screen.
    return mkLinearScale(t[0], t[t.length - 1], y + h, y);
  });

  private readonly sizeExtent = computed<[number, number]>(() => {
    const sizes = this.allPoints().map((p) => p.size ?? 0);
    return sizes.length ? [Math.min(...sizes), Math.max(...sizes)] : [0, 1];
  });

  private radiusFor(size: number | undefined): number {
    if (!this.bubble()) return this.pointRadius();
    const [lo, hi] = this.sizeExtent();
    const span = hi - lo || 1;
    const t = ((size ?? lo) - lo) / span;
    // Area-proportional so perceived size tracks value; floor at 3px.
    const min = 3;
    return min + Math.sqrt(t) * (this.maxRadius() - min);
  }

  /** Gridlines + axis-tick geometry. */
  protected readonly xGrid = computed(() => {
    const { y, h } = this.plot();
    return this.xTicks().map((value) => ({
      value,
      label: mkFormatCompact(value),
      x: this.xScale()(value),
      y1: y,
      y2: y + h,
    }));
  });
  protected readonly yGrid = computed(() => {
    const { x, w } = this.plot();
    return this.yTicks().map((value) => ({
      value,
      label: mkFormatCompact(value),
      y: this.yScale()(value),
      x1: x,
      x2: x + w,
    }));
  });

  /** Every point positioned for rendering. */
  protected readonly points = computed<RenderedPoint[]>(() => {
    const xs = this.xScale();
    const ys = this.yScale();
    return this.series().flatMap((s, si) =>
      s.points.map((p) => ({
        cx: xs(p.x),
        cy: ys(p.y),
        r: this.radiusFor(p.size),
        color: this.colors()[si],
        seriesName: s.name,
        x: p.x,
        y: p.y,
        label: p.label,
      })),
    );
  });

  protected keyOf(index: number): string {
    return `p${index}`;
  }

  protected readonly legend = computed(() =>
    this.series().map((s, i) => ({ name: s.name, color: this.colors()[i] })),
  );

  protected readonly tooltip = computed(() => {
    const key = this.hoverKey();
    if (key == null) return null;
    const idx = Number(key.slice(1));
    const p = this.points()[idx];
    if (!p) return null;
    return {
      left: (p.cx / this.width()) * 100,
      top: (p.cy / this.height()) * 100,
      color: p.color,
      title: p.label ?? p.seriesName,
      x: mkFormatCompact(p.x),
      y: mkFormatCompact(p.y),
    };
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const s = this.series();
    if (!s.length) return 'Scatter chart, no data';
    const total = this.allPoints().length;
    return `Scatter chart of ${s.map((x) => x.name).join(', ')}, ${total} points`;
  });

  protected setHover(key: string | null): void {
    this.hoverKey.set(key);
  }
}
