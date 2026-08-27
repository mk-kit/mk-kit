/**
 * Pure string transforms behind the `migrate-primeng` schematic. No devkit
 * types here so they can be unit-tested on fixtures and reused by other
 * tooling. Every function returns the new text plus what it did.
 */
import { DOCS_BASE, MODULES, SELECTORS, type ModuleRule, type SelectorRule } from './mapping';

export interface Finding {
  /** Rule id: `import:primeng/table`, `element:p-table`, `attr:pButton`, … */
  rule: string;
  /** Short human description of what happened. */
  message: string;
  /** `rewrite` = done automatically; `manual` = needs a human; `unmapped` = no mk-kit equivalent. */
  kind: 'rewrite' | 'manual' | 'unmapped';
  docs?: string;
  count: number;
}

export interface TransformResult {
  text: string;
  changed: boolean;
  findings: Finding[];
}

const MODULE_BY_PATH = new Map(MODULES.map((m) => [m.path, m]));

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function docsUrl(route: string | undefined): string | undefined {
  return route ? `${DOCS_BASE}${route}` : undefined;
}

/* ------------------------------------------------------------------------ */
/* TypeScript                                                                */
/* ------------------------------------------------------------------------ */

const IMPORT_RE = /import\s*(type\s+)?\{([^}]*)\}\s*from\s*['"]primeng\/([\w-]+)['"];?[ \t]*\r?\n?/g;

/**
 * Rewrites `primeng/*` imports to `@mk-kit/ui`, renames the imported
 * identifiers everywhere in the file, keeps unmapped symbols on their
 * original import, and dedupes `imports: [...]` arrays.
 */
export function transformTypeScript(source: string): TransformResult {
  const findings: Finding[] = [];
  const mkNames = new Set<string>();
  const renames = new Map<string, string>();
  const keep: string[] = [];
  let text = source;
  let firstImportIndex = -1;

  text = text.replace(IMPORT_RE, (whole, isType, names: string, path: string, offset: number) => {
    const rule: ModuleRule | undefined = MODULE_BY_PATH.get(path);
    if (firstImportIndex === -1) firstImportIndex = offset;
    const symbols = names
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    const unmapped: string[] = [];
    for (const raw of symbols) {
      const [name, alias] = raw.split(/\s+as\s+/).map((s) => s.trim());
      const target = rule?.symbols[name];
      if (target) {
        mkNames.add(target);
        renames.set(alias ?? name, target);
        add(findings, `import:primeng/${path}`, `${name} → ${target}`, 'rewrite', rule?.docs);
      } else {
        unmapped.push(raw);
        add(findings, `import:primeng/${path}`, `${name} (primeng/${path}) has no drop-in equivalent — kept`, rule ? 'manual' : 'unmapped', rule?.docs);
      }
    }
    if (unmapped.length) keep.push(`import ${isType ?? ''}{ ${unmapped.join(', ')} } from 'primeng/${path}';\n`);
    if (rule?.note && symbols.some((s) => rule.symbols[s.split(/\s+as\s+/)[0].trim()])) {
      add(findings, `note:primeng/${path}`, rule.note, 'manual', rule.docs);
    }
    return '';
  });

  if (firstImportIndex === -1) return { text: source, changed: false, findings };

  // Rename identifiers (whole words) — includes `imports: [...]` entries and injected services.
  for (const [from, to] of renames) {
    if (from === to) continue;
    text = text.replace(new RegExp(`\\b${escapeRe(from)}\\b`, 'g'), to);
  }

  // Dedupe entries inside `imports: [ ... ]` arrays (several PrimeNG symbols map to one class).
  text = text.replace(/imports:\s*\[([^\]]*)\]/g, (whole, inner: string) => {
    const seen = new Set<string>();
    const items = inner
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !seen.has(s) && seen.add(s));
    const multiline = inner.includes('\n');
    return multiline ? `imports: [\n    ${items.join(',\n    ')},\n  ]` : `imports: [${items.join(', ')}]`;
  });

  // Insert the mk-kit import where the first primeng import was, merging with an existing one.
  const header = [...(keep.length ? keep : [])];
  if (mkNames.size) {
    const existing = /import\s*\{([^}]*)\}\s*from\s*['"]@mk-kit\/ui['"];?[ \t]*\r?\n?/;
    const m = existing.exec(text);
    if (m) {
      const merged = new Set(m[1].split(',').map((s) => s.trim()).filter(Boolean));
      for (const n of mkNames) merged.add(n);
      text = text.replace(existing, `import { ${[...merged].join(', ')} } from '@mk-kit/ui';\n`);
    } else {
      header.unshift(`import { ${[...mkNames].join(', ')} } from '@mk-kit/ui';\n`);
    }
  }
  text = text.slice(0, firstImportIndex) + header.join('') + text.slice(firstImportIndex);

  // Service usage hints (MessageService / ConfirmationService bodies are not mechanical).
  if (renames.has('MessageService')) {
    text = text.replace(/(\n[ \t]*)([^\n]*\.add\(\s*\{[^\n]*severity[^\n]*)/g, '$1// mk-kit: MessageService.add({severity, summary, detail}) → toast.<severity>(detail, { title: summary })$1$2');
  }
  if (renames.has('ConfirmationService')) {
    text = text.replace(/(\n[ \t]*)([^\n]*\.confirm\(\s*\{[^\n]*)/g, '$1// mk-kit: ConfirmationService.confirm({...}) → await dialog.confirm({ title, message, tone }) returns boolean$1$2');
  }

  // Inline templates get the template pass too.
  const tpl = transformTemplate(text, true);
  text = tpl.text;
  findings.push(...tpl.findings);

  return { text, changed: text !== source, findings };
}

/* ------------------------------------------------------------------------ */
/* Templates                                                                 */
/* ------------------------------------------------------------------------ */

/** Longest selectors first so `p-inputgroupaddon` is not eaten by `p-inputgroup`. */
const ELEMENT_RULES = SELECTORS.filter((r) => r.kind === 'element').sort((a, b) => b.from.length - a.from.length);
const ATTRIBUTE_RULES = SELECTORS.filter((r) => r.kind === 'attribute').sort((a, b) => b.from.length - a.from.length);

function noteComment(rule: SelectorRule, inline: boolean): string {
  const text = `mk-kit: ${rule.from} → ${rule.to ?? 'manual'} — ${rule.note ?? ''}`.trim();
  // Inside a TS template literal `-->` is fine; keep one comment style everywhere.
  return inline ? `<!-- ${text} -->` : `<!-- ${text} -->`;
}

function renameAttrs(openTag: string, attrs: Record<string, string | null> | undefined): string {
  if (!attrs) return openTag;
  let out = openTag;
  for (const [from, to] of Object.entries(attrs)) {
    const re = new RegExp(`(\\s)${escapeRe(from)}(?=[\\s=>/])`, 'g');
    out = out.replace(re, (_m, ws: string) => (to === null ? ws.trimEnd() : `${ws}${to}`));
  }
  return out;
}

/**
 * Rewrites PrimeNG selectors in a template (an .html file, or a whole .ts file
 * when `inline` — only `<p-…` tags and known attribute tokens are touched).
 */
export function transformTemplate(source: string, inline = false): TransformResult {
  const findings: Finding[] = [];
  let text = source;

  for (const rule of ELEMENT_RULES) {
    const open = new RegExp(`<${escapeRe(rule.from)}(?=[\\s>/])`, 'g');
    const close = new RegExp(`</${escapeRe(rule.from)}\\s*>`, 'g');
    const matches = text.match(open);
    if (!matches) continue;
    const n = matches.length;
    if (rule.to) {
      // Rename open/close tags, then attributes on each opening tag.
      text = text.replace(open, `<${rule.to}`).replace(close, `</${rule.to}>`);
      if (rule.attrs) {
        const tagRe = new RegExp(`<${escapeRe(rule.to)}(\\s[^>]*)?>`, 'g');
        text = text.replace(tagRe, (tag) => renameAttrs(tag, rule.attrs));
      }
      add(findings, `element:${rule.from}`, `<${rule.from}> → <${rule.to}>`, 'rewrite', rule.docs, n);
      if (rule.manual && rule.note) {
        text = insertNote(text, `<${rule.to}`, noteComment(rule, inline));
        add(findings, `manual:${rule.from}`, rule.note, 'manual', rule.docs, n);
      }
    } else {
      text = insertNote(text, `<${rule.from}`, noteComment(rule, inline));
      add(findings, `element:${rule.from}`, rule.note ?? 'no drop-in equivalent', 'unmapped', rule.docs, n);
    }
  }

  for (const rule of ATTRIBUTE_RULES) {
    // Attribute token forms: `pButton`, `[pTooltip]="…"`, `pTooltip="…"`.
    const token = new RegExp(`(?<=[\\s\\[])${escapeRe(rule.from)}(?=[\\s=\\]>/])`, 'g');
    const matches = text.match(token);
    if (!matches) continue;
    const n = matches.length;
    if (rule.to) {
      text = text.replace(token, rule.to);
      if (rule.attrs) {
        const tagRe = new RegExp(`<[a-zA-Z][^>]*\\b${escapeRe(rule.to)}\\b[^>]*>`, 'g');
        text = text.replace(tagRe, (tag) => renameAttrs(tag, rule.attrs));
      }
      add(findings, `attr:${rule.from}`, `${rule.from} → ${rule.to}`, 'rewrite', rule.docs, n);
      if (rule.manual && rule.note) {
        text = insertNoteBeforeTagWith(text, rule.to, noteComment(rule, inline));
        add(findings, `manual:${rule.from}`, rule.note, 'manual', rule.docs, n);
      }
    } else {
      text = insertNoteBeforeTagWith(text, rule.from, noteComment(rule, inline));
      add(findings, `attr:${rule.from}`, rule.note ?? 'no drop-in equivalent', 'unmapped', rule.docs, n);
    }
  }

  return { text, changed: text !== source, findings };
}

/** Insert `note` once, right before the first occurrence of `needle` (keeps indentation). */
function insertNote(text: string, needle: string, note: string): string {
  if (text.includes(note)) return text;
  const i = text.indexOf(needle);
  if (i === -1) return text;
  const lineStart = text.lastIndexOf('\n', i) + 1;
  const indent = text.slice(lineStart, i).match(/^[ \t]*$/) ? text.slice(lineStart, i) : '';
  return indent ? text.slice(0, lineStart) + indent + note + '\n' + text.slice(lineStart) : text.slice(0, i) + note + ' ' + text.slice(i);
}

/** Insert `note` once before the first tag that carries `attr`. */
function insertNoteBeforeTagWith(text: string, attr: string, note: string): string {
  if (text.includes(note)) return text;
  const re = new RegExp(`<[a-zA-Z][^>]*(?<=[\\s\\[])${escapeRe(attr)}(?=[\\s=\\]>/])`);
  const m = re.exec(text);
  if (!m) return text;
  return insertNote(text, m[0], note);
}

/* ------------------------------------------------------------------------ */
/* Workspace files                                                           */
/* ------------------------------------------------------------------------ */

export const MK_STYLE_PATH = 'node_modules/@mk-kit/ui/styles/mk-kit.css';

/** Remove PrimeNG / primeicons / primeflex style entries from every project's `styles`; add the mk-kit theme. */
export function transformAngularJson(source: string): TransformResult {
  const findings: Finding[] = [];
  let json: any;
  try {
    json = JSON.parse(source);
  } catch {
    return { text: source, changed: false, findings };
  }
  let changed = false;
  for (const project of Object.values<any>(json.projects ?? {})) {
    const options = project?.architect?.build?.options;
    if (!options || !Array.isArray(options.styles)) continue;
    const before = options.styles.length;
    options.styles = options.styles.filter((s: unknown) => {
      const p = typeof s === 'string' ? s : (s as { input?: string })?.input ?? '';
      return !/prime(ng|icons|flex|uix)/i.test(p);
    });
    if (options.styles.length !== before) {
      changed = true;
      add(findings, 'styles:primeng', `removed ${before - options.styles.length} PrimeNG/primeicons style entries`, 'rewrite', '/theming', before - options.styles.length);
    }
    const has = options.styles.some((s: unknown) => (typeof s === 'string' ? s : (s as { input?: string })?.input ?? '').includes('@mk-kit/ui/styles'));
    if (!has) {
      options.styles.unshift(MK_STYLE_PATH);
      changed = true;
      add(findings, 'styles:mk-kit', `added ${MK_STYLE_PATH}`, 'rewrite', '/theming');
    }
  }
  return { text: changed ? JSON.stringify(json, null, 2) + '\n' : source, changed, findings };
}

/** Drop PrimeNG packages from dependencies and make sure @mk-kit/ui is present. */
export function transformPackageJson(source: string, packages: readonly string[], mkVersion = '^0.38.0'): TransformResult {
  const findings: Finding[] = [];
  let json: any;
  try {
    json = JSON.parse(source);
  } catch {
    return { text: source, changed: false, findings };
  }
  let changed = false;
  for (const field of ['dependencies', 'devDependencies']) {
    const deps = json[field];
    if (!deps) continue;
    for (const p of packages) {
      if (p in deps) {
        delete deps[p];
        changed = true;
        add(findings, 'package:remove', `removed ${p} from ${field}`, 'rewrite');
      }
    }
  }
  json.dependencies ??= {};
  if (!json.dependencies['@mk-kit/ui']) {
    json.dependencies['@mk-kit/ui'] = mkVersion;
    changed = true;
    add(findings, 'package:add', `added @mk-kit/ui ${mkVersion}`, 'rewrite');
  }
  return { text: changed ? JSON.stringify(json, null, 2) + '\n' : source, changed, findings };
}

/* ------------------------------------------------------------------------ */
/* Report                                                                    */
/* ------------------------------------------------------------------------ */

export interface FileReport {
  path: string;
  findings: Finding[];
  changed: boolean;
}

function add(findings: Finding[], rule: string, message: string, kind: Finding['kind'], docs?: string, count = 1): void {
  const existing = findings.find((f) => f.rule === rule && f.message === message);
  if (existing) existing.count += count;
  else findings.push({ rule, message, kind, docs: docsUrl(docs), count });
}

/** Markdown report of a whole run. */
export function renderReport(files: FileReport[], options: { dryRun: boolean; scanned: number }): string {
  const all = files.flatMap((f) => f.findings.map((x) => ({ ...x, file: f.path })));
  const changed = files.filter((f) => f.changed);
  const byKind = (kind: Finding['kind']) => all.filter((f) => f.kind === kind);
  const sum = (list: Finding[]) => list.reduce((n, f) => n + f.count, 0);
  const lines: string[] = [];
  lines.push('# PrimeNG → mk-kit migration report', '');
  lines.push(`${options.dryRun ? '**Dry run** — nothing was written. ' : ''}Scanned ${options.scanned} files, ${options.dryRun ? 'would change' : 'changed'} ${changed.length}.`, '');
  lines.push(`- Automatic rewrites: **${sum(byKind('rewrite'))}**`);
  lines.push(`- Needs a manual touch: **${sum(byKind('manual'))}**`);
  lines.push(`- No mk-kit equivalent: **${sum(byKind('unmapped'))}**`, '');

  lines.push('## Rewrites', '');
  const rewrites = group(byKind('rewrite'));
  lines.push(...(rewrites.length ? rewrites.map(([msg, n]) => `- ${msg} ×${n}`) : ['- (none)']), '');

  lines.push('## Manual steps', '', 'Look for `<!-- mk-kit: … -->` and `// mk-kit:` comments in the changed files.', '');
  const manual = group(byKind('manual'), true);
  lines.push(...(manual.length ? manual.map(([msg, n, docs]) => `- ${msg} ×${n}${docs ? ` — [docs](${docs})` : ''}`) : ['- (none)']), '');

  lines.push('## Not available in mk-kit', '');
  const unmapped = group(byKind('unmapped'), true);
  lines.push(...(unmapped.length ? unmapped.map(([msg, n, docs]) => `- ${msg} ×${n}${docs ? ` — closest: [docs](${docs})` : ''}`) : ['- (none)']), '');

  lines.push('## Files', '');
  lines.push(...(changed.length ? changed.map((f) => `- \`${f.path}\` — ${f.findings.map((x) => `${x.rule}×${x.count}`).join(', ')}`) : ['- (none)']), '');

  lines.push('## Next', '');
  lines.push(
    '1. Run `ng build` and fix the remaining template errors — most are the `<!-- mk-kit -->` notes above.',
    '2. Replace `MessageService.add(...)` calls with `MkToastService` and `ConfirmationService.confirm(...)` with `await MkDialogService.confirm(...)`.',
    '3. Icons: `pi pi-*` classes → `<mk-icon name="…" />` (see https://mk-kit.dev/components/icon).',
    `4. Theme: \`--mk-*\` tokens replace the PrimeNG preset — https://mk-kit.dev/theming.`,
    '',
  );
  return lines.join('\n');
}

function group(list: Array<Finding & { file?: string }>, withDocs = false): Array<[string, number, string | undefined]> {
  const map = new Map<string, [number, string | undefined]>();
  for (const f of list) {
    const key = f.message;
    const cur = map.get(key) ?? [0, f.docs];
    cur[0] += f.count;
    map.set(key, cur);
  }
  return [...map.entries()].map(([msg, [n, docs]]) => [msg, n, withDocs ? docs : undefined]);
}
