import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * PageHeader — the standard heading block at the top of an admin/CMS page: an
 * optional breadcrumb, a page title with optional description and inline meta
 * (badges/status), a right-aligned actions cluster, and an optional tab row
 * beneath. Everything but the title/description is projected, so it composes
 * with `mk-breadcrumb`, `mk-tabs`, buttons, badges, etc.
 *
 * Slots: `[mkPageHeaderBreadcrumb]`, `[mkPageHeaderMeta]` (beside the title),
 * `[mkPageHeaderActions]` (right), `[mkPageHeaderTabs]` (below).
 *
 * ```html
 * <mk-page-header heading="Articles" description="Manage your published posts.">
 *   <mk-breadcrumb mkPageHeaderBreadcrumb …></mk-breadcrumb>
 *   <mk-badge mkPageHeaderMeta tone="success">Live</mk-badge>
 *   <div mkPageHeaderActions>
 *     <button mkButton variant="outline">Import</button>
 *     <button mkButton>New article</button>
 *   </div>
 * </mk-page-header>
 * ```
 */
@Component({
  selector: 'mk-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-page-header' },
})
export class MkPageHeader {
  /** The page title (rendered as an `<h1>`). */
  readonly heading = input<string>('');
  /** Supporting description under the title. */
  readonly description = input<string>('');
}
