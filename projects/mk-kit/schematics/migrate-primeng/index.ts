/**
 * `ng g @mk-kit/ui:migrate-primeng`
 *
 * Walks the source tree, rewrites what maps 1:1 from PrimeNG to @mk-kit/ui
 * (imports, class names, element / attribute selectors, a few input names),
 * leaves `<!-- mk-kit: … -->` notes where a human has to finish the job,
 * cleans angular.json styles and package.json, and writes a Markdown report.
 * `--dry-run` computes everything and writes only the report to the console.
 */
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { PRIMENG_PACKAGES } from './mapping';
import type { Schema } from './schema';
import {
  FileReport,
  renderReport,
  transformAngularJson,
  transformPackageJson,
  transformTemplate,
  transformTypeScript,
} from './transform';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.angular', '.git']);

export function migratePrimeng(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const root = normalize(options.path ?? 'src');
    const dryRun = !!options.dryRun;
    const reportPath = options.report ?? 'primeng-migration.md';
    const files: FileReport[] = [];
    let scanned = 0;

    tree.getDir(root).visit((path) => {
      if (path.split('/').some((seg) => SKIP_DIRS.has(seg))) return;
      const isTs = path.endsWith('.ts') && !path.endsWith('.d.ts');
      const isHtml = path.endsWith('.html');
      if (!isTs && !isHtml) return;
      scanned++;
      const source = tree.read(path)?.toString('utf8');
      if (source === undefined || !/primeng|<p-[a-zA-Z]|\bp[A-Z][a-zA-Z]+\b/.test(source)) return;
      const result = isTs ? transformTypeScript(source) : transformTemplate(source);
      if (!result.findings.length && !result.changed) return;
      files.push({ path, findings: result.findings, changed: result.changed });
      if (result.changed && !dryRun) tree.overwrite(path, result.text);
    });

    const unmapped = files.some((f) => f.findings.some((x) => x.kind === 'unmapped'));

    for (const [path, fn] of [
      ['/angular.json', transformAngularJson] as const,
      ['/package.json', (src: string) => transformPackageJson(src, unmapped ? [] : PRIMENG_PACKAGES)] as const,
    ]) {
      if (!tree.exists(path)) continue;
      scanned++;
      const result = fn(tree.read(path)!.toString('utf8'));
      if (!result.findings.length) continue;
      files.push({ path, findings: result.findings, changed: result.changed });
      if (result.changed && !dryRun) tree.overwrite(path, result.text);
    }
    if (unmapped) {
      files.push({
        path: '/package.json',
        changed: false,
        findings: [{ rule: 'package:keep', message: 'primeng kept in package.json: some components have no mk-kit equivalent yet (see "Not available")', kind: 'manual', count: 1 }],
      });
    }

    const report = renderReport(files, { dryRun, scanned });
    if (!dryRun) {
      if (tree.exists(reportPath)) tree.overwrite(reportPath, report);
      else tree.create(reportPath, report);
    }

    const counts = { rewrite: 0, manual: 0, unmapped: 0 };
    for (const f of files) for (const x of f.findings) counts[x.kind] += x.count;
    context.logger.info(
      `migrate-primeng: ${dryRun ? 'dry run — ' : ''}${files.filter((f) => f.changed).length} file(s) ${dryRun ? 'would change' : 'changed'}; ` +
        `${counts.rewrite} rewrites, ${counts.manual} manual steps, ${counts.unmapped} without an equivalent.` +
        (dryRun ? '' : ` Report: ${reportPath}`),
    );
    if (dryRun) context.logger.info('\n' + report);
    return tree;
  };
}

function normalize(p: string): string {
  const trimmed = p.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
