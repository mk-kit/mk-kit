import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/** Layout for {@link MkDescriptionList}. */
export type MkDescriptionLayout = 'grid' | 'stacked';

/**
 * DescriptionList — a semantic `<dl>` of term/detail pairs for entity-detail and
 * metadata panels. Project {@link MkDescItem} rows; values may be rich content
 * (badges, links, …). In `grid` layout terms align in a shared column; in
 * `stacked` each term sits above its value.
 *
 * ```html
 * <mk-description-list>
 *   <mk-desc-item term="Status"><mk-badge tone="success">Active</mk-badge></mk-desc-item>
 *   <mk-desc-item term="Owner">Ada Lovelace</mk-desc-item>
 * </mk-description-list>
 * ```
 */
@Component({
  selector: 'mk-description-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dl
    class="mk-description-list__dl"
    [attr.data-layout]="layout()"
    [class.mk-description-list__dl--divided]="divided()"
  >
    <ng-content />
  </dl>`,
  styleUrl: './description-list.scss',
  host: { class: 'mk-description-list' },
})
export class MkDescriptionList {
  /** `grid` aligns terms in a column; `stacked` puts each term above its value. */
  readonly layout = input<MkDescriptionLayout>('grid');
  /** Draw a divider between rows. */
  readonly divided = input(false, { transform: booleanAttribute });
}

/**
 * A single term/detail row inside {@link MkDescriptionList}. Renders a `<dt>`
 * (the `term`) and a `<dd>` (the projected value). The host is `display:contents`
 * so the `<dt>`/`<dd>` participate directly in the list's grid.
 */
@Component({
  selector: 'mk-desc-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dt class="mk-description-list__term">{{ term() }}</dt>
    <dd class="mk-description-list__details"><ng-content /></dd>`,
  styles: [':host{display:contents;}'],
  host: { class: 'mk-desc-item' },
})
export class MkDescItem {
  /** The term (label) shown in the `<dt>`. */
  readonly term = input('');
}
