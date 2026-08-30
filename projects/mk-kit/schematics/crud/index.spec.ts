import { logging } from '@angular-devkit/core';
import { callRule, HostTree, SchematicContext, Tree } from '@angular-devkit/schematics';
import { lastValueFrom } from 'rxjs';

import { crudFiles, listPageFile, modelFile, routesConstName, serviceFile, specFile, titleField } from './files';
import { crud } from './index';
import { buildEntity, parseFields, pluralize } from './model';
import type { Schema } from './schema';

const APP_ROUTES = `import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
`;

function workspaceJson(): string {
  return JSON.stringify({
    version: 1,
    projects: {
      app: {
        projectType: 'application',
        root: '',
        sourceRoot: 'src',
        architect: { build: { builder: '@angular/build:application', options: { browser: 'src/main.ts' } } },
      },
    },
  });
}

function createTree({ routesTs = APP_ROUTES }: { routesTs?: string | null } = {}): Tree {
  const tree = new HostTree();
  tree.create('/angular.json', workspaceJson());
  tree.create('/package.json', JSON.stringify({ name: 'app', version: '0.0.0' }));
  if (routesTs !== null) tree.create('/src/app/app.routes.ts', routesTs);
  return tree;
}

async function runCrud(tree: Tree, options: Schema) {
  const logs: string[] = [];
  const logger = new logging.Logger('test');
  logger.subscribe((entry) => logs.push(`${entry.level}: ${entry.message}`));
  const context = { logger } as unknown as SchematicContext;

  const result = await lastValueFrom(callRule(crud(options), tree, context));
  return { tree: result, logs };
}

describe('crud schematic — field grammar and naming', () => {
  it('parses keys, required markers and select options', () => {
    const fields = parseFields('name!:string, price:currency ,status:select=draft|published,created_at:date');
    expect(fields.map((f) => f.key)).toEqual(['name', 'price', 'status', 'createdAt']);
    expect(fields[0].required).toBe(true);
    expect(fields[1].required).toBe(false);
    expect(fields[2].options).toEqual(['draft', 'published']);
    expect(fields[3].label).toBe('Created at');
  });

  it('defaults a bare key to string', () => {
    expect(parseFields('name')[0].type).toBe('string');
  });

  it('rejects unknown types, duplicate keys, optionless selects and a manual id', () => {
    expect(() => parseFields('name:blob')).toThrowError(/Unknown field type "blob"/);
    expect(() => parseFields('name:string,name:number')).toThrowError(/Duplicate field key/);
    expect(() => parseFields('status:select')).toThrowError(/lists no options/);
    expect(() => parseFields('id:string')).toThrowError(/added automatically/);
  });

  it('derives every name shape from a multi-word entity', () => {
    const entity = buildEntity('OrderLine', 'name:string');
    expect(entity.className).toBe('OrderLine');
    expect(entity.propertyName).toBe('orderLine');
    expect(entity.fileName).toBe('order-line');
    expect(entity.pluralFile).toBe('order-lines');
    expect(entity.constName).toBe('ORDER_LINE');
    expect(entity.humanPlural).toBe('order lines');
    expect(routesConstName(entity)).toBe('ORDER_LINES_ROUTES');
  });

  it('pluralizes common English endings and accepts an override', () => {
    expect(pluralize('category')).toBe('categories');
    expect(pluralize('box')).toBe('boxes');
    expect(pluralize('product')).toBe('products');
    const entity = buildEntity('person', 'name:string', 'people');
    expect(entity.pluralFile).toBe('people');
    expect(routesConstName(entity)).toBe('PEOPLE_ROUTES');
  });
});

