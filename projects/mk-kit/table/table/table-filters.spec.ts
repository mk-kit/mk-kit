import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkLiveAnnouncer } from '@mk-kit/ui/core';
import { MkTable, mkCompactFilters, type MkTableColumn, type MkTableFilters } from './table';

interface Row {
  id: number;
  name: string;
  role: string;
  orders: number;
  joined: Date | string | null;
  children?: Row[];
}

const ROWS: Row[] = [
  { id: 1, name: 'Ada Lovelace', role: 'Admin', orders: 42, joined: new Date(2024, 0, 15) },
  { id: 2, name: 'Grace Hopper', role: 'Editor', orders: 17, joined: '2024-03-02T10:00:00' },
  { id: 3, name: 'Alan Turing', role: 'Viewer', orders: 8, joined: new Date(2023, 11, 31, 23, 59) },
  { id: 4, name: 'Katherine Johnson', role: 'Editor', orders: 63, joined: null },
];

@Component({
  selector: 'mk-filter-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkTable],
  template: `
    <mk-table
      [columns]="columns()"
      [data]="data()"
      [filterable]="filterable()"
      [clientFilter]="clientFilter()"
      [(filters)]="filters"
      (filtersChange)="changes.set(changes() + 1)"
      [groupBy]="groupBy()"
      [childrenKey]="childrenKey()"
      [selectable]="true"
      trackKey="id"
      [(selected)]="selected"
    />
  `,
})
class FilterHost {
  readonly columns = signal<MkTableColumn<Row>[]>([
    { key: 'name', header: 'Name', sortable: true },
    { key: 'role', header: 'Role', filter: 'select' },
    { key: 'orders', header: 'Orders', filter: 'number' },
    { key: 'joined', header: 'Joined', filter: 'date' },
    { key: 'id', header: 'ID', filter: false, format: (v) => `#${v}` },
  ]);
  readonly data = signal<Row[]>(ROWS);
  readonly filterable = signal(true);
  readonly clientFilter = signal(true);
  readonly filters = signal<MkTableFilters>({});
  readonly changes = signal(0);
  readonly groupBy = signal<string | null>(null);
  readonly childrenKey = signal<string | null>(null);
  readonly selected = signal<Row[]>([]);
}

