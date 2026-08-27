import { logging } from '@angular-devkit/core';
import { callRule, HostTree, SchematicContext, Tree } from '@angular-devkit/schematics';
import { lastValueFrom } from 'rxjs';

import { migratePrimeng } from './index';
import { renderReport, transformAngularJson, transformPackageJson, transformTemplate, transformTypeScript } from './transform';

const COMPONENT_TS = `import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService, MenuItem } from 'primeng/api';

@Component({
  selector: 'app-users',
  imports: [ButtonModule, InputTextModule, TableModule, ToastModule],
  providers: [MessageService],
  template: \`
    <p-toast />
    <input pInputText [(ngModel)]="q" />
    <button pButton label="Save" severity="danger" (click)="save()"></button>
    <p-table [value]="rows" [rowHover]="true">
      <ng-template pTemplate="body" let-row><tr><td>{{ row.name }}</td></tr></ng-template>
    </p-table>
  \`,
})
export class UsersComponent {
  items: MenuItem[] = [];
  constructor(private messages: MessageService) {}
  save() {
    this.messages.add({ severity: 'success', summary: 'Saved', detail: 'User saved' });
  }
}
`;

const TEMPLATE_HTML = `<p-checkbox [(ngModel)]="agree" [binary]="true" label="I agree" />
<p-toggleswitch [(ngModel)]="dark" />
<p-select [options]="roles" optionLabel="name" [(ngModel)]="role"></p-select>
<p-tabView [(activeIndex)]="tab">
  <p-tabPanel header="One">1</p-tabPanel>
</p-tabView>
<span pTooltip="Hint" tooltipPosition="top">?</span>
<p-dialog [(visible)]="open" header="Edit">…</p-dialog>
<p-inputgroup><p-inputgroupaddon>$</p-inputgroupaddon><input pInputText /></p-inputgroup>
<p-chart type="line" [data]="data" />
`;

describe('migrate-primeng transforms', () => {
  it('rewrites primeng imports to @mk-kit/ui, renames identifiers and dedupes imports arrays', () => {
    const { text, findings } = transformTypeScript(COMPONENT_TS);
    expect(text).toContain("import { MkButton, MkInput, MkTable, MkToastService } from '@mk-kit/ui';");
    expect(text).toContain("import { MenuItem } from 'primeng/api';");
    expect(text).toContain("import { ToastModule } from 'primeng/toast';"); // unmapped → kept
    expect(text).not.toMatch(/from 'primeng\/(button|inputtext|table)'/);
    expect(text).toContain('imports: [MkButton, MkInput, MkTable, ToastModule]');
    expect(text).toContain('providers: [MkToastService]');
    expect(text).toContain('private messages: MkToastService');
    expect(text).toContain('// mk-kit: MessageService.add(');
    // Inline template got the template pass.
    expect(text).toContain('<input mkInput');
    expect(text).toContain('<button mkButton label="Save" tone="danger"');
    expect(text).toContain('<mk-table [data]="rows" [hover]="true">');
    expect(text).toContain('<!-- mk-kit: p-toast → manual');
    expect(text).toContain('<p-toast />'); // left in place
    const kinds = Object.fromEntries(findings.map((f) => [f.rule, f.kind]));
    expect(kinds['import:primeng/button']).toBe('rewrite');
    expect(kinds['element:p-toast']).toBe('unmapped');
    expect(kinds['element:p-table']).toBe('rewrite');
    expect(kinds['manual:p-table']).toBe('manual');
  });

  it('rewrites 1:1 selectors in .html, renames known inputs and annotates the rest', () => {
    const { text, findings } = transformTemplate(TEMPLATE_HTML);
    expect(text).toContain('<mk-checkbox [(ngModel)]="agree" [binary]="true" label="I agree" />');
    expect(text).toContain('<mk-switch [(ngModel)]="dark" />');
    expect(text).toContain('<mk-select [options]="roles" optionLabel="name" [(ngModel)]="role"></mk-select>');
    expect(text).toContain('<mk-tabs [(selectedIndex)]="tab">');
    expect(text).toContain('<mk-tab label="One">1</mk-tab>');
    expect(text).toContain('</mk-tabs>');
    expect(text).toContain('<span mkTooltip="Hint" mkTooltipPlacement="top">?</span>');
    expect(text).toContain('<mk-input-group>');
    expect(text).toContain('<p-inputgroupaddon>$</p-inputgroupaddon><input mkInput /></mk-input-group>');
    expect(text).toContain('<!-- mk-kit: p-inputgroupaddon → manual');
    expect(text).toContain('<input mkInput />');
    // Non 1:1: original kept + one note.
    expect(text).toContain('<p-dialog [(visible)]="open" header="Edit">…</p-dialog>');
    expect(text.match(/<!-- mk-kit: p-dialog/g)?.length).toBe(1);
    expect(text).toContain('<!-- mk-kit: p-chart → manual');
    expect(text).toContain('<p-chart type="line" [data]="data" />');
    const byRule = Object.fromEntries(findings.map((f) => [f.rule, f]));
    expect(byRule['element:p-select'].kind).toBe('rewrite');
    expect(byRule['manual:p-select'].kind).toBe('manual');
    expect(byRule['element:p-dialog'].kind).toBe('unmapped');
    expect(byRule['element:p-inputgroupaddon'].kind).toBe('unmapped');
    expect(byRule['element:p-inputgroup'].count).toBe(1);
  });

  it('is idempotent on already migrated templates', () => {
    const once = transformTemplate(TEMPLATE_HTML).text;
    const twice = transformTemplate(once);
    expect(twice.text).toBe(once);
  });

  it('cleans angular.json styles and package.json dependencies', () => {
    const ng = transformAngularJson(
      JSON.stringify({
        projects: {
          app: { architect: { build: { options: { styles: ['node_modules/primeicons/primeicons.css', { input: 'node_modules/primeng/resources/themes/lara/theme.css' }, 'src/styles.css'] } } } },
        },
      }),
    );
    const styles = JSON.parse(ng.text).projects.app.architect.build.options.styles;
    expect(styles).toEqual(['node_modules/@mk-kit/ui/styles/mk-kit.css', 'src/styles.css']);
    expect(ng.findings.map((f) => f.rule)).toEqual(['styles:primeng', 'styles:mk-kit']);

    const pkg = transformPackageJson(JSON.stringify({ dependencies: { primeng: '^19', primeicons: '^7', '@angular/core': '^22' } }), ['primeng', 'primeicons']);
    const deps = JSON.parse(pkg.text).dependencies;
    expect(deps.primeng).toBeUndefined();
    expect(deps.primeicons).toBeUndefined();
    expect(deps['@mk-kit/ui']).toMatch(/^\^/);
  });

  it('renders a report with counts, manual steps, docs links and files', () => {
    const ts = transformTypeScript(COMPONENT_TS);
    const md = renderReport([{ path: '/src/app/users.ts', findings: ts.findings, changed: true }], { dryRun: true, scanned: 3 });
    expect(md).toContain('**Dry run**');
    expect(md).toContain('Scanned 3 files, would change 1.');
    expect(md).toMatch(/Automatic rewrites: \*\*\d+\*\*/);
    expect(md).toContain('## Manual steps');
    expect(md).toContain('https://mk-kit.dev/components/table');
    expect(md).toContain('## Not available in mk-kit');
    expect(md).toContain('p-toast');
    expect(md).toContain('- `/src/app/users.ts`');
  });
});

