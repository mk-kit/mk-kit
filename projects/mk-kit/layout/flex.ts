import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MkResponsive } from '@mk-kit/ui/core';
import { MkFlexBase, type MkFlexDirection } from './flex-base';
import type { MkResponsiveSpace } from './space';

/**
 * Flex — a flexbox container with its options as inputs, horizontal by default
 * and no gap unless asked. Reach for it when a stack's "one after another"
 * isn't the point: space-between toolbars, centring, wrapping tag clouds.
 * Children can fine-tune themselves with `mkFlexItem`.
 *
 * ```html
 * <mk-flex align="center" justify="between" gap="3">
 *   <h2>Orders</h2>
 *   <button mkButton>New order</button>
 * </mk-flex>
 * <mk-flex wrap gap="2">@for (tag of tags; track tag) { <mk-chip>{{ tag }}</mk-chip> }</mk-flex>
 * ```
 */
@Component({
  selector: 'mk-flex',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-flex' },
})
export class MkFlex extends MkFlexBase {
  /** Space between children (default none). */
  override readonly gap = input<MkResponsiveSpace>(0);
  /** Direction (default `row`). */
  override readonly direction = input<MkResponsive<MkFlexDirection>>('row');
}
