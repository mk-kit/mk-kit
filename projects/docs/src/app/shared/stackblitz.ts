import { version as UI_VERSION } from '../../../../mk-kit/package.json';
import { MK_SELECTORS } from './mk-selectors';

/** What a docs snippet turns into: the app template, its imports and any extra class code. */
export interface StackBlitzApp {
  title: string;
  /** Angular template of the root component. */
  template: string;
  /** Classes to import from `@mk-kit/ui` (deduplicated, sorted). */
  mkImports: string[];
  /** Other Angular imports for the `imports: []` array, e.g. `FormsModule`. */
  extraImports: Array<{ name: string; from: string }>;
  /** Lines placed inside the root component class. */
  classBody: string;
  /** Source that could not be placed automatically, shown as a comment. */
  leftover: string;
}

const TS_LINE = /^\s*(import |export |readonly |protected |private |public |const |let |var |@Component|\/\/|\/\*|\w+\s*=\s*(signal|computed|new |\[|\{|`|')|\w+\([^)]*\)\s*(:\s*\w+\s*)?\{|\}\s*;?$|\)\s*;$)/;

/** Everything a snippet references from the library, via the generated selector map. */
export function detectMkImports(source: string): string[] {
  const found = new Set<string>();
  for (const m of source.matchAll(/<(mk-[a-z0-9-]+)/g)) {
    const cls = MK_SELECTORS[m[1]];
    if (cls) found.add(cls);
  }
  for (const m of source.matchAll(/[\s\[(*](mk[A-Z][A-Za-z0-9]*)/g)) {
    const cls = MK_SELECTORS[m[1]];
    if (cls) found.add(cls);
  }
  return [...found].sort();
}

/**
 * Turn a docs snippet into an app: leading HTML lines become the template,
 * the rest is kept as class code (or as a comment when it cannot compile on
 * its own). A snippet that is a whole `@Component` is used as the component.
 */
export function snippetToApp(title: string, snippet: string): StackBlitzApp {
  const lines = snippet.replace(/\r\n/g, '\n').split('\n');
  let template = '';
  let rest = '';
  const trimmed = snippet.trim();

  if (trimmed.startsWith('<')) {
    // Template first; stop at the first line that looks like TypeScript.
    let i = 0;
    const html: string[] = [];
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (html.length && TS_LINE.test(line) && !line.trim().startsWith('<') && !line.trim().startsWith('{{') && !line.trim().startsWith('@')) break;
      html.push(line);
    }
    template = html.join('\n').trim();
    rest = lines.slice(i).join('\n').trim();
  } else {
    rest = trimmed;
  }

  const mkImports = detectMkImports(snippet);
  const extraImports: StackBlitzApp['extraImports'] = [];
  if (/ngModel|formControl|formGroup/.test(snippet)) {
    extraImports.push({ name: 'FormsModule', from: '@angular/forms' });
    if (/formControl|formGroup/.test(snippet)) extraImports.push({ name: 'ReactiveFormsModule', from: '@angular/forms' });
  }
  if (/routerLink/.test(snippet)) extraImports.push({ name: 'RouterLink', from: '@angular/router' });

  // Class code we can keep verbatim: field declarations using signals / plain values.
  const keep: string[] = [];
  const leftover: string[] = [];
  for (const line of rest.split('\n')) {
    if (!line.trim()) continue;
    if (/^\s*(readonly |protected |private |public )?\w+\s*=\s*signal[<(]/.test(line) && line.trim().endsWith(';')) keep.push(line.trim());
    else leftover.push(line);
  }
  return {
    title,
    template: template || `<p>Paste the example's template here.</p>`,
    mkImports,
    extraImports,
    classBody: keep.join('\n  '),
    leftover: leftover.join('\n'),
  };
}

/** Root component source for an app. */
export function appSource(app: StackBlitzApp): string {
  const angularCore = ['Component', 'signal', 'computed', 'inject'];
  const importLines = [
    `import { ${angularCore.join(', ')} } from '@angular/core';`,
    ...(app.mkImports.length ? [`import { ${app.mkImports.join(', ')} } from '@mk-kit/ui';`] : []),
    ...app.extraImports.map((e) => `import { ${e.name} } from '${e.from}';`),
  ];
  const imports = [...app.mkImports, ...app.extraImports.map((e) => e.name)];
  const leftover = app.leftover
    ? `\n  // From the docs snippet — wire up as needed:\n${app.leftover
        .split('\n')
        .map((l) => `  // ${l}`)
        .join('\n')}\n`
    : '';
  const indented = app.template
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n');
  return `${importLines.join('\n')}

@Component({
  selector: 'app-root',
  imports: [${imports.join(', ')}],
  template: \`
    <div class="page">
      <h1>${escapeTpl(app.title)}</h1>
${indented}
    </div>
  \`,
  styles: \`.page { max-width: 60rem; margin: 0 auto; padding: 2rem; display: grid; gap: 1rem; }\`,
})
export class App {
  ${app.classBody}${leftover}
}
`;
}

function escapeTpl(s: string): string {
  return s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/** Every file of the StackBlitz project. */
export function projectFiles(app: StackBlitzApp): Record<string, string> {
  return {
    'package.json': JSON.stringify(
      {
        name: 'mk-kit-example',
        private: true,
        scripts: { start: 'ng serve', build: 'ng build' },
        dependencies: {
          '@angular/common': '^22.0.0',
          '@angular/compiler': '^22.0.0',
          '@angular/core': '^22.0.0',
          '@angular/forms': '^22.0.0',
          '@angular/platform-browser': '^22.0.0',
          '@angular/router': '^22.0.0',
          '@mk-kit/ui': `^${UI_VERSION}`,
          rxjs: '^7.8.0',
          tslib: '^2.8.0',
        },
        devDependencies: {
          '@angular/build': '^22.0.0',
          '@angular/cli': '^22.0.0',
          '@angular/compiler-cli': '^22.0.0',
          typescript: '~6.0.0',
        },
      },
      null,
      2,
    ),
    '.stackblitzrc': JSON.stringify({ installDependencies: true, startCommand: 'npm start' }, null, 2),
    'angular.json': JSON.stringify(
      {
        $schema: './node_modules/@angular/cli/lib/config/schema.json',
        version: 1,
        projects: {
          app: {
            projectType: 'application',
            root: '',
            sourceRoot: 'src',
            prefix: 'app',
            architect: {
              build: {
                builder: '@angular/build:application',
                options: {
                  outputPath: 'dist/app',
                  index: 'src/index.html',
                  browser: 'src/main.ts',
                  tsConfig: 'tsconfig.app.json',
                  styles: ['src/styles.css'],
                },
              },
              serve: { builder: '@angular/build:dev-server', options: { buildTarget: 'app:build' } },
            },
          },
        },
      },
      null,
      2,
    ),
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          target: 'ES2022',
          module: 'preserve',
          moduleResolution: 'bundler',
          experimentalDecorators: true,
          importHelpers: true,
          skipLibCheck: true,
          isolatedModules: true,
          esModuleInterop: true,
          lib: ['ES2022', 'dom'],
        },
        angularCompilerOptions: { strictTemplates: true },
      },
      null,
      2,
    ),
    'tsconfig.app.json': JSON.stringify({ extends: './tsconfig.json', files: ['src/main.ts'] }, null, 2),
    'src/index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${app.title} — mk-kit</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body class="mk-app">
    <app-root></app-root>
  </body>
</html>
`,
    'src/styles.css': `@import '@mk-kit/ui/styles.css';\n\nbody { margin: 0; font-family: var(--mk-font-sans); background: var(--mk-bg); color: var(--mk-text); }\n`,
    'src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] }).catch(console.error);
`,
    'src/app/app.ts': appSource(app),
  };
}

/** The "hello world" starter shown on the homepage and Getting started. */
export function starterApp(): StackBlitzApp {
  return {
    title: 'mk-kit starter',
    template: `<mk-card variant="elevated">
  <p>Signals, OnPush and CSS variables — dark mode included.</p>
  <mk-stack direction="row" gap="2">
    <button mkButton tone="primary" (click)="theme.toggle()">Toggle theme</button>
    <button mkButton variant="outline" tone="neutral" (click)="count.set(count() + 1)">
      Clicked {{ count() }} times
    </button>
  </mk-stack>
</mk-card>`,
    mkImports: ['MkButton', 'MkCard', 'MkStack', 'MkThemeService'],
    extraImports: [],
    classBody: `readonly theme = inject(MkThemeService);\n  readonly count = signal(0);`,
    leftover: '',
  };
}

/**
 * Open a project in StackBlitz through its form-POST API — no SDK, no
 * network access from the docs, and a plain popup the browser can vet.
 */
export function openInStackBlitz(app: StackBlitzApp, doc: Document = document): void {
  const form = doc.createElement('form');
  form.method = 'post';
  form.action = 'https://stackblitz.com/run?file=src%2Fapp%2Fapp.ts';
  form.target = '_blank';
  form.style.display = 'none';
  const add = (name: string, value: string) => {
    const input = doc.createElement('textarea');
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };
  add('project[title]', `${app.title} — @mk-kit/ui`);
  add('project[description]', 'Angular 22 example built with @mk-kit/ui');
  add('project[template]', 'node');
  for (const [path, content] of Object.entries(projectFiles(app))) add(`project[files][${path}]`, content);
  doc.body.appendChild(form);
  form.submit();
  form.remove();
}
