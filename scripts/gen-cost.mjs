#!/usr/bin/env node
/**
 * Measure what every entry point and every export of @mk-kit/ui costs in a
 * production bundle, and write the result for the docs' "Bundle cost" page:
 *
 *   projects/docs/public/cost.json
 *
 * How it measures. The built package in dist/mk-kit/fesm2022 is what npm
 * ships, so that is what gets measured — after the same steps an Angular CLI
 * production build applies to it: the Angular linker turns the partial
 * declarations into real component definitions, Angular's babel plugins mark
 * classes and top-level calls pure so they can be dropped, then esbuild
 * bundles, tree-shakes and minifies with `ngDevMode` off. Sizes are the
 * brotli-compressed bytes of that output. Angular itself, rxjs and tslib are
 * externals (every Angular app already pays for them); nothing else is,
 * because the library has no other runtime dependencies.
 *
 * Three numbers come out:
 *
 *   entry.brotli  the whole entry point, sibling entries external. Summed
 *                 over all entries this is the size of the entire library.
 *   item.own      one export, bundled on its own, sibling entries external —
 *                 the part of its entry point this export actually needs.
 *   item.size     the same export with the mk-kit code it pulls from other
 *                 entries (the icon set, the i18n defaults, …) bundled in —
 *                 what an app pays for importing only that export.
 *
 * Reads projects/docs/public/api.json (from scripts/gen-api.mjs) for the
 * export list and scripts/size-budget.json for the raw-size budgets.
 * Needs a built library: `npm run build:lib` first.
 *
 *   node scripts/gen-cost.mjs          # write cost.json
 *   node scripts/gen-cost.mjs --check  # exit 1 when it is stale
 *
 * Without esbuild and the Angular linker on hand (they come with the Angular
 * CLI) the script falls back to `method: "entry-share"`: whole-entry sizes
 * only, per-export numbers null.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { brotliCompressSync, constants as zlib } from 'node:zlib';

const require = createRequire(import.meta.url);
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const FESM = join(ROOT, 'dist/mk-kit/fesm2022');
const API = join(ROOT, 'projects/docs/public/api.json');
const OUT = join(ROOT, 'projects/docs/public/cost.json');
const BUDGET = join(ROOT, 'scripts/size-budget.json');

const SKIP_KINDS = new Set(['interface', 'type']);
const EXTERNALS = ['@angular/*', 'rxjs', 'tslib'];

if (!existsSync(FESM)) {
  console.error(`gen-cost: ${relative(ROOT, FESM)} not found — run \`npm run build:lib\` first.`);
  process.exit(1);
}
if (!existsSync(API)) {
  console.error(`gen-cost: ${relative(ROOT, API)} not found — run \`npm run gen:api\` first.`);
  process.exit(1);
}

const api = JSON.parse(readFileSync(API, 'utf8'));
const budget = JSON.parse(readFileSync(BUDGET, 'utf8'));
const pkg = JSON.parse(readFileSync(join(ROOT, 'dist/mk-kit/package.json'), 'utf8'));

const brotli = (text) =>
  brotliCompressSync(Buffer.from(text), { params: { [zlib.BROTLI_PARAM_QUALITY]: 11 } }).length;

/**
 * Secondary entry points, from the built package's exports map (the root
 * barrel only re-exports): subpath → FESM file. Nested entries like
 * `icon/extended` build to a flattened file name (`mk-kit-ui-icon-extended.mjs`),
 * so the exports map — not the file list — is the source of truth.
 */
