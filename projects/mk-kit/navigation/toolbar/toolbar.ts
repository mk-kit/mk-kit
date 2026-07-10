import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Toolbar — a horizontal action bar: content flows on the start side, anything
 * marked `mkToolbarEnd` is pushed to the end. Handy above tables and lists for
 * a title/search on the left and actions on the right.
 *
 * The projected controls are ordinary tab stops (no roving focus), so this is a
 * layout container, not an ARIA `toolbar` widget.
 *
 * ```html
 * <mk-toolbar bordered aria-label="Users actions">
 *   <strong>Users</strong>
 *   <span mkToolbarEnd>
 *     <button mkButton variant="outline">Export</button>
 *     <button mkButton>New user</button>
 *   </span>
 * </mk-toolbar>
 * ```
 */
@Component({
  selector: 'mk-toolbar',
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-toolbar',
    '[class.mk-toolbar--bordered]': 'bordered()',
    '[attr.role]': "ariaLabel() ? 'group' : null",
    '[attr.aria-label]': 'ariaLabel() || null',
  },
})
export class MkToolbar {
  /** Wrap the bar in a themed, bordered surface. */
  readonly bordered = input(false, { transform: booleanAttribute });
  /** Accessible name (also promotes the bar to an ARIA `group`). */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });
}
