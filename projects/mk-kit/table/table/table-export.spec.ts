import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTable, type MkTableColumn } from './table';

interface Row {
  id: number;
  name: string;
  amount: number;
  children?: Row[];
}

@Component({
  imports: [MkTable],
  template: `
    <mk-table
      [columns]="columns"
      [data]="rows"
      [childrenKey]="childrenKey()"
      trackKey="id"
      selectable
      [(selected)]="selected"
    />
  `,
})
class Host {
  columns: MkTableColumn<Row>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, format: (v) => `${v as number} zł` },
  ];
  rows: Row[] = [
    { id: 1, name: 'Zed', amount: 3, children: [{ id: 3, name: 'Kid', amount: 1 }] },
    { id: 2, name: 'Ann', amount: 5 },
  ];
  readonly childrenKey = signal<string | null>(null);
  readonly selected = signal<Row[]>([]);
}

describe('MkTable.exportCsv', () => {
  let fixture: ComponentFixture<Host>;
  const table = (): MkTable<Row> =>
    fixture.debugElement.children[0].componentInstance as MkTable<Row>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('exports visible columns with headers and formatters, without downloading', () => {
    const createObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL });
    expect(table().exportCsv({ download: false, bom: false })).toBe(
      'Name,Amount\r\nZed,3 zł\r\nAnn,5 zł\r\n',
    );
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('follows the current sort and the column subset', async () => {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.mk-table__th-button')!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table().exportCsv({ download: false, bom: false, columns: ['name'] })).toBe(
      'Name\r\nAnn\r\nZed\r\n',
    );
  });

  it('flattens tree children under their parent even while collapsed', async () => {
    fixture.componentInstance.childrenKey.set('children');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table().exportCsv({ download: false, bom: false, header: false })).toBe(
      'Zed,3 zł\r\nKid,1 zł\r\nAnn,5 zł\r\n',
    );
  });

  it('exports only the selected rows in table order when asked', async () => {
    fixture.componentInstance.selected.set([fixture.componentInstance.rows[1]]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table().exportCsv({ download: false, bom: false, selectedOnly: true })).toBe(
      'Name,Amount\r\nAnn,5 zł\r\n',
    );
  });

  it('downloads as table.csv by default', () => {
    const createObjectURL = vi.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      table().exportCsv();
      expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe('table.csv');
    } finally {
      click.mockRestore();
    }
  });
});
