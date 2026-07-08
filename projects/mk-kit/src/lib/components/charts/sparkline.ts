import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import {
  MkPoint,
  mkAreaPath,
  mkFormatCompact,
  mkLinePath,
} from './chart-utils';

/** Visual form of a {@link MkSparkline}. */
export type MkSparklineType = 'line' | 'area' | 'bar';

/**
 * Sparkline — a tiny, axis-less trend chart sized to sit inline in a table
 * cell, stat card or list row. Single series only; it's a *mark*, so it carries
 * no legend or tooltip (give context with the surrounding label + `label`).
 *
 * ```html
 * <mk-sparkline [data]="[3,5,4,7,6,9,8]" type="area" />
 * <mk-sparkline [data]="visits()" [width]="80" showDot
 *   color="var(--mk-success)" label="Weekly visits" />
 * ```
 */
@Component({
  selector: 'mk-sparkline',
  templateUrl: './sparkline.html',
  styleUrl: './sparkline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-sparkline',
    role: 'img',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkSparkline {
  /** The values to plot (left → right). */
  readonly data = input<readonly number[]>([]);
  /** Visual form. */
  readonly type = input<MkSparklineType>('line');
  /** Any CSS colour; defaults to the first chart hue. */
  readonly color = input<string>('var(--mk-chart-1)');
  /** Intrinsic width in px (the SVG scales with its box). */
  readonly width = input(120, { transform: numberAttribute });
  /** Intrinsic height in px. */
  readonly height = input(32, { transform: numberAttribute });
  /** Line/area stroke width. */
  readonly strokeWidth = input(2, { transform: numberAttribute });
  /** Draw a dot on the last point (line/area only). */
  readonly showDot = input(false, { transform: booleanAttribute });
  /** Fixed domain minimum (defaults to the data min). */
  readonly min = input<number | undefined>(undefined);
  /** Fixed domain maximum (defaults to the data max). */
  readonly max = input<number | undefined>(undefined);
  /** Accessible label; a data summary is generated when omitted. */
  readonly label = input<string>('');

  private readonly pad = computed(() => this.strokeWidth() + (this.showDot() ? 2 : 0));

  private readonly domain = computed<[number, number]>(() => {
    const d = this.data();
    if (!d.length) return [0, 1];
    const lo = this.min() ?? Math.min(...d);
    const hi = this.max() ?? Math.max(...d);
    return lo === hi ? [lo - 1, hi + 1] : [lo, hi];
  });

  protected readonly points = computed<MkPoint[]>(() => {
    const d = this.data();
    if (!d.length) return [];
    const [lo, hi] = this.domain();
    const w = this.width();
    const h = this.height();
    const p = this.pad();
    const innerW = Math.max(w - 2 * p, 1);
    const innerH = Math.max(h - 2 * p, 1);
    const step = d.length > 1 ? innerW / (d.length - 1) : 0;
    return d.map((v, i) => ({
      x: p + (d.length > 1 ? i * step : innerW / 2),
      y: p + innerH - ((v - lo) / (hi - lo)) * innerH,
    }));
  });

  protected readonly linePath = computed(() => mkLinePath(this.points()));
  protected readonly areaPath = computed(() =>
    mkAreaPath(this.points(), this.height() - this.pad()),
  );

  /** Bar geometry for the `bar` type. */
  protected readonly bars = computed(() => {
    const d = this.data();
    if (!d.length) return [];
    const [lo, hi] = this.domain();
    const w = this.width();
    const h = this.height();
    const p = this.pad();
    const innerH = Math.max(h - 2 * p, 1);
    const gap = 2;
    const slot = (w - 2 * p) / d.length;
    const bw = Math.max(slot - gap, 1);
    const base = lo < 0 ? 0 : lo;
    return d.map((v, i) => {
      const y = p + innerH - ((Math.max(v, base) - lo) / (hi - lo)) * innerH;
      const y0 = p + innerH - ((base - lo) / (hi - lo)) * innerH;
      return { x: p + i * slot + gap / 2, y, w: bw, h: Math.max(y0 - y, 1) };
    });
  });

  protected readonly lastPoint = computed(() => {
    const pts = this.points();
    return pts.length ? pts[pts.length - 1] : null;
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const d = this.data();
    if (!d.length) return 'Sparkline, no data';
    const first = d[0];
    const last = d[d.length - 1];
    const dir = last > first ? 'up' : last < first ? 'down' : 'flat';
    return (
      `Sparkline trend ${dir}: ${d.length} points, ` +
      `${mkFormatCompact(first)} to ${mkFormatCompact(last)}, ` +
      `min ${mkFormatCompact(Math.min(...d))}, max ${mkFormatCompact(Math.max(...d))}`
    );
  });
}
