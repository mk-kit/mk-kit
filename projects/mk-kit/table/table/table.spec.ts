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
    (table as any).onResizeEnd(); // flushes the rAF-coalesced move
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

  it('resizes a column with arrow keys on the separator', () => {
    const resized = vi.fn();
    table.columnResize.subscribe(resized);
    const col = GRID_COLUMNS[1];
    const evt = {
      key: 'ArrowRight',
      shiftKey: false,
      preventDefault() {},
      stopPropagation() {},
      target: { closest: () => null },
    } as unknown as KeyboardEvent;
    (table as any).onResizeKeydown(evt, col);
    expect((table as any).colStyleWidth(col)).toBe('160px'); // 150 default + 10
    expect(resized).toHaveBeenCalledWith({ key: 'name', width: 160 });
  });

  it('reorders a column with Alt+ArrowRight on the header', () => {
    const reordered = vi.fn();
    table.columnReorder.subscribe(reordered);
    const evt = Object.assign(
      new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true }),
      { preventDefault() {} },
    );
    (table as any).onReorderKeydown(evt, GRID_COLUMNS[1]); // move name right
    expect(
      (table as any).orderedColumns().map((c: MkTableColumn<Row>) => c.key),
    ).toEqual(['id', 'notes', 'name']);
    expect(reordered).toHaveBeenCalledWith(['id', 'notes', 'name']);
  });

  it('labels the inline-edit input with its column header and focuses it', async () => {
    (table as any).startEdit(0, GRID_COLUMNS[1]);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector(
      '.mk-table__cell-input',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    // WCAG 4.1.2: the bare input had no accessible name at all.
    expect(input.getAttribute('aria-label')).toBe('Name');
    // Focus is explicit (afterNextRender), not a dynamically inserted
    // `autofocus` attribute, which browsers only honour on page load.
    expect(input.hasAttribute('autofocus')).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('bounds the resize separator with aria-valuemin/max', () => {
    const sep = fixture.nativeElement.querySelector(
      '.mk-table__resize',
    ) as HTMLElement;
    expect(sep).toBeTruthy();
    expect(sep.getAttribute('aria-valuemin')).toBe('60'); // default floor
    expect(sep.getAttribute('aria-valuemax')).toBe('2000');
    expect(sep.getAttribute('aria-valuenow')).toBe('80'); // id's 80px width
  });

  it('reflects a column minWidth as the separator floor', async () => {
    fixture.componentRef.setInput('columns', [
      { key: 'id', header: 'ID', resizable: true, minWidth: 120 },
      { key: 'name', header: 'Name' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const sep = fixture.nativeElement.querySelector(
      '.mk-table__resize',
    ) as HTMLElement;
    expect(sep.getAttribute('aria-valuemin')).toBe('120');
  });

  it('swallows Alt+Arrow at the edges instead of letting the browser navigate', () => {
    const reordered = vi.fn();
    table.columnReorder.subscribe(reordered);
    fixture.componentRef.setInput('columns', [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
    ]);
    fixture.detectChanges();
    const cols = (table as any).orderedColumns() as MkTableColumn<Row>[];

    // Alt+ArrowLeft on the FIRST column: no move, but the combo must still be
    // consumed or it falls through to the browser's history Back.
    const left = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      altKey: true,
      cancelable: true,
    });
    (table as any).onReorderKeydown(left, cols[0]);
    expect(left.defaultPrevented).toBe(true);

    // Alt+ArrowRight on the LAST column: same, against history Forward.
    const right = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      altKey: true,
      cancelable: true,
    });
    (table as any).onReorderKeydown(right, cols[cols.length - 1]);
    expect(right.defaultPrevented).toBe(true);

    expect(reordered).not.toHaveBeenCalled();
  });

  it('enters edit mode from the keyboard (Enter on an editable cell)', () => {
    const evt = {
      key: 'Enter',
      preventDefault() {},
      stopPropagation() {},
      target: { closest: () => null },
    } as unknown as KeyboardEvent;
    (table as any).onCellKeydown(evt, 0, GRID_COLUMNS[1]);
    expect((table as any).isEditing(0, GRID_COLUMNS[1])).toBe(true);
  });

  it('keeps desc sort stable and null-consistent (negated comparator)', () => {
    fixture.componentRef.setInput('data', [
      { id: 2, name: 'b', notes: '' },
      { id: 1, name: null as unknown as string, notes: '' },
      { id: 3, name: 'a', notes: '' },
    ]);
    (table as any).onSort({ key: 'name', header: 'Name', sortable: true });
    // asc: null first, then a, b
    expect((table as any).sortedData().map((r: Row) => r.id)).toEqual([1, 3, 2]);
    (table as any).onSort({ key: 'name', header: 'Name', sortable: true });
    // desc: b, a, then null last
    expect((table as any).sortedData().map((r: Row) => r.id)).toEqual([2, 3, 1]);
  });
});

