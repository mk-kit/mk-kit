/**
 * Prints one version's section from CHANGELOG.md, for use as GitHub Release
 * notes. The changelog follows Keep a Changelog, so a release is everything
 * between its own `## [x.y.z] — date` heading and the next `## ` heading.
 *
 *   node scripts/changelog-section.mjs 0.7.0
 *
 * Exits non-zero when the version has no section, so a release job fails loudly
 * rather than publishing with empty notes.
 */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = (process.argv[2] ?? '').replace(/^v/, '');

if (!version) {
  console.error('usage: node scripts/changelog-section.mjs <version>');
  process.exit(2);
}

const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8');
const lines = changelog.split('\n');

// Match `## [0.7.0]` or `## 0.7.0`, with or without a trailing date.
const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const heading = new RegExp(`^## \\[?${escaped}\\]?(\\s|$|\\s*—)`);

const start = lines.findIndex((line) => heading.test(line));
if (start === -1) {
  console.error(`No CHANGELOG.md section found for version ${version}.`);
  process.exit(1);
}

const rest = lines.slice(start + 1);
const end = rest.findIndex((line) => line.startsWith('## '));
const body = (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();

if (!body) {
  console.error(`CHANGELOG.md section for ${version} is empty.`);
  process.exit(1);
}

console.log(body);
