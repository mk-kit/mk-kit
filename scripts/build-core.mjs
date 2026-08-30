#!/usr/bin/env node
/**
 * Assemble the publishable @mk-kit/core package in dist/core:
 * compiled ESM + .d.ts (tsc -p projects/core — run before this
 * script), package.json, README and LICENSE.
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'dist/core');
const SRC = join(ROOT, 'projects/core');

if (!existsSync(join(OUT, 'index.js'))) {
  console.error('dist/core/index.js missing — run `tsc -p projects/core` first (npm run build:core does both).');
  process.exit(1);
}
copyFileSync(join(SRC, 'package.json'), join(OUT, 'package.json'));
copyFileSync(join(SRC, 'README.md'), join(OUT, 'README.md'));
copyFileSync(join(ROOT, 'LICENSE'), join(OUT, 'LICENSE'));
const { version } = JSON.parse(readFileSync(join(SRC, 'package.json'), 'utf8'));
console.log(`dist/core ready — @mk-kit/core ${version}`);
