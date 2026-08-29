#!/usr/bin/env node
/**
 * Assemble the publishable @mk-kit/validators package in dist/validators:
 * compiled ESM + .d.ts (tsc -p projects/validators — run before this
 * script), package.json, README and LICENSE.
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'dist/validators');
const SRC = join(ROOT, 'projects/validators');

if (!existsSync(join(OUT, 'index.js'))) {
  console.error('dist/validators/index.js missing — run `tsc -p projects/validators` first (npm run build:validators does both).');
  process.exit(1);
}
copyFileSync(join(SRC, 'package.json'), join(OUT, 'package.json'));
copyFileSync(join(SRC, 'README.md'), join(OUT, 'README.md'));
copyFileSync(join(ROOT, 'LICENSE'), join(OUT, 'LICENSE'));
const { version } = JSON.parse(readFileSync(join(SRC, 'package.json'), 'utf8'));
console.log(`dist/validators ready — @mk-kit/validators ${version}`);
