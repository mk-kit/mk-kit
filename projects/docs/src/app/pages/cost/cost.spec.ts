import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import costJson from '../../../../public/cost.json';
import { CostDoc, buildRows, filterRows, formatKiB, formatPercent } from './cost';
import { CostPage } from './cost-page';

const committed = costJson as CostDoc;

describe('cost.json (scripts/gen-cost.mjs)', () => {
  it('has the shape the page renders', () => {
    expect(committed.package).toBe('@mk-kit/ui');
    expect(committed.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(['esbuild', 'entry-share']).toContain(committed.method);
    expect(committed.externals).toContain('@angular/*');
    expect(committed.total.brotli).toBeGreaterThan(0);
    expect(committed.total.raw).toBeGreaterThan(committed.total.brotli);
    expect(committed.total.budgetKiB).toBeGreaterThan(0);
    expect(committed.entries.length).toBeGreaterThan(10);
    const names = committed.entries.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of ['core', 'forms', 'table', 'data']) expect(names).toContain(name);
  });

  it('keeps every entry point and export internally consistent', () => {
    let measured = 0;
    for (const e of committed.entries) {
      expect(e.import).toBe(`@mk-kit/ui/${e.name}`);
      expect(e.file).toBe(`mk-kit-ui-${e.name}.mjs`);
      expect(e.brotli).toBeGreaterThan(0);
      expect(e.raw).toBeGreaterThan(e.brotli);
      if (e.budgetKiB !== null) expect(e.raw / 1024).toBeLessThanOrEqual(e.budgetKiB);
      for (const x of e.items) {
        expect(['interface', 'type']).not.toContain(x.kind);
        if (x.own === null) continue;
        measured++;
        expect(x.own).toBeGreaterThan(0);
        // An export can never weigh more than its own entry point …
        expect(x.own).toBeLessThanOrEqual(e.brotli * 1.02);
        // … and pulling in its cross-entry dependencies can only add.
        expect(x.size).toBeGreaterThanOrEqual(x.own * 0.98);
      }
    }
    if (committed.method === 'esbuild') expect(measured).toBeGreaterThan(100);
    expect(committed.entries.reduce((n, e) => n + e.brotli, 0)).toBe(committed.total.brotli);
  });
});

const fixture: CostDoc = {
  package: '@mk-kit/ui',
  version: '9.9.9',
  method: 'esbuild',
  externals: ['@angular/*', 'rxjs', 'tslib'],
  esbuild: '0.0.0',
  total: { raw: 100 * 1024, min: 40 * 1024, brotli: 12 * 1024, budgetKiB: 200 },
  entries: [
    {
      name: 'forms',
      import: '@mk-kit/ui/forms',
      file: 'mk-kit-ui-forms.mjs',
      raw: 80 * 1024,
      min: 30 * 1024,
      brotli: 10 * 1024,
      budgetKiB: 100,
      items: [
        { name: 'MkSelect', kind: 'component', selector: 'mk-select', own: 5 * 1024, size: 9 * 1024 },
        { name: 'MkInput', kind: 'directive', selector: 'input[mkInput]', own: 2 * 1024, size: 3 * 1024 },
      ],
    },
    {
      name: 'button',
      import: '@mk-kit/ui/button',
      file: 'mk-kit-ui-button.mjs',
      raw: 20 * 1024,
      min: 10 * 1024,
      brotli: 2 * 1024,
      budgetKiB: null,
      items: [{ name: 'MkButton', kind: 'component', selector: 'button[mkButton]', own: 2 * 1024, size: 2 * 1024 }],
    },
  ],
};

