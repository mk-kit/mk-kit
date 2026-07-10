import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { mkFormatCompact } from './chart-utils';

interface HeatCell {
  value: number | null;
  display: string;
  xLabel: string;
  bg: string;
  strong: boolean;
}
interface HeatRow {
  label: string;
  cells: HeatCell[];
}

/**
 * Heatmap — a matrix of cells shaded by value intensity, for correlation
 * grids, activity-by-time tables and the like. Rendered as a semantic
 * `<table>` (so it is inherently screen-reader friendly) with cell colours
 * mixed from `accent` over the surface via `color-mix`, so it tracks the theme.
 *
 * ```html
 * <mk-heatmap
 *   [xLabels]="hours" [yLabels]="days" [data]="matrix()" showValues />
 * ```
 */
@Component({
  selector: 'mk-heatmap',
  templateUrl: './heatmap.html',
  styleUrl: './heatmap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-heatmap',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkHeatmap {
  /** Column labels (x axis). */
  readonly xLabels = input<readonly string[]>([]);
  /** Row labels (y axis). */
  readonly yLabels = input<readonly string[]>([]);
  /** Row-major matrix: `data[row][col]`. Use `null` for a blank cell. */
  readonly data = input<readonly (readonly (number | null)[])[]>([]);
  /** Override the low end of the colour domain (defaults to the data min). */
  readonly min = input<number | null>(null);
  /** Override the high end of the colour domain (defaults to the data max). */
  readonly max = input<number | null>(null);
  /** Base colour mixed over the surface for intensity. */
  readonly accent = input<string>('var(--mk-primary)');
  /** Print each cell's value inside it. */
  readonly showValues = input(false, { transform: booleanAttribute });
  /** Show the min→max colour scale legend. */
  readonly showScale = input(true, { transform: booleanAttribute });
  /** Formatter for cell + legend values. */
  readonly format = input<(value: number) => string>(mkFormatCompact);
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  private readonly domain = computed<[number, number]>(() => {
    const flat = this.data()
      .flat()
      .filter((v): v is number => v != null);
    const lo = this.min() ?? (flat.length ? Math.min(...flat) : 0);
    const hi = this.max() ?? (flat.length ? Math.max(...flat) : 1);
    return [lo, hi];
  });

  /** Fraction (0–1) of the domain a value sits at. */
  private ratio(value: number): number {
    const [lo, hi] = this.domain();
    const span = hi - lo || 1;
    return Math.max(0, Math.min(1, (value - lo) / span));
  }

  protected readonly rows = computed<HeatRow[]>(() => {
    const xs = this.xLabels();
    const ys = this.yLabels();
    const data = this.data();
    const fmt = this.format();
    return ys.map((yLabel, r) => ({
      label: yLabel,
      cells: xs.map((xLabel, c) => {
        const value = data[r]?.[c] ?? null;
        if (value == null) {
          return { value: null, display: '', xLabel, bg: 'transparent', strong: false };
        }
        const t = this.ratio(value);
        return {
          value,
          display: fmt(value),
          xLabel,
          // Mix the accent over the surface; more intense = more accent.
          bg: `color-mix(in srgb, ${this.accent()} ${Math.round(t * 100)}%, var(--mk-surface-2))`,
          strong: t >= 0.55,
        };
      }),
    }));
  });

  /** Legend swatches from 0 → 1 intensity. */
  protected readonly scaleStops = computed(() => {
    const [lo, hi] = this.domain();
    const fmt = this.format();
    return {
      min: fmt(lo),
      max: fmt(hi),
      swatches: [0, 0.25, 0.5, 0.75, 1].map(
        (t) =>
          `color-mix(in srgb, ${this.accent()} ${t * 100}%, var(--mk-surface-2))`,
      ),
    };
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const rows = this.yLabels().length;
    const cols = this.xLabels().length;
    return `Heatmap, ${rows} rows by ${cols} columns`;
  });
}
