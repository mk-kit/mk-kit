/**
 * Shared, framework-agnostic helpers for the mk-kit SVG charts. Pure functions
 * only — no Angular, no DOM — so they stay trivially testable and reusable.
 */

/** A named data series for multi-series charts. */
export interface MkChartSeries {
  /** Legend/tooltip label (identity — always shown, never colour-alone). */
  name: string;
  /** The values, one per category/x position. */
  data: number[];
  /** Optional explicit colour; defaults to the validated palette by index. */
  color?: string;
}

/** A single slice for the donut/pie chart. */
export interface MkChartSlice {
  /** Slice label. */
  name: string;
  /** Slice value (summed to compute proportions). */
  value: number;
  /** Optional explicit colour; defaults to the palette by index. */
  color?: string;
}

/** A resolved 2-D point in SVG user space. */
export interface MkPoint {
  x: number;
  y: number;
}

/** Number of hues in the validated categorical palette (`--mk-chart-1..8`). */
export const MK_CHART_PALETTE_SIZE = 8;

/**
 * Categorical colour for a series index — a CSS reference to the validated
 * `--mk-chart-N` token. Assigned in fixed order and wrapped past 8 (prefer
 * folding a 9th series into "Other" over relying on the wrap).
 */
export function mkChartColor(index: number): string {
  return `var(--mk-chart-${(index % MK_CHART_PALETTE_SIZE) + 1})`;
}

/** Build a linear scale mapping `[d0,d1]` (domain) onto `[r0,r1]` (range). */
export function mkLinearScale(
  d0: number,
  d1: number,
  r0: number,
  r1: number,
): (value: number) => number {
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/**
 * "Nice" rounded tick values covering `[min,max]` with roughly `count` steps —
 * used for value axes so gridlines land on human numbers.
 */
export function mkNiceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) {
    max = min + 1;
  }
  const range = max - min;
  const rawStep = range / Math.max(count, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const step =
    (residual >= 5 ? 10 : residual >= 2 ? 5 : residual >= 1 ? 2 : 1) * magnitude;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // Guard against fp drift accumulating an extra tick.
  for (let v = start; v <= end + step / 2; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

/** Straight-segment SVG path (`M … L …`) through the given points. */
export function mkLinePath(points: readonly MkPoint[]): string {
  if (!points.length) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
    .join(' ');
}

/**
 * Closed area path under a line: the line, dropped to `baselineY` at each end.
 */
export function mkAreaPath(
  points: readonly MkPoint[],
  baselineY: number,
): string {
  if (!points.length) return '';
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
    .join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${last.x} ${baselineY} L${first.x} ${baselineY} Z`;
}

/**
 * SVG arc path for a donut/pie slice between two angles (radians, clockwise
 * from 12 o'clock). `inner` of 0 yields a pie wedge; > 0 yields a ring segment.
 */
export function mkArcPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  startAngle: number,
  endAngle: number,
): string {
  const p = (r: number, a: number): MkPoint => ({
    x: cx + r * Math.sin(a),
    y: cy - r * Math.cos(a),
  });
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const o0 = p(outer, startAngle);
  const o1 = p(outer, endAngle);
  if (inner <= 0) {
    return `M${cx} ${cy} L${o0.x} ${o0.y} A${outer} ${outer} 0 ${large} 1 ${o1.x} ${o1.y} Z`;
  }
  const i1 = p(inner, endAngle);
  const i0 = p(inner, startAngle);
  return (
    `M${o0.x} ${o0.y} A${outer} ${outer} 0 ${large} 1 ${o1.x} ${o1.y} ` +
    `L${i1.x} ${i1.y} A${inner} ${inner} 0 ${large} 0 ${i0.x} ${i0.y} Z`
  );
}

/** Compact number formatting for axes/tooltips (1.2k, 3.4M). */
export function mkFormatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(value / 1_000)}k`;
  return `${trim(value)}`;
}

function trim(n: number): string {
  return Number(n.toFixed(1)).toString();
}
