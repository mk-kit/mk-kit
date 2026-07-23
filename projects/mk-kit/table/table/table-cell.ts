import { Directive, TemplateRef, inject, input } from '@angular/core';

/** Context handed to an `[mkTableCell]` template. */
export interface MkTableCellContext<T = unknown> {
  /** The cell's raw value (the row's property named by the column key). */
  $implicit: unknown;
  /** The whole row, for cells that need more than one field. */
  row: T;
}

/**
 * Marks an `<ng-template>` as the renderer for one column's cells, named by the
 * column `key`. Without it a cell can only be text — `MkTableColumn.format`
 * returns a string — so anything richer (a status tag, an avatar, a progress
 * bar, an action button) meant abandoning `mk-table` for a hand-rolled
 * `<table>`.
 *
 * The value is the template's implicit context and the row is available as
 * `let-row`:
 *
 * ```html
 * <mk-table [columns]="cols" [data]="rows()">
 *   <ng-template mkTableCell="status" let-value let-row="row">
 *     <mk-tag [tone]="toneFor(value)">{{ label(value) }}</mk-tag>
 *   </ng-template>
 * </mk-table>
 * ```
 *
 * A column with both a template and a `format` uses the template; `format`
 * still applies to sorting/export paths that need a string.
 */
@Directive({
  selector: '[mkTableCell]',
})
export class MkTableCell<T = unknown> {
  /** Column key whose cells this template renders. */
  readonly mkTableCell = input.required<string>();

  /** The projected template, rendered once per cell in that column. */
  readonly template =
    inject<TemplateRef<MkTableCellContext<T>>>(TemplateRef);
}
