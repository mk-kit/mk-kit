import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  signal,
} from '@angular/core';
import {
  MkAlert,
  MkBarChart,
  MkChartSeries,
  MkInput,
  MkSpinner,
  MkStatCard,
  MkTable,
  MkTableColumn,
} from '@mk-kit/ui';
import { CostDoc, CostRow, buildRows, filterRows, formatKiB, formatPercent } from './cost';

/**
 * Bundle cost — what every entry point and every export of `@mk-kit/ui`
 * weighs in a production build, from `cost.json` (written by
 * `scripts/gen-cost.mjs` against the built package, so the numbers are
 * measured, not estimated). The table is `mk-table` with sortable columns.
 */
@Component({
  selector: 'docs-cost-page',
  imports: [MkAlert, MkBarChart, MkInput, MkSpinner, MkStatCard, MkTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Bundle cost</h1>
      <p class="docs-lead">
        What every component, directive and service of
        <strong>&#64;mk-kit/ui</strong> costs your app, measured — not
        estimated — from the package npm ships. Each entry point is bundled the
        way an Angular CLI production build bundles it (linked, tree-shaken,
        minified, <code class="docs-inline">ngDevMode</code> off) and the
        result is brotli-compressed. Angular, rxjs and tslib are left out because
        your app already has them; nothing else is, because the library has
        <strong>zero runtime dependencies beyond Angular</strong>. Import from
        the group entry points and you pay only for what you use.
      </p>

      @switch (state()) {
        @case ('loading') {
          <div class="cost-loading" role="status">
            <mk-spinner />
            <span>Measuring…</span>
          </div>
        }
        @case ('error') {
          <mk-alert tone="warning" title="Couldn't load the cost table">
            <code class="docs-inline">cost.json</code> isn't reachable right now.
            The raw data lives in
            <a
              href="https://github.com/mk-kit/mk-kit/blob/main/projects/docs/public/cost.json"
              target="_blank"
              rel="noopener noreferrer"
              >GitHub</a
            >.
          </mk-alert>
        }
        @case ('ready') {
          @if (doc(); as d) {
            <div class="cost-summary">
              <mk-stat-card
                label="Whole library"
                [value]="kib(d.total.brotli, 0)"
                [hint]="'minified + brotli · ' + kib(d.total.raw, 0) + ' raw'"
              />
              <mk-stat-card
                label="Entry points"
                [value]="d.entries.length"
                [hint]="exportCount() + ' exports measured'"
              />
              <mk-stat-card
                label="Largest entry"
                [value]="largest().name"
                [hint]="kib(largest().brotli) + ' · ' + largest().items.length + ' exports'"
              />
              <mk-stat-card
                label="Smallest entry"
                [value]="smallest().name"
                [hint]="kib(smallest().brotli) + ' · ' + smallest().items.length + ' exports'"
              />
            </div>

            <h2 id="entries">Entry points</h2>
            <p>
              Brotli-compressed size of each <code class="docs-inline">&#64;mk-kit/ui/*</code>
              entry point on its own. An app that imports from three of them
              ships (at most) those three — the root
              <code class="docs-inline">&#64;mk-kit/ui</code> barrel only
              re-exports them and tree-shakes to the same result.
            </p>
            <div class="cost-chart">
              <mk-bar-chart
                orientation="horizontal"
                [categories]="chartCategories()"
                [series]="chartSeries()"
                [height]="chartHeight()"
                [showLegend]="false"
                label="Entry point size in KiB, brotli"
              />
            </div>

            <h2 id="table">Every export</h2>
            <p>
              <strong>Size</strong> is the export bundled alone, sibling entry
              points external — the part of its entry point that import
              actually needs. <strong>Standalone</strong> adds the mk-kit code it
              pulls from other entries (typically the icon set and the i18n
              defaults) — what an app pays for importing only that one thing.
              <strong>Budget</strong> is the uncompressed limit CI enforces on
              the entry point. Click a header to sort.
            </p>
            @if (d.method !== 'esbuild') {
              <mk-alert tone="info" title="Entry share">
                Per-export measurement needs esbuild and the Angular linker; this
                build only had entry-point sizes, so every export shows the size of
                its whole entry point.
              </mk-alert>
            }
            <div class="cost-filter">
              <input
                mkInput
                type="search"
                placeholder="Filter — e.g. mk-select, directive, table…"
                aria-label="Filter the cost table"
                [value]="query()"
                (input)="query.set($any($event.target).value)"
              />
              <span class="cost-filter__count" role="status">
                {{ filtered().length }} of {{ rows().length }} rows
              </span>
            </div>
            <mk-table
              [columns]="columns"
              [data]="filtered()"
              trackKey="id"
              stickyHeader
              density="compact"
              emptyMessage="Nothing matches."
              class="cost-table"
              style="width: 100%; max-height: 70vh"
            />

            <h2 id="method">How it is measured</h2>
            <ul>
              <li>
                The input is <code class="docs-inline">dist/mk-kit/fesm2022</code>
                — the exact files in the npm package, v{{ d.version }}. Nothing is
                measured from source.
              </li>
              <li>
                Each bundle goes through the same steps as an Angular CLI
                production build: the Angular linker, Angular's pure-annotation
                babel plugins, then esbuild{{ d.esbuild ? ' ' + d.esbuild : '' }}
                with tree-shaking and minification,
                <code class="docs-inline">ngDevMode</code> and
                <code class="docs-inline">ngJitMode</code> set to false. The
                number shown is the brotli-compressed output (quality 11).
              </li>
              <li>
                Externals: {{ d.externals.join(', ') }}. Every Angular app ships
                those already. There is nothing else to exclude —
                <code class="docs-inline">&#64;mk-kit/ui</code> has no other
                runtime dependencies.
              </li>
              <li>
                Sizes don't add up, on purpose. Exports of one entry point share
                helpers, so the sum of a column is larger than the entry point.
                Standalone sizes include shared chunks
                @if (shared(); as s) {
                  — the icon set ({{ kib(s.icons) }}) and the i18n defaults
                  ({{ kib(s.i18n) }}) —
                }
                that a real app pays once, not per component.
              </li>
              <li>
                Brotli compresses a small file worse than the same code inside a
                big app bundle, so these are conservative upper bounds.
              </li>
              <li>
                The budget column is the raw (uncompressed) limit from
                <code class="docs-inline">scripts/size-budget.json</code>, which
                <code class="docs-inline">scripts/check-size.mjs</code> enforces in
                CI ({{ d.total.budgetKiB.toLocaleString() }} KiB in total).
              </li>
              <li>
                Regenerated with <code class="docs-inline">npm run gen:cost</code>
                after every library build; CI fails when the committed
                <a href="/cost.json" target="_blank" rel="noopener">cost.json</a> is
                stale.
              </li>
            </ul>
          }
        }
      }
    </div>
  `,
  styles: [
    `
      .cost-loading {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        padding: var(--mk-space-8) 0;
        color: var(--mk-text-muted);
      }
      .cost-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
        gap: var(--mk-space-4);
        margin: var(--mk-space-6) 0;
      }
      .cost-chart {
        margin: var(--mk-space-4) 0;
      }
      .cost-filter {
        display: flex;
        align-items: center;
        gap: var(--mk-space-4);
        margin: var(--mk-space-4) 0;
      }
      .cost-filter input {
        flex: 1;
        max-width: 28rem;
      }
      .cost-filter__count {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
        white-space: nowrap;
      }
    `,
  ],
})
export class CostPage {
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly doc = signal<CostDoc | null>(null);
  protected readonly query = signal('');

  protected readonly rows = computed<CostRow[]>(() => {
    const d = this.doc();
    return d ? buildRows(d) : [];
  });

  /** Selector per row id, so the filter also matches `mk-select`. */
  private readonly selectors = computed(() => {
    const map = new Map<string, string>();
    for (const e of this.doc()?.entries ?? []) {
      for (const x of e.items) if (x.selector) map.set(`${e.name}/${x.name}`, x.selector);
    }
    return map;
  });

  protected readonly filtered = computed(() => filterRows(this.rows(), this.query(), this.selectors()));

  protected readonly exportCount = computed(
    () => this.doc()?.entries.reduce((n, e) => n + e.items.length, 0) ?? 0,
  );
  private readonly bySize = computed(() => [...(this.doc()?.entries ?? [])].sort((a, b) => b.brotli - a.brotli));
  protected readonly largest = computed(() => this.bySize()[0]);
  protected readonly smallest = computed(() => this.bySize()[this.bySize().length - 1]);

  protected readonly chartCategories = computed(() => this.bySize().map((e) => e.name));
  protected readonly chartSeries = computed<MkChartSeries[]>(() => [
    { name: 'KiB (brotli)', data: this.bySize().map((e) => Math.round((e.brotli / 1024) * 10) / 10) },
  ]);
  protected readonly chartHeight = computed(() => this.bySize().length * 24 + 56);

  /** The two chunks most standalone sizes share: the icon set and the i18n defaults. */
  protected readonly shared = computed(() => {
    const d = this.doc();
    if (!d || d.method !== 'esbuild') return null;
    const find = (entry: string, name: string) =>
      d.entries.find((e) => e.name === entry)?.items.find((x) => x.name === name)?.size ?? null;
    const icons = find('icon', 'MkIcon');
    const i18n = find('core', 'MK_I18N');
    return icons && i18n ? { icons, i18n } : null;
  });

  protected readonly columns: MkTableColumn<CostRow>[] = [
    { key: 'entry', header: 'Entry point', sortable: true, width: '9rem' },
    { key: 'export', header: 'Export', sortable: true },
    { key: 'kind', header: 'Kind', sortable: true, width: '7rem' },
    {
      key: 'size',
      header: 'Size (brotli)',
      sortable: true,
      align: 'end',
      format: (v, row) => (row.estimated ? `≤ ${formatKiB(v as number)} (entry share)` : formatKiB(v as number)),
    },
    {
      key: 'share',
      header: 'Share of entry',
      sortable: true,
      align: 'end',
      format: (v, row) => (row.isEntry ? `${formatPercent(v as number)} of library` : formatPercent(v as number)),
    },
    {
      key: 'standalone',
      header: 'Standalone',
      sortable: true,
      align: 'end',
      format: (v) => ((v as number) < 0 ? '—' : formatKiB(v as number)),
    },
    {
      key: 'budget',
      header: 'Budget (raw)',
      sortable: true,
      align: 'end',
      format: (_, row) =>
        !row.isEntry ? '—' : row.budgetKiB ? `${formatKiB(row.raw, 0)} / ${row.budgetKiB} KiB` : `${formatKiB(row.raw, 0)} · none`,
    },
  ];

  protected kib(bytes: number, digits = 1): string {
    return formatKiB(bytes, digits);
  }

  constructor() {
    afterNextRender(() => {
      fetch('/cost.json')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: CostDoc) => {
          this.doc.set(d);
          this.state.set('ready');
        })
        .catch(() => this.state.set('error'));
    });
  }
}
