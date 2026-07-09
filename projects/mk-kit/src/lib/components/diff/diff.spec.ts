import { mkComputeDiff, mkDiffStats } from './diff-util';

describe('mkComputeDiff', () => {
  it('marks every line equal for identical text', () => {
    const rows = mkComputeDiff('a\nb\nc', 'a\nb\nc');
    expect(rows.map((r) => r.op)).toEqual(['equal', 'equal', 'equal']);
    expect(rows[1]).toMatchObject({ beforeNo: 2, afterNo: 2 });
  });

  it('detects a pure insertion in the middle', () => {
    const rows = mkComputeDiff('a\nc', 'a\nb\nc');
    expect(rows.map((r) => `${r.op}:${r.text}`)).toEqual([
      'equal:a',
      'insert:b',
      'equal:c',
    ]);
    expect(rows[1]).toMatchObject({ beforeNo: null, afterNo: 2 });
  });

  it('detects a pure deletion', () => {
    const rows = mkComputeDiff('a\nb\nc', 'a\nc');
    expect(rows.map((r) => `${r.op}:${r.text}`)).toEqual([
      'equal:a',
      'delete:b',
      'equal:c',
    ]);
  });

  it('word-highlights a changed line', () => {
    const rows = mkComputeDiff('the quick brown fox', 'the slow brown fox');
    const del = rows.find((r) => r.op === 'delete')!;
    const ins = rows.find((r) => r.op === 'insert')!;
    expect(del.segments?.find((s) => s.text === 'quick')?.changed).toBe(true);
    expect(del.segments?.find((s) => s.text === 'brown')?.changed).toBe(false);
    expect(ins.segments?.find((s) => s.text === 'slow')?.changed).toBe(true);
  });

  it('can disable word highlighting', () => {
    const rows = mkComputeDiff('one', 'two', { wordHighlight: false });
    expect(rows.every((r) => r.segments === undefined)).toBe(true);
  });

  it('ignores trailing whitespace when asked', () => {
    const withWs = mkComputeDiff('a  \nb', 'a\nb', {
      ignoreTrailingWhitespace: true,
    });
    expect(withWs.every((r) => r.op === 'equal')).toBe(true);
    const strict = mkComputeDiff('a  \nb', 'a\nb');
    expect(strict.some((r) => r.op !== 'equal')).toBe(true);
  });

  it('summarises add/remove/unchanged counts', () => {
    const rows = mkComputeDiff('a\nb\nc', 'a\nB\nc\nd');
    expect(mkDiffStats(rows)).toEqual({ added: 2, removed: 1, unchanged: 2 });
  });
});
