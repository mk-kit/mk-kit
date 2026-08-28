#!/usr/bin/env node
/**
 * Generate the machine-readable API surface of @mk-kit/ui from the library
 * sources, and the derived artefacts that ship with the docs site:
 *
 *   projects/docs/public/api.json       every public export per entry point
 *   projects/docs/public/llms.txt       llms.txt index (https://llmstxt.org)
 *   projects/docs/public/llms-full.txt  the whole API as Markdown, for LLMs
 *
 * The extraction runs the TypeScript compiler over each entry-point barrel
 * (`projects/mk-kit/<entry>/index.ts`), so inputs/outputs, signatures and
 * JSDoc come straight from the source of truth — nothing here is hand-kept.
 *
 *   node scripts/gen-api.mjs          # write the files
 *   node scripts/gen-api.mjs --check  # exit 1 when they are stale
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const LIB = join(ROOT, 'projects/mk-kit');
const PUBLIC = join(ROOT, 'projects/docs/public');
const OUT_JSON = join(PUBLIC, 'api.json');
const OUT_LLMS = join(PUBLIC, 'llms.txt');
const OUT_FULL = join(PUBLIC, 'llms-full.txt');
const SITE = 'https://mk-kit.dev';

const pkg = JSON.parse(readFileSync(join(LIB, 'package.json'), 'utf8'));

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/** Secondary entry points in the order the root barrel re-exports them. */
const rootBarrel = readFileSync(join(LIB, 'src/public-api.ts'), 'utf8');
const ENTRIES = [...rootBarrel.matchAll(/from '@mk-kit\/ui\/([\w/-]+)'/g)].map((m) => m[1]);
for (const dir of readdirSync(LIB)) {
  if (statSync(join(LIB, dir)).isDirectory() && existsSync(join(LIB, dir, 'ng-package.json')) && !ENTRIES.includes(dir)) {
    ENTRIES.push(dir);
  }
}

// ---------------------------------------------------------------------------
// TypeScript program (paths remapped to the sources, not dist/)
// ---------------------------------------------------------------------------

const configPath = join(LIB, 'tsconfig.lib.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, LIB);
const options = {
  ...parsed.options,
  baseUrl: ROOT,
  paths: { '@mk-kit/ui': ['projects/mk-kit/src/public-api.ts'], '@mk-kit/ui/*': ['projects/mk-kit/*/index.ts'] },
  noEmit: true,
  skipLibCheck: true,
};
const rootNames = ENTRIES.map((e) => join(LIB, e, 'index.ts'));
const program = ts.createProgram(rootNames, options);
const checker = program.getTypeChecker();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LIFECYCLE = new Set([
  'ngOnInit', 'ngOnChanges', 'ngOnDestroy', 'ngAfterViewInit', 'ngAfterContentInit',
  'ngAfterViewChecked', 'ngAfterContentChecked', 'ngDoCheck',
  'writeValue', 'registerOnChange', 'registerOnTouched', 'setDisabledState',
  'registerOnValidatorChange', 'transform',
]);
const SIGNAL_WRAPPERS = new Set([
  'InputSignal', 'InputSignalWithTransform', 'ModelSignal', 'OutputEmitterRef', 'OutputRef',
  'Signal', 'WritableSignal',
]);

function docOf(symbolOrNode) {
  const symbol = symbolOrNode && 'flags' in symbolOrNode && 'escapedName' in symbolOrNode
    ? symbolOrNode
    : checker.getSymbolAtLocation(symbolOrNode?.name ?? symbolOrNode);
  if (!symbol) return { description: '', tags: [] };
  const description = ts.displayPartsToString(symbol.getDocumentationComment(checker))
    .replace(/\{@link(?:code|plain)?\s+([^}|]+?)(?:\s*\|\s*([^}]+))?\}/g, (_, target, label) => '`' + (label ?? target).trim() + '`')
    .trim();
  const tags = symbol.getJsDocTags(checker).map((t) => ({ name: t.name, text: ts.displayPartsToString(t.text ?? []).trim() }));
  return { description, tags };
}

function withTags(target, tags) {
  const dep = tags.find((t) => t.name === 'deprecated');
  if (dep) target.deprecated = dep.text || true;
  const example = tags.find((t) => t.name === 'example');
  if (example) target.example = example.text;
  return target;
}

