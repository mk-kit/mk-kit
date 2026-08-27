import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { newer } from './data.js';
import { MkKitIndex, brief, createMkKitServer, type ApiDoc, type MkKitData } from './index.js';

const PUBLIC = new URL('../../docs/public/', import.meta.url);

function loadFixture(): MkKitData {
  return {
    api: JSON.parse(readFileSync(new URL('api.json', PUBLIC), 'utf8')) as ApiDoc,
    llms: readFileSync(new URL('llms.txt', PUBLIC), 'utf8'),
    llmsFull: readFileSync(new URL('llms-full.txt', PUBLIC), 'utf8'),
    source: 'fixture',
  };
}

async function text(res: Awaited<ReturnType<Client['callTool']>>): Promise<string> {
  const content = res.content as Array<{ type: string; text?: string }>;
  return content.map((c) => c.text ?? '').join('\n');
}

describe('MkKitIndex', () => {
  const data = loadFixture();
  const index = new MkKitIndex(data);

  it('indexes every export with a Markdown section from llms-full.txt', () => {
    const total = data.api.entries.reduce((n, e) => n + e.exports.length, 0);
    expect(index.items.length).toBe(total);
    const missing = index.items.filter((ix) => !ix.markdown.startsWith(`### ${ix.item.name} (`));
    expect(missing.map((m) => m.item.name)).toEqual([]);
  });

  it('resolves class names, selectors and attribute selectors, case-insensitively', () => {
    expect(index.get('MkSelect')?.item.name).toBe('MkSelect');
    expect(index.get('mk-select')?.item.name).toBe('MkSelect');
    expect(index.get('<mk-select>')?.item.name).toBe('MkSelect');
    expect(index.get('mkButton')?.item.name).toBe('MkButton');
    expect(index.get('[mkbutton]')?.item.name).toBe('MkButton');
    expect(index.get('nope')).toBeUndefined();
  });

  it('ranks exact and prefix matches first, then free-text', () => {
    const names = index.search('mk-table').map((ix) => ix.item.name);
    expect(names[0]).toBe('MkTable');
    const csv = index.search('export csv', { limit: 5 }).map((ix) => ix.item.name);
    expect(csv).toContain('mkExportCsv');
    expect(index.search('zzzz-nothing')).toEqual([]);
  });

  it('filters by kind and entry', () => {
    const services = index.search('theme', { kind: 'service' });
    expect(services.every((ix) => ix.item.kind === 'service')).toBe(true);
    expect(services.map((ix) => ix.item.name)).toContain('MkThemeService');
    const forms = index.search('select', { entry: 'forms' });
    expect(forms.length).toBeGreaterThan(0);
    expect(forms.every((ix) => ix.entry.name === 'forms')).toBe(true);
  });

  it('brief() takes the first paragraph without backticks', () => {
    const b = brief(index.get('MkButton')!.item);
    expect(b).toMatch(/^Button — enhances a native <button> or <a>/);
    expect(b).not.toContain('`');
  });
});

describe('newer()', () => {
  it('compares semver-ish strings', () => {
    expect(newer('0.38.0', '0.37.0')).toBe(true);
    expect(newer('0.37.0', '0.37.0')).toBe(false);
    expect(newer('0.37.1', '0.38.0')).toBe(false);
    expect(newer('1.0.0', '0.99.9')).toBe(true);
    expect(newer('abc', '0.1.0')).toBe(false);
  });
});

describe('mk-kit MCP server', () => {
  let client: Client;
  const data = loadFixture();

  beforeAll(async () => {
    const server = createMkKitServer(data);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: 'spec', version: '0.0.0' });
    await client.connect(clientTransport);
  });

  it('advertises the four tools and three resources', async () => {
    const tools = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(['get_mk_kit_export', 'get_mk_kit_overview', 'list_mk_kit_exports', 'search_mk_kit']);
    const resources = (await client.listResources()).resources.map((r) => r.uri).sort();
    expect(resources).toEqual(['mk-kit://api.json', 'mk-kit://llms-full.txt', 'mk-kit://llms.txt']);
  });

  it('search_mk_kit returns ranked hits with import paths', async () => {
    const out = await text(await client.callTool({ name: 'search_mk_kit', arguments: { query: 'date range', limit: 5 } }));
    expect(out).toContain('MkDateRangePicker');
    expect(out).toContain('@mk-kit/ui/datetime');
  });

  it('get_mk_kit_export returns the Markdown section incl. inputs table', async () => {
    const out = await text(await client.callTool({ name: 'get_mk_kit_export', arguments: { name: 'mk-select' } }));
    expect(out.startsWith('### MkSelect (component)')).toBe(true);
    expect(out).toContain("import { MkSelect } from '@mk-kit/ui/forms';");
    expect(out).toContain('| `options` |');
    expect(out).toContain('https://mk-kit.dev/components/forms');
  });

  it('get_mk_kit_export suggests near matches for unknown names', async () => {
    const res = await client.callTool({ name: 'get_mk_kit_export', arguments: { name: 'MkSelec' } });
    expect(res.isError).toBe(true);
    expect(await text(res)).toContain('MkSelect');
  });

  it('list_mk_kit_exports lists entry points, one entry, and rejects unknown ones', async () => {
    const all = await text(await client.callTool({ name: 'list_mk_kit_exports', arguments: {} }));
    for (const e of data.api.entries) expect(all).toContain(`## ${e.import}`);
    const table = await text(await client.callTool({ name: 'list_mk_kit_exports', arguments: { entry: 'table', kind: 'function' } }));
    expect(table).toContain('mkToCsv');
    expect(table).not.toContain('MkTable** (component)');
    const bad = await client.callTool({ name: 'list_mk_kit_exports', arguments: { entry: 'nope' } });
    expect(bad.isError).toBe(true);
  });

  it('get_mk_kit_overview and the resources serve the llms files', async () => {
    const overview = await text(await client.callTool({ name: 'get_mk_kit_overview', arguments: {} }));
    expect(overview.startsWith('# mk-kit')).toBe(true);
    const res = await client.readResource({ uri: 'mk-kit://api.json' });
    const json = JSON.parse((res.contents[0] as { text: string }).text) as ApiDoc;
    expect(json.version).toBe(data.api.version);
  });
});
