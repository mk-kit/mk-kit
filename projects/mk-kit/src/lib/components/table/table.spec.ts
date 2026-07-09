import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTable, type MkTableColumn } from './table';
import { MkTableRowDetail } from './table-row-detail';

interface Row {
  id: number;
  name: string;
  notes: string;
}

const COLUMNS: MkTableColumn<Row>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
];

@Component({
  selector: 'mk-table-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkTable, MkTableRowDetail],
  template: `
    <mk-table
      [columns]="columns"
      [data]="data()"
      expandable
      [singleExpand]="singleExpand()"
      (expandedChange)="expanded.set($event)"
    >
      <ng-template mkTableRowDetail let-row>
        <div class="detail-content">Notes: {{ row.notes }}</div>
      </ng-template>
    </mk-table>
  `,
})
class TableHost {
  readonly columns = COLUMNS;
  readonly data = signal<Row[]>([
    { id: 1, name: 'Ada', notes: 'first' },
    { id: 2, name: 'Grace', notes: 'second' },
  ]);
  readonly singleExpand = signal(false);
  readonly expanded = signal<Row[]>([]);
}

describe('MkTable — expandable rows', () => {
  let fixture: ComponentFixture<TableHost>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  function expanders(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.mk-table__expander'),
    );
  }
  function detailRows(): HTMLElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.mk-table__detail-row'),
    );
  }

  it('renders an expander per row and no detail row until expanded', () => {
    expect(expanders()).toHaveLength(2);
    expect(detailRows()).toHaveLength(0);
    expect(expanders()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('expands a row, projecting the row context into the detail template', async () => {
    expanders()[0].click();
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = detailRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Notes: first');
    expect(expanders()[0].getAttribute('aria-expanded')).toBe('true');
    // aria-controls points at the rendered detail cell's id.
    const controls = expanders()[0].getAttribute('aria-controls');
    expect(fixture.nativeElement.querySelector(`#${controls}`)).toBeTruthy();
    expect(fixture.componentInstance.expanded().map((r) => r.id)).toEqual([1]);
  });

  it('collapses an expanded row when toggled again', async () => {
    expanders()[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expanders()[0].click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(detailRows()).toHaveLength(0);
    expect(fixture.componentInstance.expanded()).toEqual([]);
  });

  it('allows multiple rows open by default', async () => {
    expanders()[0].click();
    expanders()[1].click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(detailRows()).toHaveLength(2);
    expect(fixture.componentInstance.expanded().map((r) => r.id)).toEqual([1, 2]);
  });

  it('keeps only one row open in singleExpand mode', async () => {
    fixture.componentInstance.singleExpand.set(true);
    fixture.detectChanges();

    expanders()[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expanders()[1].click();
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = detailRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Notes: second');
    expect(fixture.componentInstance.expanded().map((r) => r.id)).toEqual([2]);
  });
});

describe('MkTable — data-grid pro', () => {
  let fixture: ComponentFixture<MkTable<Row>>;
  let table: MkTable<Row>;

  const GRID_COLUMNS: MkTableColumn<Row>[] = [
    { key: 'id', header: 'ID', pinned: 'left', width: '80px', resizable: true },
    { key: 'name', header: 'Name', resizable: true, editable: true },
    { key: 'notes', header: 'Notes', editable: true },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent<MkTable<Row>>(MkTable);
    table = fixture.componentInstance;
    fixture.componentRef.setInput('columns', GRID_COLUMNS);
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'Ada', notes: 'x' },
    ]);
    fixture.componentRef.setInput('resizableColumns', true);
    fixture.componentRef.setInput('reorderableColumns', true);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('resizing a column updates its rendered width and emits', () => {
    const resized = vi.fn();
    table.columnResize.subscribe(resized);
    const col = GRID_COLUMNS[1]; // name, no fixed width
    (table as any).startResize(
      { clientX: 100, preventDefault() {}, stopPropagation() {}, target: { closest: () => null } },
      col,
    );
    (table as any).onResizeMove({ clientX: 160 }); // +60
    (table as any).onResizeEnd();
    expect((table as any).colStyleWidth(col)).toBe('210px'); // 150 default + 60
    expect(resized).toHaveBeenCalledWith({ key: 'name', width: 210 });
  });

  it('never resizes below the minimum width', () => {
    const col = GRID_COLUMNS[1];
    (table as any).startResize(
      { clientX: 100, preventDefault() {}, stopPropagation() {}, target: { closest: () => null } },
      col,
    );
    (table as any).onResizeMove({ clientX: -500 }); // way negative
    expect((table as any).colStyleWidth(col)).toBe('60px'); // clamped to min
  });

  it('reordering moves a column and emits the new key order', () => {
    const reordered = vi.fn();
    table.columnReorder.subscribe(reordered);
    // drag "notes" onto "name"
    (table as any).onColDragStart({ dataTransfer: null }, GRID_COLUMNS[2]);
    (table as any).onColDrop({ preventDefault() {} }, GRID_COLUMNS[1]);
    expect((table as any).orderedColumns().map((c: MkTableColumn<Row>) => c.key)).toEqual([
      'id',
      'notes',
      'name',
    ]);
    expect(reordered).toHaveBeenCalledWith(['id', 'notes', 'name']);
  });

  it('computes a sticky offset for pinned columns', () => {
    // id is the only left-pinned column, first in order → offset 0.
    expect((table as any).pinnedOffset(GRID_COLUMNS[0])).toBe(0);
    // A second left-pinned column sits after id's 80px width.
    fixture.componentRef.setInput('columns', [
      { key: 'id', header: 'ID', pinned: 'left', width: '80px' },
      { key: 'name', header: 'Name', pinned: 'left', width: '120px' },
      { key: 'notes', header: 'Notes' },
    ]);
    fixture.detectChanges();
    const cols = (table as any).orderedColumns() as MkTableColumn<Row>[];
    expect((table as any).pinnedOffset(cols[1])).toBe(80);
  });

  it('inline edit toggles and commits, emitting cellEdit', () => {
    const edited = vi.fn();
    table.cellEdit.subscribe(edited);
    const col = GRID_COLUMNS[1];
    const row = { id: 1, name: 'Ada', notes: 'x' };
    expect((table as any).isEditing(0, col)).toBe(false);
    (table as any).startEdit(0, col);
    expect((table as any).isEditing(0, col)).toBe(true);
    (table as any).commitEdit(row, col, 'Grace');
    expect((table as any).isEditing(0, col)).toBe(false);
    expect(edited).toHaveBeenCalledWith({ row, key: 'name', value: 'Grace' });
  });

  it('cancelEdit exits without emitting', () => {
    const edited = vi.fn();
    table.cellEdit.subscribe(edited);
    (table as any).startEdit(0, GRID_COLUMNS[2]);
    (table as any).cancelEdit();
    expect((table as any).isEditing(0, GRID_COLUMNS[2])).toBe(false);
    expect(edited).not.toHaveBeenCalled();
  });
});
