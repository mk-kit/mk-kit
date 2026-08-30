/**
 * Recipes for the `scaffold_mk_kit` tool: ready-to-paste, entity-aware code
 * for the patterns people build first with mk-kit. Pure functions over the
 * inputs — no I/O — so they are unit-testable and never drift silently: the
 * snippets mirror what `ng g @mk-kit/ui:crud` generates and what the docs
 * pages show.
 */

export const SCAFFOLD_RECIPES = ['crud-schematic', 'table-page', 'dynamic-form', 'dialog', 'embed'] as const;
export type ScaffoldRecipe = (typeof SCAFFOLD_RECIPES)[number];

const FIELD_TYPES = [
  'string', 'textarea', 'email', 'url', 'number', 'currency',
  'boolean', 'date', 'datetime', 'select', 'tags',
] as const;
type FieldType = (typeof FIELD_TYPES)[number];

interface Field {
  key: string;
  type: FieldType;
  required: boolean;
  options: string[];
  label: string;
}

/* ---------------------------------------------------------------- naming */

function words(name: string): string[] {
  return name
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}
function classify(name: string): string {
  return words(name).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
}
function camelize(name: string): string {
  const c = classify(name);
  return c ? c[0].toLowerCase() + c.slice(1) : c;
}
function humanize(key: string): string {
  const ws = words(key);
  return ws.length ? [ws[0][0].toUpperCase() + ws[0].slice(1), ...ws.slice(1)].join(' ') : key;
}
function plural(word: string): string {
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

/* ---------------------------------------------------------- field grammar */

/**
 * Parse the crud-schematic field grammar: comma-separated `key:type`, `!`
 * after the key marks it required, selects list options after `=` —
 * `name!:string,price:currency,status:select=draft|published`. Throws with a
 * correctable message on bad input.
 */
export function parseFields(spec: string): Field[] {
  const fields = spec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((segment) => {
      const m = /^([A-Za-z][A-Za-z\d_-]*)(!?)(?::([A-Za-z-]+)(?:=(.+))?)?$/.exec(segment);
      if (!m) throw new Error(`Cannot parse field "${segment}". Write "key:type", "key!:type" or "key:select=a|b|c".`);
      const [, rawKey, bang, rawType = 'string', rawOptions] = m;
      const type = rawType.toLowerCase() as FieldType;
      if (!FIELD_TYPES.includes(type)) {
        throw new Error(`Unknown field type "${rawType}" in "${segment}". Valid: ${FIELD_TYPES.join(', ')}.`);
      }
      const options = rawOptions ? rawOptions.split('|').map((o) => o.trim()).filter(Boolean) : [];
      if (type === 'select' && !options.length) {
        throw new Error(`Field "${rawKey}" is a select but lists no options — write "${rawKey}:select=draft|published".`);
      }
      const key = camelize(rawKey);
      return { key, type, required: bang === '!', options, label: humanize(key) };
    });
  if (!fields.length) throw new Error('At least one field is required, e.g. "name!:string".');
  return fields;
}

function tsType(f: Field): string {
  switch (f.type) {
    case 'number':
    case 'currency':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'datetime':
      return 'Date | null';
    case 'select':
      return f.options.map((o) => `'${o}'`).join(' | ');
    case 'tags':
      return 'string[]';
    default:
      return 'string';
  }
}

function dynamicType(f: Field): string {
  if (f.type === 'string') return 'text';
  if (f.type === 'boolean') return 'switch';
  return f.type;
}

/* ---------------------------------------------------------------- recipes */

export interface ScaffoldInput {
  recipe: ScaffoldRecipe;
  /** Singular entity name (`product`, `OrderLine`). Default `item`. */
  entity?: string;
  /** Field spec in the crud grammar. Default `name!:string`. */
  fields?: string;
}

/** Render one recipe as paste-ready Markdown. Throws on invalid input. */
export function scaffold(input: ScaffoldInput): string {
  const entity = input.entity ?? 'item';
  if (!/^[A-Za-z][A-Za-z\d_-]*$/.test(entity)) {
    throw new Error(`"${entity}" is not a valid entity name — letters/digits like "product" or "OrderLine".`);
  }
  const fields = parseFields(input.fields ?? 'name!:string');
  const n = {
    cls: classify(entity),
    prop: camelize(entity),
    human: words(entity).join(' '),
    plural: plural(camelize(entity)),
    pluralFile: plural(words(entity).join('-')),
  };

  switch (input.recipe) {
    case 'crud-schematic':
      return crudSchematic(n, input.fields ?? 'name!:string');
    case 'table-page':
      return tablePage(n, fields);
    case 'dynamic-form':
      return dynamicForm(n, fields);
    case 'dialog':
      return dialog(n);
    case 'embed':
      return embed(n);
  }
}

type Names = { cls: string; prop: string; human: string; plural: string; pluralFile: string };

function crudSchematic(n: Names, fieldSpec: string): string {
  return `## Generate a complete CRUD slice

mk-kit ships a generator that produces a working admin slice — run it instead
of hand-writing the pattern:

\`\`\`bash
ng g @mk-kit/ui:crud ${n.prop} --fields "${fieldSpec}"
\`\`\`

It creates \`src/app/${n.pluralFile}/\` with:

| File | Contents |
|---|---|
| \`${words(n.cls).join('-')}.model.ts\` | interface + \`MkTableColumn[]\` + \`MkDynamicSchema\` — one source of truth |
| \`${words(n.cls).join('-')}.service.ts\` | list/get/create/update/remove — in-memory (runs immediately); \`--api /api/${n.pluralFile}\` for HttpClient |
| \`${words(n.cls).join('-')}-list-page.ts\` | \`mk-table\` + \`MkTableDataSource\`, search, sort, pagination, delete confirm |
| \`${words(n.cls).join('-')}-form-page.ts\` | \`mk-dynamic-form\` for /new and /:id/edit |
| \`${n.pluralFile}.routes.ts\` | lazy routes, auto-wired into \`app.routes.ts\` |
| \`${n.pluralFile}.spec.ts\` | harness-driven tests (\`--no-spec\` to skip) |

Field grammar: \`key:type\` (comma-separated), \`!\` = required,
\`select=a|b|c\` for options. Types: ${FIELD_TYPES.join(', ')}.
Other options: \`--plural\`, \`--path\`, \`--project\`, \`--route=false\`.
Guide: https://mk-kit.dev/crud`;
}

function tablePage(n: Names, fields: Field[]): string {
  const columns = fields
    .map((f) => {
      const extra =
        f.type === 'number' || f.type === 'currency'
          ? `, align: 'end'`
          : f.type === 'boolean'
            ? `, format: (v) => (v ? 'Yes' : 'No')`
            : '';
      return `    { key: '${f.key}', header: '${f.label}', sortable: true${extra} },`;
    })
    .join('\n');
  const iface = fields.map((f) => `  ${f.key}: ${tsType(f)};`).join('\n');
  return `## Server-driven table page for ${n.human}

\`MkTableDataSource\` is the page/sort/filter plumbing: give it a fetcher and
bind its signals. Stale responses never overwrite newer state, \`setFilter\`
is debounced, and rows persist while loading (the table never blanks).

\`\`\`ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MkInput } from '@mk-kit/ui/forms';
import { MkPagination } from '@mk-kit/ui/navigation';
import { MkTable, MkTableDataSource, type MkDataPage, type MkTableColumn } from '@mk-kit/ui/table';

interface ${n.cls} {
  id: string;
${iface}
}

@Component({
  selector: 'app-${n.pluralFile}-page',
  imports: [MkInput, MkPagination, MkTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <input
      mkInput
      type="search"
      placeholder="Search ${n.plural}…"
      (input)="ds.setFilter($any($event.target).value)"
    />

    <mk-table [columns]="columns" [data]="ds.rows()" (sortChange)="ds.setSort($event)" />
    @if (ds.error()) {
      <p role="alert">Loading failed.</p>
    } @else if (ds.empty()) {
      <p>No ${n.plural} yet.</p>
    }

    <mk-pagination
      [total]="ds.total()"
      [pageSize]="ds.pageSize()"
      [page]="ds.page()"
      (pageChange)="ds.setPage($event)"
    />
  \`,
})
export class ${n.cls}ListPage {
  private readonly http = inject(HttpClient);

  protected readonly columns: MkTableColumn<${n.cls}>[] = [
${columns}
  ];

  protected readonly ds = new MkTableDataSource<${n.cls}>((req) =>
    this.http.get<MkDataPage<${n.cls}>>('/api/${n.pluralFile}', {
      params: {
        page: req.page,
        pageSize: req.pageSize,
        ...(req.filter && { filter: req.filter }),
        ...(req.sort && { sort: \`\${req.sort.active},\${req.sort.direction}\` }),
      },
    }),
  );
}
\`\`\`

The server answers \`{ rows: ${n.cls}[], total: number }\`. Custom cells:
project \`<ng-template mkTableCell="key" let-value let-row="row">\` (import
\`MkTableCell\`). Refresh after a mutation with \`ds.refresh()\`.
Docs: https://mk-kit.dev/components/table`;
}

function dynamicForm(n: Names, fields: Field[]): string {
  const schemaFields = fields
    .map((f) => {
      const parts = [`key: '${f.key}'`, `type: '${dynamicType(f)}'`, `label: '${f.label}'`];
      if (f.required) parts.push('required: true');
      if (f.type === 'select') {
        parts.push(`options: [${f.options.map((o) => `{ label: '${humanize(o)}', value: '${o}' }`).join(', ')}]`);
      }
      return `      { ${parts.join(', ')} },`;
    })
    .join('\n');
  return `## Schema-driven form for ${n.human}

\`mk-dynamic-form\` renders a whole form from data — fields, validators,
layout, conditions. Project your own action buttons; \`(formSubmit)\` fires
only when valid (\`(invalidSubmit)\` marks everything touched).

\`\`\`ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkDynamicForm, type MkDynamicSchema } from '@mk-kit/ui/dynamic-form';

@Component({
  selector: 'app-${words(n.cls).join('-')}-form',
  imports: [MkButton, MkDynamicForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <mk-dynamic-form [schema]="schema" [(value)]="value" (formSubmit)="save($event)">
      <button mkButton type="submit">Save</button>
    </mk-dynamic-form>
  \`,
})
export class ${n.cls}Form {
  protected readonly value = signal<Record<string, unknown>>({});

  protected readonly schema: MkDynamicSchema = {
    columns: 2,
    fields: [
${schemaFields}
    ],
  };

  protected save(value: Record<string, unknown>): void {
    console.log('valid submit', value);
  }
}
\`\`\`

Also available: \`group\`/\`array\`/\`section\` field kinds, \`showWhen\`
conditions, \`span\`, custom renderers via \`ng-template[mkDynamicField]\`,
and \`mkDynamicFormToSignalSchema\` for Signal Forms.
Docs: https://mk-kit.dev/components/dynamic-form`;
}

function dialog(n: Names): string {
  return `## Dialogs for ${n.human}

\`MkDialogService\` opens components (returns a typed ref) and ships a
\`confirm()\` convenience. No modules, no boilerplate:

\`\`\`ts
import { Component, inject } from '@angular/core';
import { MK_OVERLAY_DATA, MkOverlayRef } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkDialogService, MkToastService } from '@mk-kit/ui/feedback';

// Anywhere in the app — a danger confirm:
export class ${n.cls}Actions {
  private readonly dialog = inject(MkDialogService);
  private readonly toasts = inject(MkToastService);

  async remove(name: string): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: \`Delete "\${name}"?\`,
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    // …delete…
    this.toasts.success('${n.cls} deleted');
  }

  async edit(item: unknown): Promise<void> {
    const ref = this.dialog.open<Edit${n.cls}Dialog, unknown>(Edit${n.cls}Dialog, { data: item });
    const result = await ref.afterClosed;
    if (result) this.toasts.success('Saved');
  }
}

// The dialog component reads its data and closes itself via the ref:
@Component({
  selector: 'app-edit-${words(n.cls).join('-')}-dialog',
  imports: [MkButton],
  template: \`
    <h2>Edit ${n.human}</h2>
    <button mkButton (click)="ref.close(true)">Save</button>
    <button mkButton variant="ghost" (click)="ref.close()">Cancel</button>
  \`,
})
export class Edit${n.cls}Dialog {
  protected readonly data = inject(MK_OVERLAY_DATA);
  protected readonly ref = inject(MkOverlayRef);
}
\`\`\`

\`confirm\` resolves \`true\`/\`false\`; \`open\` takes \`size\`,
\`hasBackdrop\`, \`autoFocus\`… and \`mk-dialog\` supports \`draggable\` /
\`resizable\`. Docs: https://mk-kit.dev/components/dialogs`;
}

function embed(n: Names): string {
  return `## Ship ${n.human} widgets as custom elements

\`@mk-kit/ui/embed\` renders mk-kit components behind shadow DOM on pages you
don't control — host CSS can't break them, \`--mk-*\` tokens still theme them.

\`\`\`ts
import { mkEmbed, mkShadowCss } from '@mk-kit/ui/embed';
import themeCss from '@mk-kit/ui/styles.css' with { type: 'text' };

mkEmbed({
  styles: mkShadowCss(themeCss), // :root token blocks retargeted to :host
  // styleUrls: ['https://cdn.example.com/theme.css'], // CDN alternative
  // nonce: document.currentScript?.nonce,             // CSP host pages
  // providers: [provideMkI18n({ … })],
}).element('acme-${words(n.cls).join('-')}', ${n.cls}Widget);
\`\`\`

\`\`\`html
<acme-${words(n.cls).join('-')} some-input="42" style="--mk-primary: #7c3aed"></acme-${words(n.cls).join('-')}>
\`\`\`

Inputs become dash-cased attributes (transforms coerce) and element
properties; outputs bubble as composed CustomEvents; overlays (dialogs,
selects, toasts) mount in a themed shadow host, not the bare page.
\`el.mkReady\` resolves once rendered; \`mkComponent\` exposes the instance.
Docs: https://mk-kit.dev/embed`;
}