describe('crud schematic — generated content', () => {
  const entity = buildEntity(
    'product',
    'name!:string,price:currency,status:select=draft|published,active:boolean,createdAt:date',
  );

  it('model: interface, draft, empty value, columns and form schema agree on the fields', () => {
    const text = modelFile(entity);
    expect(text).toContain('export interface Product {');
    expect(text).toContain('  id: string;');
    expect(text).toContain("  status: 'draft' | 'published';");
    expect(text).toContain("export type ProductDraft = Omit<Product, 'id'>;");
    expect(text).toContain("name: '', price: 0, status: 'draft', active: false, createdAt: null");
    expect(text).toContain('export function reviveProduct(row: Product): Product {');
    expect(text).toContain('createdAt: row.createdAt ? new Date(row.createdAt) : null,');
    expect(text).toContain("{ key: 'name', header: 'Name', sortable: true },");
    expect(text).toContain("key: 'price', header: 'Price', sortable: true, align: 'end'");
    expect(text).toContain("format: (value) => (value ? 'Yes' : 'No')");
    expect(text).toContain("{ key: 'actions', header: '', align: 'end', stack: 'footer' },");
    expect(text).toContain("{ key: 'name', type: 'text', label: 'Name', required: true },");
    expect(text).toContain("type: 'switch'");
    expect(text).toContain("options: [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }]");
  });

  it('service: in-memory honours the MkDataRequest surface and seeds three rows', () => {
    const text = serviceFile(entity, undefined);
    expect(text).toContain('async list(req: MkDataRequest): Promise<MkDataPage<Product>>');
    expect(text).toContain("{ id: 'product-1', name: 'Name 1'");
    expect(text).toContain('crypto.randomUUID()');
    expect(text).not.toContain('@angular/common/http');
  });

  it('service: --api switches to HttpClient over the given base', () => {
    const text = serviceFile(entity, '/api/products');
    expect(text).toContain("private readonly base = '/api/products';");
    expect(text).toContain('this.http.get<MkDataPage<Product>>(this.base, { params })');
    expect(text).toContain('firstValueFrom');
    expect(text).not.toContain('crypto.randomUUID');
  });

  it('list page: table, actions template, pagination and a named delete confirm', () => {
    const text = listPageFile(entity);
    expect(text).toContain('new MkTableDataSource<Product>((req) => this.service.list(req))');
    expect(text).toContain('<ng-template mkTableCell="actions" let-row="row">');
    expect(text).toContain('ds.setFilter($any($event.target).value)');
    expect(text).toContain('title: `Delete "${row.name}"?`');
    expect(text).toContain("confirmText: 'Delete'");
    expect(text).toContain('(pageChange)="ds.setPage($event)"');
  });

  it('spec: asserts the seeded title value in the edit test when the first field is textual', () => {
    const text = specFile(entity);
    expect(text).toContain("expect(input.value()).toBe('Name 1');");
    expect(text).toContain('MkInputHarness');
    const noText = specFile(buildEntity('toggle', 'active:boolean'));
    expect(noText).toContain("toContain('Edit toggle')");
    expect(noText).not.toContain('MkInputHarness');
  });

  it('falls back to a generic confirm title when no field is textual', () => {
    const noTitle = buildEntity('flag', 'active:boolean,weight:number');
    expect(titleField(noTitle)).toBeUndefined();
    expect(listPageFile(noTitle)).toContain("title: 'Delete this flag?'");
  });

  it('generates six files (five with --no-spec)', () => {
    expect([...crudFiles(entity, { spec: true }).keys()]).toEqual([
      'product.model.ts',
      'product.service.ts',
      'product-list-page.ts',
      'product-form-page.ts',
      'products.routes.ts',
      'products.spec.ts',
    ]);
    expect(crudFiles(entity, { spec: false }).size).toBe(5);
  });
});

describe('crud schematic — tree integration', () => {
  it('creates the slice under src/app and wires a lazy route', async () => {
    const { tree, logs } = await runCrud(createTree(), { entity: 'product' });

    expect(tree.exists('/src/app/products/product.model.ts')).toBe(true);
    expect(tree.exists('/src/app/products/products.spec.ts')).toBe(true);
    const routes = tree.read('/src/app/app.routes.ts')!.toString();
    expect(routes).toContain("path: 'products',");
    expect(routes).toContain("import('./products/products.routes').then((m) => m.PRODUCTS_ROUTES)");
    expect(logs.join('\n')).toContain("Routed 'products'");
  });

  it('respects --path with a relative import from the routes file', async () => {
    const { tree } = await runCrud(createTree(), { entity: 'product', path: 'src/app/admin' });

    expect(tree.exists('/src/app/admin/products/product.model.ts')).toBe(true);
    const routes = tree.read('/src/app/app.routes.ts')!.toString();
    expect(routes).toContain("import('./admin/products/products.routes')");
  });

  it('warns instead of failing when there is no routes file, and skips with --route=false', async () => {
    const { tree, logs } = await runCrud(createTree({ routesTs: null }), { entity: 'product' });
    expect(tree.exists('/src/app/products/product.model.ts')).toBe(true);
    expect(logs.join('\n')).toContain('add the route yourself');

    const { tree: skipped } = await runCrud(createTree(), { entity: 'order', route: false });
    expect(skipped.read('/src/app/app.routes.ts')!.toString()).not.toContain("path: 'orders'");
  });

  it('leaves an existing route for the same path untouched', async () => {
    const routesTs = APP_ROUTES.replace(
      'export const routes: Routes = [',
      "export const routes: Routes = [\n  { path: 'products', loadChildren: () => import('./x').then((m) => m.X) },",
    );
    const { logs } = await runCrud(createTree({ routesTs }), { entity: 'product' });
    expect(logs.join('\n')).toContain("already routes 'products'");
  });

  it('refuses to overwrite an existing slice', async () => {
    const tree = createTree();
    tree.create('/src/app/products/product.model.ts', '// existing');
    await expect(runCrud(tree, { entity: 'product' })).rejects.toThrowError(/already exists/);
  });

  it('rejects an unknown --project', async () => {
    await expect(runCrud(createTree(), { entity: 'product', project: 'nope' })).rejects.toThrowError(
      /was not found in the workspace/,
    );
  });
});
