import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SCAFFOLD_RECIPES, scaffold, type ScaffoldRecipe } from './scaffolds.js';

export { SCAFFOLD_RECIPES, parseFields, scaffold, type ScaffoldInput, type ScaffoldRecipe } from './scaffolds.js';

/* ------------------------------------------------------------------------ */
/* Data — the same artefacts the docs site serves (scripts/gen-api.mjs)      */
/* ------------------------------------------------------------------------ */

export type ApiKind =
  | 'component'
  | 'directive'
  | 'pipe'
  | 'service'
  | 'class'
  | 'function'
  | 'token'
  | 'const'
  | 'interface'
  | 'type'
  | 'enum';

export const API_KINDS: readonly ApiKind[] = [
  'component',
  'directive',
  'pipe',
  'service',
  'class',
  'function',
  'token',
  'const',
  'interface',
  'type',
  'enum',
];

export interface ApiExport {
  kind: ApiKind;
  name: string;
  description: string;
  file: string;
  docs?: string;
  deprecated?: string | boolean;
  selector?: string;
  selectors?: string[];
  exportAs?: string;
  formControl?: boolean;
  inputs?: Array<{ name: string; type: string; description: string }>;
  outputs?: Array<{ name: string; type: string; description: string }>;
  methods?: Array<{ name: string; signature: string; description: string }>;
}

export interface ApiEntry {
  name: string;
  import: string;
  exports: ApiExport[];
}

export interface ApiDoc {
  package: string;
  version: string;
  site: string;
  entries: ApiEntry[];
}

export interface MkKitData {
  api: ApiDoc;
  /** llms.txt — the docs index. */
  llms: string;
  /** llms-full.txt — the whole API as Markdown. */
  llmsFull: string;
  /** Where the data came from, for the startup log. */
  source: string;
}

/* ------------------------------------------------------------------------ */
/* Index                                                                     */
/* ------------------------------------------------------------------------ */

interface Indexed {
  entry: ApiEntry;
  item: ApiExport;
  /** Markdown section for this export, cut from llms-full.txt. */
  markdown: string;
}

export class MkKitIndex {
  readonly items: Indexed[] = [];
  private readonly byName = new Map<string, Indexed>();
  private readonly bySelector = new Map<string, Indexed>();

  constructor(readonly data: MkKitData) {
    const sections = splitSections(data.llmsFull);
    for (const entry of data.api.entries) {
      for (const item of entry.exports) {
        const markdown =
          sections.get(`${entry.name}/${item.name}`) ?? renderFallback(item, entry);
        const ix = { entry, item, markdown };
        this.items.push(ix);
        // First entry wins on a duplicate name (root re-export order).
        if (!this.byName.has(item.name.toLowerCase())) this.byName.set(item.name.toLowerCase(), ix);
        for (const s of item.selectors ?? []) {
          if (!this.bySelector.has(s.toLowerCase())) this.bySelector.set(s.toLowerCase(), ix);
        }
      }
    }
  }

  /** Exact lookup by class name (`MkSelect`), selector (`mk-select`, `mkButton`) or pipe name. */
  get(name: string): Indexed | undefined {
    const q = name.trim().toLowerCase().replace(/^<|>$/g, '').replace(/^\[|\]$/g, '');
    return this.byName.get(q) ?? this.bySelector.get(q);
  }

  search(query: string, opts: { kind?: ApiKind; entry?: string; limit?: number } = {}): Indexed[] {
    const q = query.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const limit = opts.limit ?? 10;
    const scored: Array<{ ix: Indexed; score: number }> = [];
    for (const ix of this.items) {
      if (opts.kind && ix.item.kind !== opts.kind) continue;
      if (opts.entry && ix.entry.name !== opts.entry) continue;
      const name = ix.item.name.toLowerCase();
      const sels = (ix.item.selectors ?? []).map((s) => s.toLowerCase());
      const desc = ix.item.description.toLowerCase();
      let score = 0;
      if (name === q || sels.includes(q)) score = 100;
      else if (name.startsWith(q) || sels.some((s) => s.startsWith(q))) score = 60;
      else if (name.includes(q) || sels.some((s) => s.includes(q))) score = 40;
      else if (words.length && words.every((w) => name.includes(w) || sels.some((s) => s.includes(w)) || desc.includes(w))) {
        score = 10 + words.filter((w) => name.includes(w)).length * 5;
      }
      if (!score) continue;
      // Components and directives are what people usually mean.
      if (ix.item.kind === 'component' || ix.item.kind === 'directive') score += 3;
      else if (ix.item.kind === 'service' || ix.item.kind === 'function') score += 1;
      scored.push({ ix, score });
    }
    scored.sort((a, b) => b.score - a.score || a.ix.item.name.localeCompare(b.ix.item.name));
    return scored.slice(0, limit).map((s) => s.ix);
  }
}