// --- Grouping ---------------------------------------------------------------
interface GroupedRow {
  id: number;
  name: string;
  team: string;
}

@Component({
  selector: 'mk-table-group-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkTable],
  template: `
    <mk-table
      [columns]="columns"
      [data]="data()"
      [groupBy]="groupBy()"
      [groupLabel]="groupLabel()"
      (groupToggle)="lastToggle.set($event)"
    />
  `,
})
class GroupHost {
  readonly columns: MkTableColumn<GroupedRow>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'team', header: 'Team' },
  ];
  readonly data = signal<GroupedRow[]>([
    { id: 1, name: 'Ada', team: 'Core' },
    { id: 2, name: 'Grace', team: 'Infra' },
    { id: 3, name: 'Alan', team: 'Core' },
  ]);
  readonly groupBy = signal<string | ((row: GroupedRow) => unknown) | null>(
    'team',
  );
  readonly groupLabel = signal<
    ((value: unknown, rows: GroupedRow[]) => string) | null
  >(null);
  readonly lastToggle = signal<{ key: unknown; collapsed: boolean } | null>(
    null,
  );
}

describe('MkTable — grouped rows', () => {
  let fixture: ComponentFixture<GroupHost>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(GroupHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  function groupHeaders(): HTMLElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.mk-table__group-toggle'),
    );
  }
  function dataRows(): HTMLElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll(
        '.mk-table__body .mk-table__row:not(.mk-table__row--empty)',
      ),
    );
  }
  function bodyRowsInOrder(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll(
        '.mk-table__body tr',
      ) as NodeListOf<HTMLElement>,
    ).map((tr) =>
      tr.classList.contains('mk-table__group-row')
        ? `G:${tr.querySelector('.mk-table__group-label')!.textContent!.trim()}`
        : tr.querySelector('.mk-table__td')!.textContent!.trim(),
    );
  }

  it('renders a header per group with a count, rows kept contiguous', () => {
    expect(groupHeaders()).toHaveLength(2);
    expect(bodyRowsInOrder()).toEqual(['G:Core', 'Ada', 'Alan', 'G:Infra', 'Grace']);
    const counts = Array.from(
      fixture.nativeElement.querySelectorAll('.mk-table__group-count'),
    ).map((el: any) => el.textContent.trim());
    expect(counts).toEqual(['2 items', '1 item']);
  });

  it('collapses and re-expands a group, emitting groupToggle', async () => {
    groupHeaders()[0].click();
    await fixture.whenStable();
    expect(bodyRowsInOrder()).toEqual(['G:Core', 'G:Infra', 'Grace']);
    expect(groupHeaders()[0].getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.lastToggle()).toEqual({
      key: 'Core',
      collapsed: true,
    });

    groupHeaders()[0].click();
    await fixture.whenStable();
    expect(dataRows()).toHaveLength(3);
    expect(fixture.componentInstance.lastToggle()).toEqual({
      key: 'Core',
      collapsed: false,
    });
  });

  it('sorts within groups; group order follows the first sorted row', async () => {
    const sortBtn = fixture.nativeElement.querySelector(
      '.mk-table__th-button',
    ) as HTMLButtonElement;
    sortBtn.click(); // name asc
    await fixture.whenStable();
    expect(bodyRowsInOrder()).toEqual(['G:Core', 'Ada', 'Alan', 'G:Infra', 'Grace']);
    sortBtn.click(); // name desc — Grace first, so Infra group leads
    await fixture.whenStable();
    expect(bodyRowsInOrder()).toEqual(['G:Infra', 'Grace', 'G:Core', 'Alan', 'Ada']);
  });

  it('applies a custom groupLabel and supports accessor functions', async () => {
    fixture.componentInstance.groupLabel.set(
      (value, rows) => `${value} team (${rows.length})`,
    );
    await fixture.whenStable();
    expect(bodyRowsInOrder()[0]).toBe('G:Core team (2)');

    fixture.componentInstance.groupLabel.set(null);
    fixture.componentInstance.groupBy.set((row) =>
      row.name.startsWith('A') ? 'A-names' : 'Other',
    );
    await fixture.whenStable();
    expect(bodyRowsInOrder()).toEqual(['G:A-names', 'Ada', 'Alan', 'G:Other', 'Grace']);
  });

  it('renders plain rows with no group headers when groupBy is null', async () => {
    fixture.componentInstance.groupBy.set(null);
    await fixture.whenStable();
    expect(groupHeaders()).toHaveLength(0);
    expect(dataRows()).toHaveLength(3);
  });
});

