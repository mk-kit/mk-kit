import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  input,
} from '@angular/core';
import { MkBreadcrumbItem } from './breadcrumb-item';

/**
 * Breadcrumb trail. Renders `nav[aria-label="Breadcrumb"] > ol` and marks the
 * final `<mk-breadcrumb-item>` as the current page. The separator is drawn in
 * CSS and can be customised via `separator`.
 *
 * ```html
 * <mk-breadcrumb separator="›">
 *   <mk-breadcrumb-item href="/">Home</mk-breadcrumb-item>
 *   <mk-breadcrumb-item href="/users">Users</mk-breadcrumb-item>
 *   <mk-breadcrumb-item>Jane</mk-breadcrumb-item>
 * </mk-breadcrumb>
 * ```
 */
@Component({
  selector: 'mk-breadcrumb',
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-breadcrumb',
    '[style.--mk-breadcrumb-separator]': 'separatorValue()',
  },
})
export class MkBreadcrumb {
  /** Accessible label for the navigation landmark. */
  readonly label = input('Breadcrumb');
  /** Separator character rendered between crumbs. */
  readonly separator = input('/');

  private readonly items = contentChildren(MkBreadcrumbItem);

  /** Wrap the separator in quotes for the CSS `content` property. */
  protected readonly separatorValue = computed(
    () => `"${this.separator().replace(/"/g, '\\"')}"`,
  );

  constructor() {
    // Flag the last crumb so it renders as the current page.
    effect(() => {
      const items = this.items();
      items.forEach((item, i) => item.last.set(i === items.length - 1));
    });
  }
}
