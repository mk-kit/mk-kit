import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import {
  MkChartSeries,
  mkChartColor,
  mkFormatCompact,
  mkNiceTicks,
} from './chart-utils';

interface RadarPoint {
  x: number;
  y: number;
}
interface RadarSeries {
  name: string;
  color: string;
  polygon: string;
  points: RadarPoint[];
}
interface RadarAxis {
  label: string;
  x: number;
  y: number;
  lx: number;
  ly: number;
  anchor: 'start' | 'middle' | 'end';
}

/**
 * RadarChart — a radar / spider chart comparing several series across the same
 * set of axes (skills, product profiles, survey dimensions). Dependency-free
 * SVG on the validated `--mk-chart-*` palette; ships concentric grid rings, a
 * legend for ≥ 2 series and a screen-reader data table.
 *
 * ```html
 * <mk-radar-chart
 *   [axes]="['Speed','Power','Range','Cost','Ease']"
 *   [series]="[{ name: 'Model A', data: [8,6,7,5,9] }]" />
 * ```
 */
@Component({
  selector: 'mk-radar-chart',
  templateUrl: './radar-chart.html',
  styleUrl: './charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-radar-chart',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkRadarChart {
  protected readonly i18n = inject(MK_I18N);

  /** Axis labels (one spoke each). Series data align to this order. */
  readonly axes = input<readonly string[]>([]);
  /** One or more series (values align to `axes`). */
  readonly series = input<readonly MkChartSeries[]>([]);
  /** Domain maximum (defaults to a nice value above the data max). */
  readonly max = input<number | null>(null);
  /** Number of concentric grid rings. */
  readonly levels = input(4, { transform: numberAttribute });
  /** Intrinsic width (viewBox units; the SVG scales to its container). */
  readonly width = input(360, { transform: numberAttribute });
  /** Intrinsic height. */
  readonly height = input(360, { transform: numberAttribute });
  /** Draw a dot at each vertex. */
  readonly showDots = input(true, { transform: booleanAttribute });
  /** Force the legend on/off (defaults to on when there are ≥ 2 series). */
  readonly showLegend = input<boolean | undefined>(undefined);
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  private readonly cx = computed(() => this.width() / 2);
  private readonly cy = computed(() => this.height() / 2);
  private readonly radius = computed(
    () => Math.min(this.width(), this.height()) / 2 - 44,
  );

  protected readonly colors = computed(() =>
    this.series().map((s, i) => s.color ?? mkChartColor(i)),
  );
  protected readonly legendVisible = computed(
    () => this.showLegend() ?? this.series().length > 1,
  );

  private readonly domainMax = computed(() => {
    const explicit = this.max();
    if (explicit != null) return explicit;
    const values = this.series().flatMap((s) => s.data);
    const hi = values.length ? Math.max(...values) : 1;
    const ticks = mkNiceTicks(0, hi, this.levels());
    return ticks[ticks.length - 1] || 1;
  });

  /** Angle (radians) of axis `i`, starting at the top and going clockwise. */
  private angleAt(i: number): number {
    const n = Math.max(this.axes().length, 1);
    return -Math.PI / 2 + (i * 2 * Math.PI) / n;
  }

  private pointAt(i: number, value: number): RadarPoint {
    const t = this.domainMax() ? value / this.domainMax() : 0;
    const a = this.angleAt(i);
    return {
      x: this.cx() + Math.cos(a) * this.radius() * t,
      y: this.cy() + Math.sin(a) * this.radius() * t,
    };
  }

  /** Concentric grid ring polygons (outer → inner). */
  protected readonly rings = computed(() => {
    const levels = Math.max(this.levels(), 1);
    const n = this.axes().length;
    return Array.from({ length: levels }, (_, l) => {
      const t = (levels - l) / levels;
      const pts = Array.from({ length: n }, (_, i) => {
        const a = this.angleAt(i);
        return `${this.cx() + Math.cos(a) * this.radius() * t},${
          this.cy() + Math.sin(a) * this.radius() * t
        }`;
      });
      return { key: l, points: pts.join(' ') };
    });
  });

  /** Axis spokes + outer labels. */
  protected readonly axisSpokes = computed<RadarAxis[]>(() =>
    this.axes().map((label, i) => {
      const a = this.angleAt(i);
      const ex = this.cx() + Math.cos(a) * this.radius();
      const ey = this.cy() + Math.sin(a) * this.radius();
      const lx = this.cx() + Math.cos(a) * (this.radius() + 16);
      const ly = this.cy() + Math.sin(a) * (this.radius() + 16);
      const cos = Math.cos(a);
      const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
      return { label, x: ex, y: ey, lx, ly, anchor };
    }),
  );

  /** Per-series polygon + vertex geometry. */
  protected readonly rendered = computed<RadarSeries[]>(() =>
    this.series().map((s, si) => {
      const points = this.axes().map((_, i) => this.pointAt(i, s.data[i] ?? 0));
      return {
        name: s.name,
        color: this.colors()[si],
        polygon: points.map((p) => `${p.x},${p.y}`).join(' '),
        points,
      };
    }),
  );

  protected readonly legend = computed(() =>
    this.series().map((s, i) => ({ name: s.name, color: this.colors()[i] })),
  );

  protected readonly ringMax = computed(() => mkFormatCompact(this.domainMax()));

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const s = this.series();
    if (!s.length) return 'Radar chart, no data';
    return `Radar chart of ${s.map((x) => x.name).join(', ')} across ${this.axes().length} axes`;
  });
}
