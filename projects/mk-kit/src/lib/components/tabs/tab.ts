import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  signal,
} from '@angular/core';
import { mkUniqueId } from '../../core/a11y/unique-id';

/**
 * A single tab + its panel. Declared inside `<mk-tabs>`; the projected content
 * becomes the tab panel body while `label` is rendered in the tablist.
 *
 * ```html
 * <mk-tabs>
 *   <mk-tab label="Overview">…panel content…</mk-tab>
 *   <mk-tab label="Settings" [disabled]="locked()">…</mk-tab>
 * </mk-tabs>
 * ```
 */
@Component({
  selector: 'mk-tab',
  templateUrl: './tab.html',
  styleUrl: './tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-tab',
    role: 'tabpanel',
    '[id]': 'panelId',
    '[attr.aria-labelledby]': 'tabId',
    '[attr.hidden]': "active() ? null : ''",
    '[attr.tabindex]': 'active() ? 0 : null',
  },
})
export class MkTab {
  /** Text shown on the tab button in the tablist. */
  readonly label = input('');
  /** Disable selection of this tab. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Stable id for the tab button (wires `aria-labelledby`). */
  readonly tabId = mkUniqueId('mk-tab');
  /** Stable id for the panel (wires `aria-controls`). */
  readonly panelId = mkUniqueId('mk-tabpanel');

  /** Whether this tab is currently selected. Set by the parent `MkTabs`. */
  readonly active = signal(false);
}
