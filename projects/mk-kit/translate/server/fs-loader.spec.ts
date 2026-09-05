/// <reference types="node" />
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mkFsTranslateLoader } from './fs-loader';

describe('mkFsTranslateLoader', () => {
  it('reads the first directory that has the file, once per language', async () => {
    const missing = await mkdtemp(join(tmpdir(), 'mk-translate-missing-'));
    const dir = await mkdtemp(join(tmpdir(), 'mk-translate-'));
    await writeFile(join(dir, 'pl.json'), JSON.stringify({ a: { b: 'c' } }));
    const loader = mkFsTranslateLoader({ dirs: [missing, dir] })();
    expect(await loader.load('pl')).toEqual({ a: { b: 'c' } });
    await writeFile(join(dir, 'pl.json'), JSON.stringify({ a: { b: 'changed' } }));
    expect(await loader.load('pl')).toEqual({ a: { b: 'c' } });
  });

  it('resolves {} for an unknown language by default and throws on request', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mk-translate-'));
    expect(await mkFsTranslateLoader({ dirs: [dir] })().load('xx')).toEqual({});
    await expect(mkFsTranslateLoader({ dirs: [dir], onNotFound: 'throw' })().load('xx')).rejects.toThrow(/xx\.json/);
  });
});
