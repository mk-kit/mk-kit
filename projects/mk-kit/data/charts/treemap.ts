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
import { mkChartColor, mkFormatCompact } from './chart-utils';

/** A single treemap tile: a labelled rectangle sized by `value`. */
export interface MkTreemapItem {
  /** Tile label (identity — shown on the tile when it fits, and in the tooltip). */
  label: string;
  /** Positive magnitude driving the tile's area. */
  value: number;
  /** Optional explicit colour; defaults to the validated palette by index. */
  color?: string;
}

/** A positioned tile in SVG user space, tagged with its source `index`. */
export interface MkTreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
  index: number;
}

/**
 * Worst (largest) aspect ratio produced by laying `areas` as one strip along a
 * side of length `side` — the squarify quality metric (Bruls/Huizing/van Wijk).
 */
function worstRatio(areas: readonly number[], side: number): number {
  let sum = 0;
  let rmax = -Infinity;
  let rmin = Infinity;
  for (const a of areas) {
    sum += a;
    if (a > rmax) rmax = a;
    if (a < rmin) rmin = a;
  }
  if (areas.length === 0 || sum <= 0 || side <= 0) return Infinity;
  const s2 = sum * sum;
  const w2 = side * side;
  return Math.max((w2 * rmax) / s2, s2 / (w2 * rmin));
}

/**
 * Squarified treemap layout — pack `items` into the rectangle `(x, y, w, h)` as
 * nested tiles whose areas are proportional to `value`, greedily building rows
 * along the shorter side so tiles stay close to square. Returns exactly one
 * rect per input item, tagged with its original `index` (so callers can render
 * in input order). Framework-agnostic and pure.
 */
export function mkSquarify(
  items: readonly { value: number }[],
  x: number,
  y: number,
  w: number,
  h: number,
): MkTreemapRect[] {
  const n = items.length;
  const result: MkTreemapRect[] = new Array(n);
  if (n === 0) return result;

  // Largest first, remembering where each came from; clamp negatives to 0.
  const nodes = items
    .map((it, index) => ({ value: Math.max(it.value, 0), index }))
    .sort((a, b) => b.value - a.value);

  const totalValue = nodes.reduce((s, node) => s + node.value, 0);
  const scale = totalValue > 0 ? (w * h) / totalValue : 0;
  const areas = nodes.map((node) => node.value * scale);

  // The remaining free rectangle we keep carving strips off.
  let rx = x;
  let ry = y;
  let rw = w;
  let rh = h;

  let i = 0;
  while (i < n) {
    const shortSide = Math.min(rw, rh);

    // Grow the current row while the worst aspect ratio keeps improving.
    const row: number[] = [];
    let j = i;
    while (j < n) {
      const candidate = row.concat(j).map((k) => areas[k]);
      const current = row.map((k) => areas[k]);
      if (row.length === 0 || worstRatio(candidate, shortSide) <= worstRatio(current, shortSide)) {
        row.push(j);
        j++;
      } else {
        break;
      }
    }

    const rowSum = row.reduce((s, k) => s + areas[k], 0);
    const thickness = shortSide > 0 ? rowSum / shortSide : 0;

    if (rw >= rh) {
      // Wider than tall: lay the row as a column of width `thickness`.
      let offset = ry;
      for (const k of row) {
        const cellH = rowSum > 0 ? (areas[k] / rowSum) * rh : 0;
        result[nodes[k].index] = {
          x: rx,
          y: offset,
          w: thickness,
          h: cellH,
          index: nodes[k].index,
        };
        offset += cellH;
      }
      rx += thickness;
      rw -= thickness;
    } else {
      // Taller than wide: lay the row as a band of height `thickness`.
      let offset = rx;
      for (const k of row) {
        const cellW = rowSum > 0 ? (areas[k] / rowSum) * rw : 0;
        result[nodes[k].index] = {
          x: offset,
          y: ry,
          w: cellW,
          h: thickness,
          index: nodes[k].index,
        };
        offset += cellW;
      }
      ry += thickness;
      rh -= thickness;
    }

    i = j;
  }

  return result;
}

