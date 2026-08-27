import { MkHarness, MkTestElement, pickBy } from '../harness';
import { MkCheckboxHarness } from './form-controls.harness';

/** One data row of `mk-table`. */
export class MkTableRowHarness extends MkHarness {
  static override readonly hostSelector = 'tr.mk-table__row';

  /** Cell texts of the data columns (expand / select cells excluded). */
  cells(): string[] {
    return this.dataCells().map((c) => c.text());
  }

  cell(index: number): string {
    return this.cells()[index] ?? '';
  }

  isSelected(): boolean {
    return this.host.hasClass('mk-table__row--selected');
  }

  isExpanded(): boolean {
    return this.host.hasClass('mk-table__row--expanded') || this.host.attr('aria-expanded') === 'true';
  }

  async click(): Promise<void> {
    await this.host.click();
  }

  /** Toggle the selection checkbox (throws when the table is not `selectable`). */
  async toggleSelected(): Promise<void> {
    const cb = await this.loader.within(this.host.child('.mk-table__td--select')).get(MkCheckboxHarness);
    await cb.toggle();
  }

  /** Toggle the expand / tree control of the row. */
  async toggleExpanded(): Promise<void> {
    const btn = this.q('.mk-table__td--expand button') ?? this.q('.mk-table__tree-toggle') ?? this.q('button[aria-expanded]');
    if (!btn) throw new Error('Row has no expand toggle (table is not expandable / has no children).');
    await btn.click();
  }

  private dataCells(): MkTestElement[] {
    return this.qAll('td.mk-table__td').filter(
      (c) => !c.hasClass('mk-table__td--expand') && !c.hasClass('mk-table__td--select'),
    );
  }
}

/** `mk-table`. */
export class MkTableHarness extends MkHarness {
  static override readonly hostSelector = 'mk-table';

  /** Header labels of the data columns, in display order. */
  headers(): string[] {
    return this.headerCells().map((th) => th.child('.mk-table__th-label').text());
  }

  rows(): Promise<MkTableRowHarness[]> {
    return this.loader.within(this.host).getAll(MkTableRowHarness);
  }

  async rowCount(): Promise<number> {
    return (await this.rows()).length;
  }

  /** Every data cell as text: `rows()[r].cells()`. */
  async cellTexts(): Promise<string[][]> {
    return (await this.rows()).map((r) => r.cells());
  }

  /** Click a sortable header (by index, exact label or RegExp). */
  async sortBy(which: number | string | RegExp): Promise<void> {
    const th = pickBy(this.headerCells(), which, (h) => h.child('.mk-table__th-label').text(), 'column');
    const btn = th.query('.mk-table__th-button');
    if (!btn) throw new Error(`Column "${th.text()}" is not sortable.`);
    await btn.click();
  }

  /** `'ascending' | 'descending' | 'none' | null` (null = not sortable). */
  sortDirection(which: number | string | RegExp): string | null {
    return pickBy(this.headerCells(), which, (h) => h.child('.mk-table__th-label').text(), 'column').attr('aria-sort');
  }

  async selectedRowCount(): Promise<number> {
    return (await this.rows()).filter((r) => r.isSelected()).length;
  }

  /** Toggle the header "select all" checkbox. */
  async toggleAll(): Promise<void> {
    const th = this.q('.mk-table__th--select');
    if (!th) throw new Error('Table is not selectable.');
    await (await this.loader.within(th).get(MkCheckboxHarness)).toggle();
  }

  isEmpty(): boolean {
    return !this.q('tr.mk-table__row');
  }

  private headerCells(): MkTestElement[] {
    return this.qAll('th.mk-table__th').filter(
      (th) => !th.hasClass('mk-table__th--expand') && !th.hasClass('mk-table__th--select'),
    );
  }
}
