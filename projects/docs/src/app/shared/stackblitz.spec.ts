import { appSource, detectMkImports, projectFiles, snippetToApp, starterApp } from './stackblitz';

describe('stackblitz project builder', () => {
  it('detects library classes from element and attribute selectors', () => {
    const imports = detectMkImports(`<mk-card><button mkButton (click)="x()">Go</button><div [mkBlockUi]="busy()"></div></mk-card>`);
    expect(imports).toEqual(['MkBlockUi', 'MkButton', 'MkCard']);
  });

  it('detects pipes used in interpolations', () => {
    const imports = detectMkImports(`<p>{{ total | mkCurrency:'EUR' }} · {{ at |mkRelativeTime }}</p>`);
    expect(imports).toEqual(['MkCurrencyPipe', 'MkRelativeTimePipe']);
  });

  it('splits a snippet into template and class code, keeping signal fields and commenting the rest', () => {
    const app = snippetToApp('Toggles', `<mk-switch [(checked)]="on" />
<p>{{ on() }}</p>

readonly on = signal(false);
protected save(): void {
  this.api.save();
}`);
    expect(app.template).toBe(`<mk-switch [(checked)]="on" />\n<p>{{ on() }}</p>`);
    expect(app.mkImports).toEqual(['MkSwitch']);
    expect(app.classBody).toBe('readonly on = signal(false);');
    expect(app.leftover).toContain('protected save(): void {');
    const src = appSource(app);
    expect(src).toContain(`import { MkSwitch } from '@mk-kit/ui';`);
    expect(src).toContain('imports: [MkSwitch]');
    expect(src).toContain('// protected save(): void {');
    expect(src).toContain('readonly on = signal(false);');
  });

  it('adds FormsModule / RouterLink when the snippet needs them', () => {
    const app = snippetToApp('Form', `<input mkInput [(ngModel)]="name" /><a routerLink="/x">x</a>`);
    expect(app.extraImports.map((e) => e.name)).toEqual(['FormsModule', 'RouterLink']);
    expect(appSource(app)).toContain('imports: [MkInput, FormsModule, RouterLink]');
  });

  it('produces a complete zoneless Angular project on @mk-kit/ui', () => {
    const files = projectFiles(starterApp());
    expect(Object.keys(files).sort()).toEqual([
      '.stackblitzrc',
      'angular.json',
      'package.json',
      'src/app/app.ts',
      'src/index.html',
      'src/main.ts',
      'src/styles.css',
      'tsconfig.app.json',
      'tsconfig.json',
    ]);
    const pkg = JSON.parse(files['package.json']);
    expect(pkg.dependencies['@mk-kit/ui']).toMatch(/^\^\d+\.\d+\.\d+$/);
    expect(files['src/main.ts']).toContain('provideZonelessChangeDetection');
    expect(files['src/index.html']).toContain('class="mk-app"');
    expect(files['src/styles.css']).toContain(`@import '@mk-kit/ui/styles.css'`);
    expect(files['src/app/app.ts']).toContain('MkThemeService');
  });
});
