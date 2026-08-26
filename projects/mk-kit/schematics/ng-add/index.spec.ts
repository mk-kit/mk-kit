import { logging } from '@angular-devkit/core';
import { callRule, HostTree, SchematicContext, Tree } from '@angular-devkit/schematics';
import { lastValueFrom } from 'rxjs';

import { ngAdd } from './index';

const THEME_STYLE_PATH = 'node_modules/@mk-kit/ui/styles/mk-kit.css';

const STANDARD_APP_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter([])],
};
`;

const STANDARD_MAIN = `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
`;

function workspaceJson(styles: unknown[] = ['src/styles.css']): string {
  return JSON.stringify({
    version: 1,
    projects: {
      app: {
        projectType: 'application',
        root: '',
        sourceRoot: 'src',
        architect: {
          build: {
            builder: '@angular/build:application',
            options: {
              browser: 'src/main.ts',
              styles,
            },
          },
        },
      },
    },
  });
}

function createTree({ styles, mainTs }: { styles?: unknown[]; mainTs?: string } = {}): Tree {
  const tree = new HostTree();
  tree.create('/angular.json', workspaceJson(styles));
  tree.create('/package.json', JSON.stringify({ name: 'app', version: '0.0.0' }));
  tree.create('/src/main.ts', mainTs ?? STANDARD_MAIN);
  tree.create('/src/app/app.config.ts', STANDARD_APP_CONFIG);
  return tree;
}

async function runNgAdd(tree: Tree, options: { project?: string; i18n?: boolean } = {}) {
  // The ng-add rules only touch the tree and the logger, so a minimal context
  // (no engine) keeps the smoke test fully in-memory.
  const logs: string[] = [];
  const logger = new logging.Logger('test');
  logger.subscribe((entry) => logs.push(`${entry.level}: ${entry.message}`));
  const context = { logger } as unknown as SchematicContext;

  const result = await lastValueFrom(callRule(ngAdd(options), tree, context));
  return { tree: result, logs };
}

function readStyles(tree: Tree): unknown[] {
  const workspace = JSON.parse(tree.read('/angular.json')!.toString());
  return workspace.projects['app'].architect.build.options.styles;
}

describe('ng-add schematic', () => {
  it('prepends the theme stylesheet to the build styles', async () => {
    const { tree } = await runNgAdd(createTree(), { project: 'app' });

    expect(readStyles(tree)).toEqual([THEME_STYLE_PATH, 'src/styles.css']);
  });

  it('resolves the first application project when none is given', async () => {
    const { tree } = await runNgAdd(createTree());

    expect(readStyles(tree)).toEqual([THEME_STYLE_PATH, 'src/styles.css']);
  });

  it('does not duplicate an existing theme entry', async () => {
    const { tree } = await runNgAdd(createTree({ styles: [THEME_STYLE_PATH, 'src/styles.css'] }), {
      project: 'app',
    });

    expect(readStyles(tree)).toEqual([THEME_STYLE_PATH, 'src/styles.css']);
  });

  it('rejects an unknown project name', async () => {
    await expect(runNgAdd(createTree(), { project: 'nope' })).rejects.toThrow(
      /Project "nope" was not found/,
    );
  });

  it('leaves app.config.ts untouched without the i18n option', async () => {
    const { tree } = await runNgAdd(createTree(), { project: 'app' });

    expect(tree.read('/src/app/app.config.ts')!.toString()).toBe(STANDARD_APP_CONFIG);
  });

  it('inserts provideMkI18n({}) into app.config.ts when i18n is enabled', async () => {
    const { tree } = await runNgAdd(createTree(), { project: 'app', i18n: true });

    const appConfig = tree.read('/src/app/app.config.ts')!.toString();
    expect(appConfig).toContain(`import { provideMkI18n } from '@mk-kit/ui/core';`);
    expect(appConfig).toContain('provideMkI18n({})');
    expect(readStyles(tree)).toEqual([THEME_STYLE_PATH, 'src/styles.css']);
  });

  it('warns instead of failing when the app is not a standard standalone app', async () => {
    const tree = createTree({ mainTs: `console.log('no bootstrapApplication here');\n` });
    const { tree: result, logs } = await runNgAdd(tree, { project: 'app', i18n: true });

    expect(readStyles(result)).toEqual([THEME_STYLE_PATH, 'src/styles.css']);
    expect(result.read('/src/app/app.config.ts')!.toString()).toBe(STANDARD_APP_CONFIG);
    expect(logs.some((l) => l.includes('Could not set up provideMkI18n'))).toBe(true);
  });
});
