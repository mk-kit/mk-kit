import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  contentChildren,
  input,
  viewChild,
} from '@angular/core';

/** Layout for {@link MkDescriptionList}. */
export type MkDescriptionLayout = 'grid' | 'stacked';

/**
 * A single term/detail row of {@link MkDescriptionList}: `term` becomes the
 * `<dt>`, the projected content the `<dd>`. The row itself renders nothing —
 * the list reads its rows and writes `<dt>`/`<dd>` as direct children of the
 * `<dl>`, which is what HTML and assistive tech require (a wrapper element
 * between `<dl>` and `<dt>` fails axe `definition-list` / `dlitem`).
 */
@Component({
  selector: 'mk-desc-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-template #content><ng-content /></ng-template>`,
  styles: [':host{display:none;}'],
  host: { class: 'mk-desc-item' },
})
export class MkDescItem {
  /** The term (label) shown in the `<dt>`. */
  readonly term = input('');
  /** The row's detail content, rendered by the list inside its `<dd>`. @internal */
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
}

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
 *
 * Only `mk-desc-item` children are rendered; the `<dl>` always contains plain
 * `<dt>`/`<dd>` pairs.
 */
@Component({
  selector: 'mk-description-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `<dl
    class="mk-description-list__dl"
    [attr.data-layout]="layout()"
    [class.mk-description-list__dl--divided]="divided()"
  >
    @for (item of items(); track item) {
      <dt class="mk-description-list__term">{{ item.term() }}</dt>
      <dd class="mk-description-list__details">
        <ng-container *ngTemplateOutlet="item.content()" />
      </dd>
    }
  </dl>`,
  styleUrl: './description-list.scss',
  host: { class: 'mk-description-list' },
})
export class MkDescriptionList {
  /** `grid` aligns terms in a column; `stacked` puts each term above its value. */
  readonly layout = input<MkDescriptionLayout>('grid');
  /** Draw a divider between rows. */
  readonly divided = input(false, { transform: booleanAttribute });

  protected readonly items = contentChildren(MkDescItem);
}
