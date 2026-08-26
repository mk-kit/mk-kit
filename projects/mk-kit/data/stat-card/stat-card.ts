import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { mkUniqueId } from '@mk-kit/ui/core';

/** Direction of a {@link MkStatCard} delta. */
export type MkStatTrend = 'up' | 'down' | 'neutral';

/**
 * Stat card — a compact KPI tile for dashboards. Shows a label, a primary
 * value and an optional trend delta. The trend is conveyed by an arrow glyph
 * and a screen-reader phrase in addition to colour, so it never relies on
 * colour alone.
 *
 * ```html
 * <mk-stat-card
 *   label="Revenue"
 *   value="$48.2k"
 *   [delta]="'+12%'"
 *   deltaTrend="up"
 *   hint="vs. last month">
 *   <svg mkStatIcon>…</svg>
 * </mk-stat-card>
 * ```
 */
@Component({
  selector: 'mk-stat-card',
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-stat-card',
    role: 'group',
    '[attr.aria-labelledby]': 'labelId',
  },
})
export class MkStatCard {
  /** Metric name shown above the value. */
  readonly label = input<string>('');
  /** The primary metric value. */
  readonly value = input<string | number>('');
  /** Change indicator (e.g. `'+12%'` or `-4`). Omit to hide the delta row. */
  readonly delta = input<string | number>();
  /** Trend direction; colourises the delta and picks the arrow glyph. */
  readonly deltaTrend = input<MkStatTrend>('neutral');
  /** Small supporting note under the delta (e.g. "vs. last month"). */
  readonly hint = input<string>();

  protected readonly labelId = mkUniqueId('mk-stat-label');

  protected readonly hasDelta = computed(() => {
    const d = this.delta();
    return d !== undefined && d !== null && `${d}`.length > 0;
  });

  /** Arrow glyph for the current trend. */
  protected readonly arrow = computed(() => {
    switch (this.deltaTrend()) {
      case 'up':
        return '↑'; // ↑
      case 'down':
        return '↓'; // ↓
      default:
        return '→'; // →
    }
  });

  /** Screen-reader phrase describing the trend. */
  protected readonly trendLabel = computed(() => {
    switch (this.deltaTrend()) {
      case 'up':
        return 'Trending up';
      case 'down':
        return 'Trending down';
      default:
        return 'No change';
    }
  });
}
