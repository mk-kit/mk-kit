import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { mkFormatCompact } from './chart-utils';

interface HeatCell {
  value: number | null;
  display: string;
  xLabel: string;
  bg: string;
  /** Draw the value with `--mk-text-inverse` (else `--mk-text`). */
  inverse: boolean;
}
interface HeatRow {
  label: string;
  cells: HeatCell[];
}

/** An sRGB colour as 0–255 channels. */
export type MkRgb = readonly [number, number, number];

/** The resolved colours a heatmap picks its cell text against. */
export interface MkHeatmapPalette {
  /** The `accent` input, resolved to sRGB. */
  accent: MkRgb;
  /** `--mk-surface-2` — the zero-intensity cell colour. */
  surface: MkRgb;
  /** `--mk-text`. */
  text: MkRgb;
  /** `--mk-text-inverse`. */
  textInverse: MkRgb;
}

/** Which text token a cell value is drawn with, and the intensity to paint the cell at. */
export interface MkHeatmapCellColors {
  /** Accent share of the cell background, 0–1. */
  intensity: number;
  /** `true` → `--mk-text-inverse`, `false` → `--mk-text`. */
  inverse: boolean;
  /** Contrast ratio of the chosen text against the cell background (1–21). */
  contrast: number;
}

/** WCAG AA minimum contrast for normal text — what cell values are held to. */
export const MK_HEATMAP_MIN_CONTRAST = 4.5;

