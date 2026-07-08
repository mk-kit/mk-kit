import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MkTone } from '../../core/types';
import { MkIcon } from '../icon/icon';

/**
 * A single event in an `<mk-timeline>`: a tone-coloured marker (optionally an
 * icon), an optional time/label and heading, and projected body content.
 *
 * ```html
 * <mk-timeline-item tone="danger" icon="error" time="2m ago" heading="Build failed">
 *   3 tests failed on <code>main</code>.
 * </mk-timeline-item>
 * ```
 */
@Component({
  selector: 'mk-timeline-item',
  templateUrl: './timeline-item.html',
  styleUrl: './timeline-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkIcon],
  host: {
    class: 'mk-timeline-item',
    role: 'listitem',
    '[attr.data-tone]': 'tone()',
    '[class.mk-timeline-item--icon]': 'icon()',
  },
})
export class MkTimelineItem {
  /** Semantic colour of the marker dot. */
  readonly tone = input<MkTone>('primary');
  /** Name of a registered icon rendered inside the marker. */
  readonly icon = input<string>('');
  /** Time or label shown above the heading (e.g. "09:30", "2m ago"). */
  readonly time = input<string>('');
  /** Event title. */
  readonly heading = input<string>('');
}
