import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MkSort, MkSortHeader, type MkSortState } from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

interface Repo {
  name: string;
  language: string;
  stars: number;
  updated: string;
}

/**
 * Documentation + live demo page for the standalone `mkSort` / `mkSortHeader`
 * directives of `@mk-kit/ui`.
 */
@Component({
  selector: 'docs-sort-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkSort, MkSortHeader],
  template: `
    <div class="docs-page docs-container">
      <h1>Sort</h1>
      <p class="docs-lead">
        <code class="docs-inline">mkSort</code> and
        <code class="docs-inline">mkSortHeader</code> add accessible, keyboard-
        operable column sorting to <em>any</em> table markup — they track the
        active column and direction and emit
        <code class="docs-inline">mkSortChange</code>; you re-sort your rows in
        the handler. (The <code class="docs-inline">&lt;mk-table&gt;</code>
        component has built-in sorting; these directives are for hand-rolled
        tables and custom layouts.)
      </p>
      <p>
        Clicking a header cycles ascending → descending → unsorted; the arrow
        hints on hover and turns solid when active. Enter/Space work when a
        header is focused, and each change is announced via a live region.
      </p>

      <!-- ============================================================ -->
      <h2>On a native table</h2>
      <docs-example [code]="tableCode" column>
        <table
          class="sort-demo"
          mkSort
          [mkSortActive]="sort().active"
          [mkSortDirection]="sort().direction"
          (mkSortChange)="onSort($event)"
        >
          <thead>
            <tr>
              <th mkSortHeader="name">Repository</th>
              <th mkSortHeader="language">Language</th>
              <th mkSortHeader="stars" mkSortHeaderStart="desc">Stars</th>
              <th mkSortHeader="updated">Updated</th>
            </tr>
          </thead>
          <tbody>
            @for (r of sortedRepos(); track r.name) {
              <tr>
                <td>{{ r.name }}</td>
                <td>{{ r.language }}</td>
                <td>{{ r.stars.toLocaleString() }}</td>
                <td>{{ r.updated }}</td>
              </tr>
            }
          </tbody>
        </table>
        <p class="echo">
          Sort:
          <code class="docs-inline">{{
            sort().direction === 'none'
              ? 'none'
              : sort().active + ' · ' + sort().direction
          }}</code>
        </p>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Options</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>On</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>mkSortActive</td><td>mkSort</td><td>Two-way id of the sorted column.</td></tr>
          <tr><td>mkSortDirection</td><td>mkSort</td><td>Two-way <code class="docs-inline">'asc' | 'desc' | 'none'</code>.</td></tr>
          <tr><td>mkSortStart</td><td>mkSort</td><td>Direction of the first click. Default <code class="docs-inline">'asc'</code>.</td></tr>
          <tr><td>mkSortDisableClear</td><td>mkSort</td><td>Cycle asc ↔ desc only (no unsorted step).</td></tr>
          <tr><td>mkSortDisabled</td><td>mkSort</td><td>Disable sorting for every header.</td></tr>
          <tr><td>mkSortHeaderStart</td><td>mkSortHeader</td><td>Per-header first-click direction (e.g. numbers → <code class="docs-inline">desc</code>).</td></tr>
          <tr><td>mkSortHeaderDisabled</td><td>mkSortHeader</td><td>Disable just this header.</td></tr>
          <tr><td>mkSortHeaderLabel</td><td>mkSortHeader</td><td>Accessible label used in announcements.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .sort-demo {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mk-font-size-md);
      }
      .sort-demo th,
      .sort-demo td {
        padding: var(--mk-space-2) var(--mk-space-3);
        text-align: left;
        border-bottom: var(--mk-border-width) solid var(--mk-border-subtle);
      }
      .sort-demo th {
        color: var(--mk-text);
        font-weight: var(--mk-font-weight-semibold);
      }
      .sort-demo tbody tr:hover {
        background-color: var(--mk-hover-overlay);
      }
    `,
  ],
})
export class SortPage {
  private readonly repos: Repo[] = [
    { name: 'angular', language: 'TypeScript', stars: 95400, updated: '2026-07-01' },
    { name: 'rxjs', language: 'TypeScript', stars: 30700, updated: '2026-05-18' },
    { name: 'zone.js', language: 'JavaScript', stars: 3300, updated: '2026-02-09' },
    { name: 'components', language: 'TypeScript', stars: 24200, updated: '2026-06-27' },
    { name: 'angular-cli', language: 'TypeScript', stars: 26800, updated: '2026-06-30' },
  ];

  protected readonly sort = signal<MkSortState>({ active: '', direction: 'none' });

  protected readonly sortedRepos = computed<Repo[]>(() => {
    const { active, direction } = this.sort();
    if (!active || direction === 'none') return this.repos;
    const dir = direction === 'asc' ? 1 : -1;
    return [...this.repos].sort((a, b) => {
      const av = a[active as keyof Repo];
      const bv = b[active as keyof Repo];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  protected onSort(state: MkSortState): void {
    this.sort.set(state);
  }

  protected readonly tableCode = `<table mkSort
  [mkSortActive]="sort().active"
  [mkSortDirection]="sort().direction"
  (mkSortChange)="onSort($event)">
  <thead><tr>
    <th mkSortHeader="name">Repository</th>
    <th mkSortHeader="stars" mkSortHeaderStart="desc">Stars</th>
  </tr></thead>
  <tbody>
    @for (r of sortedRepos(); track r.name) { <tr>…</tr> }
  </tbody>
</table>

// re-sort in the handler:
onSort(s: MkSortState) { this.sort.set(s); }`;
}
