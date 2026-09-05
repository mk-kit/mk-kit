/// <reference types="node" />
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM script, typed by use
import { analyze, flatten, main, removeKeys, scanSources } from './mk-translate.mjs';

function project() {
  const root = mkdtempSync(join(tmpdir(), 'mk-translate-'));
  const i18n = join(root, 'i18n');
  mkdirSync(i18n);
  mkdirSync(join(root, 'src', 'app'), { recursive: true });
  writeFileSync(
    join(i18n, 'pl.json'),
    JSON.stringify({
      menu: { title: 'Menu', old: 'Stare' },
      DayShort0: 'nd',
      DayShort1: 'pon',
      guests: { one: 'osoba', few: 'osoby', many: 'osób', other: 'osoby' },
      checkout: { paid: 'Opłacone', pending: 'Oczekuje' },
    }),
  );
  writeFileSync(join(i18n, 'en.json'), JSON.stringify({ menu: { title: 'Menu', old: 'Old', extra: 'x' }, DayShort0: 'Sun' }));
  writeFileSync(
    join(root, 'src', 'app', 'a.html'),
    `<h1>{{ 'menu.title' | translate }}</h1>{{ n | translatePlural: 'guests' }}`,
  );
  writeFileSync(
    join(root, 'src', 'app', 'a.ts'),
    `const d = t.instant('DayShort' + i); const s = t.instant(\`checkout.\${status()}\`);`,
  );
  writeFileSync(join(root, 'src', 'app', 'a.spec.ts'), `t.instant('menu.old')`); // specs don't count
  return { root, i18n };
}

describe('mk-translate check', () => {
  it('flattens and scans literals + dynamic prefixes', () => {
    expect(flatten({ a: { b: 'x' }, c: 'y' })).toEqual({ 'a.b': 'x', c: 'y' });
    const { literals, prefixes } = scanSources(`'menu.title' | translate; 'Day' + n; \`sushi.d.\${k}\`; | translatePlural: 'guests'; t.plural('cart.items', n)`);
    expect(literals.has('menu.title')).toBe(true);
    expect([...prefixes]).toEqual(expect.arrayContaining(['Day', 'sushi.d.', 'guests.', 'cart.items.']));
  });

  it('reports unused keys, missing and extra keys per language', () => {
    const { root, i18n } = project();
    const r = analyze({ dir: i18n, langs: ['pl', 'en'], base: 'pl', srcRoots: [join(root, 'src')], exts: ['ts', 'html'] });
    expect(r.unused).toEqual(['menu.old']);
    expect(r.missing.en).toEqual(['DayShort1', 'checkout.paid', 'checkout.pending', 'guests.few', 'guests.many', 'guests.one', 'guests.other']);
    expect(r.extra.en).toEqual(['menu.extra']);
    expect(r.used).toBe(9);
  });

  it('--fix deletes unused keys from every file and prunes empty objects', () => {
    const { root, i18n } = project();
    const r = analyze({ dir: i18n, langs: ['pl', 'en'], base: 'pl', srcRoots: [join(root, 'src')], exts: ['ts', 'html'] });
    removeKeys(i18n, ['pl', 'en'], r.raw, r.unused);
    expect(JSON.parse(readFileSync(join(i18n, 'pl.json'), 'utf8')).menu).toEqual({ title: 'Menu' });
    expect(JSON.parse(readFileSync(join(i18n, 'en.json'), 'utf8')).menu).toEqual({ title: 'Menu', extra: 'x' });
  });

  it('main: exit codes and --json', () => {
    const { root, i18n } = project();
    const logs: string[] = [];
    const orig = console.log;
    console.log = (s: string) => void logs.push(String(s));
    try {
      const code = main(['check', '--dir', i18n, '--src', join(root, 'src'), '--json']);
      expect(code).toBe(1);
      const report = JSON.parse(logs.join('\n'));
      expect(report.ok).toBe(false);
      expect(report.base).toBe('pl');
      expect(report.unused).toEqual(['menu.old']);
    } finally {
      console.log = orig;
    }
    expect(main(['nope'])).toBe(2);
    expect(main(['check', '--dir', join(root, 'missing')])).toBe(2);
  });
});
