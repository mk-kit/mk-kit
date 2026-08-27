import { readFile } from 'node:fs/promises';
import type { ApiDoc, MkKitData } from './index.js';

/**
 * Load the API snapshot. The package bundles the artefacts of the release it
 * shipped with (`data/`); unless `MK_KIT_MCP_OFFLINE` is set, a newer set is
 * fetched from the docs site (`MK_KIT_SITE`, default https://mk-kit.dev) so
 * an old install still answers for the current library version. Any network
 * problem silently keeps the bundled copy.
 */
export async function loadData(env: NodeJS.ProcessEnv = process.env): Promise<MkKitData> {
  const bundled = await loadBundled();
  if (env['MK_KIT_MCP_OFFLINE']) return bundled;
  const site = (env['MK_KIT_SITE'] ?? bundled.api.site ?? 'https://mk-kit.dev').replace(/\/$/, '');
  try {
    const remote = await fetchRemote(site);
    return newer(remote.api.version, bundled.api.version) ? remote : bundled;
  } catch {
    return bundled;
  }
}

async function loadBundled(): Promise<MkKitData> {
  const dir = new URL('./data/', import.meta.url);
  const [apiText, llms, llmsFull] = await Promise.all([
    readFile(new URL('api.json', dir), 'utf8'),
    readFile(new URL('llms.txt', dir), 'utf8'),
    readFile(new URL('llms-full.txt', dir), 'utf8'),
  ]);
  return { api: JSON.parse(apiText) as ApiDoc, llms, llmsFull, source: 'bundled' };
}

async function fetchRemote(site: string): Promise<MkKitData> {
  const get = async (path: string) => {
    const res = await fetch(`${site}${path}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.text();
  };
  const apiText = await get('/api.json');
  const api = JSON.parse(apiText) as ApiDoc;
  if (!api?.entries?.length || typeof api.version !== 'string') throw new Error('bad api.json');
  const [llms, llmsFull] = await Promise.all([get('/llms.txt'), get('/llms-full.txt')]);
  return { api, llms, llmsFull, source: site };
}

/** semver-ish: is `a` newer than `b`? */
export function newer(a: string, b: string): boolean {
  const pa = a.split(/[.-]/).map(Number);
  const pb = b.split(/[.-]/).map(Number);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (Number.isNaN(x) || Number.isNaN(y)) return false;
    if (x !== y) return x > y;
  }
  return false;
}