function typeText(type, node) {
  return checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope);
}

/** Strip `InputSignal<T>` & friends down to `T`. */
function unwrapSignal(type, node) {
  const sym = type.aliasSymbol ?? type.getSymbol();
  if (sym && SIGNAL_WRAPPERS.has(sym.name)) {
    const args = type.aliasSymbol ? type.aliasTypeArguments : checker.getTypeArguments(type);
    if (args?.length) return typeText(args[0], node);
  }
  return typeText(type, node);
}

function isPublic(member) {
  const mods = ts.getCombinedModifierFlags(member);
  if (mods & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) return false;
  if (member.name && ts.isPrivateIdentifier(member.name)) return false;
  return true;
}

function callName(expr) {
  if (!expr || !ts.isCallExpression(expr)) return null;
  const callee = expr.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
    return `${callee.expression.text}.${callee.name.text}`;
  }
  return null;
}

function literalText(node) {
  if (!node) return undefined;
  const text = node.getText().replace(/\s+/g, ' ');
  return text.length > 80 ? text.slice(0, 77) + '…' : text;
}

function decoratorInfo(node) {
  for (const d of ts.getDecorators(node) ?? []) {
    if (!ts.isCallExpression(d.expression) || !ts.isIdentifier(d.expression.expression)) continue;
    const name = d.expression.expression.text;
    const arg = d.expression.arguments[0];
    const meta = {};
    if (arg && ts.isObjectLiteralExpression(arg)) {
      for (const p of arg.properties) {
        if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name)) continue;
        if (ts.isStringLiteralLike(p.initializer)) meta[p.name.text] = p.initializer.text;
        else if (p.initializer.kind === ts.SyntaxKind.TrueKeyword) meta[p.name.text] = true;
        else if (p.initializer.kind === ts.SyntaxKind.FalseKeyword) meta[p.name.text] = false;
      }
    }
    return { name, meta };
  }
  return null;
}

function selectorTokens(selector) {
  const out = [];
  for (const part of selector.split(',')) {
    const p = part.trim();
    const tag = /^([a-z][\w-]*)/.exec(p);
    if (tag && tag[1].startsWith('mk-')) out.push(tag[1]);
    for (const attr of p.matchAll(/\[(\w+)\]/g)) if (attr[1].startsWith('mk')) out.push(attr[1]);
  }
  return [...new Set(out)];
}

