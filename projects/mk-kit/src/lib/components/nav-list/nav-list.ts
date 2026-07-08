import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Sidebar navigation list. Hosts `<mk-nav-item>`s and, when `collapsed`, drives
 * them into an icon-only rail (labels hidden, exposed via `title` tooltips).
 * Designed to sit inside the `mkAppSidebar` slot of `<mk-app-shell>`.
 *
 * ```html
 * <mk-nav-list [collapsed]="collapsed()">
 *   <mk-nav-item label="Dashboard" href="/" active>
 *     <svg mkNavIcon>…</svg>
 *   </mk-nav-item>
 * </mk-nav-list>
 * ```
 */
@Component({
  selector: 'mk-nav-list',
  templateUrl: './nav-list.html',
  styleUrl: './nav-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-nav-list',
    '[class.mk-nav-list--collapsed]': 'collapsed()',
  },
})
export class MkNavList {
  /** Collapse items to icon-only. Read by descendant `MkNavItem`s. */
  readonly collapsed = input(false, { transform: booleanAttribute });
}
