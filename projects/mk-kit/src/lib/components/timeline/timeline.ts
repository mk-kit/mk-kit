import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Timeline — a vertical sequence of chronological events (activity feeds, order
 * status, audit logs). A container for `<mk-timeline-item>`s that draws the
 * connecting rail; exposed to assistive tech as a list.
 *
 * ```html
 * <mk-timeline>
 *   <mk-timeline-item tone="success" time="09:30" heading="Order placed">
 *     Payment confirmed.
 *   </mk-timeline-item>
 *   <mk-timeline-item time="10:15" heading="Packed">In the warehouse.</mk-timeline-item>
 * </mk-timeline>
 * ```
 */
@Component({
  selector: 'mk-timeline',
  template: '<ng-content />',
  styleUrl: './timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-timeline',
    role: 'list',
  },
})
export class MkTimeline {}