describe('MkTable — header filter row', () => {
  let fixture: ComponentFixture<FilterHost>;
  let host: FilterHost;
  let table: MkTable<Row>;
  let el: HTMLElement;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  function names(): string[] {
    return Array.from(el.querySelectorAll('tbody tr.mk-table__row')).map(
      (r) => r.querySelectorAll('td.mk-table__td')[1].querySelector('.mk-table__cell-value')!.textContent!.trim(),
    );
  }
  function control<E extends HTMLElement = HTMLInputElement>(key: string): E {
    return el.querySelector(`.mk-table__filter-control[data-filter-key="${key}"]`) as E;
  }
  async function type(key: string, value: string): Promise<void> {
    const input = control(key);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  }
  async function pick(key: string, value: string): Promise<void> {
    const select = control<HTMLSelectElement>(key);
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await settle();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(FilterHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    await settle();
    table = fixture.debugElement.children[0].componentInstance as MkTable<Row>;
  });

  afterEach(() => fixture.destroy());

  it('renders one control per column of the right kind, labelled from the header', () => {
    const row = el.querySelector('thead tr.mk-table__filter-row')!;
    expect(row).toBeTruthy();
    // Leading select column gets an empty cell so the controls line up.
    expect(row.querySelectorAll('td').length).toBe(6);
    expect(control('name').type).toBe('search');
    expect(control('name').getAttribute('aria-label')).toBe('Filter Name');
    expect(control('name').placeholder).toBe('Filter…');
    expect(control<HTMLSelectElement>('role').tagName).toBe('SELECT');
    expect(control('orders').type).toBe('number');
    expect(control('orders').placeholder).toBe('Min');
    expect(control('joined').type).toBe('date');
    expect(control('id')).toBeNull();
    expect(el.querySelector('.mk-table')!.classList.contains('mk-table--filterable')).toBe(true);
  });

  it('is absent without `filterable`', async () => {
    host.filterable.set(false);
    await settle();
    expect(el.querySelector('.mk-table__filter-row')).toBeNull();
  });

  it('text: case-insensitive contains on the displayed text, two-way bound', async () => {
    await type('name', 'ADA');
    expect(names()).toEqual(['Ada Lovelace']);
    expect(host.filters()).toEqual({ name: 'ADA' });
    expect(host.changes()).toBe(1);

    await type('name', '  a ');
    expect(names()).toEqual(['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson']);

    await type('name', '');
    expect(host.filters()).toEqual({});
    expect(host.changes()).toBe(3);
  });

  it('select: derives sorted distinct options and filters by equality', async () => {
    const select = control<HTMLSelectElement>('role');
    expect(Array.from(select.options).map((o) => o.textContent!.trim())).toEqual([
      'All',
      'Admin',
      'Editor',
      'Viewer',
    ]);
    await pick('role', 'Editor');
    expect(names()).toEqual(['Grace Hopper', 'Katherine Johnson']);
    expect(host.filters()).toEqual({ role: 'Editor' });
    expect(select.classList.contains('mk-table__filter-control--active')).toBe(true);
    await pick('role', '');
    expect(names().length).toBe(4);
  });

  it('select: explicit options keep their original (non-string) values', async () => {
    host.columns.update((cols) =>
      cols.map((c) =>
        c.key === 'orders'
          ? { ...c, filter: 'select', filterOptions: [{ value: 42, label: 'Forty-two' }, 8] }
          : c,
      ),
    );
    await settle();
    const select = control<HTMLSelectElement>('orders');
    expect(Array.from(select.options).map((o) => o.textContent!.trim())).toEqual(['All', 'Forty-two', '8']);
    await pick('orders', '42');
    expect(host.filters()).toEqual({ orders: 42 });
    expect(names()).toEqual(['Ada Lovelace']);
    expect(select.selectedIndex).toBe(1);
  });

  it('number: the control keeps values ≥ the entry; a range is inclusive', async () => {
    await type('orders', '17');
    expect(names()).toEqual(['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson']);
    expect(host.filters()).toEqual({ orders: 17 });

    host.filters.set({ orders: { min: 10, max: 42 } });
    await settle();
    expect(names()).toEqual(['Ada Lovelace', 'Grace Hopper']);
    expect(control('orders').value).toBe('10');

    host.filters.set({ orders: { max: 8 } });
    await settle();
    expect(names()).toEqual(['Alan Turing']);
  });

  it('date: compares by local calendar day for Dates and ISO strings', async () => {
    await type('joined', '2024-01-15');
    expect(names()).toEqual(['Ada Lovelace', 'Grace Hopper']);
    expect(host.filters()).toEqual({ joined: '2024-01-15' });

    host.filters.set({ joined: { min: new Date(2023, 11, 31), max: '2024-01-15' } });
    await settle();
    expect(names()).toEqual(['Ada Lovelace', 'Alan Turing']);
    expect(control('joined').value).toBe('2023-12-31');
  });

  it('shows a clear button per active filter; Escape clears too', async () => {
    expect(el.querySelector('.mk-table__filter-clear')).toBeNull();
    await type('name', 'gr');
    const clear = el.querySelector('.mk-table__filter-clear') as HTMLButtonElement;
    expect(clear.getAttribute('aria-label')).toBe('Clear filter for Name');
    clear.click();
    await settle();
    expect(host.filters()).toEqual({});
    expect(control('name').value).toBe('');

    await type('name', 'gr');
    control('name').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(host.filters()).toEqual({});
  });

  it('setFilter / clearFilter / clearFilters are public and de-duplicated', async () => {
    table.setFilter('name', 'ada');
    await settle();
    expect(control('name').value).toBe('ada');
    expect(names()).toEqual(['Ada Lovelace']);
    const changes = host.changes();
    table.setFilter('name', 'ada');
    table.clearFilter('orders');
    expect(host.changes()).toBe(changes);
    table.clearFilters();
    await settle();
    expect(host.filters()).toEqual({});
    expect(names().length).toBe(4);
    table.clearFilters();
    expect(host.changes()).toBe(changes + 1);
  });

  it('composes with sorting, grouping and select-all; export sees the filtered rows', async () => {
    host.groupBy.set('role');
    await settle();
    await pick('role', 'Editor');
    (el.querySelector('.mk-table__th-button') as HTMLButtonElement).click(); // sort by name
    await settle();
    expect(names()).toEqual(['Grace Hopper', 'Katherine Johnson']);
    expect(el.querySelector('.mk-table__group-count')!.textContent).toContain('2');
    expect(el.querySelectorAll('.mk-table__group-row').length).toBe(1);

    (el.querySelector('.mk-table__th--select input') as HTMLInputElement).click();
    await settle();
    expect(host.selected().map((r) => r.id)).toEqual([2, 4]);
    expect(table.getExportRows().rows.map((r) => r.name)).toEqual(['Grace Hopper', 'Katherine Johnson']);
    expect(table.exportCsv({ download: false })).not.toContain('Ada');
  });

  it('tree rows: a matching child keeps its parents; a parent with no visible children is a leaf', async () => {
    host.childrenKey.set('children');
    host.data.set([
      {
        id: 10,
        name: 'Engineering',
        role: 'Dept',
        orders: 0,
        joined: null,
        children: [
          { id: 11, name: 'Web', role: 'Team', orders: 0, joined: null, children: [
            { id: 12, name: 'Ada Lovelace', role: 'Staff', orders: 1, joined: null },
          ] },
          { id: 13, name: 'API', role: 'Team', orders: 0, joined: null },
        ],
      },
      { id: 20, name: 'Design', role: 'Dept', orders: 0, joined: null, children: [
        { id: 21, name: 'Grace Hopper', role: 'Lead', orders: 1, joined: null },
      ] },
    ]);
    await settle();
    await type('name', 'ada');
    expect(names()).toEqual(['Engineering']);
    table.expandAllRows();
    await settle();
    expect(names()).toEqual(['Engineering', 'Web', 'Ada Lovelace']);
    expect(table.getExportRows().rows.map((r) => r.id)).toEqual([10, 11, 12]);

    await type('name', 'engineering');
    expect(names()).toEqual(['Engineering']);
    // Every child was filtered out, so the row no longer offers a toggle.
    expect(el.querySelector('.mk-table__tree-toggle')).toBeNull();
    expect(el.querySelector('tbody tr.mk-table__row')!.hasAttribute('aria-expanded')).toBe(false);
  });

  it('clientFilter=false leaves the rows alone but still emits the filters', async () => {
    host.clientFilter.set(false);
    await settle();
    await type('name', 'ada');
    expect(names().length).toBe(4);
    expect(host.filters()).toEqual({ name: 'ada' });
  });

  it('announces the result count after a filter change', async () => {
    const announcer = TestBed.inject(MkLiveAnnouncer);
    const spy = vi.spyOn(announcer, 'announce');
    await type('name', 'ada');
    expect(spy).toHaveBeenLastCalledWith('1 result');
    await type('name', '');
    expect(spy).toHaveBeenLastCalledWith('4 results');
  });

  it('mkCompactFilters drops empty entries and normalises nothing-left to null', () => {
    expect(mkCompactFilters({ a: '', b: null, c: undefined, d: { min: '', max: null } })).toBeNull();
    expect(mkCompactFilters({ a: 'x', b: '', c: 0, d: { min: 1 } })).toEqual({ a: 'x', c: 0, d: { min: 1 } });
    expect(mkCompactFilters(null)).toBeNull();
  });
});
