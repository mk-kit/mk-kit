/**
 * Shape of `projects/docs/public/cost.json` (written by `scripts/gen-cost.mjs`)
 * and the pure helpers the Bundle cost page renders it with.
 */

export interface CostItem {
  name: string;
  kind: string;
  selector?: string;
  docs?: string;
  /** Brotli bytes of this export bundled alone, sibling entries external. `null` in entry-share mode. */
  own: number | null;
  /** Brotli bytes of this export with the mk-kit code it pulls from other entries. `null` in entry-share mode. */
  size: number | null;
}

export interface CostEntry {
  name: string;
  import: string;
  file: string;
  /** Uncompressed bytes of the FESM file npm ships. */
  raw: number;
  /** Minified bytes (null in entry-share mode). */
  min: number | null;
  /** Minified + brotli bytes of the whole entry point, sibling entries external. */
  brotli: number;
  /** Raw-size budget from scripts/size-budget.json, in KiB (null when the entry has none). */
  budgetKiB: number | null;
  items: CostItem[];
}

export interface CostDoc {
  package: string;
  version: string;
  method: 'esbuild' | 'entry-share';
  externals: string[];
  esbuild?: string;
  total: { raw: number; min: number | null; brotli: number; budgetKiB: number };
  entries: CostEntry[];
}

/** One table row: an entry point (`isEntry`) or one of its exports. */
export interface CostRow {
  id: string;
  entry: string;
  export: string;
  kind: string;
  /** Brotli bytes: the entry point, or the export's own share of it. */
  size: number;
  /** 0–1: export ÷ its entry point, or entry point ÷ the whole library. */
  share: number;
  /** Brotli bytes of the export with its cross-entry mk-kit dependencies; -1 for entry rows. */
  standalone: number;
  /** raw ÷ budget for entry rows with a budget; -1 otherwise (sorts last). */
  budget: number;
  isEntry: boolean;
  raw: number;
  budgetKiB: number | null;
  docs?: string;
  /** Per-export numbers unavailable — `size` is the whole entry point. */
  estimated: boolean;
}

export const KIB = 1024;

export function formatKiB(bytes: number, digits = 1): string {
  return `${(bytes / KIB).toFixed(digits)} KiB`;
}

export function formatPercent(share: number): string {
  const pct = share * 100;
  return `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`;
}

/** Entry points followed by their exports, largest first. */
export function buildRows(doc: CostDoc): CostRow[] {
  const rows: CostRow[] = [];
  const estimated = doc.method !== 'esbuild';
  const entries = [...doc.entries].sort((a, b) => b.brotli - a.brotli);
  for (const e of entries) {
    rows.push({
      id: e.name,
      entry: e.name,
      export: e.import,
      kind: 'entry point',
      size: e.brotli,
      share: doc.total.brotli ? e.brotli / doc.total.brotli : 0,
      standalone: -1,
      budget: e.budgetKiB ? e.raw / (e.budgetKiB * KIB) : -1,
      isEntry: true,
      raw: e.raw,
      budgetKiB: e.budgetKiB,
      estimated: false,
    });
    for (const x of e.items) {
      const own = x.own ?? e.brotli;
      rows.push({
        id: `${e.name}/${x.name}`,
        entry: e.name,
        export: x.name,
        kind: x.kind,
        size: own,
        share: e.brotli ? own / e.brotli : 0,
        standalone: x.size ?? -1,
        budget: -1,
        isEntry: false,
        raw: e.raw,
        budgetKiB: e.budgetKiB,
        docs: x.docs,
        estimated: estimated || x.own == null,
      });
    }
  }
  return rows;
}

/** Case-insensitive match on entry, export name, kind and selector. */
export function filterRows(rows: CostRow[], query: string, selectors: ReadonlyMap<string, string>): CostRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.entry.includes(q) ||
      r.export.toLowerCase().includes(q) ||
      r.kind.includes(q) ||
      (selectors.get(r.id)?.toLowerCase().includes(q) ?? false),
  );
}