// --- Stacked-mode roles ------------------------------------------------------
// `display: block`/`flex`/`grid` strips a table element of its implicit role,
// so while stacked the template re-applies them explicitly. The data rows and
// cells were covered by the 0.27.0 work; these pin the five spots that were
// missed: the selection cell, the expander cell, the detail row, the group
// header row and the empty-state row. `stacked` is normally set by a
// ResizeObserver, which jsdom does not run — the specs drive the protected
// signal directly, same as table-stacked.spec.ts.
interface StackRow {
  id: number;
  name: string;
  notes: string;
  team: string;
}

@Component({
  selector: 'mk-stack-roles-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkTable, MkTableRowDetail],
  template: `
    <mk-table
      [columns]="columns"
      [data]="data()"
      [groupBy]="groupBy()"
      selectable
      expandable
      stackAt="600"
    >
      <ng-template mkTableRowDetail let-row>
        <div class="detail-content">{{ row.notes }}</div>
      </ng-template>
    </mk-table>
  `,
})
class StackRolesHost {
  readonly columns: MkTableColumn<StackRow>[] = [
    { key: 'name', header: 'Name' },
    { key: 'team', header: 'Team' },
  ];
  readonly data = signal<StackRow[]>([
    { id: 1, name: 'Ada', notes: 'first', team: 'Core' },
  ]);
  readonly groupBy = signal<string | null>(null);
}

describe('MkTable — stacked mode roles', () => {
  let fixture: ComponentFixture<StackRolesHost>;

  async function render(
    opts: { data?: StackRow[]; groupBy?: string | null; stacked?: boolean } = {},
  ): Promise<HTMLElement> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(StackRolesHost);
    if (opts.data) fixture.componentInstance.data.set(opts.data);
    if (opts.groupBy !== undefined) {
      fixture.componentInstance.groupBy.set(opts.groupBy);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.debugElement.children[0]
      .componentInstance as MkTable<StackRow>;
    (table as unknown as { stacked: { set(v: boolean): void } }).stacked.set(
      opts.stacked ?? true,
    );
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => fixture?.destroy());

  it('re-applies cell roles to the selection and expander cells', async () => {
    const el = await render();
    expect(
      el.querySelector('.mk-table__td--select')?.getAttribute('role'),
    ).toBe('cell');
    expect(
      el.querySelector('.mk-table__td--expand')?.getAttribute('role'),
    ).toBe('cell');
  });

  it('re-applies row/cell roles to an expanded detail row', async () => {
    const el = await render();
    (el.querySelector('.mk-table__expander') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      el.querySelector('.mk-table__detail-row')?.getAttribute('role'),
    ).toBe('row');
    expect(el.querySelector('.mk-table__detail')?.getAttribute('role')).toBe(
      'cell',
    );
  });

  it('re-applies roles to the group header row', async () => {
    const el = await render({ groupBy: 'team' });
    expect(
      el.querySelector('.mk-table__group-row')?.getAttribute('role'),
    ).toBe('row');
    expect(el.querySelector('.mk-table__group')?.getAttribute('role')).toBe(
      'rowheader',
    );
  });

  it('re-applies roles to the empty-state row', async () => {
    const el = await render({ data: [] });
    expect(
      el.querySelector('.mk-table__row--empty')?.getAttribute('role'),
    ).toBe('row');
    expect(el.querySelector('.mk-table__empty')?.getAttribute('role')).toBe(
      'cell',
    );
  });

  it('adds none of these roles in the grid, where the elements already say it', async () => {
    const el = await render({ groupBy: 'team', stacked: false });
    expect(
      el.querySelector('.mk-table__td--select')?.getAttribute('role'),
    ).toBeNull();
    expect(
      el.querySelector('.mk-table__td--expand')?.getAttribute('role'),
    ).toBeNull();
    expect(
      el.querySelector('.mk-table__group-row')?.getAttribute('role'),
    ).toBeNull();
    expect(
      el.querySelector('.mk-table__group')?.getAttribute('role'),
    ).toBeNull();
  });
});

describe('MkTable rowClass', () => {
  it('appends the consumer class per row and tolerates null', async () => {
    @Component({
      imports: [MkTable],
      template: `<mk-table
        [columns]="cols"
        [data]="rows"
        [rowClass]="rowClass"
      />`,
    })
    class Host {
      cols = [{ key: 'name', header: 'Name' }] as MkTableColumn<{
        name: string;
      }>[];
      rows = [{ name: 'a' }, { name: 'b' }];
      rowClass = (r: { name: string }) => (r.name === 'a' ? 'is-hot' : null);
    }
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const rows = fixture.nativeElement.querySelectorAll('tr.mk-table__row');
    expect(rows[0].classList.contains('is-hot')).toBe(true);
    expect(rows[1].classList.contains('is-hot')).toBe(false);
  });
});
