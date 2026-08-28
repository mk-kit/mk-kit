import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTable, type MkTableColumn } from './table';
import { MkTableRowDetail } from './table-row-detail';

/**
 * Row virtualisation — `virtual`.
 *
 * jsdom has no layout, so nothing here is ever measured: the specs drive the
 * two signals the DOM would normally feed (the viewport height and the scroll
 * offset) and pin what follows from them — which rows exist, how tall the
 * spacers are, and that every feature reasoning about "all rows" still sees
 * all of them.
 */
interface Row {
  id: number;
  name: string;
  group: string;
  children?: Row[];
}

const ROW_HEIGHT = 40;
const VIEWPORT = 200;

function rowsOf(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Row ${i + 1}`,
    group: i % 2 === 0 ? 'even' : 'odd',
  }));
}

@Component({
  selector: 'mk-virtual-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkTable, MkTableRowDetail],
  template: `
    <mk-table
      [columns]="columns"
      [data]="data()"
      [virtual]="virtual()"
      [rowHeight]="rowHeight()"
      [overscan]="2"
      [maxHeight]="200"
      [selectable]="selectable()"
      [expandable]="expandable()"
      [groupBy]="groupBy()"
      [childrenKey]="childrenKey()"
      [zebra]="true"
      trackKey="id"
      [(selected)]="selected"
    >
      <ng-template mkTableRowDetail let-row>
        <div class="detail-content">Detail of {{ row.name }}</div>
      </ng-template>
    </mk-table>
  `,
})
class VirtualHost {
  readonly columns: MkTableColumn<Row>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name' },
  ];
  readonly data = signal<Row[]>(rowsOf(100));
  readonly virtual = signal(true);
  readonly rowHeight = signal<number | null>(ROW_HEIGHT);
  readonly selectable = signal(false);
  readonly expandable = signal(false);
  readonly groupBy = signal<string | null>(null);
  readonly childrenKey = signal<string | null>(null);
  readonly selected = signal<Row[]>([]);
}

describe('MkTable — virtual rows', () => {
  let fixture: ComponentFixture<VirtualHost>;
  let host: VirtualHost;
  let table: MkTable<Row>;
  let el: HTMLElement;

  /** Reach the signals a browser would set from layout. */
  function stubs() {
    return table as unknown as {
      viewportHeight: { set(v: number): void };
      scrollTop: { set(v: number): void };
      stacked: { set(v: boolean): void };
    };
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function rows(): HTMLElement[] {
    return Array.from(el.querySelectorAll('tbody tr.mk-table__row'));
  }
  function indexes(): number[] {
    return rows().map((r) => Number(r.dataset['index']));
  }
  function spacers(): number[] {
    return Array.from(el.querySelectorAll<HTMLElement>('tr.mk-table__spacer > td')).map((td) =>
      parseFloat(td.style.height),
    );
  }
  function scroller(): HTMLElement {
    return el.querySelector('.mk-table__scroll') as HTMLElement;
  }

  /** Scroll the box the way a user would: the element reports a new scrollTop. */
  async function scrollTo(top: number): Promise<void> {
    const box = scroller();
    Object.defineProperty(box, 'scrollTop', { value: top, configurable: true, writable: true });
    box.dispatchEvent(new Event('scroll'));
    await settle();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(VirtualHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    await settle();
    table = fixture.debugElement.children[0].componentInstance as MkTable<Row>;
    stubs().viewportHeight.set(VIEWPORT);
    await settle();
  });

  afterEach(() => fixture.destroy());

  it('renders only the viewport plus overscan, with a spacer for the rest', () => {
    // 200px / 40px = 5 rows visible (indexes 0..5 inclusive of the row at the
    // bottom edge) + 2 overscan below; nothing above the top.
    expect(indexes()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(spacers()).toEqual([(100 - 8) * ROW_HEIGHT]);
    expect(el.querySelector('table')!.getAttribute('aria-rowcount')).toBe('101');
    expect(rows()[0].getAttribute('aria-rowindex')).toBe('2');
    expect(scroller().getAttribute('data-row-height')).toBe(String(ROW_HEIGHT));
    expect(el.querySelector('.mk-table')!.classList.contains('mk-table--virtual')).toBe(true);
    expect(el.querySelector('.mk-table')!.classList.contains('mk-table--sticky')).toBe(true);
  });

  it('moves the window as the box scrolls, keeping both spacers honest', async () => {
    await scrollTo(50 * ROW_HEIGHT);
    expect(indexes()).toEqual([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]);
    expect(spacers()).toEqual([48 * ROW_HEIGHT, (100 - 58) * ROW_HEIGHT]);
    expect(rows()[0].getAttribute('aria-rowindex')).toBe('50');

    await scrollTo(99 * ROW_HEIGHT);
    expect(indexes()).toEqual([97, 98, 99]);
    expect(spacers()).toEqual([97 * ROW_HEIGHT]);
  });

  it('stripes by absolute index so zebra does not flicker with the window', async () => {
    await scrollTo(51 * ROW_HEIGHT);
    const first = rows()[0];
    expect(first.dataset['index']).toBe('49');
    expect(first.classList.contains('mk-table__row--even')).toBe(true);
    expect(rows()[1].classList.contains('mk-table__row--even')).toBe(false);
  });

  it('honours an explicit rowHeight and falls back to 44 when none is set', async () => {
    host.rowHeight.set(20);
    await settle();
    expect(indexes().length).toBe(10 + 1 + 2);
    expect(scroller().getAttribute('data-row-height')).toBe('20');

    host.rowHeight.set(null);
    await settle();
    expect(scroller().getAttribute('data-row-height')).toBe('44');
  });

  it('sorts the whole list, not the window', async () => {
    (el.querySelector('.mk-table__th-button') as HTMLButtonElement).click(); // asc
    await settle();
    (el.querySelector('.mk-table__th-button') as HTMLButtonElement).click(); // desc
    await settle();
    expect(rows()[0].textContent).toContain('Row 100');
    expect(indexes()[0]).toBe(0);
  });

  it('select-all covers every row, not just the rendered ones', async () => {
    host.selectable.set(true);
    await settle();
    (el.querySelector('.mk-table__th--select input') as HTMLInputElement).click();
    await settle();
    expect(host.selected().length).toBe(100);
    expect(table.getExportRows().rows.length).toBe(100);
  });

  it('counts group headers as rows in the window', async () => {
    host.groupBy.set('group');
    await settle();
    // 2 groups + 100 rows = 102 items (+ 1 header row).
    expect(el.querySelector('table')!.getAttribute('aria-rowcount')).toBe('103');
    expect(el.querySelectorAll('tbody tr.mk-table__group-row').length).toBe(1);
    expect(rows().length).toBe(7);
    expect(spacers()).toEqual([(102 - 8) * ROW_HEIGHT]);
  });

  it('re-windows the flattened list when a tree row expands', async () => {
    host.childrenKey.set('children');
    host.data.set([
      { id: 1, name: 'Parent', group: 'a', children: rowsOf(3).map((r) => ({ ...r, id: r.id + 100 })) },
      ...rowsOf(20).map((r) => ({ ...r, id: r.id + 200 })),
    ]);
    await settle();
    expect(el.querySelector('table')!.getAttribute('aria-rowcount')).toBe('22');
    (el.querySelector('.mk-table__tree-toggle') as HTMLButtonElement).click();
    await settle();
    expect(el.querySelector('table')!.getAttribute('aria-rowcount')).toBe('25');
    expect(rows()[1].textContent).toContain('Row 1');
    expect(rows()[1].getAttribute('aria-level')).toBe('2');
  });

  it('gives an expanded detail row one extra (unmeasured) row of space', async () => {
    host.expandable.set(true);
    await settle();
    expect(rows().length).toBe(8);
    (el.querySelector('.mk-table__expander') as HTMLButtonElement).click();
    await settle();
    expect(el.querySelector('.detail-content')!.textContent).toContain('Detail of Row 1');
    // The detail takes one slot, so one fewer data row fits the same window,
    // and the body is one row taller overall.
    expect(rows().length).toBe(7);
    expect(spacers()).toEqual([(100 + 1) * ROW_HEIGHT - 8 * ROW_HEIGHT]);
  });

  it('scrollToRow lands a display index or a row key at the top of the viewport', async () => {
    expect(table.scrollToRow(60)).toBe(true);
    await settle();
    expect(indexes()[0]).toBe(58);
    expect(spacers()[0]).toBe(58 * ROW_HEIGHT);

    expect(table.scrollToRow(30, 'key')).toBe(true);
    await settle();
    expect(rows().find((r) => r.dataset['index'] === '29')!.textContent).toContain('Row 30');

    expect(table.scrollToRow(999)).toBe(false);
    expect(table.scrollToRow('nope')).toBe(false);
    // Never past the end: the last viewport is clamped.
    expect(table.scrollToRow(99)).toBe(true);
    await settle();
    expect(indexes()).toContain(99);
    expect(indexes()[0]).toBe(100 - 5 - 2);
  });

  it('falls back to rendering everything while stacked into cards', async () => {
    stubs().stacked.set(true);
    await settle();
    expect(rows().length).toBe(100);
    expect(spacers()).toEqual([]);
    expect(el.querySelector('table')!.hasAttribute('aria-rowcount')).toBe(false);
  });

  it('is inert when virtual is off', async () => {
    host.virtual.set(false);
    await settle();
    expect(rows().length).toBe(100);
    expect(spacers()).toEqual([]);
    expect(scroller().hasAttribute('data-row-height')).toBe(false);
    expect(scroller().style.maxHeight).toBe('200px');
  });
});
