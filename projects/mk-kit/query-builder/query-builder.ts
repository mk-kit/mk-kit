import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input, model, numberAttribute } from '@angular/core';
import { MK_I18N, mkCreateQueryGroup, type MkQueryField, type MkQueryGroup, type MkSize } from '@mk-kit/ui/core';
import { MkQueryGroupComponent } from './query-group';

/**
 * QueryBuilder — a rule / group tree the user assembles from your `fields`,
 * held as plain JSON (`MkQueryGroup`) in the two-way `query` model. Pair it
 * with `mkQueryToPredicate()` to filter rows in the browser, with
 * `MkTableDataSource.setQuery()` to send it to the server, or with
 * `mkQueryToText()` for a readable summary.
 *
 * ```html
 * <mk-query-builder [fields]="fields" [(query)]="query" allowNot />
 *
 * fields: MkQueryField[] = [
 *   { key: 'name', label: 'Name' },
 *   { key: 'orders', label: 'Orders', type: 'number' },
 *   { key: 'status', label: 'Status', type: 'select', options: [{ label: 'Active', value: 'active' }, …] },
 *   { key: 'since', label: 'Customer since', type: 'date' },
 *   { key: 'vip', label: 'VIP', type: 'boolean' },
 * ];
 * rows = computed(() => this.all.filter(mkQueryToPredicate(this.query(), this.fields)));
 * ```
 */
@Component({
  selector: 'mk-query-builder',
  template: `
    <mk-query-group
      root
      [group]="query()"
      [fields]="fields()"
      [depth]="0"
      [maxDepth]="maxDepth()"
      [allowNot]="allowNot()"
      [disabled]="disabled()"
      [size]="size()"
      (groupChange)="query.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkQueryGroupComponent],
  host: {
    class: 'mk-query-builder',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel() ?? i18n.queryBuilderLabel',
    style: 'display: block',
  },
})
export class MkQueryBuilder {
  protected readonly i18n = inject(MK_I18N);

  /** The filterable fields, in picker order. */
  readonly fields = input.required<readonly MkQueryField[]>();
  /** The query tree (two-way). Starts as an empty `and` group. */
  readonly query = model<MkQueryGroup>(mkCreateQueryGroup());
  /** How deep groups may nest (0 = rules only). */
  readonly maxDepth = input(3, { transform: numberAttribute });
  /** Offer a *Not* toggle on every group. */
  readonly allowNot = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Control size (default `sm`). */
  readonly size = input<MkSize>('sm');
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Reset to an empty group. */
  clear(): void {
    this.query.set(mkCreateQueryGroup());
  }
}
