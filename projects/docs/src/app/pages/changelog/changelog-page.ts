import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  signal,
} from '@angular/core';
import { MkAlert, MkMarkdown, MkSpinner } from '@mk-kit/ui';

/**
 * Renders the repository's `CHANGELOG.md` with the library's own
 * `<mk-markdown>` component (dogfooding the CommonMark-subset renderer it
 * was built for). The file ships as a build asset (see the docs `assets`
 * entry in angular.json) and is fetched at runtime inside
 * `afterNextRender`, which keeps the page SSR-safe.
 *
 * Two source tweaks before rendering, because the parser intentionally
 * omits reference-style links:
 * - the trailing `[x.y.z]: https://…/compare/…` definition block is
 *   stripped (it would render as a literal paragraph);
 * - everything else in the changelog (ATX headings, bold, lists, inline
 *   links, code) is within the supported subset.
 */
@Component({
  selector: 'docs-changelog-page',
  imports: [MkAlert, MkMarkdown, MkSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <header class="changelog-header">
        <h1>Changelog</h1>
        <p class="docs-lead">
          Every release of <strong>&#64;mk-kit/ui</strong>, rendered straight
          from the repository's <code class="docs-inline">CHANGELOG.md</code>
          by the library's own
          <code class="docs-inline">&lt;mk-markdown&gt;</code> component.
          Also available
          <a
            class="changelog-header__link"
            href="https://github.com/mk-kit/mk-kit/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
            >on GitHub</a
          >.
        </p>
      </header>

      @switch (state()) {
        @case ('loading') {
          <div class="changelog-loading" role="status">
            <mk-spinner />
            <span>Loading changelog…</span>
          </div>
        }
        @case ('error') {
          <mk-alert tone="warning" title="Couldn't load the changelog">
            The changelog file isn't reachable right now. You can always read
            it
            <a
              href="https://github.com/mk-kit/mk-kit/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              >on GitHub</a
            >.
          </mk-alert>
        }
        @case ('ready') {
          <mk-markdown [source]="source()" linkTarget="_blank" />
        }
      }
    </div>
  `,
  styles: [
    `
      .changelog-header {
        margin-bottom: var(--mk-space-6);
        padding-bottom: var(--mk-space-4);
        border-bottom: 1px solid var(--mk-border);
      }
      .changelog-header__link {
        color: var(--mk-primary);
      }
      .changelog-loading {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        padding: var(--mk-space-8) 0;
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class ChangelogPage {
  protected readonly source = signal('');
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    // afterNextRender only runs in the browser, so the fetch never executes
    // during prerender/SSR.
    afterNextRender(() => {
      void this.load();
    });
  }

  private async load(): Promise<void> {
    try {
      const res = await fetch('/CHANGELOG.md');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      this.source.set(stripLinkDefinitions(text));
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }
}

/**
 * Drops Keep-a-Changelog reference-link definition lines
 * (`[0.7.0]: https://…`). `<mk-markdown>` deliberately doesn't support
 * reference-style links, so left in place they'd render as a wall of
 * literal text at the bottom of the page.
 */
function stripLinkDefinitions(markdown: string): string {
  return markdown
    .split('\n')
    .filter((line) => !/^\[[^\]]+\]:\s+\S+/.test(line))
    .join('\n');
}