const ENTRIES = Object.entries(pkg.exports ?? {})
  .flatMap(([sub, cond]) => {
    const m = /^\.\/fesm2022\/(mk-kit-ui-[\w-]+\.mjs)$/.exec(cond?.default ?? '');
    return m && sub !== '.' ? [{ name: sub.replace(/^\.\//, ''), file: m[1] }] : [];
  })
  .sort((a, b) => a.name.localeCompare(b.name));
const FILE_OF = new Map(ENTRIES.map((e) => [e.name, e.file]));
const fesmOf = (entry) => join(FESM, entry ? FILE_OF.get(entry) : 'mk-kit-ui.mjs');
/** The entry point a source file belongs to — the longest entry path prefixing it. */
const homeOf = (file) => {
  const rel = file.replace(/^projects\/mk-kit\//, '');
  let best = '';
  for (const { name } of ENTRIES) {
    if ((rel === name || rel.startsWith(`${name}/`)) && name.length > best.length) best = name;
  }
  return best;
};

// ---------------------------------------------------------------------------
// Toolchain: esbuild + the Angular linker + the CLI's optimisation plugins.
// ---------------------------------------------------------------------------

function loadToolchain() {
  try {
    const esbuild = require('esbuild');
    const babel = require('@babel/core');
    const { createEs2015LinkerPlugin } = require('@angular/compiler-cli/linker/babel');
    const { NodeJSFileSystem } = require('@angular/compiler-cli');
    // Same plugins `@angular/build` runs on node_modules code in a production
    // build (see its javascript-transformer-worker); not part of the public
    // exports map, hence the path.
    const plugins = require(
      join(require.resolve('@angular/build/package.json'), '../src/tools/babel/plugins/index.js'),
    );
    return { esbuild, babel, createEs2015LinkerPlugin, NodeJSFileSystem, ...plugins };
  } catch (err) {
    console.warn(`gen-cost: per-export measurement unavailable (${err.message}); falling back to entry sizes.`);
    return null;
  }
}

const tc = loadToolchain();
const method = tc ? 'esbuild' : 'entry-share';

/** FESM file → linked + optimised source (memoised; the same file is loaded by many builds). */
const linked = new Map();
async function link(file) {
  if (!linked.has(file)) {
    const src = readFileSync(file, 'utf8');
    const quiet = { level: 3, debug() {}, info() {}, warn() {}, error() {} };
    const linker = tc.createEs2015LinkerPlugin({
      fileSystem: new tc.NodeJSFileSystem(),
      logger: quiet,
      sourceMapping: false,
      linkerJitMode: false,
    });
    const out = await tc.babel.transformAsync(src, {
      filename: file,
      plugins: [
        linker,
        [tc.markTopLevelPure, { topLevelSafeMode: true }],
        tc.elideAngularMetadata,
        tc.adjustTypeScriptEnums,
        [tc.adjustStaticMembers, { wrapDecorators: true }],
      ],
      compact: false,
      babelrc: false,
      configFile: false,
      sourceMaps: false,
    });
    linked.set(file, out.code);
  }
  return linked.get(file);
}

/** Names a FESM bundle exports itself (its trailing `export { … }` lists). */
function ownExportNames(entry) {
  const src = readFileSync(fesmOf(entry), 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/^export \{([^}]*)\};?$/gm)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name) names.add(name);
    }
  }
  return names;
}

/**
 * esbuild plugin: `@mk-kit/ui/<x>` resolves to the built FESM (linked on
 * load); Angular, rxjs and tslib stay external. In `own` mode the sibling
 * entry points are external too and their `export *` re-exports are cut, so
 * only the entry's own code is counted.
 */
function mkPlugin(mode, entry) {
  return {
    name: 'mk-kit-cost',
    setup(b) {
      b.onResolve({ filter: /^@mk-kit\/ui(\/[\w-]+)*$/ }, (args) => {
        const e = args.path.slice('@mk-kit/ui/'.length);
        if (mode === 'own' && e !== entry) return { path: args.path, external: true, sideEffects: false };
        return { path: fesmOf(e) };
      });
      b.onResolve({ filter: /^(@angular\/|rxjs(\/|$)|tslib$|@mk-kit\/validators(\/|$))/ }, (args) => ({ path: args.path, external: true }));
      b.onLoad({ filter: /fesm2022[\\/][\w-]+\.mjs$/ }, async (args) => {
        let contents = await link(args.path);
        if (mode === 'own') contents = contents.replace(/^export \* from '@mk-kit\/ui\/[\w/-]+';$/gm, '');
        return { contents, loader: 'js', resolveDir: FESM };
      });
      b.onResolve({ filter: /^cost:/ }, (args) => ({ path: args.path, namespace: 'cost' }));
      b.onLoad({ filter: /.*/, namespace: 'cost' }, (args) => {
        const [, e, name] = /^cost:([\w/-]*)::(.*)$/.exec(args.path);
        const from = JSON.stringify(fesmOf(e));
        const contents = name === '__entry__' ? `export * from ${from};` : `export { ${name} } from ${from};`;
        return { contents, loader: 'js', resolveDir: FESM };
      });
    },
  };
}

