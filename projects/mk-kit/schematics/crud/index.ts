/**
 * `ng g @mk-kit/ui:crud <entity>`
 *
 * Generates a working CRUD slice for one entity: a model file (interface +
 * table columns + dynamic-form schema as the single source of truth), a data
 * service (in-memory, or HttpClient with `--api`), a list page (`mk-table` +
 * `MkTableDataSource` + search + pagination + delete confirm), a form page
 * (`mk-dynamic-form` for create and edit), lazy routes, and a harness-driven
 * spec — then wires the routes into the application's route table.
 */
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';

import { crudFiles, routesConstName } from './files';
import { buildEntity } from './model';
import type { Schema } from './schema';

/** Entry point referenced from collection.json (`./crud/index#crud`). */
export function crud(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const entity = buildEntity(options.entity, options.fields ?? 'name!:string', options.plural);
    const appDir = options.path?.replace(/\/+$/, '') ?? (await defaultAppDir(tree, options.project));
    const targetDir = `${appDir}/${entity.pluralFile}`;

    const files = crudFiles(entity, { api: options.api || undefined, spec: options.spec !== false });
    for (const [name, content] of files) {
      const filePath = `${targetDir}/${name}`;
      if (tree.exists(filePath)) {
        throw new SchematicsException(
          `${filePath} already exists — delete the previous slice or generate under a different --path.`,
        );
      }
      tree.create(filePath, content);
    }

    if (options.route !== false) {
      wireRoute(tree, context, appDir, targetDir, entity.pluralFile, routesConstName(entity));
    }

    logNextSteps(context, targetDir, entity.pluralFile, !!options.api);
  };
}

/** `<sourceRoot>/app` of the target (or first application) project. */
async function defaultAppDir(tree: Tree, requested: string | undefined): Promise<string> {
  const workspace = await readWorkspace(tree);

  let project = requested ? workspace.projects.get(requested) : undefined;
  if (requested && !project) {
    throw new SchematicsException(
      `Project "${requested}" was not found in the workspace. ` +
        `Available projects: ${[...workspace.projects.keys()].join(', ') || '(none)'}.`,
    );
  }
  if (!project) {
    for (const candidate of workspace.projects.values()) {
      if (candidate.extensions['projectType'] === 'application') {
        project = candidate;
        break;
      }
    }
  }
  if (!project) {
    throw new SchematicsException(
      'No application project found in the workspace. Pass --project or --path explicitly.',
    );
  }
  const sourceRoot = (project.sourceRoot ?? `${project.root}/src`).replace(/\/+$/, '');
  return `${sourceRoot}/app`;
}

/**
 * Inserts a lazy route into the app's route table. Looks for `app.routes.ts`
 * beside the target directory (then anywhere under it) and prepends a
 * `loadChildren` entry to the first `Routes = [` array. When the file or the
 * array cannot be found, prints the entry to add manually instead of failing
 * the whole generation.
 */
function wireRoute(
  tree: Tree,
  context: SchematicContext,
  appDir: string,
  targetDir: string,
  routePath: string,
  constName: string,
): void {
  const entry =
    `{\n    path: '${routePath}',\n    loadChildren: () =>\n` +
    `      import('./${routePath}/${routePath}.routes').then((m) => m.${constName}),\n  },`;

  const routesFilePath = findRoutesFile(tree, appDir);
  if (!routesFilePath) {
    context.logger.warn(`Could not find an app.routes.ts under ${appDir} — add the route yourself:`);
    context.logger.warn(`  ${entry}`);
    return;
  }

  const source = tree.read(routesFilePath)!.toString('utf-8');
  const match = /(:\s*Routes\s*=\s*\[)/.exec(source);
  if (!match) {
    context.logger.warn(`${routesFilePath} has no \`Routes = [\` array — add the route yourself:`);
    context.logger.warn(`  ${entry}`);
    return;
  }
  if (source.includes(`path: '${routePath}'`)) {
    context.logger.warn(`${routesFilePath} already routes '${routePath}' — left untouched.`);
    return;
  }

  const relative = relativeImportDir(routesFilePath, targetDir);
  const adjusted = entry.replace(`./${routePath}/`, `${relative}/`);
  const at = match.index + match[1].length;
  tree.overwrite(routesFilePath, `${source.slice(0, at)}\n  ${adjusted}${source.slice(at)}`);
  context.logger.info(`Routed '${routePath}' in ${routesFilePath}.`);
}

/**
 * `app.routes.ts` in `appDir` or any of its ancestors (a `--path` deep in the
 * app still wires the app-level table), else the first one anywhere below.
 */
function findRoutesFile(tree: Tree, appDir: string): string | null {
  const segments = appDir.split('/').filter(Boolean);
  for (let i = segments.length; i >= 0; i--) {
    const candidate = `${segments.slice(0, i).join('/')}/app.routes.ts`.replace(/^\//, '');
    if (tree.exists(candidate)) return candidate;
  }
  let found: string | null = null;
  tree.getDir(appDir).visit((filePath) => {
    if (!found && filePath.endsWith('/app.routes.ts')) found = filePath;
  });
  return found;
}

/** Relative import (no extension) from the routes file's directory to `dir`. */
function relativeImportDir(fromFile: string, dir: string): string {
  const from = fromFile.split('/').filter(Boolean).slice(0, -1);
  const to = dir.split('/').filter(Boolean);
  let common = 0;
  while (common < from.length && common < to.length && from[common] === to[common]) common++;
  const up = from.length - common;
  const down = to.slice(common).join('/');
  if (up === 0) return `./${down}`;
  return `${'../'.repeat(up)}${down}`.replace(/\/$/, '');
}

function logNextSteps(context: SchematicContext, targetDir: string, routePath: string, api: boolean): void {
  context.logger.info('');
  context.logger.info(`CRUD slice generated in ${targetDir}/ — visit /${routePath} to use it.`);
  if (api) {
    context.logger.info('  - The service uses HttpClient: make sure provideHttpClient() is in your app config.');
  } else {
    context.logger.info('  - The service is in-memory; swap its method bodies for API calls when ready.');
  }
  context.logger.info(`  - Columns and the form schema live in the model file — one place to grow the entity.`);
}