/** Minimum tile size (px) before we bother drawing text on it. */
const MIN_TEXT_W = 40;
const MIN_TEXT_H = 24;

interface RenderedTile {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
  value: number;
  valueText: string;
  pct: string;
  showText: boolean;
  showValue: boolean;
  clipId: string;
  cx: number;
  cy: number;
  index: number;
}

/**
 * Treemap — nested rectangles sized by value, using a squarified layout that
 * keeps tiles close to square. Dependency-free SVG on the validated
 * `--mk-chart-*` palette; ships in-tile labels (hidden when a tile is too
 * small), a hover tooltip with the share of total, and a screen-reader table.
 *
 * ```html
 * <mk-treemap [items]="[{ label: 'Ads', value: 40 }, { label: 'SEO', value: 25 }]" />
 * ```
 */
@Component({
  selector: 'mk-treemap',
  templateUrl: './treemap.html',
  styleUrl: './treemap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-treemap',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkTreemap {
  protected readonly i18n = inject(MK_I18N);

  /** The tiles to pack, largest first (order-independent — sorted internally). */
  readonly items = input<readonly MkTreemapItem[]>([]);
  /** Intrinsic width (viewBox units; the SVG scales to its container). */
  readonly width = input(480, { transform: numberAttribute });
  /** Intrinsic height. */
  readonly height = input(320, { transform: numberAttribute });
  /** Draw each tile's value beneath its label when the tile is tall enough. */
  readonly showValues = input(true, { transform: booleanAttribute });
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  protected readonly hoverKey = signal<string | null>(null);

  protected readonly total = computed(() =>
    this.items().reduce((s, it) => s + Math.max(it.value, 0), 0),
  );

  /** Every tile positioned and decorated for rendering (in input order). */
  protected readonly tiles = computed<RenderedTile[]>(() => {
    const items = this.items();
    const rects = mkSquarify(items, 0, 0, this.width(), this.height());
    const total = this.total();
    return items.map((it, i) => {
      const r = rects[i];
      const showText = r.w >= MIN_TEXT_W && r.h >= MIN_TEXT_H;
      const pct = total > 0 ? (Math.max(it.value, 0) / total) * 100 : 0;
      return {
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        color: it.color ?? mkChartColor(i),
        label: it.label,
        value: it.value,
        valueText: mkFormatCompact(it.value),
        pct: `${pct.toFixed(1)}%`,
        showText,
        showValue: showText && this.showValues() && r.h >= MIN_TEXT_H + 16,
        clipId: `mk-treemap-clip-${i}`,
        cx: r.x + r.w / 2,
        cy: r.y + r.h / 2,
        index: i,
      };
    });
  });

  protected keyOf(index: number): string {
    return `t${index}`;
  }

  /** Rounded share of the total (e.g. `42%`) for the screen-reader table. */
  protected shareOf(value: number): string {
    const total = this.total();
    return `${total > 0 ? Math.round((Math.max(value, 0) / total) * 100) : 0}%`;
  }

  protected readonly tooltip = computed(() => {
    const key = this.hoverKey();
    if (key == null) return null;
    const tile = this.tiles()[Number(key.slice(1))];
    if (!tile) return null;
    return {
      left: (tile.cx / this.width()) * 100,
      top: (tile.cy / this.height()) * 100,
      color: tile.color,
      title: tile.label,
      value: tile.valueText,
      pct: tile.pct,
    };
  });

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const items = this.items();
    if (!items.length) return 'Treemap, no data';
    return `Treemap of ${items.length} items: ${items.map((it) => it.label).join(', ')}`;
  });

  protected setHover(key: string | null): void {
    this.hoverKey.set(key);
  }
}
