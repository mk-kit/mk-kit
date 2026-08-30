/**
 * Content generators of the `crud` schematic — pure functions from the parsed
 * {@link CrudEntity} to file text, so the unit spec can assert on output
 * without a virtual tree. String templates (not `./files` assets) keep the
 * build a plain `tsc` like the other schematics.
 */
import type { CrudEntity, CrudField } from './model';
import { humanize, tsType } from './model';

/** Fields whose value reads naturally as text (filter haystack, title pick). */
const TEXTUAL = new Set(['string', 'textarea', 'email', 'url']);

/** The field used to name a record in messages ("Delete X?"), if any. */
export function titleField(entity: CrudEntity): CrudField | undefined {
  return entity.fields.find((f) => TEXTUAL.has(f.type));
}

/** Name of the exported routes const (`PRODUCTS_ROUTES`, `ORDER_LINES_ROUTES`). */
export function routesConstName(entity: CrudEntity): string {
  return `${entity.pluralFile.replace(/-/g, '_').toUpperCase()}_ROUTES`;
}

/** A deterministic sample value for seed row `i` (1-based), as a TS literal. */
function sampleLiteral(field: CrudField, i: number, entity: CrudEntity): string {
  switch (field.type) {
    case 'number':
      return String(i * 10);
    case 'currency':
      return (i * 10 - 0.01).toFixed(2);
    case 'boolean':
      return String(i % 2 === 1);
    case 'date':
      return `new Date('2026-0${i}-15')`;
    case 'datetime':
      return `new Date('2026-0${i}-15T09:30:00Z')`;
    case 'select':
      return `'${field.options[(i - 1) % field.options.length]}'`;
    case 'tags':
      return `['sample', 'tag-${i}']`;
    case 'email':
      return `'${entity.propertyName.toLowerCase()}${i}@example.com'`;
    case 'url':
      return `'https://example.com/${entity.pluralFile}/${i}'`;
    default:
      return `'${field.label} ${i}'`;
  }
}

/** The value a fresh form starts from, as a TS literal. */
function emptyLiteral(field: CrudField): string {
  switch (field.type) {
    case 'number':
    case 'currency':
      return '0';
    case 'boolean':
      return 'false';
    case 'date':
    case 'datetime':
      return 'null';
    case 'select':
      return `'${field.options[0]}'`;
    case 'tags':
      return '[]';
    default:
      return `''`;
  }
}

/** `mk-dynamic-form` field type for a crud field type. */
function dynamicType(field: CrudField): string {
  switch (field.type) {
    case 'string':
      return 'text';
    case 'boolean':
      return 'switch';
    default:
      return field.type;
  }
}

/** One column literal of the list table. */
function columnLiteral(field: CrudField): string {
  const parts = [`key: '${field.key}'`, `header: '${field.label}'`, 'sortable: true'];
  switch (field.type) {
    case 'number':
      parts.push(`align: 'end'`);
      break;
    case 'currency':
      parts.push(`align: 'end'`, `format: (value) => (typeof value === 'number' ? value.toFixed(2) : '')`);
      break;
    case 'boolean':
      parts.push(`format: (value) => (value ? 'Yes' : 'No')`);
      break;
    case 'date':
      parts.push(`format: (value) => (value instanceof Date ? value.toLocaleDateString() : '')`);
      break;
    case 'datetime':
      parts.push(`format: (value) => (value instanceof Date ? value.toLocaleString() : '')`);
      break;
    case 'tags':
      parts.push(`format: (value) => (Array.isArray(value) ? value.join(', ') : '')`);
      break;
  }
  return `  { ${parts.join(', ')} },`;
}

/** One dynamic-form field literal. */
function schemaFieldLiteral(field: CrudField): string {
  const parts = [`key: '${field.key}'`, `type: '${dynamicType(field)}'`, `label: '${field.label}'`];
  if (field.required) parts.push('required: true');
  if (field.type === 'select') {
    const options = field.options.map((o) => `{ label: '${humanize(o)}', value: '${o}' }`).join(', ');
    parts.push(`options: [${options}]`);
  }
  if (field.type === 'textarea') parts.push(`props: { rows: 4 }`);
  return `    { ${parts.join(', ')} },`;
}

/** `<entity>.model.ts` — the one source of truth the other files import. */
/** Fields whose runtime value is a `Date` (lost over JSON transport). */
function dateFields(entity: CrudEntity): CrudField[] {
  return entity.fields.filter((f) => f.type === 'date' || f.type === 'datetime');
}