describe('migrate-primeng schematic', () => {
  function createTree(): Tree {
    const tree = new HostTree();
    tree.create('/angular.json', JSON.stringify({ projects: { app: { architect: { build: { options: { styles: ['node_modules/primeicons/primeicons.css', 'src/styles.css'] } } } } } }));
    tree.create('/package.json', JSON.stringify({ dependencies: { primeng: '^19', primeicons: '^7' } }));
    tree.create('/src/app/users.ts', COMPONENT_TS);
    tree.create('/src/app/form.html', TEMPLATE_HTML);
    tree.create('/src/app/plain.ts', "export const x = 1;\n");
    tree.create('/node_modules/primeng/index.ts', "export const Table = 1;\n");
    return tree;
  }

  async function run(tree: Tree, options: { path?: string; dryRun?: boolean; report?: string } = {}) {
    const logs: string[] = [];
    const logger = new logging.Logger('test');
    logger.subscribe((entry) => logs.push(entry.message));
    const context = { logger } as unknown as SchematicContext;
    await lastValueFrom(callRule(migratePrimeng(options), tree, context));
    return logs;
  }

  it('migrates the tree, writes the report and keeps primeng while unmapped components remain', async () => {
    const tree = createTree();
    const logs = await run(tree);
    expect(tree.readText('/src/app/users.ts')).toContain("from '@mk-kit/ui'");
    expect(tree.readText('/src/app/form.html')).toContain('<mk-switch');
    expect(tree.readText('/src/app/plain.ts')).toBe("export const x = 1;\n");
    expect(tree.readText('/node_modules/primeng/index.ts')).toBe("export const Table = 1;\n");
    expect(tree.exists('/primeng-migration.md')).toBe(true);
    const report = tree.readText('/primeng-migration.md');
    expect(report).toContain('# PrimeNG → mk-kit migration report');
    expect(report).toContain('primeng kept in package.json');
    expect(JSON.parse(tree.readText('/package.json')).dependencies.primeng).toBe('^19'); // p-toast / p-dialog / p-chart are unmapped
    expect(JSON.parse(tree.readText('/angular.json')).projects.app.architect.build.options.styles[0]).toBe('node_modules/@mk-kit/ui/styles/mk-kit.css');
    expect(logs.join('\n')).toMatch(/4 file\(s\) changed/); // users.ts, form.html, angular.json, package.json
  });

  it('removes primeng from package.json when everything mapped', async () => {
    const tree = new HostTree();
    tree.create('/package.json', JSON.stringify({ dependencies: { primeng: '^19' } }));
    tree.create('/src/a.html', '<p-toggleswitch [(ngModel)]="x" />\n');
    await run(tree);
    expect(JSON.parse(tree.readText('/package.json')).dependencies.primeng).toBeUndefined();
    expect(JSON.parse(tree.readText('/package.json')).dependencies['@mk-kit/ui']).toBeDefined();
  });

  it('dry-run touches nothing and prints the report', async () => {
    const tree = createTree();
    const logs = await run(tree, { dryRun: true });
    expect(tree.readText('/src/app/users.ts')).toBe(COMPONENT_TS);
    expect(tree.readText('/src/app/form.html')).toBe(TEMPLATE_HTML);
    expect(tree.exists('/primeng-migration.md')).toBe(false);
    expect(JSON.parse(tree.readText('/angular.json')).projects.app.architect.build.options.styles[0]).toBe('node_modules/primeicons/primeicons.css');
    expect(logs.join('\n')).toContain('# PrimeNG → mk-kit migration report');
    expect(logs.join('\n')).toContain('dry run');
  });

  it('honours --path and --report', async () => {
    const tree = createTree();
    tree.create('/other/x.html', '<p-toggleswitch />');
    await run(tree, { path: 'other', report: 'docs/report.md' });
    expect(tree.readText('/other/x.html')).toBe('<mk-switch />');
    expect(tree.readText('/src/app/form.html')).toBe(TEMPLATE_HTML);
    expect(tree.exists('/docs/report.md')).toBe(true);
  });
});
