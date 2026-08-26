import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTable, type MkTableColumn, type MkTreeToggle } from './table';

interface Node {
  id: string;
  name: string;
  size: number;
  children?: Node[];
}

const TREE: Node[] = [
  {
    id: 'eng',
    name: 'Engineering',
    size: 40,
    children: [
      { id: 'web', name: 'Web', size: 15, children: [{ id: 'ada', name: 'Ada', size: 1 }] },
      { id: 'api', name: 'API', size: 25 },
    ],
  },
  { id: 'ops', name: 'Operations', size: 8 },
  { id: 'design', name: 'Design', size: 6, children: [{ id: 'grace', name: 'Grace', size: 1 }] },
];

@Component({
  imports: [MkTable],
  template: `
    <mk-table
      [columns]="columns"
      [data]="rows"
      childrenKey="children"
      trackKey="id"
      [selectable]="selectable()"
      [clickableRows]="clickable()"
      [stackAt]="stackAt()"
      (treeToggle)="toggles.push($event)"
    />
  `,
})
class Host {
  readonly columns: MkTableColumn<Node>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'size', header: 'Size', sortable: true, align: 'end' },
  ];
  rows = TREE;
  readonly selectable = signal(false);
  readonly clickable = signal(false);
  readonly stackAt = signal(0);
  toggles: MkTreeToggle<Node>[] = [];
}

describe('MkTable tree rows', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const table = (): MkTable<Node> =>
    fixture.debugElement.children[0].componentInstance as MkTable<Node>;
  const rows = () =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('tbody .mk-table__row')];
  const names = () =>
    rows().map((r) => r.querySelector('.mk-table__td--tree .mk-table__cell-value')!.textContent!.trim());
  const rowByName = (name: string) => rows().find((r) => r.textContent!.includes(name))!;
  const toggleOf = (name: string) =>
    rowByName(name).querySelector<HTMLButtonElement>('.mk-table__tree-toggle');

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  afterEach(() => fixture.destroy());

  it('renders only root rows collapsed, as a treegrid with levels', () => {
    expect(names()).toEqual(['Engineering', 'Operations', 'Design']);
    const tbl = (fixture.nativeElement as HTMLElement).querySelector('table')!;
    expect(tbl.getAttribute('role')).toBe('treegrid');
    const eng = rowByName('Engineering');
    expect(eng.getAttribute('aria-level')).toBe('1');
    expect(eng.getAttribute('aria-expanded')).toBe('false');
    expect(rowByName('Operations').hasAttribute('aria-expanded')).toBe(false);
    expect(toggleOf('Operations')).toBeNull();
    expect(rowByName('Operations').querySelector('.mk-table__tree-spacer')).toBeTruthy();
  });

  it('expands and collapses children from the toggle, emitting treeToggle', async () => {
    toggleOf('Engineering')!.click();
    await settle();
    expect(names()).toEqual(['Engineering', 'Web', 'API', 'Operations', 'Design']);
    expect(rowByName('Engineering').getAttribute('aria-expanded')).toBe('true');
    expect(rowByName('Web').getAttribute('aria-level')).toBe('2');
    expect(rowByName('Web').style.getPropertyValue('--mk-tree-depth')).toBe('1');
    expect(host.toggles).toEqual([{ row: TREE[0], expanded: true }]);

    toggleOf('Web')!.click();
    await settle();
    expect(names()).toEqual(['Engineering', 'Web', 'Ada', 'API', 'Operations', 'Design']);
    expect(rowByName('Ada').getAttribute('aria-level')).toBe('3');

    toggleOf('Engineering')!.click();
    await settle();
    expect(names()).toEqual(['Engineering', 'Operations', 'Design']);
    expect(host.toggles.at(-1)).toEqual({ row: TREE[0], expanded: false });
  });

  it('remembers a nested expansion while its parent is collapsed', async () => {
    table().expandAllRows();
    await settle();
    expect(names()).toEqual(['Engineering', 'Web', 'Ada', 'API', 'Operations', 'Design', 'Grace']);
    toggleOf('Engineering')!.click();
    await settle();
    expect(names()).toEqual(['Engineering', 'Operations', 'Design', 'Grace']);
    toggleOf('Engineering')!.click();
    await settle();
    expect(names()).toEqual(['Engineering', 'Web', 'Ada', 'API', 'Operations', 'Design', 'Grace']);
    table().collapseAllRows();
    await settle();
    expect(names()).toEqual(['Engineering', 'Operations', 'Design']);
  });

  it('ArrowRight / ArrowLeft on a row open and close its children', async () => {
    host.clickable.set(true);
    await settle();
    const eng = rowByName('Engineering');
    const press = (el: HTMLElement, key: string) => {
      const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      el.dispatchEvent(e);
      return e;
    };
    expect(press(eng, 'ArrowRight').defaultPrevented).toBe(true);
    await settle();
    expect(names()).toContain('Web');
    expect(press(rowByName('Engineering'), 'ArrowLeft').defaultPrevented).toBe(true);
    await settle();
    expect(names()).not.toContain('Web');
    // A leaf ignores the keys.
    expect(press(rowByName('Operations'), 'ArrowRight').defaultPrevented).toBe(false);
  });

  it('sorts within each sibling group, keeping children under their parent', async () => {
    table().expandAllRows();
    await settle();
    const sizeHeader = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.mk-table__th-button')[1];
    sizeHeader.click(); // asc
    await settle();
    expect(names()).toEqual(['Design', 'Grace', 'Operations', 'Engineering', 'Web', 'Ada', 'API']);
    sizeHeader.click(); // desc
    await settle();
    expect(names()).toEqual(['Engineering', 'API', 'Web', 'Ada', 'Operations', 'Design', 'Grace']);
  });

  it('select-all covers every tree row, expanded or not', async () => {
    host.selectable.set(true);
    await settle();
    const headerBox = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('thead mk-checkbox input')!;
    headerBox.click();
    await settle();
    expect(table().selected().map((r) => r.id).sort()).toEqual(
      ['ada', 'api', 'design', 'eng', 'grace', 'ops', 'web'],
    );
  });

  it('stacked cards indent by depth', async () => {
    // `stacked` is driven by a ResizeObserver jsdom does not run; set it directly.
    (table() as unknown as { stacked: { set(v: boolean): void } }).stacked.set(true);
    table().expandAllRows();
    await settle();
    const web = rowByName('Web');
    expect(web.style.marginInlineStart).toBe('16px');
    expect(rowByName('Ada').style.marginInlineStart).toBe('32px');
    expect(rowByName('Engineering').style.marginInlineStart).toBe('');
  });
});
