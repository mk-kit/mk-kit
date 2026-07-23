import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkTable, MkTableColumn } from './table';
import { MkTableCell } from './table-cell';

interface Row {
  name: string;
  status: 'paid' | 'failed';
  amount: number;
}

const ROWS: Row[] = [
  { name: 'Ada', status: 'paid', amount: 120 },
  { name: 'Linus', status: 'failed', amount: 80 },
];

const COLUMNS: MkTableColumn<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status', format: (v) => `fmt:${v}` },
  { key: 'amount', header: 'Amount', format: (v) => `${v} zł` },
];

@Component({
  standalone: true,
  imports: [MkTable, MkTableCell],
  template: `
    <mk-table [columns]="columns" [data]="rows">
      <ng-template mkTableCell="status" let-value let-row="row">
        <span class="tag" [attr.data-tone]="value">{{ row.name }}:{{ value }}</span>
      </ng-template>
    </mk-table>
  `,
})
class Host {
  columns = COLUMNS;
  rows = ROWS;
}

/**
 * Without a cell template a cell can only be text (`format` returns a string),
 * so anything richer — a status tag, an avatar, an action button — meant
 * abandoning mk-table for a hand-rolled `<table>`.
 */
describe('MkTable cell templates', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  function setup() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    return f;
  }

  it('renders the projected template for the named column', () => {
    const f = setup();
    const tags = f.nativeElement.querySelectorAll('.tag');
    expect(tags).toHaveLength(2);
  });

  it('passes the raw value, not the formatted string', () => {
    const f = setup();
    const first = f.nativeElement.querySelector('.tag');
    expect(first.getAttribute('data-tone')).toBe('paid');
    expect(first.textContent).not.toContain('fmt:');
  });

  it('exposes the whole row as let-row', () => {
    const f = setup();
    const tags = [...f.nativeElement.querySelectorAll('.tag')];
    expect(tags[0].textContent.trim()).toBe('Ada:paid');
    expect(tags[1].textContent.trim()).toBe('Linus:failed');
  });

  it('leaves untemplated columns rendering their formatted text', () => {
    const f = setup();
    const text = f.nativeElement.textContent;
    expect(text).toContain('120 zł');
    expect(text).toContain('Ada');
  });

  it('a table with no cell templates is unaffected', () => {
    const f = TestBed.createComponent(MkTable<Row>);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', ROWS);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('fmt:paid');
    expect(f.nativeElement.querySelectorAll('.tag')).toHaveLength(0);
  });
});
