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