function classMembers(node) {
  const inputs = [];
  const outputs = [];
  const methods = [];
  const properties = [];
  const queries = [];

  for (const m of node.members) {
    if (!isPublic(m) || !m.name) continue;
    if (ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static) continue;
    const name = m.name.getText();
    if (name.startsWith('_')) continue;
    const { description, tags } = docOf(m);
    const internal = tags.some((t) => t.name === 'internal');
    if (internal) continue;

    if (ts.isPropertyDeclaration(m)) {
      const call = callName(m.initializer);
      const type = checker.getTypeAtLocation(m.name);
      const decorator = decoratorInfo(m);
      const decoName = decorator?.name;

      if (call === 'input' || call === 'input.required' || decoName === 'Input') {
        const required = call === 'input.required' || (decorator?.meta.required === true);
        const args = m.initializer?.arguments ?? [];
        const optionsArg = call === 'input.required' ? args[0] : args[1];
        let transform;
        let alias;
        if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
          for (const p of optionsArg.properties) {
            if (!ts.isPropertyAssignment(p)) continue;
            if (p.name.getText() === 'transform') transform = p.initializer.getText();
            if (p.name.getText() === 'alias' && ts.isStringLiteralLike(p.initializer)) alias = p.initializer.text;
          }
        }
        const entry = withTags({
          name: alias ?? name,
          type: unwrapSignal(type, m),
          description,
        }, tags);
        if (required) entry.required = true;
        const def = call === 'input' ? literalText(args[0]) : decoName === 'Input' ? literalText(m.initializer) : undefined;
        if (def !== undefined) entry.default = def;
        if (transform === 'booleanAttribute') entry.type = 'boolean';
        else if (transform === 'numberAttribute') entry.type = 'number';
        else if (transform) entry.transform = transform;
        inputs.push(entry);
        continue;
      }
      if (call === 'model' || call === 'model.required') {
        const args = m.initializer.arguments;
        const entry = withTags({ name, type: unwrapSignal(type, m), description, model: true }, tags);
        if (call === 'model.required') entry.required = true;
        else if (args[0]) entry.default = literalText(args[0]);
        inputs.push(entry);
        outputs.push({ name: `${name}Change`, type: entry.type, description: `Emits when \`${name}\` changes (two-way binding).`, model: true });
        continue;
      }
      if (call === 'output' || call === 'outputFromObservable' || decoName === 'Output') {
        outputs.push(withTags({ name, type: unwrapSignal(type, m), description }, tags));
        continue;
      }
      if (call && /^(contentChild|contentChildren|viewChild|viewChildren)(\.required)?$/.test(call)) {
        queries.push({ name, kind: call.replace('.required', ''), type: unwrapSignal(type, m), description });
        continue;
      }
      if (decoName && /^(ContentChild|ContentChildren|ViewChild|ViewChildren)$/.test(decoName)) {
        queries.push({ name, kind: decoName[0].toLowerCase() + decoName.slice(1), type: typeText(type, m), description });
        continue;
      }
      if (decoName === 'HostBinding' || decoName === 'HostListener') continue;
      properties.push(withTags({
        name,
        type: typeText(type, m),
        description,
        readonly: !!(ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Readonly),
      }, tags));
      continue;
    }

    if (ts.isMethodDeclaration(m)) {
      if (LIFECYCLE.has(name)) continue;
      const decorator = decoratorInfo(m);
      if (decorator?.name === 'HostListener') continue;
      const sig = checker.getSignatureFromDeclaration(m);
      if (!sig) continue;
      methods.push(withTags({
        name,
        signature: checker.signatureToString(sig, m, ts.TypeFormatFlags.NoTruncation),
        description,
      }, tags));
      continue;
    }

    if (ts.isGetAccessor(m)) {
      const type = checker.getTypeAtLocation(m.name);
      properties.push(withTags({ name, type: typeText(type, m), description, readonly: true }, tags));
    }
  }
  return { inputs, outputs, methods, properties, queries };
}

function interfaceMembers(node) {
  const members = [];
  for (const m of node.members) {
    if (!m.name) continue;
    const name = m.name.getText();
    const { description, tags } = docOf(m);
    const type = checker.getTypeAtLocation(m);
    const entry = withTags({
      name,
      type: ts.isMethodSignature(m)
        ? checker.signatureToString(checker.getSignatureFromDeclaration(m), m, ts.TypeFormatFlags.NoTruncation)
        : typeText(type, m),
      description,
    }, tags);
    if (m.questionToken) entry.optional = true;
    if (ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Readonly) entry.readonly = true;
    members.push(entry);
  }
  return members;
}

function relFile(node) {
  return relative(ROOT, node.getSourceFile().fileName);
}

function typeParams(node) {
  return node.typeParameters?.length ? `<${node.typeParameters.map((p) => p.getText()).join(', ')}>` : '';
}

