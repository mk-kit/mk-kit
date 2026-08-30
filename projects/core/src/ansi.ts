/**
 * Minimal ANSI SGR parser for {@link MkLogViewer}.
 *
 * Understands the SGR (`ESC[…m`) subset that matters for log output — reset
 * (0), bold (1), italic (3), underline (4), the 22/23/24 "off" codes, the 8
 * standard + 8 bright foreground colours (30–37 / 90–97, 39 reset) and the
 * matching backgrounds (40–47 / 100–107, 49 reset). Extended-colour
 * introducers (38/48;5;… and 38/48;2;r;g;b) are consumed so their arguments
 * are never misread as other codes, but map to "no colour" (the theme has no
 * 256-colour palette). Every other escape sequence — cursor movement, erase,
 * OSC titles, single-character escapes — is stripped rather than rendered as
 * garbage.
 *
 * Colours are emitted as CSS class names (`mk-ansi--fg-red`,
 * `mk-ansi--bg-bright-blue`, `mk-ansi--bold`, …) themed in
 * `log-viewer.scss`, not as raw terminal colours.
 */

/** One styled run of text within a parsed line. */
export interface MkAnsiSpan {
  /** The plain text of the run (escape sequences removed). */
  text: string;
  /** `mk-ansi--*` class names styling the run; empty for plain text. */
  classes: readonly string[];
}

/** SGR colour slots 0–7, shared by fg/bg and their bright variants. */
const COLOR_NAMES = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
] as const;

/**
 * Any ANSI escape sequence. Alternatives, in order: SGR (params captured),
 * any other CSI sequence, OSC (terminated by BEL or ST), and two-character
 * `ESC <letter>` escapes.
 */
const ANSI_SOURCE =
  '\\x1b(?:\\[([0-9;]*)m|\\[[0-9;?]*[ -/]*[@-~]|\\][^\\x07\\x1b]*(?:\\x07|\\x1b\\\\)?|[@-Z\\\\-_])';

const EMPTY_CLASSES: readonly string[] = [];

interface SgrState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fg: string | null;
  bg: string | null;
}

function applySgr(params: string, s: SgrState): void {
  const codes = params.split(';').map((p) => (p === '' ? 0 : Number(p)));
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i];
    if (c === 0) {
      s.bold = s.italic = s.underline = false;
      s.fg = s.bg = null;
    } else if (c === 1) s.bold = true;
    else if (c === 3) s.italic = true;
    else if (c === 4) s.underline = true;
    else if (c === 22) s.bold = false;
    else if (c === 23) s.italic = false;
    else if (c === 24) s.underline = false;
    else if (c >= 30 && c <= 37) s.fg = COLOR_NAMES[c - 30];
    else if (c >= 90 && c <= 97) s.fg = `bright-${COLOR_NAMES[c - 90]}`;
    else if (c === 39) s.fg = null;
    else if (c >= 40 && c <= 47) s.bg = COLOR_NAMES[c - 40];
    else if (c >= 100 && c <= 107) s.bg = `bright-${COLOR_NAMES[c - 100]}`;
    else if (c === 49) s.bg = null;
    else if (c === 38 || c === 48) {
      // Extended colour: consume the arguments, render as "no colour".
      const mode = codes[i + 1];
      if (mode === 5) i += 2;
      else if (mode === 2) i += 4;
      else i = codes.length;
      if (c === 38) s.fg = null;
      else s.bg = null;
    }
    // Any other SGR parameter is ignored.
  }
}

function classesFor(s: SgrState): readonly string[] {
  if (!s.bold && !s.italic && !s.underline && !s.fg && !s.bg) {
    return EMPTY_CLASSES;
  }
  const classes: string[] = [];
  if (s.bold) classes.push('mk-ansi--bold');
  if (s.italic) classes.push('mk-ansi--italic');
  if (s.underline) classes.push('mk-ansi--underline');
  if (s.fg) classes.push(`mk-ansi--fg-${s.fg}`);
  if (s.bg) classes.push(`mk-ansi--bg-${s.bg}`);
  return classes;
}

function sameClasses(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((cls, i) => cls === b[i]);
}

/**
 * Parse one log line into styled spans. Pure — same input, same output.
 * Adjacent runs with identical styling are merged, so a plain line yields a
 * single span (or none when empty).
 */
export function mkParseAnsi(line: string): MkAnsiSpan[] {
  const spans: MkAnsiSpan[] = [];
  const state: SgrState = {
    bold: false,
    italic: false,
    underline: false,
    fg: null,
    bg: null,
  };
  const re = new RegExp(ANSI_SOURCE, 'g');
  let last = 0;

  const flush = (end: number): void => {
    if (end <= last) return;
    const text = line.slice(last, end);
    const classes = classesFor(state);
    const prev = spans[spans.length - 1];
    if (prev && sameClasses(prev.classes, classes)) {
      spans[spans.length - 1] = { text: prev.text + text, classes: prev.classes };
    } else {
      spans.push({ text, classes });
    }
  };

  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    flush(m.index);
    last = m.index + m[0].length;
    if (m[1] !== undefined) applySgr(m[1], state);
  }
  flush(line.length);
  return spans;
}

/** Remove every ANSI escape sequence from a line (for copy / search). */
export function mkStripAnsi(line: string): string {
  return line.replace(new RegExp(ANSI_SOURCE, 'g'), '');
}
