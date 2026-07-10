import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `<ng-template>` as the expandable detail content for {@link MkTable}
 * rows. The template's implicit context is the row object, so consumers can
 * destructure it with `let-row`:
 *
 * ```html
 * <mk-table [columns]="cols" [data]="rows()" expandable>
 *   <ng-template mkTableRowDetail let-row>
 *     <dl>… {{ row.notes }} …</dl>
 *   </ng-template>
 * </mk-table>
 * ```
 */
@Directive({
  selector: '[mkTableRowDetail]',
})
export class MkTableRowDetail<T = unknown> {
  /** The projected detail template, rendered once per expanded row. */
  readonly template = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);
}