/** WCAG 2.x relative luminance of an sRGB colour. */
export function mkRelativeLuminance([r, g, b]: MkRgb): number {
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio (1–21) between two colours. */
export function mkContrastRatio(a: MkRgb, b: MkRgb): number {
  const la = mkRelativeLuminance(a);
  const lb = mkRelativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** What `color-mix(in srgb, a t%, b)` yields: a linear blend in gamma-encoded sRGB. */
export function mkMixRgb(a: MkRgb, b: MkRgb, t: number): MkRgb {
  const mix = (x: number, y: number): number => Math.round(x * t + y * (1 - t));
  return [mix(a[0], b[0]), mix(a[1], b[1]), mix(a[2], b[2])];
}

/**
 * Parse a CSS colour as the CSSOM serialises it — `rgb(r, g, b)` /
 * `rgba(r, g, b, a)` — or a `#rgb` / `#rrggbb` literal. `null` for anything
 * else (an unresolved `var()`, `color(...)`, …).
 */
export function mkParseRgb(text: string | null | undefined): MkRgb | null {
  const s = (text ?? '').trim();
  const fn = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/i.exec(s);
  if (fn) return [Number(fn[1]), Number(fn[2]), Number(fn[3])];
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (!hex) return null;
  const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Best of the two text tokens against the cell painted at intensity `t`. */
function pickText(t: number, palette: MkHeatmapPalette): MkHeatmapCellColors {
  const bg = mkMixRgb(palette.accent, palette.surface, t);
  const onText = mkContrastRatio(palette.text, bg);
  const onInverse = mkContrastRatio(palette.textInverse, bg);
  return onInverse > onText
    ? { intensity: t, inverse: true, contrast: onInverse }
    : { intensity: t, inverse: false, contrast: onText };
}

/**
 * Choose the text token for a cell at intensity `t` (0–1) — light text on
 * dark cells, dark text on light cells, decided by contrast against the
 * actual blend rather than a fixed threshold.
 *
 * Every accent ramp has a crossover band where neither `--mk-text` nor
 * `--mk-text-inverse` reaches 4.5:1 (the cell is mid-luminance). When values
 * are printed in the cells, a cell in that band is painted at the nearest
 * intensity just outside it, so its value stays readable; the shift is a few
 * percent of the ramp and the cell keeps its order relative to its
 * neighbours. Without a resolved palette (server rendering, tests) a plain
 * threshold is used.
 */
export function mkHeatmapCellColors(
  t: number,
  palette: MkHeatmapPalette | null,
  showValues: boolean,
): MkHeatmapCellColors {
  const clamped = Math.max(0, Math.min(1, t));
  if (!palette) return { intensity: clamped, inverse: clamped >= 0.55, contrast: NaN };
  const best = pickText(clamped, palette);
  if (!showValues || best.contrast >= MK_HEATMAP_MIN_CONTRAST) return best;
  // In the crossover band: step outward (down and up alternately, 1 % at a
  // time) to the closest intensity at which one of the tokens passes.
  for (let step = 1; step <= 100; step++) {
    const delta = step / 100;
    for (const candidate of [clamped - delta, clamped + delta]) {
      if (candidate < 0 || candidate > 1) continue;
      const pick = pickText(candidate, palette);
      if (pick.contrast >= MK_HEATMAP_MIN_CONTRAST) return pick;
    }
  }
  return best;
}

/**
 * Heatmap — a matrix of cells shaded by value intensity, for correlation
 * grids, activity-by-time tables and the like. Rendered as a semantic
 * `<table>` (so it is inherently screen-reader friendly) with cell colours
 * mixed from `accent` over the surface via `color-mix`, so it tracks the theme.
 *
 * Printed values (`showValues`) pick `--mk-text` or `--mk-text-inverse` per
 * cell by contrast against that cell's actual colour, in both themes — see
 * {@link mkHeatmapCellColors}.
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
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

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

  /**
   * The accent and the text/surface tokens resolved through the CSSOM, so
   * each cell can pick a text colour that actually contrasts with its blend.
   * `null` until resolved (server, jsdom) — the cells then fall back to a
   * threshold.
   */
  protected readonly palette = signal<MkHeatmapPalette | null>(null);

  /** Bumped when the document theme changes so the palette is re-resolved. */
  private readonly themeTick = signal(0);

  constructor() {
    afterRenderEffect(() => {
      this.accent();
      this.themeTick();
      untracked(() => this.palette.set(this.resolvePalette()));
    });
    this.watchTheme();
  }

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

  /** The `color-mix()` expression painting a cell at intensity `t`. */
  private cellBackground(t: number): string {
    return `color-mix(in srgb, ${this.accent()} ${Math.round(t * 100)}%, var(--mk-surface-2))`;
  }

  protected readonly rows = computed<HeatRow[]>(() => {
    const xs = this.xLabels();
    const ys = this.yLabels();
    const data = this.data();
    const fmt = this.format();
    const palette = this.palette();
    const showValues = this.showValues();
    return ys.map((yLabel, r) => ({
      label: yLabel,
      cells: xs.map((xLabel, c) => {
        const value = data[r]?.[c] ?? null;
        if (value == null) {
          return { value: null, display: '', xLabel, bg: 'transparent', inverse: false };
        }
        const colors = mkHeatmapCellColors(this.ratio(value), palette, showValues);
        return {
          value,
          display: fmt(value),
          xLabel,
          // Mix the accent over the surface; more intense = more accent.
          bg: this.cellBackground(colors.intensity),
          inverse: colors.inverse,
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
      swatches: [0, 0.25, 0.5, 0.75, 1].map((t) => this.cellBackground(t)),
    };
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const rows = this.yLabels().length;
    const cols = this.xLabels().length;
    return `Heatmap, ${rows} rows by ${cols} columns`;
  });

  /**
   * Resolve the accent and the tokens to sRGB through a hidden probe: the
   * probe's computed `color` is what the browser would paint, `var()`s and
   * `color-mix()` included. `null` when the environment cannot resolve them.
   */
  protected resolvePalette(): MkHeatmapPalette | null {
    const win = this.doc.defaultView;
    if (!win?.getComputedStyle) return null;
    const probe = this.doc.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    this.host.appendChild(probe);
    try {
      const read = (expr: string): MkRgb | null => {
        probe.style.color = '';
        probe.style.color = expr;
        return mkParseRgb(win.getComputedStyle(probe).color);
      };
      const accent = read(this.accent());
      const surface = read('var(--mk-surface-2)');
      const text = read('var(--mk-text)');
      const textInverse = read('var(--mk-text-inverse)');
      return accent && surface && text && textInverse
        ? { accent, surface, text, textInverse }
        : null;
    } finally {
      probe.remove();
    }
  }

  /**
   * Re-resolve when the theme flips: `data-theme` / class changes on the root
   * element (MkThemeService and most hand-rolled toggles) and the OS scheme.
   */
  private watchTheme(): void {
    const win = this.doc.defaultView;
    const root = this.doc.documentElement;
    if (!win || !root) return;
    const bump = (): void => this.themeTick.update((n) => n + 1);
    const destroyRef = inject(DestroyRef);
    if (typeof win.MutationObserver === 'function') {
      const observer = new win.MutationObserver(bump);
      observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
      destroyRef.onDestroy(() => observer.disconnect());
    }
    const mql = win.matchMedia?.('(prefers-color-scheme: dark)');
    if (mql?.addEventListener) {
      mql.addEventListener('change', bump);
      destroyRef.onDestroy(() => mql.removeEventListener('change', bump));
    }
  }
}
