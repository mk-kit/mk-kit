import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MkButton, MkButtonToggle, MkButtonToggleGroup } from '@mk-kit/ui';
import {
  MK_TRANSLATE_CONFIG,
  MkTranslate,
  MkTranslatePipe,
  mkStaticTranslateLoader,
} from '@mk-kit/ui/translate';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation page for `@mk-kit/ui/translate`: app translations as
 * signals, the `translate` pipe, plurals and overrides.
 */
@Component({
  selector: 'docs-translate-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkTranslatePipe, MkButton, MkButtonToggle, MkButtonToggleGroup],
  // A page-local instance so the demo's languages never touch the docs app
  // itself; an app registers `provideMkTranslate()` once, in app.config.ts.
  providers: [
    MkTranslate,
    {
      provide: MK_TRANSLATE_CONFIG,
      useValue: {
        lang: 'en',
        fallbackLang: 'en',
        preload: false,
        loader: mkStaticTranslateLoader({
          en: {
            demo: {
              greeting: 'Hello, {{name}}!',
              cart: { one: '{{count}} item in your cart', other: '{{count}} items in your cart' },
              onlyEnglish: 'This key exists only in English',
            },
          },
          pl: {
            demo: {
              greeting: 'Cześć, {{name}}!',
              cart: {
                one: '{{count}} pozycja w koszyku',
                few: '{{count}} pozycje w koszyku',
                many: '{{count}} pozycji w koszyku',
                other: '{{count}} pozycji w koszyku',
              },
            },
          },
        }),
      },
    },
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Translate (i18n)</h1>
      <p class="docs-lead">
        Application strings as signals. Point
        <code class="docs-inline">provideMkTranslate()</code> at your existing nested JSON, switch
        languages with <code class="docs-inline">use()</code>, read strings with the
        <code class="docs-inline">translate</code> pipe or
        <code class="docs-inline">instant()</code>, and layer an
        <code class="docs-inline">overrides</code> source (a database of edits) over the bundled
        files. Server-rendered apps hand the loaded strings to the browser through
        <code class="docs-inline">TransferState</code>.
      </p>

      <h2>Pipe, params, plurals</h2>
      <p>
        <code class="docs-inline">{{ '{{' }} key | translate: params {{ '}}' }}</code>
        fills <code class="docs-inline">{{ '{{' }}name{{ '}}' }}</code> placeholders.
        <code class="docs-inline">plural(keyBase, count)</code> picks the CLDR form (<code
          class="docs-inline"
          >one / few / many / other</code
        >) with <code class="docs-inline">Intl.PluralRules</code>; a language that lacks a form
        falls back to <code class="docs-inline">other</code>, a key the language lacks falls back to
        <code class="docs-inline">fallbackLang</code>.
      </p>
      <docs-example [code]="pipeCode" column>
        <mk-button-toggle-group
          [value]="translate.lang()"
          (valueChange)="switchLang($event)"
          aria-label="Language"
        >
          <mk-button-toggle value="en">English</mk-button-toggle>
          <mk-button-toggle value="pl">Polski</mk-button-toggle>
        </mk-button-toggle-group>
        <p>{{ 'demo.greeting' | translate: { name: 'Ada' } }}</p>
        <p>
          {{ translate.plural('demo.cart', count()) }}
          <button mkButton size="sm" variant="outline" (click)="count.set(count() + 1)">+1</button>
        </p>
        <p>{{ 'demo.onlyEnglish' | translate }}</p>
        <p>Missing keys so far: {{ translate.missingKeys().join(', ') || 'none' }}</p>
      </docs-example>

      <h2>Setup</h2>
      <p>
        The initial language is loaded <em>before</em> the first render (<code class="docs-inline"
          >preload</code
        >, default on), so nothing renders or caches raw keys. Files stay where they are; a custom
        loader is one method returning the tree.
      </p>
      <docs-example [code]="setupCode" column>
        <p>See the code tab.</p>
      </docs-example>

      <h2>API</h2>
      <table class="docs-props">
        <thead>
          <tr>
            <th>Member</th>
            <th>Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>lang</code></td>
            <td><code>Signal&lt;string&gt;</code></td>
            <td>Active language; read it in <code>computed()</code> to follow switches.</td>
          </tr>
          <tr>
            <td><code>ready</code></td>
            <td><code>Signal&lt;boolean&gt;</code></td>
            <td>Strings for <code>lang</code> are in memory.</td>
          </tr>
          <tr>
            <td><code>use(lang)</code></td>
            <td><code>Promise&lt;void&gt;</code></td>
            <td>Load once and switch; a failed load keeps the previous language.</td>
          </tr>
          <tr>
            <td><code>instant(key, params?)</code></td>
            <td><code>string</code></td>
            <td>Reactive lookup with fallback; a missing key renders as itself.</td>
          </tr>
          <tr>
            <td><code>plural(keyBase, count, params?)</code></td>
            <td><code>string</code></td>
            <td>CLDR form under <code>keyBase</code>, interpolated with <code>count</code>.</td>
          </tr>
          <tr>
            <td>
              <code>has(key)</code>, <code>translations(lang)</code>, <code>loadedLangs()</code>
            </td>
            <td></td>
            <td>Introspection for editors and tests.</td>
          </tr>
          <tr>
            <td><code>patch(lang, strings)</code>, <code>set(lang, strings)</code></td>
            <td><code>void</code></td>
            <td>Change strings at runtime; every reader re-renders.</td>
          </tr>
          <tr>
            <td><code>missingKeys</code></td>
            <td><code>Signal&lt;string[]&gt;</code></td>
            <td>Keys asked for that no language has.</td>
          </tr>
          <tr>
            <td><code>langChange</code></td>
            <td><code>Observable&lt;string&gt;</code></td>
            <td><code>lang</code> as a stream, for code still built around RxJS.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class TranslatePage {
  readonly translate = inject(MkTranslate);
  readonly count = signal(1);

  constructor() {
    void this.translate.use('en');
  }

  switchLang(lang: unknown): void {
    if (lang === 'en' || lang === 'pl') void this.translate.use(lang);
  }

  readonly pipeCode = `<p>{{ 'demo.greeting' | translate: { name: 'Ada' } }}</p>
<p>{{ translate.plural('demo.cart', count()) }}</p>

// component
readonly translate = inject(MkTranslate);
switchLang(lang: string) { void this.translate.use(lang); }`;

  readonly setupCode = `// app.config.ts
provideHttpClient(withFetch()),
provideMkTranslate({
  lang: 'pl',
  fallbackLang: 'pl',
  loader: mkHttpTranslateLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
  // optional: edits kept in a database, merged over the files per language
  overrides: () => inject(TranslationOverridesApi),
}),

// SSR (app.config.server.ts): read the same files from disk instead of HTTP
loader: () => ({ load: (lang) => JSON.parse(readFileSync(\`\${dir}/\${lang}.json\`, 'utf8')) }),

// a loader is one method
interface MkTranslateLoader { load(lang: string): Promise<MkTranslationTree> | MkTranslationTree; }`;
}