/** Bundle each name on its own; returns { name: { min, brotli } }. `*` means the whole entry. */
async function bundle(mode, entry, names) {
  if (!names.length) return {};
  const result = await tc.esbuild.build({
    // Output names are case-insensitive for esbuild (`MkX` vs `mkX` would
    // clash), so outputs are keyed by index.
    entryPoints: names.map((n, i) => ({ in: `cost:${entry}::${n === '*' ? '__entry__' : n}`, out: `o${i}` })),
    bundle: true,
    splitting: false,
    treeShaking: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    charset: 'utf8',
    legalComments: 'none',
    logLevel: 'silent',
    write: false,
    outdir: '/cost',
    define: { ngDevMode: 'false', ngI18nClosureMode: 'false', ngJitMode: 'false' },
    plugins: [mkPlugin(mode, entry)],
  });
  const out = {};
  for (const f of result.outputFiles) {
    const i = Number(/o(\d+)\.js$/.exec(f.path)[1]);
    out[names[i]] = { min: f.contents.length, brotli: brotli(f.text) };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Walk the entry points
// ---------------------------------------------------------------------------

/** Exports per home entry point (where the source lives), deduplicated across re-exporting barrels. */
const byHome = new Map(ENTRIES.map((e) => [e.name, new Map()]));
for (const e of api.entries) {
  for (const x of e.exports) {
    if (SKIP_KINDS.has(x.kind)) continue;
    const home = homeOf(x.file);
    if (!byHome.has(home) || byHome.get(home).has(x.name)) continue;
    byHome.get(home).set(x.name, x);
  }
}

const entries = [];
const started = Date.now();
for (const { name, file: fileName } of ENTRIES) {
  const file = fesmOf(name);
  const raw = statSync(file).size;
  const budgetKiB = budget.bundles[fileName] ?? null;
  const exported = ownExportNames(name);
  const wanted = [...byHome.get(name).values()].filter((x) => exported.has(x.name));

  let min = null;
  let br = null;
  let items;
  if (tc) {
    const names = wanted.map((x) => x.name);
    const [whole, own, alone] = await Promise.all([
      bundle('own', name, ['*']),
      bundle('own', name, names),
      bundle('all', name, names),
    ]);
    min = whole['*'].min;
    br = whole['*'].brotli;
    items = wanted.map((x) => ({
      name: x.name,
      kind: x.kind,
      ...(x.selector ? { selector: x.selector } : {}),
      ...(x.docs ? { docs: x.docs } : {}),
      own: own[x.name].brotli,
      size: alone[x.name].brotli,
    }));
  } else {
    br = brotli(readFileSync(file, 'utf8'));
    items = wanted.map((x) => ({
      name: x.name,
      kind: x.kind,
      ...(x.selector ? { selector: x.selector } : {}),
      ...(x.docs ? { docs: x.docs } : {}),
      own: null,
      size: null,
    }));
  }
  items.sort((a, b) => (b.own ?? 0) - (a.own ?? 0) || a.name.localeCompare(b.name));
  entries.push({ name, import: `@mk-kit/ui/${name}`, file: fileName, raw, min, brotli: br, budgetKiB, items });
  console.error(`  ${name.padEnd(14)} ${String(items.length).padStart(3)} exports  ${(br / 1024).toFixed(1).padStart(6)} KiB brotli`);
}

const sum = (key) => entries.reduce((n, e) => n + (e[key] ?? 0), 0);
const cost = {
  package: pkg.name,
  version: pkg.version,
  method,
  externals: EXTERNALS,
  ...(tc ? { esbuild: tc.esbuild.version } : {}),
  total: { raw: sum('raw'), min: tc ? sum('min') : null, brotli: sum('brotli'), budgetKiB: budget.total },
  entries,
};

const content = JSON.stringify(cost, null, 1) + '\n';
const itemCount = entries.reduce((n, e) => n + e.items.length, 0);
const summary = `${(cost.total.brotli / 1024).toFixed(1)} KiB brotli for ${entries.length} entry points, ${itemCount} exports measured (${method}, ${((Date.now() - started) / 1000).toFixed(1)}s)`;

if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== content) {
    console.error(`${relative(ROOT, OUT)} is stale — run: npm run gen:cost`);
    process.exit(1);
  }
  console.log(`cost.json is up to date: ${summary}.`);
} else {
  writeFileSync(OUT, content);
  console.log(`wrote ${relative(ROOT, OUT)}: ${summary}.`);
}