export function modelFile(entity: CrudEntity): string {
  const { className, constName, human, fields } = entity;
  const iface = fields.map((f) => `  ${f.key}: ${tsType(f)};`).join('\n');
  const empty = fields.map((f) => `${f.key}: ${emptyLiteral(f)}`).join(', ');
  const columns = fields.map(columnLiteral).join('\n');
  const schema = fields.map(schemaFieldLiteral).join('\n');
  const dates = dateFields(entity);
  const revive = dates.length
    ? `
/** Revives date fields after JSON transport (an API answers ISO strings). */
export function revive${className}(row: ${className}): ${className} {
  return {
    ...row,
${dates.map((f) => `    ${f.key}: row.${f.key} ? new Date(row.${f.key}) : null,`).join('\n')}
  };
}
`
    : '';
  return `import type { MkDynamicSchema } from '@mk-kit/ui/dynamic-form';
import type { MkTableColumn } from '@mk-kit/ui/table';

/** One ${human} record, as the pages and the service exchange it. */
export interface ${className} {
  id: string;
${iface}
}

/** What the form edits — everything but the server-owned id. */
export type ${className}Draft = Omit<${className}, 'id'>;

/** The value a fresh "new ${human}" form starts from. */
export function empty${className}(): ${className}Draft {
  return { ${empty} };
}
${revive}

/** Columns of the list table (the \`actions\` column is a template in the page). */
export const ${constName}_COLUMNS: MkTableColumn<${className}>[] = [
${columns}
  { key: 'actions', header: '', align: 'end', stack: 'footer' },
];

/** Form schema — grow it with hints, spans and \`showWhen\` conditions as needed. */
export const ${constName}_SCHEMA: MkDynamicSchema = {
  columns: 2,
  fields: [
${schema}
  ],
};
`;
}

/** `<entity>.service.ts` — in-memory by default, HttpClient when `--api` is set. */
export function serviceFile(entity: CrudEntity, api: string | undefined): string {
  return api ? httpServiceFile(entity, api) : memoryServiceFile(entity);
}

function seedLiteral(entity: CrudEntity, i: number): string {
  const fields = entity.fields.map((f) => `${f.key}: ${sampleLiteral(f, i, entity)}`).join(', ');
  return `    { id: '${entity.fileName}-${i}', ${fields} },`;
}

function memoryServiceFile(entity: CrudEntity): string {
  const { className, propertyName, human, humanPlural } = entity;
  const seeds = [1, 2, 3].map((i) => seedLiteral(entity, i)).join('\n');
  const textual = entity.fields.filter((f) => TEXTUAL.has(f.type) || f.type === 'select' || f.type === 'tags');
  const haystack = textual.length
    ? textual.map((f) => `row.${f.key}`).join(', ')
    : `...Object.values(row)`;
  return `import { Injectable } from '@angular/core';
import type { MkDataPage, MkDataRequest } from '@mk-kit/ui/table';
import { ${className}, ${className}Draft } from './${entity.fileName}.model';

/**
 * In-memory ${human} store so the generated pages run immediately. Swap the
 * method bodies for real API calls when the backend exists — the pages only
 * depend on this surface (re-run the schematic with \`--api\` for an
 * HttpClient version).
 */
@Injectable({ providedIn: 'root' })
export class ${className}Service {
  private ${propertyName}s: ${className}[] = [
${seeds}
  ];

  /** One page of ${humanPlural}, honouring the table's filter / sort / paging. */
  async list(req: MkDataRequest): Promise<MkDataPage<${className}>> {
    let rows = [...this.${propertyName}s];
    const query = req.filter.trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) => [${haystack}].join(' ').toLowerCase().includes(query));
    }
    if (req.sort) {
      const { active, direction } = req.sort;
      const dir = direction === 'desc' ? -1 : 1;
      rows.sort((a, b) => {
        const av = a[active as keyof ${className}];
        const bv = b[active as keyof ${className}];
        return dir * String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
      });
    }
    const start = (req.page - 1) * req.pageSize;
    return { rows: rows.slice(start, start + req.pageSize), total: rows.length };
  }

  async get(id: string): Promise<${className} | undefined> {
    return this.${propertyName}s.find((row) => row.id === id);
  }

  async create(draft: ${className}Draft): Promise<${className}> {
    const row: ${className} = { id: crypto.randomUUID(), ...draft };
    this.${propertyName}s = [...this.${propertyName}s, row];
    return row;
  }

  async update(id: string, draft: ${className}Draft): Promise<${className}> {
    const row: ${className} = { id, ...draft };
    this.${propertyName}s = this.${propertyName}s.map((r) => (r.id === id ? row : r));
    return row;
  }

  async remove(id: string): Promise<void> {
    this.${propertyName}s = this.${propertyName}s.filter((row) => row.id !== id);
  }
}
`;
}

