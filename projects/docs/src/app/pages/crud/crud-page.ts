import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Guide for `ng g @mk-kit/ui:crud` — the entity CRUD generator. */
@Component({
  selector: 'docs-crud-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: `
    .crud-code {
      background: var(--mk-surface-2);
      border: 1px solid var(--mk-border);
      border-radius: var(--mk-radius-md);
      padding: var(--mk-space-4);
      overflow-x: auto;
      font-size: 0.875rem;
    }
  `,
  template: `
    <div class="docs-page docs-container">
      <h1>CRUD generator</h1>
      <p class="docs-lead">
        One command turns an entity definition into a working admin slice:
        a typed model, a data service, an
        <code class="docs-inline">mk-table</code> list page with search,
        sorting, pagination and delete confirmation, an
        <code class="docs-inline">mk-dynamic-form</code> create/edit page,
        lazy routes wired into your app — and a spec that drives it all
        through the <a routerLink="/testing">test harnesses</a>.
      </p>

      <pre class="crud-code"><code>ng g &#64;mk-kit/ui:crud product --fields "name!:string,price:currency,status:select=draft|published,createdAt:date"</code></pre>

      <p>
        The slice lands in <code class="docs-inline">src/app/products/</code>
        and is reachable at <code class="docs-inline">/products</code>
        immediately: the default service is an in-memory store with seeded
        rows, so the pages run before any backend exists. Pass
        <code class="docs-inline">--api /api/products</code> to generate an
        <code class="docs-inline">HttpClient</code> service against a REST
        endpoint instead.
      </p>

      <h2>Field grammar</h2>
      <p>
        <code class="docs-inline">--fields</code> is a comma-separated list of
        <code class="docs-inline">key:type</code> pairs.
        <code class="docs-inline">!</code> after the key marks it required;
        selects list their options after <code class="docs-inline">=</code>.
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Type</th><th>Model type</th><th>Form control</th></tr>
        </thead>
        <tbody>
          <tr><td>string · email · url</td><td>string</td><td>input</td></tr>
          <tr><td>textarea</td><td>string</td><td>textarea</td></tr>
          <tr><td>number · currency</td><td>number</td><td>number / currency input</td></tr>
          <tr><td>boolean</td><td>boolean</td><td>mk-switch</td></tr>
          <tr><td>date · datetime</td><td>Date | null</td><td>mk-date-picker / mk-datetime-picker</td></tr>
          <tr><td>select=a|b|c</td><td>'a' | 'b' | 'c'</td><td>mk-select</td></tr>
          <tr><td>tags</td><td>string[]</td><td>mk-tag-input</td></tr>
        </tbody>
      </table>

      <h2>What is generated</h2>
      <table class="docs-props">
        <thead>
          <tr><th>File</th><th>Contents</th></tr>
        </thead>
        <tbody>
          <tr><td>product.model.ts</td><td>The interface, the table columns and the form schema — one file to grow the entity in.</td></tr>
          <tr><td>product.service.ts</td><td>list / get / create / update / remove. In-memory by default, HttpClient with --api.</td></tr>
          <tr><td>product-list-page.ts</td><td>mk-table + MkTableDataSource, search box, row actions, delete confirm, mk-pagination.</td></tr>
          <tr><td>product-form-page.ts</td><td>mk-dynamic-form handling both /new and /:id/edit.</td></tr>
          <tr><td>products.routes.ts</td><td>Lazy routes, wired into app.routes.ts automatically.</td></tr>
          <tr><td>products.spec.ts</td><td>Harness-driven tests: list render, confirmed delete, edit prefill (skip with --no-spec).</td></tr>
        </tbody>
      </table>

      <h2>Options</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Option</th><th>Default</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr><td>--fields</td><td>name!:string</td><td>The field spec above.</td></tr>
          <tr><td>--api</td><td>—</td><td>REST base URL; switches the service to HttpClient (needs provideHttpClient()).</td></tr>
          <tr><td>--plural</td><td>guessed</td><td>Override when English pluralization guesses wrong (--plural people).</td></tr>
          <tr><td>--path</td><td>src/app</td><td>Directory the entity folder is created in.</td></tr>
          <tr><td>--route</td><td>true</td><td>Wire the lazy route into app.routes.ts.</td></tr>
          <tr><td>--spec</td><td>true</td><td>Generate the harness spec.</td></tr>
        </tbody>
      </table>

      <h2>After generating</h2>
      <p>
        The generated code is a starting point that stays yours: the model
        file is the single source of truth, so adding a field means one
        interface line, one column and one schema entry. Swap the in-memory
        service bodies for API calls when the backend lands — the pages only
        depend on the service surface. The form schema takes everything
        <a routerLink="/components/dynamic-form">mk-dynamic-form</a>
        understands (hints, spans, <code class="docs-inline">showWhen</code>
        conditions, custom field templates), and the list page grows with
        <a routerLink="/components/table">mk-table</a>'s selection, header
        filters, virtual rows and CSV export.
      </p>
    </div>
  `,
})
export class CrudPage {}
