import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { MkTable, type MkTableColumn } from './table';

/**
 * Stacked (card) layout — `stackAt`.
 *
 * The layout itself is CSS and jsdom has no layout engine, so these specs pin
 * the things that are NOT css: which cells get rendered, what each is labelled
 * with, and the ARIA roles that `display: block` would otherwise destroy.
 *
 * `stacked` is normally driven by a ResizeObserver on the host, which jsdom
 * does not run. The tests drive the protected signal directly — the observer
 * only ever sets that one boolean, so everything downstream is covered.
 */
interface Row {
  id: number;
  name: string;
  price: string;
  secret: string;
}

const COLUMNS: MkTableColumn<Row>[] = [
  { key: 'name', header: 'Nazwa', stack: 'title' },
  { key: 'price', header: 'Cena' },
  { key: 'id', header: 'ID', stack: 'hide' },
  { key: 'secret', header: '', stack: 'footer' },
];

@Component({
  selector: 'mk-stack-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkTable],
  template: `<mk-table [columns]="columns" [data]="data()" [stackAt]="stackAt()" />`,
})
class StackHost {
  columns = COLUMNS;
  data = signal<Row[]>([
    { id: 1, name: 'Ramen', price: '32 zł', secret: 'x' },
  ]);
  stackAt = signal(600);
}

describe('MkTable stacked layout', () => {
  let fixture: ComponentFixture<StackHost>;

  async function render(stacked: boolean) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(StackHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.debugElement.children[0].componentInstance as MkTable<Row>;
    (table as unknown as { stacked: { set(v: boolean): void } }).stacked.set(stacked);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => fixture?.destroy());

  it('keeps the table DOM so every other feature still works', async () => {
    // Selection, expansion, inline edit and consumer cell templates all reach
    // for a `td`. Rendering different elements would break all of them, and
    // every existing spec with them.
    const el = await render(true);
    expect(el.querySelector('tr.mk-table__row')).toBeTruthy();
    expect(el.querySelectorAll('.mk-table__td').length).toBeGreaterThan(0);
  });

  describe('which cells are rendered', () => {
    it('drops a hidden column entirely rather than hiding it', async () => {
      const el = await render(true);
      const card = el.querySelector('tr.mk-table__row')!;
      const labels = [...card.querySelectorAll('.mk-table__cell-label')].map(
        (n) => n.textContent?.trim(),
      );
      expect(labels).not.toContain('ID');
      // Not merely invisible: no cell exists, so nothing is read aloud either.
      // (Asserted on the card, not the host — the <thead> stays in the DOM and
      // is hidden with display:none, which takes it out of the a11y tree.)
      expect(card.textContent).not.toContain('ID');
      expect(card.querySelectorAll('.mk-table__td')).toHaveLength(3);
    });

    it('renders every column again in the grid', async () => {
      const el = await render(false);
      // `stack: 'hide'` must not leak into the layout it was never about.
      const headers = [...el.querySelectorAll('.mk-table__th-label')].map(
        (n) => n.textContent?.trim(),
      );
      expect(headers).toContain('ID');
    });
  });

  describe('labels', () => {
    it('labels a plain field with its column header', async () => {
      const el = await render(true);
      const field = el.querySelector('.mk-table__td--stack-field');
      expect(field?.querySelector('.mk-table__cell-label')?.textContent?.trim()).toBe(
        'Cena',
      );
      expect(field?.querySelector('.mk-table__cell-value')?.textContent?.trim()).toBe(
        '32 zł',
      );
    });

    it('gives the title no label — the value identifies the card', async () => {
      const el = await render(true);
      const title = el.querySelector('.mk-table__td--stack-title');
      expect(title).toBeTruthy();
      expect(title!.querySelector('.mk-table__cell-label')).toBeNull();
      expect(title!.textContent?.trim()).toBe('Ramen');
    });

    it('omits the label for a column that never had a header', async () => {
      // An actions column's header is empty; an empty label box is just a gap
      // the reader has to account for.
      const el = await render(true);
      const footer = el.querySelector('.mk-table__td--stack-footer');
      expect(footer).toBeTruthy();
      expect(footer!.querySelector('.mk-table__cell-label')).toBeNull();
    });

    it('renders no labels at all in the grid', async () => {
      const el = await render(false);
      expect(el.querySelector('.mk-table__cell-label')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('restores the table roles that display:block would strip', async () => {
      const el = await render(true);
      expect(el.querySelector('table')?.getAttribute('role')).toBe('table');
      expect(el.querySelector('tbody')?.getAttribute('role')).toBe('rowgroup');
      expect(el.querySelector('tr.mk-table__row')?.getAttribute('role')).toBe('row');
      expect(el.querySelector('.mk-table__td')?.getAttribute('role')).toBe('cell');
    });

    it('adds no roles in the grid, where the elements already say it', async () => {
      const el = await render(false);
      expect(el.querySelector('table')?.getAttribute('role')).toBeNull();
      expect(el.querySelector('tr.mk-table__row')?.getAttribute('role')).toBeNull();
    });

    it('leaves the label readable rather than hiding it from a reader', async () => {
      // The <thead> is display:none while stacked, so this label is the only
      // thing naming the value. aria-hidden here would silence it.
      const el = await render(true);
      const label = el.querySelector('.mk-table__cell-label');
      expect(label?.getAttribute('aria-hidden')).toBeNull();
    });

    it('passes axe in both layouts', async () => {
      // The point of the explicit roles. jsdom applies no stylesheet, so this
      // checks the ROLE STRUCTURE rather than the rendered layout — which is
      // exactly what display:block would have broken.
      for (const stacked of [false, true]) {
        const el = await render(stacked);
        const results = await axe.run(el, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
          rules: { 'color-contrast': { enabled: false } },
        });
        expect(
          results.violations.map((v) => `${stacked ? 'stacked' : 'grid'}: ${v.id}`),
        ).toEqual([]);
      }
    });
  });

  describe('grid-only chrome is suppressed', () => {
    it('drops per-column widths, which describe a grid', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const f = TestBed.createComponent(StackHost);
      f.componentInstance.columns = [
        { key: 'name', header: 'Nazwa', width: '300px' },
        { key: 'price', header: 'Cena' },
      ];
      f.detectChanges();
      await f.whenStable();
      const table = f.debugElement.children[0].componentInstance as MkTable<Row>;

      const widthOf = () =>
        (f.nativeElement as HTMLElement).querySelector<HTMLElement>(
          '.mk-table__td',
        )!.style.width;
      expect(widthOf()).toBe('300px');

      (table as unknown as { stacked: { set(v: boolean): void } }).stacked.set(true);
      f.detectChanges();
      await f.whenStable();
      // A card is one column wide; a 300px value box would overflow the phone
      // it stacked for.
      expect(widthOf()).toBe('');
      f.destroy();
    });
  });

  it('never stacks when stackAt is left at its default', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(StackHost);
    f.componentInstance.stackAt.set(0);
    f.detectChanges();
    await f.whenStable();
    const table = f.debugElement.children[0].componentInstance as MkTable<Row>;
    // Opt-in: an existing table must not change shape because it was narrow.
    expect((table as unknown as { stacked: () => boolean }).stacked()).toBe(false);
    f.destroy();
  });
});