/** Map `entry/Name` → Markdown section from llms-full.txt. */
function splitSections(full: string): Map<string, string> {
  const out = new Map<string, string>();
  let entry = '';
  let current: { key: string; lines: string[] } | null = null;
  const flush = () => {
    if (current) out.set(current.key, current.lines.join('\n').trim());
    current = null;
  };
  for (const line of full.split('\n')) {
    const h2 = /^## @mk-kit\/ui\/([\w-]+)\s*$/.exec(line);
    if (h2) {
      flush();
      entry = h2[1];
      continue;
    }
    const h3 = /^### (\w+) \((\w+)\)\s*$/.exec(line);
    if (h3) {
      flush();
      current = { key: `${entry}/${h3[1]}`, lines: [line] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  flush();
  return out;
}

function renderFallback(item: ApiExport, entry: ApiEntry): string {
  const lines = [`### ${item.name} (${item.kind})`, ''];
  if (item.selector) lines.push(`Selector: \`${item.selector}\``, '');
  lines.push(`Import: \`import { ${item.name} } from '${entry.import}';\``, '');
  if (item.description) lines.push(item.description, '');
  return lines.join('\n').trim();
}

export function brief(item: ApiExport, max = 140): string {
  const first = item.description.split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').replace(/`/g, '') ?? '';
  return first.length > max ? first.slice(0, max - 1) + '…' : first;
}

function line(ix: Indexed): string {
  const sel = ix.item.selector ? ` \`${ix.item.selector}\`` : ix.item.kind === 'pipe' ? '' : '';
  const dep = ix.item.deprecated ? ' [deprecated]' : '';
  const b = brief(ix.item);
  return `- **${ix.item.name}** (${ix.item.kind})${sel} — ${ix.entry.import}${dep}${b ? `\n  ${b}` : ''}`;
}

/* ------------------------------------------------------------------------ */
/* Server                                                                    */
/* ------------------------------------------------------------------------ */

const KIND = z.enum(API_KINDS as [ApiKind, ...ApiKind[]]);

/**
 * Build the mk-kit MCP server over a data snapshot. Pure — no I/O, so it is
 * unit-testable over an in-memory transport; `bin.ts` wires stdio.
 */
export function createMkKitServer(data: MkKitData): McpServer {
  const index = new MkKitIndex(data);
  const { api } = data;
  const version = `${api.package} ${api.version}`;

  const server = new McpServer(
    { name: 'mk-kit', version: api.version },
    {
      instructions:
        `Reference for ${version}, the Angular component library (mk-kit.dev). ` +
        `Use search_mk_kit to find a component/directive/service/helper by name, selector or what it does, ` +
        `then get_mk_kit_export for its full API (inputs, outputs, methods, import path). ` +
        `Call get_mk_kit_overview once for install/setup conventions, and scaffold_mk_kit for paste-ready ` +
        `starting points (CRUD slice, table page, dynamic form, dialogs, custom-element embedding). ` +
        `Every component is standalone: import the class from the entry point shown and add it to \`imports\`.`,
    },
  );

  server.registerTool(
    'search_mk_kit',
    {
      title: 'Search the mk-kit API',
      description:
        `Find exports of ${version} by name, selector (mk-select, mkButton) or free text describing what you need ` +
        `("date range", "toast", "csv export"). Returns the best matches with kind, import path and a one-line summary. ` +
        `Follow up with get_mk_kit_export for the full API.`,
      inputSchema: {
        query: z.string().min(1).describe('Name, selector or free-text description'),
        kind: KIND.optional().describe('Restrict to one kind of export'),
        entry: z.string().optional().describe('Restrict to one entry point, e.g. "forms" or "table"'),
        limit: z.number().int().min(1).max(50).optional().describe('Max results (default 10)'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ query, kind, entry, limit }) => {
      const hits = index.search(query, { kind, entry, limit });
      const text = hits.length
        ? `${hits.length} result${hits.length === 1 ? '' : 's'} for "${query}":\n\n${hits.map(line).join('\n')}`
        : `No export of ${api.package} matches "${query}". Try a shorter term, a selector (mk-…) or list_mk_kit_exports.`;
      return { content: [{ type: 'text', text }] };
    },
  );

  server.registerTool(
    'get_mk_kit_export',
    {
      title: 'Get one mk-kit export',
      description:
        `Full API of one export of ${version} as Markdown: import path, selector, description with usage example, ` +
        `inputs (type, default, two-way), outputs, methods, properties or type definition, and the docs page. ` +
        `Accepts a class name (MkSelect), a selector (mk-select, mkButton) or a helper/type name (mkToCsv, MkTone).`,
      inputSchema: {
        name: z.string().min(1).describe('Class name, selector or exported symbol'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ name }) => {
      const ix = index.get(name);
      if (ix) return { content: [{ type: 'text', text: ix.markdown }] };
      const near = index.search(name, { limit: 5 });
      const text = near.length
        ? `No export named "${name}". Did you mean:\n\n${near.map(line).join('\n')}`
        : `No export named "${name}" in ${version}.`;
      return { content: [{ type: 'text', text }], isError: true };
    },
  );

  server.registerTool(
    'list_mk_kit_exports',
    {
      title: 'List mk-kit exports',
      description:
        `Browse ${version}: every entry point with its exports, or one entry point / one kind. ` +
        `Use it to see what exists before searching; each line carries a one-line summary.`,
      inputSchema: {
        entry: z.string().optional().describe('Entry point name, e.g. "forms", "table", "core"'),
        kind: KIND.optional().describe('Only this kind of export'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ entry, kind }) => {
      const entries = entry ? api.entries.filter((e) => e.name === entry) : api.entries;
      if (!entries.length) {
        return {
          content: [{ type: 'text', text: `Unknown entry point "${entry}". Entry points: ${api.entries.map((e) => e.name).join(', ')}.` }],
          isError: true,
        };
      }
      const detailed = !!entry || !!kind;
      const blocks = entries.map((e) => {
        const items = kind ? e.exports.filter((x) => x.kind === kind) : e.exports;
        if (!detailed) {
          const comps = e.exports.filter((x) => x.kind === 'component' || x.kind === 'directive');
          const names = comps.map((x) => x.selector ? `${x.name} (${x.selector})` : x.name);
          return `## ${e.import} — ${e.exports.length} exports\n${names.length ? names.join(', ') : '(types and helpers)'}`;
        }
        return `## ${e.import} — ${items.length} export${items.length === 1 ? '' : 's'}${kind ? ` of kind ${kind}` : ''}\n${
          items.map((x) => line({ entry: e, item: x, markdown: '' })).join('\n') || '(none)'
        }`;
      });
      return { content: [{ type: 'text', text: blocks.join('\n\n') }] };
    },
  );

  server.registerTool(
    'get_mk_kit_overview',
    {
      title: 'mk-kit overview',
      description:
        `What ${version} is, how to install and set it up (ng add, theme stylesheet, entry points, theming, i18n), ` +
        `and links to every docs page. Read once before using the library.`,
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    () => ({ content: [{ type: 'text', text: data.llms }] }),
  );

  server.registerTool(
    'scaffold_mk_kit',
    {
      title: 'Scaffold an mk-kit pattern',
      description:
        `Paste-ready ${version} code for the patterns apps build first — pass a recipe and optionally the entity ` +
        `name and fields. Recipes: crud-schematic (the ng g @mk-kit/ui:crud command that generates a whole slice — ` +
        `prefer it when the user wants list + form + service), table-page (mk-table + MkTableDataSource against a ` +
        `REST endpoint), dynamic-form (schema-driven mk-dynamic-form), dialog (MkDialogService confirm + custom ` +
        `dialog), embed (ship a component as a shadow-DOM custom element). Field grammar: "key:type" comma-separated, ` +
        `"!" marks required, selects list options — "name!:string,price:currency,status:select=draft|published".`,
      inputSchema: {
        recipe: z.enum([...SCAFFOLD_RECIPES] as [ScaffoldRecipe, ...ScaffoldRecipe[]]).describe('Which pattern to scaffold'),
        entity: z.string().optional().describe('Singular entity name, e.g. "product" or "OrderLine" (default "item")'),
        fields: z.string().optional().describe('Field spec, e.g. "name!:string,price:currency" (default "name!:string")'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ recipe, entity, fields }) => {
      try {
        return { content: [{ type: 'text', text: scaffold({ recipe, entity, fields }) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: String(err instanceof Error ? err.message : err) }], isError: true };
      }
    },
  );

  server.registerResource(
    'llms.txt',
    'mk-kit://llms.txt',
    { title: 'mk-kit llms.txt', description: 'Docs index for LLMs', mimeType: 'text/markdown' },
    (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: data.llms }] }),
  );
  server.registerResource(
    'llms-full.txt',
    'mk-kit://llms-full.txt',
    { title: 'mk-kit full API reference', description: 'Every export as Markdown', mimeType: 'text/markdown' },
    (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: data.llmsFull }] }),
  );
  server.registerResource(
    'api.json',
    'mk-kit://api.json',
    { title: 'mk-kit api.json', description: 'Machine-readable API surface', mimeType: 'application/json' },
    (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(api) }] }),
  );

  return server;
}
