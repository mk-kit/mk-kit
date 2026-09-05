#!/usr/bin/env node
// mk-translate — hygiene for the JSON dictionaries behind @mk-kit/ui/translate.
//
//   mk-translate check [options]
//
//   --dir <path>        directory with <lang>.json files       (default: src/assets/i18n)
//   --base <lang>       the source-of-truth language           (default: the first of --langs, else "pl" if present, else the first file)
//   --langs <a,b,c>     languages to check                     (default: every <lang>.json in --dir)
//   --src <path>        source root(s) to scan, repeatable     (default: src)
//   --ext <ts,html>     file extensions to scan                (default: ts,html)
//   --prefix <p>        extra dynamic prefix, repeatable       (keys starting with it count as used)
//   --list              print every unused key
//   --fix               delete unused keys from every language file, then report
//   --json              machine-readable report on stdout
//
// A key counts as USED when it appears as a string literal in the scanned
// sources (specs excluded), or when it starts with a DYNAMIC PREFIX the code
// builds at runtime — 'Day' + n, `ns.${key}`, 'checkout.' + status(),
// `| translatePlural: 'ns.key'` (which resolves ns.key.one|few|many|other).
// Parity: every used key must exist in every language; no language may carry
// keys the base lacks. Exit code 1 on any finding.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function deleteKey(obj, parts) {
  const [head, ...rest] = parts;
  if (!(head in obj)) return;
  if (rest.length) {
    deleteKey(obj[head], rest);
    if (obj[head] && typeof obj[head] === 'object' && Object.keys(obj[head]).length === 0) delete obj[head];
  } else {
    delete obj[head];
  }
}

function walk(root, exts, files = []) {
  if (!fs.existsSync(root)) return files;
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.angular', 'dist', '.git'].includes(e.name)) walk(p, exts, files);
    } else if (exts.some((x) => p.endsWith(`.${x}`)) && !/\.spec\.(ts|js|mts)$/.test(p)) {
      files.push(p);
    }
  }
  return files;
}

