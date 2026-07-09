/**
 * Dependency-free text diff for {@link MkDiff} — an LCS line diff with optional
 * intra-line word highlighting. Pure and SSR-safe (no DOM). Suited to revision
 * comparison ("what changed between save N and N+1").
 */

/** The kind of change for a diff row/segment. */
export type MkDiffOp = 'equal' | 'insert' | 'delete';

/** A word-level segment within a changed line. */
export interface MkDiffSegment {
  text: string;
  /** True when this word differs from the paired line. */
  changed: boolean;
}

/** One line of a computed diff. */
export interface MkDiffRow {
  op: MkDiffOp;
  text: string;
  /** 1-based line number in the "before" text (null for inserts). */
  beforeNo: number | null;
  /** 1-based line number in the "after" text (null for deletes). */
  afterNo: number | null;
  /** Word segments for changed lines (present when word highlighting runs). */
  segments?: MkDiffSegment[];
}

/** Summary counts for a diff. */
export interface MkDiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

/** Options for {@link mkComputeDiff}. */
export interface MkDiffOptions {
  /** Highlight the specific words that changed within paired lines. */
  wordHighlight?: boolean;
  /** Treat trailing whitespace as insignificant when comparing lines. */
  ignoreTrailingWhitespace?: boolean;
}

interface Op<T> {
  op: MkDiffOp;
  a?: T;
  b?: T;
}

/** LCS diff of two sequences (dynamic programming + backtrack). */
function lcsOps<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): Op<T>[] {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = LCS length of a[i:] and b[j:].
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = eq(a[i], b[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: Op<T>[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (eq(a[i], b[j])) {
      ops.push({ op: 'equal', a: a[i], b: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ op: 'delete', a: a[i] });
      i++;
    } else {
      ops.push({ op: 'insert', b: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ op: 'delete', a: a[i++] });
  while (j < m) ops.push({ op: 'insert', b: b[j++] });
  return ops;
}

/** Split a line into word/whitespace tokens (separators preserved). */
function tokenize(line: string): string[] {
  return line.split(/(\s+)/).filter((t) => t.length > 0);
}

/** Word-level segments for a paired (deleted, inserted) line. */
function wordSegments(
  before: string,
  after: string,
): { before: MkDiffSegment[]; after: MkDiffSegment[] } {
  const ops = lcsOps(tokenize(before), tokenize(after), (x, y) => x === y);
  const bSeg: MkDiffSegment[] = [];
  const aSeg: MkDiffSegment[] = [];
  for (const o of ops) {
    if (o.op === 'equal') {
      bSeg.push({ text: o.a!, changed: false });
      aSeg.push({ text: o.b!, changed: false });
    } else if (o.op === 'delete') {
      bSeg.push({ text: o.a!, changed: true });
    } else {
      aSeg.push({ text: o.b!, changed: true });
    }
  }
  return { before: bSeg, after: aSeg };
}

/** Pair adjacent delete/insert runs and attach word segments to each row. */
function addWordHighlights(rows: MkDiffRow[]): void {
  let i = 0;
  while (i < rows.length) {
    if (rows[i].op !== 'delete') {
      i++;
      continue;
    }
    let d = i;
    while (d < rows.length && rows[d].op === 'delete') d++;
    let s = d;
    while (s < rows.length && rows[s].op === 'insert') s++;
    const deletes = rows.slice(i, d);
    const inserts = rows.slice(d, s);
    const pairs = Math.min(deletes.length, inserts.length);
    for (let k = 0; k < pairs; k++) {
      const seg = wordSegments(deletes[k].text, inserts[k].text);
      deletes[k].segments = seg.before;
      inserts[k].segments = seg.after;
    }
    i = s;
  }
}

/**
 * Compute a line diff between `before` and `after`. Returns one {@link MkDiffRow}
 * per line in document order, with `equal` / `insert` / `delete` ops and 1-based
 * before/after line numbers. With `wordHighlight` (default true) changed lines
 * also carry word-level `segments`.
 */
export function mkComputeDiff(
  before: string,
  after: string,
  options: MkDiffOptions = {},
): MkDiffRow[] {
  const { wordHighlight = true, ignoreTrailingWhitespace = false } = options;
  const norm = (s: string) =>
    ignoreTrailingWhitespace ? s.replace(/[ \t]+$/, '') : s;

  const beforeLines = String(before ?? '').split('\n');
  const afterLines = String(after ?? '').split('\n');
  const ops = lcsOps(beforeLines, afterLines, (x, y) => norm(x) === norm(y));

  const rows: MkDiffRow[] = [];
  let beforeNo = 0;
  let afterNo = 0;
  for (const o of ops) {
    if (o.op === 'equal') {
      rows.push({ op: 'equal', text: o.a!, beforeNo: ++beforeNo, afterNo: ++afterNo });
    } else if (o.op === 'delete') {
      rows.push({ op: 'delete', text: o.a!, beforeNo: ++beforeNo, afterNo: null });
    } else {
      rows.push({ op: 'insert', text: o.b!, beforeNo: null, afterNo: ++afterNo });
    }
  }

  if (wordHighlight) addWordHighlights(rows);
  return rows;
}

/** Summary counts (added / removed / unchanged lines) for a diff. */
export function mkDiffStats(rows: MkDiffRow[]): MkDiffStats {
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const r of rows) {
    if (r.op === 'insert') added++;
    else if (r.op === 'delete') removed++;
    else unchanged++;
  }
  return { added, removed, unchanged };
}