function describeExport(name, symbol) {
  const decl = symbol.declarations?.[0];
  if (!decl) return null;
  const { description, tags } = docOf(symbol);
  if (tags.some((t) => t.name === 'internal')) return null;
  const base = withTags({ name, description, file: relFile(decl) }, tags);

  if (ts.isClassDeclaration(decl)) {
    const decorator = decoratorInfo(decl);
    const members = classMembers(decl);
    const heritage = decl.heritageClauses?.flatMap((h) => h.types.map((t) => t.getText())) ?? [];
    const implementsCva = heritage.includes('ControlValueAccessor') ||
      decl.members.some((m) => ts.isMethodDeclaration(m) && m.name?.getText() === 'writeValue');
    if (decorator?.name === 'Component' || decorator?.name === 'Directive') {
      const selector = decorator.meta.selector ?? '';
      return {
        ...base,
        kind: decorator.name === 'Component' ? 'component' : 'directive',
        selector,
        selectors: selectorTokens(selector),
        exportAs: decorator.meta.exportAs,
        formControl: implementsCva || undefined,
        ...members,
        // Undocumented public fields on components are template plumbing.
        properties: members.properties.filter((p) => p.description),
      };
    }
    if (decorator?.name === 'Pipe') {
      const transform = decl.members.find((m) => ts.isMethodDeclaration(m) && m.name?.getText() === 'transform');
      const sig = transform && checker.getSignatureFromDeclaration(transform);
      return { ...base, kind: 'pipe', pipeName: decorator.meta.name, signature: sig ? checker.signatureToString(sig, transform, ts.TypeFormatFlags.NoTruncation) : undefined };
    }
    if (decorator?.name === 'Injectable') {
      return { ...base, kind: 'service', providedIn: decorator.meta.providedIn, methods: members.methods, properties: members.properties };
    }
    return { ...base, kind: 'class', typeParams: typeParams(decl) || undefined, methods: members.methods, properties: members.properties };
  }
  if (ts.isInterfaceDeclaration(decl)) {
    const ext = decl.heritageClauses?.flatMap((h) => h.types.map((t) => t.getText()));
    return { ...base, kind: 'interface', typeParams: typeParams(decl) || undefined, extends: ext?.length ? ext : undefined, members: interfaceMembers(decl) };
  }
  if (ts.isTypeAliasDeclaration(decl)) {
    const text = decl.type.getText().replace(/\s+/g, ' ');
    return { ...base, kind: 'type', typeParams: typeParams(decl) || undefined, definition: text.length > 600 ? text.slice(0, 597) + '…' : text };
  }
  if (ts.isEnumDeclaration(decl)) {
    return { ...base, kind: 'enum', members: decl.members.map((m) => ({ name: m.name.getText(), value: m.initializer?.getText(), description: docOf(m).description })) };
  }
  if (ts.isFunctionDeclaration(decl)) {
    const signatures = symbol.declarations
      .filter((d) => ts.isFunctionDeclaration(d) && d.body === undefined || symbol.declarations.length === 1)
      .map((d) => checker.signatureToString(checker.getSignatureFromDeclaration(d), d, ts.TypeFormatFlags.NoTruncation));
    return { ...base, kind: 'function', signatures: signatures.length ? signatures : [checker.signatureToString(checker.getSignatureFromDeclaration(decl), decl, ts.TypeFormatFlags.NoTruncation)] };
  }
  if (ts.isVariableDeclaration(decl)) {
    const type = checker.getTypeAtLocation(decl.name);
    const text = typeText(type, decl);
    const sym = type.getSymbol();
    if (sym?.name === 'InjectionToken') return { ...base, kind: 'token', type: text };
    if (type.getCallSignatures().length && !ts.isObjectLiteralExpression(decl.initializer ?? decl)) {
      return { ...base, kind: 'function', signatures: type.getCallSignatures().map((s) => checker.signatureToString(s, decl, ts.TypeFormatFlags.NoTruncation)) };
    }
    return { ...base, kind: 'const', type: text.length > 400 ? text.slice(0, 397) + '…' : text };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Walk every entry point
// ---------------------------------------------------------------------------

const entries = [];
for (const entry of ENTRIES) {
  const file = program.getSourceFile(join(LIB, entry, 'index.ts'));
  const moduleSymbol = checker.getSymbolAtLocation(file);
  const exportsList = checker.getExportsOfModule(moduleSymbol);
  const items = [];
  for (const exp of exportsList) {
    const symbol = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
    const described = describeExport(exp.name, symbol);
    if (described) items.push(described);
  }
  const order = { component: 0, directive: 1, pipe: 2, service: 3, class: 4, function: 5, token: 6, const: 7, interface: 8, type: 9, enum: 10 };
  items.sort((a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name));
  entries.push({ name: entry, import: `@mk-kit/ui/${entry}`, exports: items });
}

// Docs page per public name, taken from the components index page.
const indexSrc = readFileSync(join(ROOT, 'projects/docs/src/app/pages/components-index/components-index-page.ts'), 'utf8');
const docsPages = new Map();
for (const m of indexSrc.matchAll(/\{\s*name:\s*'([^']+)',\s*desc:\s*'(?:[^'\\]|\\.)*',\s*path:\s*'([^']+)'(?:,\s*fragment:\s*'([^']+)')?/g)) {
  const path = m[3] ? `${m[2]}#${m[3]}` : m[2];
  for (const part of m[1].split('/')) docsPages.set(part.trim(), path);
}
const routesSrc = readFileSync(join(ROOT, 'projects/docs/src/app/app.routes.ts'), 'utf8');
const routeTitles = new Map();
for (const m of routesSrc.matchAll(/path:\s*'([^']*)',\s*title:\s*'([^']+?)(?: — mk-kit)?'/g)) routeTitles.set('/' + m[1], m[2]);

for (const e of entries) {
  for (const x of e.exports) {
    const keys = [x.name, ...(x.selectors ?? [])];
    const page = keys.map((k) => docsPages.get(k)).find(Boolean);
    if (page) x.docs = page;
  }
}

const api = {
  package: pkg.name,
  version: pkg.version,
  site: SITE,
  entries,
};

// ---------------------------------------------------------------------------
// llms.txt + llms-full.txt
// ---------------------------------------------------------------------------

const GUIDE_PAGES = ['/introduction', '/getting-started', '/accessibility', '/cost', '/theming', '/core-services', '/touch', '/migration', '/blog', '/components-index', '/changelog'];
const componentPages = [...routeTitles.entries()].filter(([p]) => p.startsWith('/components/') || p.startsWith('/examples/'));

const counts = entries.flatMap((e) => e.exports).reduce((acc, x) => ((acc[x.kind] = (acc[x.kind] ?? 0) + 1), acc), {});

const llms = `# mk-kit

> ${pkg.description ?? 'Angular component library'} — \`${pkg.name}\` ${pkg.version}. ${counts.component} components, ${counts.directive} directives, ${counts.service} services and ${counts.function} helper functions across ${entries.length} tree-shakeable entry points. MIT licensed, zero runtime dependencies beyond Angular. Standalone components, signals, OnPush, zoneless-ready, SSR-safe, RTL and i18n via \`provideMkI18n\`.

Install with \`ng add ${pkg.name}\` (or \`npm i ${pkg.name}\` + import \`${pkg.name}/styles/mk-kit.css\`). Import from the group entry points (\`${pkg.name}/forms\`, \`${pkg.name}/table\`, …) so each lazy chunk only carries what it uses; the root \`${pkg.name}\` entry re-exports everything. Every component is standalone: add the class to a component's \`imports\`. Theme with \`--mk-*\` CSS custom properties; \`MkThemeService\` switches light/dark/system and density.

## Docs

${GUIDE_PAGES.filter((p) => routeTitles.has(p)).map((p) => `- [${routeTitles.get(p)}](${SITE}${p})`).join('\n')}

## Component pages

${componentPages.map(([p, t]) => `- [${t}](${SITE}${p})`).join('\n')}

## API reference

- [API reference (browsable)](${SITE}/api)
- [api.json](${SITE}/api.json): every export with inputs, outputs, methods and types, machine-readable
- [llms-full.txt](${SITE}/llms-full.txt): the complete API reference as Markdown in one file

## For AI assistants

- MCP server: \`npx -y @mk-kit/mcp\` (tools: search_mk_kit, get_mk_kit_export, list_mk_kit_exports, get_mk_kit_overview) — https://www.npmjs.com/package/@mk-kit/mcp

## Source

- [GitHub](https://github.com/mk-kit/mk-kit)
- [npm](https://www.npmjs.com/package/${pkg.name})
- [Changelog](https://github.com/mk-kit/mk-kit/blob/main/CHANGELOG.md)
`;

function md(s) {
  return (s ?? '').replace(/\r/g, '').trim();
}
function code(s) {
  return '`' + String(s).replace(/`/g, '\\`') + '`';
}
function table(rows, cols) {
  const esc = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [
    `| ${cols.map((c) => c.label).join(' | ')} |`,
    `| ${cols.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${cols.map((c) => esc(c.get(r))).join(' | ')} |`),
  ].join('\n');
}

function renderExport(x, entryImport) {
  const out = [];
  const head = x.kind === 'component' || x.kind === 'directive' ? `${x.name} (${x.kind})` : `${x.name} (${x.kind})`;
  out.push(`### ${head}`);
  if (x.deprecated) out.push(`**Deprecated.** ${typeof x.deprecated === 'string' ? x.deprecated : ''}`.trim());
  if (x.selector) out.push(`Selector: ${code(x.selector)}${x.exportAs ? ` · exportAs: ${code(x.exportAs)}` : ''}${x.formControl ? ' · form control (ControlValueAccessor)' : ''}`);
  if (x.pipeName) out.push(`Pipe name: ${code(x.pipeName)}${x.signature ? ` · ${code('transform' + x.signature)}` : ''}`);
  if (x.docs) out.push(`Docs: ${SITE}${x.docs}`);
  out.push(`Import: ${code(`import { ${x.name} } from '${entryImport}';`)}`);
  if (x.description) out.push(md(x.description));
  if (x.example) out.push(md(x.example));
  const col = (label, get) => ({ label, get });
  if (x.inputs?.length) {
    out.push('Inputs:');
    out.push(table(x.inputs, [
      col('Name', (i) => `${code(i.name)}${i.required ? ' (required)' : ''}${i.model ? ' (two-way)' : ''}`),
      col('Type', (i) => code(i.type)),
      col('Default', (i) => (i.default !== undefined ? code(i.default) : '')),
      col('Description', (i) => i.description),
    ]));
  }
  if (x.outputs?.length) {
    out.push('Outputs:');
    out.push(table(x.outputs, [col('Name', (o) => code(o.name)), col('Type', (o) => code(o.type)), col('Description', (o) => o.description)]));
  }
  if (x.methods?.length) {
    out.push('Methods:');
    out.push(table(x.methods, [col('Signature', (m) => code(m.name + m.signature)), col('Description', (m) => m.description)]));
  }
  if (x.properties?.length) {
    out.push('Properties:');
    out.push(table(x.properties, [col('Name', (p) => code(p.name)), col('Type', (p) => code(p.type)), col('Description', (p) => p.description)]));
  }
  if (x.kind === 'interface' && x.members?.length) {
    out.push(`Members${x.extends ? ` (extends ${x.extends.map(code).join(', ')})` : ''}:`);
    out.push(table(x.members, [col('Name', (p) => `${code(p.name)}${p.optional ? '?' : ''}`), col('Type', (p) => code(p.type)), col('Description', (p) => p.description)]));
  }
  if (x.kind === 'enum' && x.members?.length) {
    out.push(table(x.members, [col('Member', (p) => code(p.name)), col('Value', (p) => (p.value ? code(p.value) : '')), col('Description', (p) => p.description)]));
  }
  if (x.kind === 'type') out.push('```ts\n' + `type ${x.name}${x.typeParams ?? ''} = ${x.definition};` + '\n```');
  if (x.kind === 'function') out.push('```ts\n' + x.signatures.map((s) => `function ${x.name}${s}`).join('\n') + '\n```');
  if (x.kind === 'token' || x.kind === 'const') out.push('```ts\n' + `const ${x.name}: ${x.type};` + '\n```');
  return out.join('\n\n');
}

const full = [
  `# ${pkg.name} ${pkg.version} — full API reference`,
  '',
  `Generated from the library sources. Browsable version: ${SITE}/api · JSON: ${SITE}/api.json · Guides: ${SITE}/llms.txt`,
  '',
  '## Usage',
  '',
  '```bash',
  `ng add ${pkg.name}`,
  '```',
  '',
  'Every component and directive below is standalone — import the class from its entry point and list it in `imports`. Attribute selectors like `button[mkButton]` enhance native elements; element selectors render their own template. Inputs marked two-way are `model()` signals and accept `[(name)]`. Inputs are signal inputs: read them as `comp.name()` in TypeScript.',
  '',
  ...entries.flatMap((e) => [
    `## ${e.import}`,
    '',
    `${e.exports.length} exports. ${code(`import { … } from '${e.import}';`)}`,
    '',
    ...e.exports.map((x) => renderExport(x, e.import) + '\n'),
  ]),
].join('\n');

const outputs = [
  [OUT_JSON, JSON.stringify(api, null, 1) + '\n'],
  [OUT_LLMS, llms],
  [OUT_FULL, full],
];

const total = entries.reduce((n, e) => n + e.exports.length, 0);
if (process.argv.includes('--check')) {
  let stale = false;
  for (const [file, content] of outputs) {
    const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (current !== content) {
      console.error(`${relative(ROOT, file)} is stale — run: node scripts/gen-api.mjs`);
      stale = true;
    }
  }
  if (stale) process.exit(1);
  console.log(`API artefacts are up to date (${total} exports across ${entries.length} entry points).`);
} else {
  for (const [file, content] of outputs) writeFileSync(file, content);
  console.log(`wrote api.json, llms.txt, llms-full.txt (${total} exports across ${entries.length} entry points).`);
  console.log(Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', '));
}