/** Keys and prefixes referenced by the sources. */
export function scanSources(src) {
  const literals = new Set();
  for (const m of src.matchAll(/['"`]([A-Za-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*)['"`]/g)) literals.add(m[1]);
  const prefixes = new Set();
  // 'checkout.' + status()   /   'Day' + n
  for (const m of src.matchAll(/['"]([A-Za-z][A-Za-z0-9_.-]*)['"]\s*\+/g)) {
    if (/[A-Z.]/.test(m[1]) || m[1].length > 3) prefixes.add(m[1]);
  }
  // `ns.${key}`
  for (const m of src.matchAll(/`([A-Za-z][A-Za-z0-9_.-]*)\$\{/g)) {
    if (m[1].includes('.') || /^Day/.test(m[1])) prefixes.add(m[1]);
  }
  // 'ns' + '.' + key
  for (const m of src.matchAll(/['"]([A-Za-z][A-Za-z0-9_.-]*)['"]\s*\+\s*['"]\.['"]\s*\+/g)) prefixes.add(m[1] + '.');
  // plural(keyBase, …) / | translatePlural: 'keyBase' → keyBase.one|few|many|other
  for (const m of src.matchAll(/\|\s*translatePlural\s*:\s*['"]([A-Za-z][A-Za-z0-9_.-]*)['"]/g)) prefixes.add(m[1] + '.');
  for (const m of src.matchAll(/\.plural\(\s*['"]([A-Za-z][A-Za-z0-9_.-]*)['"]/g)) prefixes.add(m[1] + '.');
  return { literals, prefixes };
}

/**
 * Analyse dictionaries against sources. Pure: returns the findings and the
 * parsed trees (so `--fix` can rewrite), touches no file.
 */
export function analyze({ dir, langs, base, srcRoots, exts, extraPrefixes = [] }) {
  const raw = Object.fromEntries(
    langs.map((l) => [l, JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8'))]),
  );
  const dicts = Object.fromEntries(langs.map((l) => [l, flatten(raw[l])]));
  const keys = new Set(Object.keys(dicts[base]));
  const files = srcRoots.flatMap((r) => walk(r, exts));
  const src = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const { literals, prefixes } = scanSources(src);
  for (const p of extraPrefixes) prefixes.add(p);
  const prefixList = [...prefixes];
  const used = new Set();
  for (const k of keys) if (literals.has(k) || prefixList.some((p) => k.startsWith(p))) used.add(k);
  const others = langs.filter((l) => l !== base);
  return {
    base,
    langs,
    files: files.length,
    total: keys.size,
    used: used.size,
    literals: literals.size,
    prefixes: prefixList.length,
    unused: [...keys].filter((k) => !used.has(k)).sort(),
    missing: Object.fromEntries(others.map((l) => [l, [...used].filter((k) => !(k in dicts[l])).sort()])),
    extra: Object.fromEntries(others.map((l) => [l, Object.keys(dicts[l]).filter((k) => !keys.has(k)).sort()])),
    raw,
  };
}

/** Delete `keys` from every language file (pretty-printed, 2 spaces, trailing newline). */
export function removeKeys(dir, langs, raw, keys) {
  for (const l of langs) {
    for (const k of keys) deleteKey(raw[l], k.split('.'));
    fs.writeFileSync(path.join(dir, `${l}.json`), JSON.stringify(raw[l], null, 2) + '\n');
  }
}

function parseArgs(argv) {
  const opts = { dir: 'src/assets/i18n', src: [], ext: 'ts,html', prefix: [], list: false, fix: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--dir') opts.dir = next();
    else if (a === '--base') opts.base = next();
    else if (a === '--langs') opts.langs = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--src') opts.src.push(next());
    else if (a === '--ext') opts.ext = next();
    else if (a === '--prefix') opts.prefix.push(next());
    else if (a === '--list') opts.list = true;
    else if (a === '--fix') opts.fix = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
  }
  if (!opts.src.length) opts.src = ['src'];
  return opts;
}

function usage() {
  const text = fs.readFileSync(new URL(import.meta.url), 'utf8');
  return text.split('\n').filter((l) => l.startsWith('//')).slice(1).map((l) => l.replace(/^\/\/ ?/, '')).join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    console.log(usage());
    return 0;
  }
  if (command !== 'check') {
    console.error(`mk-translate: unknown command "${command}" (try: check)`);
    return 2;
  }
  const opts = parseArgs(rest);
  if (opts.help) {
    console.log(usage());
    return 0;
  }
  if (!fs.existsSync(opts.dir)) {
    console.error(`mk-translate: no such directory ${opts.dir}`);
    return 2;
  }
  const available = fs.readdirSync(opts.dir).filter((f) => /^[a-z]{2}(-[A-Z]{2})?\.json$/.test(f)).map((f) => f.replace(/\.json$/, '')).sort();
  const langs = opts.langs ?? available;
  const missingFiles = langs.filter((l) => !available.includes(l));
  if (!langs.length || missingFiles.length) {
    console.error(`mk-translate: no dictionary for ${missingFiles.join(', ') || 'any language'} in ${opts.dir}`);
    return 2;
  }
  const base = opts.base ?? (opts.langs ? langs[0] : langs.includes('pl') ? 'pl' : langs[0]);
  const report = analyze({
    dir: opts.dir,
    langs: [base, ...langs.filter((l) => l !== base)],
    base,
    srcRoots: opts.src,
    exts: opts.ext.split(',').map((s) => s.trim()),
    extraPrefixes: opts.prefix,
  });

  if (opts.fix && report.unused.length) {
    removeKeys(opts.dir, report.langs, report.raw, report.unused);
    if (!opts.json) console.log(`✓ removed ${report.unused.length} unused key(s) from ${report.langs.join('/')}`);
    report.fixed = report.unused;
    report.unused = [];
  }

  const others = report.langs.filter((l) => l !== base);
  const bad =
    report.unused.length > 0 || others.some((l) => report.missing[l].length || report.extra[l].length);

  if (opts.json) {
    const { raw: _raw, ...rest } = report;
    console.log(JSON.stringify({ ...rest, ok: !bad }, null, 2));
    return bad ? 1 : 0;
  }
  console.log(
    `i18n: ${report.total} keys in ${base} · used ${report.used} (${report.literals} literal sites, ${report.prefixes} dynamic prefixes, ${report.files} files)`,
  );
  if (opts.list) for (const k of report.unused) console.log(`  unused  ${k}`);
  if (report.unused.length) {
    console.error(`✗ ${report.unused.length} unused key(s) — --list to see them, --fix to delete`);
  }
  for (const l of others) {
    const m = report.missing[l];
    const x = report.extra[l];
    if (m.length) console.error(`✗ ${l}.json lacks ${m.length} used key(s): ${m.slice(0, 10).join(', ')}${m.length > 10 ? ' …' : ''}`);
    if (x.length) console.error(`✗ ${l}.json has ${x.length} key(s) ${base} lacks: ${x.slice(0, 10).join(', ')}${x.length > 10 ? ' …' : ''}`);
  }
  if (!bad) console.log(`✓ i18n keys clean (no unused keys, ${others.join('/') || 'nothing else'} in parity with ${base})`);
  return bad ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(`mk-translate: ${err.message}`);
    process.exit(2);
  }
}
