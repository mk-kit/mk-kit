import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MkResponsive } from '@mk-kit/ui/core';
import { MkFlexBase, type MkFlexDirection } from './flex-base';
import type { MkResponsiveSpace } from './space';

/**
 * Stack — children laid out one after another with a consistent gap, vertical
 * by default. The everyday layout primitive: form sections, card bodies,
 * sidebars, a row of buttons (`direction="row"`).
 *
 * ```html
 * <mk-stack gap="4">
 *   <mk-input … />
 *   <mk-input … />
 *   <mk-stack direction="row" gap="2" justify="end">
 *     <button mkButton variant="ghost">Cancel</button>
 *     <button mkButton>Save</button>
 *   </mk-stack>
 * </mk-stack>
 *
 * <!-- Stack on phones, side by side from md up -->
 * <mk-stack [direction]="{ xs: 'column', md: 'row' }" [gap]="{ xs: 3, md: 6 }">…</mk-stack>
 * ```
 */
@Component({
  selector: 'mk-stack',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-stack' },
})
export class MkStack extends MkFlexBase {
  /** Space between children (default `4` = 16px). */
  override readonly gap = input<MkResponsiveSpace>(4);
  /** Direction (default `column`). */
  override readonly direction = input<MkResponsive<MkFlexDirection>>('column');
}
