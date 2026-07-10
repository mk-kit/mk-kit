import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { mkChartColor, mkFormatCompact } from './chart-utils';

/** A single stage of the funnel (ordered largest → smallest conceptually). */
export interface MkFunnelSegment {
  /** Stage label (e.g. "Visits"). */
  label: string;
  /** Stage value; drives the band width. */
  value: number;
  /** Optional explicit colour; defaults to the palette by index. */
  color?: string;
}

interface FunnelBand {
  label: string;
  value: number;
  valueLabel: string;
  /** Conversion relative to the first (top) segment, as a percentage. */
  percent: number;
  percentLabel: string;
  color: string;
  topWidth: number;
  bottomWidth: number;
  polygon: string;
  labelX: number;
  labelY: number;
  subY: number;
}

const MARGIN = { top: 10, right: 12, bottom: 10, left: 12 };

/**
 * FunnelChart — decreasing stacked trapezoids visualising conversion through a
 * sequence of stages. Each band's top width tracks its own value and its bottom
 * width tracks the next stage's value, so consecutive bands connect into a
 * funnel. Dependency-free SVG on the validated `--mk-chart-*` palette; each band
 * is labelled with its value and its conversion relative to the top stage, and a
 * screen-reader table mirrors the data.
 *
 * ```html
 * <mk-funnel-chart
 *   [segments]="[
 *     { label: 'Visits', value: 1000 },
 *     { label: 'Signups', value: 400 },
 *     { label: 'Paid', value: 120 },
 *   ]" />
 * ```
 */
@Component({
  selector: 'mk-funnel-chart',
  templateUrl: './funnel-chart.html',
  styleUrl: './funnel-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chart mk-funnel-chart',
    role: 'group',
    '[attr.aria-label]': 'resolvedLabel()',
  },
})
export class MkFunnelChart {
  /** The funnel stages, ordered largest → smallest conceptually. */
  readonly segments = input<readonly MkFunnelSegment[]>([]);
  /** Intrinsic width (viewBox units; the SVG scales to its container). */
  readonly width = input(420, { transform: numberAttribute });
  /** Intrinsic height. */
  readonly height = input(300, { transform: numberAttribute });
  /** Force the legend on/off (funnels label each band, so off by default). */
  readonly showLegend = input<boolean | undefined>(undefined);
  /** Render the value + conversion text on each band. */
  readonly showValues = input(true, { transform: booleanAttribute });
  /** Accessible summary; generated from the data when omitted. */
  readonly label = input<string>('');

  protected readonly plot = computed(() => ({
    x: MARGIN.left,
    y: MARGIN.top,
    w: Math.max(this.width() - MARGIN.left - MARGIN.right, 1),
    h: Math.max(this.height() - MARGIN.top - MARGIN.bottom, 1),
  }));

  protected readonly legendVisible = computed(() => this.showLegend() ?? false);

  private readonly maxValue = computed(() =>
    Math.max(1, ...this.segments().map((s) => Math.max(s.value, 0))),
  );

  private readonly topValue = computed(() => this.segments()[0]?.value ?? 0);

  /** One trapezoid per stage, stacked top → bottom. */
  protected readonly bands = computed<FunnelBand[]>(() => {
    const segments = this.segments();
    const n = segments.length;
    if (!n) return [];
    const { x, y, w, h } = this.plot();
    const max = this.maxValue();
    const top = this.topValue() || 1;
    const bandH = h / n;
    const centerX = x + w / 2;

    return segments.map((seg, i) => {
      const topVal = Math.max(seg.value, 0);
      // Bottom edge follows the next stage; the last band closes to itself.
      const bottomVal = Math.max(segments[i + 1]?.value ?? seg.value, 0);
      const topWidth = (topVal / max) * w;
      const bottomWidth = (bottomVal / max) * w;
      const yTop = y + i * bandH;
      const yBottom = yTop + bandH;
      const tl = centerX - topWidth / 2;
      const tr = centerX + topWidth / 2;
      const bl = centerX - bottomWidth / 2;
      const br = centerX + bottomWidth / 2;
      const percent = (seg.value / top) * 100;
      return {
        label: seg.label,
        value: seg.value,
        valueLabel: mkFormatCompact(seg.value),
        percent,
        percentLabel: `${Math.round(percent)}% of top`,
        color: seg.color ?? mkChartColor(i),
        topWidth,
        bottomWidth,
        polygon: `${tl},${yTop} ${tr},${yTop} ${br},${yBottom} ${bl},${yBottom}`,
        labelX: centerX,
        labelY: yTop + bandH / 2 - 4,
        subY: yTop + bandH / 2 + 12,
      };
    });
  });

  protected readonly legend = computed(() =>
    this.segments().map((s, i) => ({
      name: s.label,
      color: s.color ?? mkChartColor(i),
    })),
  );

  protected readonly resolvedLabel = computed(() => {
    if (this.label()) return this.label();
    const segments = this.segments();
    if (!segments.length) return 'Funnel chart, no data';
    return `Funnel chart of ${segments.length} stages from ${segments[0].label} to ${segments[segments.length - 1].label}`;
  });
}
