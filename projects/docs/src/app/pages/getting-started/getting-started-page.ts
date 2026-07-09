import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MkAlert,
  MkAutocomplete,
  MkButton,
  MkSelect,
  MkThemeService,
  provideMkI18n,
} from '@mkornas/ui';

/** A subtree with Polish strings, to show `provideMkI18n` scoping. */
@Component({
  selector: 'docs-i18n-demo',
  imports: [MkSelect, MkAutocomplete],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideMkI18n({
      noOptions: 'Brak opcji',
      noResults: 'Brak wyników',
      clear: 'Wyczyść',
      loading: 'Ładowanie…',
    }),
  ],
  template: `
    <div style="display: flex; gap: var(--mk-space-3); flex-wrap: wrap;">
      <mk-select placeholder="Wybierz…" [options]="[]" style="max-width: 14rem;" />
      <mk-autocomplete placeholder="Szukaj…" [options]="[]" style="max-width: 14rem;" />
    </div>
  `,
})
export class I18nDemo {}

@Component({
  selector: 'docs-getting-started-page',
  imports: [MkButton, MkAlert, I18nDemo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Getting started</h1>
      <p class="docs-lead">
        Install the package, wire up the theme stylesheet once, and start importing
        standalone components. Two minutes, no configuration.
      </p>

      <h2>1. Install</h2>
      <pre class="gs-code"><code>npm install &#64;mk-kit/ui</code></pre>
      <p>
        Peer dependencies: <code class="docs-inline">&#64;angular/core</code>,
        <code class="docs-inline">&#64;angular/common</code> and
        <code class="docs-inline">&#64;angular/forms</code> (v22 or newer).
      </p>

      <h2>2. Add the theme stylesheet</h2>
      <p>
        Import the theme once — it defines every <code class="docs-inline">--mk-*</code>
        design token plus the base reset. Add it to your global
        <code class="docs-inline">styles.css</code>:
      </p>
      <pre class="gs-code"><code>&#64;import '&#64;mk-kit/ui/styles.css';</code></pre>
      <p>or reference it from the <code class="docs-inline">styles</code> array in <code class="docs-inline">angular.json</code>.</p>

      <h2>3. Enable the theme surface</h2>
      <p>
        Add the <code class="docs-inline">mk-app</code> class to your
        <code class="docs-inline">&lt;body&gt;</code> (or a top-level wrapper) so the
        background, text color, fonts and themed scrollbars apply:
      </p>
      <pre class="gs-code"><code>&lt;body class="mk-app"&gt;</code></pre>

      <h2>4. Use a component</h2>
      <p>Everything is standalone — import only what you need:</p>
      <pre class="gs-code"><code>{{ usageSnippet }}</code></pre>

      <mk-alert tone="info" variant="soft" title="Zoneless-ready">
        mk-kit is built entirely on signals and <code class="docs-inline">OnPush</code>,
        so it works with both Zone.js and Angular's zoneless change detection.
      </mk-alert>

      <h2>5. Dark mode</h2>
      <p>
        Dark mode works with <strong>no JavaScript</strong> — it follows the OS
        <code class="docs-inline">prefers-color-scheme</code>. To let users choose,
        inject <code class="docs-inline">MkThemeService</code>. Try it right here — the
        current resolved theme is <strong>{{ theme.resolvedTheme() }}</strong>
        (preference: {{ theme.preference() }}):
      </p>
      <div class="gs-theme-demo">
        <button mkButton size="sm" [variant]="theme.preference() === 'light' ? 'solid' : 'outline'" tone="neutral" (click)="theme.setTheme('light')">☀ Light</button>
        <button mkButton size="sm" [variant]="theme.preference() === 'dark' ? 'solid' : 'outline'" tone="neutral" (click)="theme.setTheme('dark')">☾ Dark</button>
        <button mkButton size="sm" [variant]="theme.preference() === 'system' ? 'solid' : 'outline'" tone="neutral" (click)="theme.setTheme('system')">◐ System</button>
      </div>
      <pre class="gs-code"><code>{{ themeSnippet }}</code></pre>

      <h2>6. Localization (i18n)</h2>
      <p>
        Every string the library renders itself — empty-state text, aria-labels
        and screen-reader announcements — comes from an injectable map. Override
        any subset with <code class="docs-inline">provideMkI18n</code> at bootstrap
        (or scoped to a subtree). The demo below is scoped to Polish:
      </p>
      <div class="gs-theme-demo">
        <docs-i18n-demo />
      </div>
      <pre class="gs-code"><code>{{ i18nSnippet }}</code></pre>

      <h2>7. Publish your own build</h2>
      <p>The library builds into a standards-compliant Angular package:</p>
      <pre class="gs-code"><code>{{ publishSnippet }}</code></pre>
    </div>
  `,
  styles: [
    `
      .gs-code {
        margin: var(--mk-space-3) 0 var(--mk-space-5);
        padding: var(--mk-space-4) var(--mk-space-5);
        background: var(--mk-code-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: var(--mk-line-height-normal);
        color: var(--mk-text);
        overflow-x: auto;
      }
      .gs-theme-demo {
        display: flex;
        gap: var(--mk-space-2);
        margin: var(--mk-space-4) 0;
      }
    `,
  ],
})
export class GettingStartedPage {
  protected readonly theme = inject(MkThemeService);

  protected readonly i18nSnippet = `import { bootstrapApplication } from '@angular/platform-browser';
import { provideMkI18n } from '@mkornas/ui';

bootstrapApplication(App, {
  providers: [
    provideMkI18n({
      noResults: 'Brak wyników',
      noOptions: 'Brak opcji',
      close: 'Zamknij',
      sortedBy: (col, dir) =>
        \`Posortowano wg \${col} \${dir === 'asc' ? 'rosnąco' : 'malejąco'}\`,
    }),
  ],
});`;

  protected readonly usageSnippet = `import { Component, inject } from '@angular/core';
import { MkButton, MkCard, MkThemeService } from '@mkornas/ui';

@Component({
  selector: 'app-root',
  imports: [MkButton, MkCard],
  template: \`
    <mk-card variant="elevated">
      <button mkButton tone="primary" (click)="theme.toggle()">
        Toggle theme
      </button>
    </mk-card>
  \`,
})
export class AppRoot {
  protected readonly theme = inject(MkThemeService);
}`;

  protected readonly themeSnippet = `const theme = inject(MkThemeService);

theme.setTheme('dark');     // force dark
theme.setTheme('system');   // follow the OS
theme.toggle();             // flip light <-> dark

theme.resolvedTheme();      // signal: 'light' | 'dark'
theme.isDark();             // signal: boolean`;

  protected readonly publishSnippet = `ng build mk-kit          # emits dist/mk-kit
cd dist/mk-kit
npm publish --access public`;
}