function httpServiceFile(entity: CrudEntity, api: string): string {
  const { className, human, humanPlural } = entity;
  const revive = dateFields(entity).length > 0;
  const modelImports = revive
    ? `${className}, ${className}Draft, revive${className}`
    : `${className}, ${className}Draft`;
  const listBody = revive
    ? `    const page = await firstValueFrom(this.http.get<MkDataPage<${className}>>(this.base, { params }));
    return { ...page, rows: page.rows.map(revive${className}) };`
    : `    return firstValueFrom(this.http.get<MkDataPage<${className}>>(this.base, { params }));`;
  const wrap = (expr: string): string => (revive ? `revive${className}(await ${expr})` : `await ${expr}`);
  return `import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { MkDataPage, MkDataRequest } from '@mk-kit/ui/table';
import { ${modelImports} } from './${entity.fileName}.model';

/**
 * REST ${human} service (needs \`provideHttpClient()\` in the app config).
 * Adjust the query params and endpoints to the real backend contract — the
 * pages only depend on this surface.
 */
@Injectable({ providedIn: 'root' })
export class ${className}Service {
  private readonly http = inject(HttpClient);
  private readonly base = '${api}';

  /** One page of ${humanPlural}; the server answers \`{ rows, total }\`. */
  async list(req: MkDataRequest): Promise<MkDataPage<${className}>> {
    let params = new HttpParams().set('page', req.page).set('pageSize', req.pageSize);
    if (req.filter) params = params.set('filter', req.filter);
    if (req.sort) params = params.set('sort', \`\${req.sort.active},\${req.sort.direction}\`);
${listBody}
  }

  async get(id: string): Promise<${className}> {
    return ${wrap(`firstValueFrom(this.http.get<${className}>(\`\${this.base}/\${id}\`))`)};
  }

  async create(draft: ${className}Draft): Promise<${className}> {
    return ${wrap(`firstValueFrom(this.http.post<${className}>(this.base, draft))`)};
  }

  async update(id: string, draft: ${className}Draft): Promise<${className}> {
    return ${wrap(`firstValueFrom(this.http.put<${className}>(\`\${this.base}/\${id}\`, draft))`)};
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(\`\${this.base}/\${id}\`));
  }
}
`;
}

/** `<entity>-list-page.ts`. */
export function listPageFile(entity: CrudEntity): string {
  const { className, constName, fileName, pluralFile, human, humanPlural } = entity;
  const title = titleField(entity);
  const confirmTitle = title
    ? `\`Delete "\${row.${title.key}}"?\``
    : `'Delete this ${human}?'`;
  return `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MkButton } from '@mk-kit/ui/button';
import { MkDialogService, MkToastService } from '@mk-kit/ui/feedback';
import { MkInput } from '@mk-kit/ui/forms';
import { MkPagination } from '@mk-kit/ui/navigation';
import { MkTable, MkTableCell, MkTableDataSource } from '@mk-kit/ui/table';
import { ${className}, ${constName}_COLUMNS } from './${fileName}.model';
import { ${className}Service } from './${fileName}.service';

@Component({
  selector: 'app-${fileName}-list-page',
  imports: [RouterLink, MkButton, MkInput, MkPagination, MkTable, MkTableCell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: \`
    .${pluralFile}-list {
      display: grid;
      gap: var(--mk-space-4);
    }
    .${pluralFile}-list__bar {
      display: flex;
      justify-content: space-between;
      gap: var(--mk-space-3);
    }
  \`,
  template: \`
    <div class="${pluralFile}-list">
      <header class="${pluralFile}-list__bar">
        <input
          mkInput
          type="search"
          placeholder="Search ${humanPlural}…"
          aria-label="Search ${humanPlural}"
          (input)="ds.setFilter($any($event.target).value)"
        />
        <a mkButton routerLink="new">New ${human}</a>
      </header>

      <mk-table [columns]="columns" [data]="ds.rows()" (sortChange)="ds.setSort($event)">
        <ng-template mkTableCell="actions" let-row="row">
          <a mkButton variant="ghost" size="sm" [routerLink]="[row.id, 'edit']">Edit</a>
          <button mkButton variant="ghost" tone="danger" size="sm" (click)="remove(row)">Delete</button>
        </ng-template>
      </mk-table>

      @if (ds.error()) {
        <p role="alert">Loading ${humanPlural} failed.</p>
      } @else if (ds.empty()) {
        <p>No ${humanPlural} yet.</p>
      }

      <mk-pagination
        [total]="ds.total()"
        [pageSize]="ds.pageSize()"
        [page]="ds.page()"
        (pageChange)="ds.setPage($event)"
      />
    </div>
  \`,
})
export class ${className}ListPage {
  private readonly service = inject(${className}Service);
  private readonly dialog = inject(MkDialogService);
  private readonly toasts = inject(MkToastService);

  protected readonly columns = ${constName}_COLUMNS;
  protected readonly ds = new MkTableDataSource<${className}>((req) => this.service.list(req));

  protected async remove(row: ${className}): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: ${confirmTitle},
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    await this.service.remove(row.id);
    this.toasts.success('${humanize(entity.propertyName)} deleted');
    this.ds.refresh();
  }
}
`;
}

/** `<entity>-form-page.ts` — one page for both `/new` and `/:id/edit`. */
export function formPageFile(entity: CrudEntity): string {
  const { className, constName, fileName, pluralFile, human } = entity;
  return `import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MkButton } from '@mk-kit/ui/button';
import { MkDynamicForm } from '@mk-kit/ui/dynamic-form';
import { MkToastService } from '@mk-kit/ui/feedback';
import { ${className}Draft, ${constName}_SCHEMA, empty${className} } from './${fileName}.model';
import { ${className}Service } from './${fileName}.service';

@Component({
  selector: 'app-${fileName}-form-page',
  imports: [RouterLink, MkButton, MkDynamicForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: \`
    .${pluralFile}-form {
      display: grid;
      gap: var(--mk-space-4);
      max-width: 40rem;
    }
  \`,
  template: \`
    <div class="${pluralFile}-form">
      <h1>{{ id ? 'Edit ${human}' : 'New ${human}' }}</h1>
      <mk-dynamic-form [schema]="schema" [(value)]="value" (formSubmit)="save($event)">
        <button mkButton type="submit" [loading]="saving()">Save</button>
        <a mkButton variant="ghost" [routerLink]="id ? ['../..'] : ['..']">Cancel</a>
      </mk-dynamic-form>
    </div>
  \`,
})
export class ${className}FormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(${className}Service);
  private readonly toasts = inject(MkToastService);

  protected readonly schema = ${constName}_SCHEMA;
  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly value = signal<Record<string, unknown>>({ ...empty${className}() });
  protected readonly saving = signal(false);

  constructor() {
    if (this.id) {
      void this.service.get(this.id).then((row) => {
        if (row) {
          const { id: _id, ...draft } = row;
          this.value.set(draft);
        }
      });
    }
  }

  protected async save(value: Record<string, unknown>): Promise<void> {
    this.saving.set(true);
    try {
      const draft = value as ${className}Draft;
      if (this.id) {
        await this.service.update(this.id, draft);
      } else {
        await this.service.create(draft);
      }
      this.toasts.success(this.id ? '${humanize(entity.propertyName)} updated' : '${humanize(entity.propertyName)} created');
      await this.router.navigate(this.id ? ['../..'] : ['..'], { relativeTo: this.route });
    } finally {
      this.saving.set(false);
    }
  }
}
`;
}

/** `<plural>.routes.ts`. */
export function routesFile(entity: CrudEntity): string {
  const { className, fileName, human } = entity;
  const title = humanize(entity.pluralProperty);
  return `import { Routes } from '@angular/router';
import { ${className}FormPage } from './${fileName}-form-page';
import { ${className}ListPage } from './${fileName}-list-page';

export const ${routesConstName(entity)}: Routes = [
  { path: '', component: ${className}ListPage, title: '${title}' },
  { path: 'new', component: ${className}FormPage, title: 'New ${human}' },
  { path: ':id/edit', component: ${className}FormPage, title: 'Edit ${human}' },
];
`;
}

/** `<plural>.spec.ts` — a harness-driven spec over a deterministic fake service. */
export function specFile(entity: CrudEntity): string {
  const { className, fileName, pluralFile, humanPlural } = entity;
  const seeds = [1, 2].map((i) => seedLiteral(entity, i)).join('\n');
  // The first form control is only predictable when the first field renders a
  // plain input — otherwise assert on the heading instead.
  const first = entity.fields[0];
  const firstIsInput = TEXTUAL.has(first.type);
  const editAssertions = firstIsInput
    ? `    const input = await loader.get(MkInputHarness);
    expect(input.value()).toBe(${sampleLiteral(first, 1, entity)});`
    : `    expect(fixture.nativeElement.textContent).toContain('Edit ${entity.human}');`;
  const harnessNames = ['MkButtonHarness', 'MkDialogHarness', 'MkHarnessLoader'];
  if (firstIsInput) harnessNames.push('MkInputHarness');
  harnessNames.push('MkTableHarness', 'MkToastHarness');
  const harnessImports = harnessNames.map((n) => `  ${n},`).join('\n');
  return `import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import type { MkDataPage, MkDataRequest } from '@mk-kit/ui/table';
import {
${harnessImports}
} from '@mk-kit/ui/testing';
import { ${className}, ${className}Draft } from './${fileName}.model';
import { ${className}FormPage } from './${fileName}-form-page';
import { ${className}ListPage } from './${fileName}-list-page';
import { ${className}Service } from './${fileName}.service';

/** Deterministic stand-in for ${className}Service, seeded per test. */
@Injectable()
class Fake${className}Service {
  rows: ${className}[] = [
${seeds}
  ];

  async list(req: MkDataRequest): Promise<MkDataPage<${className}>> {
    const start = (req.page - 1) * req.pageSize;
    return { rows: this.rows.slice(start, start + req.pageSize), total: this.rows.length };
  }
  async get(id: string): Promise<${className} | undefined> {
    return this.rows.find((row) => row.id === id);
  }
  async create(draft: ${className}Draft): Promise<${className}> {
    const row: ${className} = { id: \`${fileName}-\${this.rows.length + 1}\`, ...draft };
    this.rows = [...this.rows, row];
    return row;
  }
  async update(id: string, draft: ${className}Draft): Promise<${className}> {
    const row: ${className} = { id, ...draft };
    this.rows = this.rows.map((r) => (r.id === id ? row : r));
    return row;
  }
  async remove(id: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.id !== id);
  }
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('${humanPlural} CRUD', () => {
  afterEach(() => {
    // Overlays (dialogs, toasts) mount on document.body — leave it clean.
    document.body.querySelectorAll('.mk-overlay-backdrop, .mk-overlay-panel, mk-toast').forEach((el) => el.remove());
  });

  function setup(routeId?: string): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ${className}Service, useClass: Fake${className}Service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) } },
        },
      ],
    });
  }

  it('lists one row per record', async () => {
    setup();
    const fixture = TestBed.createComponent(${className}ListPage);
    const loader = MkHarnessLoader.fromFixture(fixture);
    await settle(fixture);
    await settle(fixture);

    const table = await loader.get(MkTableHarness);
    expect(await table.rowCount()).toBe(2);
  });

  it('deletes a record after confirmation', async () => {
    setup();
    const fixture = TestBed.createComponent(${className}ListPage);
    const loader = MkHarnessLoader.fromFixture(fixture);
    await settle(fixture);
    await settle(fixture);

    const table = await loader.get(MkTableHarness);
    const firstRow = (await table.rows())[0];
    const deleteButton = await loader.within(firstRow.host).get(MkButtonHarness, { text: 'Delete' });
    await deleteButton.click();

    const dialog = await loader.document().get(MkDialogHarness);
    await dialog.clickButton('Delete');
    await settle(fixture);
    await settle(fixture);

    expect(await table.rowCount()).toBe(1);
    const toast = await loader.document().get(MkToastHarness);
    expect(toast.message()).toContain('deleted');
  });

  it('loads the record into the form when editing', async () => {
    setup('${fileName}-1');
    const fixture = TestBed.createComponent(${className}FormPage);
    const loader = MkHarnessLoader.fromFixture(fixture);
    await settle(fixture);
    await settle(fixture);

${editAssertions}
  });
});
`;
}

/** Every generated file, keyed by file name inside the entity directory. */
export function crudFiles(entity: CrudEntity, options: { api?: string; spec: boolean }): Map<string, string> {
  const files = new Map<string, string>();
  files.set(`${entity.fileName}.model.ts`, modelFile(entity));
  files.set(`${entity.fileName}.service.ts`, serviceFile(entity, options.api));
  files.set(`${entity.fileName}-list-page.ts`, listPageFile(entity));
  files.set(`${entity.fileName}-form-page.ts`, formPageFile(entity));
  files.set(`${entity.pluralFile}.routes.ts`, routesFile(entity));
  if (options.spec) files.set(`${entity.pluralFile}.spec.ts`, specFile(entity));
  return files;
}
