#!/usr/bin/env node
/**
 * Assemble the publishable @mk-kit/auth package in dist/auth:
 * compiled ESM + .d.ts (tsc -p projects/auth — run before this
 * script), package.json, README and LICENSE.
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'dist/auth');
const SRC = join(ROOT, 'projects/auth');

if (!existsSync(join(OUT, 'index.js'))) {
  console.error('dist/auth/index.js missing — run `tsc -p projects/auth` first (npm run build:auth does both).');
  process.exit(1);
}
copyFileSync(join(SRC, 'package.json'), join(OUT, 'package.json'));
copyFileSync(join(SRC, 'README.md'), join(OUT, 'README.md'));
copyFileSync(join(ROOT, 'LICENSE'), join(OUT, 'LICENSE'));
const { version } = JSON.parse(readFileSync(join(SRC, 'package.json'), 'utf8'));
console.log(`dist/auth ready — @mk-kit/auth ${version}`);
