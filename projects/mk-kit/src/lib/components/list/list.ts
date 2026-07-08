import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * List — a vertical stack of {@link MkListItem}s with `role="list"` semantics.
 *
 * ```html
 * <mk-list>
 *   <mk-list-item>Dashboard</mk-list-item>
 *   <mk-list-item interactive (activated)="open()">Settings</mk-list-item>
 * </mk-list>
 * ```
 */
@Component({
  selector: 'mk-list',
  templateUrl: './list.html',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-list',
    role: 'list',
    '[class.mk-list--bordered]': 'bordered()',
  },
})
export class MkList {
  /** Draw hairline separators between items. */
  readonly bordered = input(false, { transform: booleanAttribute });
}
