/**
 * Bundle-size budget check for the built library.
 *
 * Compares the raw sizes of dist/mk-kit/fesm2022 bundles against
 * scripts/size-budget.json and exits non-zero when a bundle (or the total)
 * exceeds its budget. Run after `npm run build:lib`:
 *
 *   node scripts/check-size.mjs
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fesmDir = join(root, 'dist/mk-kit/fesm2022');
const budget = JSON.parse(
  await readFile(join(root, 'scripts/size-budget.json'), 'utf8'),
);

const kib = (bytes) => bytes / 1024;
const fmt = (k) => `${k.toFixed(1)} KiB`;

let files;
try {
  files = (await readdir(fesmDir)).filter((f) => f.endsWith('.mjs'));
} catch {
  console.error(`size-check: ${fesmDir} not found — run \`npm run build:lib\` first.`);
  process.exit(1);
}

let total = 0;
let failed = false;
for (const file of files.sort()) {
  const size = kib((await stat(join(fesmDir, file))).size);
  total += size;
  const limit = budget.bundles[file];
  const over = limit !== undefined && size > limit;
  if (over) failed = true;
  if (limit !== undefined || over) {
    console.log(
      `${over ? '✗' : '✓'} ${file.padEnd(32)} ${fmt(size).padStart(10)} / ${fmt(limit)}`,
    );
  }
}

const totalOver = total > budget.total;
if (totalOver) failed = true;
console.log(
  `${totalOver ? '✗' : '✓'} ${'TOTAL (fesm2022)'.padEnd(32)} ${fmt(total).padStart(10)} / ${fmt(budget.total)}`,
);

if (failed) {
  console.error(
    '\nsize-check: budget exceeded. If the growth is intentional, raise the ' +
      'limit in scripts/size-budget.json in the same commit and say why.',
  );
  process.exit(1);
}
console.log('\nsize-check: all bundles within budget.');
