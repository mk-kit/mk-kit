/**
 * `ng add @mk-kit/ui`
 *
 * - Adds the packaged theme stylesheet to the target application's `styles`
 *   in angular.json (physical path — exports maps don't apply there).
 * - Optionally (`--i18n`) inserts a `provideMkI18n({})` override block into
 *   the application config via the CLI's standalone-app AST helpers.
 * - Prints a short getting-started note.
 */
import {
  callRule,
  chain,
  noop,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { addRootProvider, readWorkspace, updateWorkspace } from '@schematics/angular/utility';
import { lastValueFrom } from 'rxjs';

import type { Schema } from './schema';

/**
 * Physical path of the compiled theme inside the published package. The
 * package.json exports map aliases it as `@mk-kit/ui/styles.css`, but
 * angular.json `styles` entries resolve plain file paths, not export
 * conditions, so the real location is used here.
 */
const THEME_STYLE_PATH = 'node_modules/@mk-kit/ui/styles/mk-kit.css';

const DOCS_URL = 'https://github.com/mk-kit/mk-kit#readme';

/** Entry point referenced from collection.json (`./ng-add/index#ngAdd`). */
export function ngAdd(options: Schema): Rule {
  return async (tree: Tree) => {
    const projectName = await resolveProjectName(tree, options.project);

    return chain([
      addThemeStyles(projectName),
      options.i18n ? addI18nProvider(projectName) : noop(),
      logGettingStarted(),
    ]);
  };
}

/**
 * Resolves the target project name: the explicit `--project` option (validated
 * against the workspace) or the first application project in angular.json.
 */
async function resolveProjectName(tree: Tree, requested: string | undefined): Promise<string> {
  const workspace = await readWorkspace(tree);

  if (requested) {
    if (!workspace.projects.has(requested)) {
      throw new SchematicsException(
        `Project "${requested}" was not found in the workspace. ` +
          `Available projects: ${[...workspace.projects.keys()].join(', ') || '(none)'}.`,
      );
    }
    return requested;
  }

  for (const [name, project] of workspace.projects) {
    if (project.extensions['projectType'] === 'application') {
      return name;
    }
  }

  throw new SchematicsException(
    'No application project found in the workspace. ' +
      'Pass one explicitly: ng add @mk-kit/ui --project <name>.',
  );
}

/**
 * Prepends the theme stylesheet to the project's build `styles` array so
 * application styles keep the last word for overrides. No-ops when an entry
 * for the theme is already present.
 */
function addThemeStyles(projectName: string): Rule {
  return updateWorkspace((workspace) => {
    const project = workspace.projects.get(projectName);
    if (!project) {
      throw new SchematicsException(`Project "${projectName}" was not found in the workspace.`);
    }

    const buildTarget = project.targets.get('build');
    if (!buildTarget) {
      throw new SchematicsException(
        `Project "${projectName}" has no "build" target; cannot add the @mk-kit/ui theme ` +
          `stylesheet. Add "${THEME_STYLE_PATH}" to your styles manually.`,
      );
    }

    const buildOptions = (buildTarget.options ??= {});
    const styles = (buildOptions['styles'] ??= []) as (string | { input?: string })[];

    const alreadyListed = styles.some((entry) => {
      const path = typeof entry === 'string' ? entry : entry?.input;
      return path === THEME_STYLE_PATH;
    });

    if (!alreadyListed) {
      styles.unshift(THEME_STYLE_PATH);
    }
  });
}

/**
 * Inserts `provideMkI18n({})` into the application config providers using the
 * CLI's standalone-app helpers. When the app doesn't match the standard
 * standalone shape (no `bootstrapApplication` call, unusual config), the rule
 * logs a friendly hint instead of failing the whole `ng add`.
 */
function addI18nProvider(projectName: string): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const rule = addRootProvider(
      projectName,
      ({ code, external }) => code`${external('provideMkI18n', '@mk-kit/ui/core')}({})`,
    );

    try {
      return await lastValueFrom(callRule(rule, tree, context));
    } catch {
      context.logger.warn(
        'Could not set up provideMkI18n automatically (the application config does not match ' +
          'the standard standalone shape). To localise the built-in strings, add it manually:',
      );
      context.logger.warn(`  import { provideMkI18n } from '@mk-kit/ui/core';`);
      context.logger.warn('  providers: [provideMkI18n({})]');
      return tree;
    }
  };
}

/** Prints a short getting-started message at the end of a successful run. */
function logGettingStarted(): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('@mk-kit/ui has been set up.');
    context.logger.info(`  - Theme stylesheet wired into angular.json (${THEME_STYLE_PATH}).`);
    context.logger.info(
      "  - Scaffold a dashboard layout with MkAppShell: import { MkAppShell } from '@mk-kit/ui/navigation';",
    );
    context.logger.info(`  - Docs and examples: ${DOCS_URL}`);
  };
}