describe('cost helpers', () => {
  it('formats sizes and shares', () => {
    expect(formatKiB(1536)).toBe('1.5 KiB');
    expect(formatKiB(1536, 0)).toBe('2 KiB');
    expect(formatPercent(0.5)).toBe('50%');
    expect(formatPercent(0.0525)).toBe('5.3%');
  });

  it('builds entry rows followed by their exports, largest entry first', () => {
    const rows = buildRows(fixture);
    expect(rows.map((r) => r.id)).toEqual(['forms', 'forms/MkSelect', 'forms/MkInput', 'button', 'button/MkButton']);
    const forms = rows[0];
    expect(forms.isEntry).toBe(true);
    expect(forms.size).toBe(10 * 1024);
    expect(forms.share).toBeCloseTo(10 / 12);
    expect(forms.budget).toBeCloseTo(0.8);
    const select = rows[1];
    expect(select.size).toBe(5 * 1024);
    expect(select.share).toBeCloseTo(0.5);
    expect(select.standalone).toBe(9 * 1024);
    expect(select.budget).toBe(-1);
    expect(select.estimated).toBe(false);
    expect(rows[3].budget).toBe(-1);
  });

  it('marks exports as entry share when per-export numbers are missing', () => {
    const rows = buildRows({
      ...fixture,
      method: 'entry-share',
      entries: [{ ...fixture.entries[1], items: [{ ...fixture.entries[1].items[0], own: null, size: null }] }],
    });
    expect(rows[1].estimated).toBe(true);
    expect(rows[1].size).toBe(2 * 1024);
    expect(rows[1].standalone).toBe(-1);
  });

  it('filters by entry, export, kind and selector', () => {
    const rows = buildRows(fixture);
    const selectors = new Map([['forms/MkSelect', 'mk-select'], ['forms/MkInput', 'input[mkInput]']]);
    expect(filterRows(rows, '', selectors)).toBe(rows);
    expect(filterRows(rows, 'mk-select', selectors).map((r) => r.id)).toEqual(['forms/MkSelect']);
    expect(filterRows(rows, 'DIRECTIVE', selectors).map((r) => r.id)).toEqual(['forms/MkInput']);
    expect(filterRows(rows, 'button', selectors).map((r) => r.id)).toEqual(['button', 'button/MkButton']);
    expect(filterRows(rows, 'entry point', selectors).length).toBe(2);
  });
});

describe('CostPage', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function mount(response: () => Response) {
    globalThis.fetch = (async () => response()) as typeof fetch;
    await TestBed.configureTestingModule({
      imports: [CostPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CostPage);
    await fixture.whenStable();
    // The fetch resolves after afterNextRender; settle the microtasks.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    return fixture;
  }

  it('renders the summary, the chart and a sortable table from cost.json', async () => {
    const f = await mount(() => new Response(JSON.stringify(fixture), { status: 200 }));
    const el = f.nativeElement as HTMLElement;

    const stats = [...el.querySelectorAll('.mk-stat-card__value')].map((n) => n.textContent?.trim());
    expect(stats).toEqual(['12 KiB', '2', 'forms', 'button']);

    expect(el.querySelector('mk-bar-chart')).toBeTruthy();

    const table = el.querySelector('mk-table')!;
    expect(table.querySelectorAll('tbody tr').length).toBe(5);
    expect(table.querySelectorAll('th[aria-sort]').length).toBeGreaterThan(0);
    const cells = [...table.querySelectorAll('tbody tr')[1].querySelectorAll('td')].map((td) => td.textContent?.trim());
    expect(cells).toEqual(['forms', 'MkSelect', 'component', '5.0 KiB', '50%', '9.0 KiB', '—']);
    const entryCells = [...table.querySelectorAll('tbody tr')[0].querySelectorAll('td')].map((td) => td.textContent?.trim());
    expect(entryCells[3]).toBe('10.0 KiB');
    expect(entryCells[4]).toBe('83% of library');
    expect(entryCells[6]).toBe('80 KiB / 100 KiB');
  });

  it('filters the table from the search box', async () => {
    const f = await mount(() => new Response(JSON.stringify(fixture), { status: 200 }));
    const el = f.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'mk-select';
    input.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(el.querySelectorAll('mk-table tbody tr').length).toBe(1);
    expect(el.querySelector('.cost-filter__count')?.textContent).toContain('1 of 5');
  });

  it('shows the error state when cost.json is missing', async () => {
    const f = await mount(() => new Response('', { status: 404 }));
    expect((f.nativeElement as HTMLElement).querySelector('mk-alert')).toBeTruthy();
  });
});
