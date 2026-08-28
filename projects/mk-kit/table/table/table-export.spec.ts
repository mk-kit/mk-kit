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

  describe('getExportRows (the public plumbing behind exportCsv)', () => {
    it('returns display-ordered rows and the ordered columns with header + formatter', () => {
      const { rows, columns } = table().getExportRows();
      expect(rows.map((r) => r.name)).toEqual(['Zed', 'Ann']);
      expect(columns.map((c) => c.key)).toEqual(['name', 'amount']);
      expect(columns[1].header).toBe('Amount');
      expect(columns[1].format?.(5, rows[1])).toBe('5 zł');
    });

    it('follows the current sort and restricts to the requested column keys', async () => {
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('.mk-table__th-button')!
        .click();
      fixture.detectChanges();
      await fixture.whenStable();
      const { rows, columns } = table().getExportRows({ columns: ['amount'] });
      expect(rows.map((r) => r.name)).toEqual(['Ann', 'Zed']);
      expect(columns.map((c) => c.key)).toEqual(['amount']);
    });

    it('flattens tree children under their parent while collapsed', async () => {
      fixture.componentInstance.childrenKey.set('children');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(table().getExportRows().rows.map((r) => r.id)).toEqual([1, 3, 2]);
    });

    it('applies selectedOnly', async () => {
      fixture.componentInstance.selected.set([fixture.componentInstance.rows[1]]);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(table().getExportRows({ selectedOnly: true }).rows.map((r) => r.id)).toEqual([2]);
    });

    it('is exactly what exportCsv writes', () => {
      const { rows, columns } = table().getExportRows({ columns: ['name'] });
      const manual = ['Name', ...rows.map((r) => columns.map((c) => r[c.key as 'name']).join(','))]
        .join('\r\n')
        .concat('\r\n');
      expect(table().exportCsv({ download: false, bom: false, columns: ['name'] })).toBe(manual);
    });
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
