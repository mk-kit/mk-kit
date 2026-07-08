import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

/**
 * A single crumb inside `<mk-breadcrumb>`. Renders a link when `href` is set,
 * otherwise plain text. The last item is automatically marked
 * `aria-current="page"` by the parent.
 *
 * ```html
 * <mk-breadcrumb-item href="/">Home</mk-breadcrumb-item>
 * <mk-breadcrumb-item>Current page</mk-breadcrumb-item>
 * ```
 */
@Component({
  selector: 'mk-breadcrumb-item',
  templateUrl: './breadcrumb-item.html',
  styleUrl: './breadcrumb-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-breadcrumb-item',
    role: 'listitem',
  },
})
export class MkBreadcrumbItem {
  /** Optional link target. Rendered as text when omitted or when it is last. */
  readonly href = input<string>();

  /** Whether this is the final crumb. Set by the parent `MkBreadcrumb`. */
  readonly last = signal(false);
}
