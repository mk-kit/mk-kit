import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkAutofocus,
  MkButton,
  MkClickOutside,
  MkCopyToClipboard,
  MkScrollspy,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the utility directives of `@mkornas/ui`:
 * `mkClickOutside` and `mkCopyToClipboard`.
 */
@Component({
  selector: 'docs-utilities-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkButton,
    MkClickOutside,
    MkCopyToClipboard,
    MkAutofocus,
    MkScrollspy,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Utilities</h1>
      <p class="docs-lead">
        Small standalone directives that compose with any element — the building
        blocks the components themselves use.
      </p>

      <!-- clickOutside -->
      <h2>Click outside</h2>
      <p>
        <code class="docs-inline">(mkClickOutside)</code> emits when a pointer
        press lands outside the host — the primitive for dismissing custom
        panels. Open the box below, then click anywhere outside it.
      </p>
      <docs-example [code]="clickOutsideCode" [column]="true">
        <button mkButton variant="outline" (click)="boxOpen.set(true)">
          Open box
        </button>
        @if (boxOpen()) {
          <div
            class="docs-outside-box"
            (mkClickOutside)="boxOpen.set(false)"
            style="margin-top: var(--mk-space-2); padding: var(--mk-space-4);
                   border: var(--mk-border-width) solid var(--mk-border);
                   border-radius: var(--mk-radius-md); background: var(--mk-surface);"
          >
            I close when you click outside me.
          </div>
        }
        <p class="echo">Box is {{ boxOpen() ? 'open' : 'closed' }}.</p>
      </docs-example>

      <!-- copyToClipboard -->
      <h2>Copy to clipboard</h2>
      <p>
        <code class="docs-inline">[mkCopyToClipboard]</code> copies its value on
        click, emits <code class="docs-inline">(copiedText)</code>, and exposes a
        transient <code class="docs-inline">justCopied()</code> signal (via
        <code class="docs-inline">exportAs</code>) for instant "Copied!" feedback.
      </p>
      <docs-example [code]="copyCode" [column]="true">
        <button
          mkButton
          variant="outline"
          [mkCopyToClipboard]="token"
          #copier="mkCopyToClipboard"
          (copiedText)="lastCopied.set($event)"
        >
          {{ copier.justCopied() ? '✓ Copied!' : 'Copy token' }}
        </button>
        <p class="echo">
          <code class="docs-inline">{{ token }}</code>
          @if (lastCopied()) {
            — last copied at click
          }
        </p>
      </docs-example>

      <!-- autofocus -->
      <h2>Autofocus</h2>
      <p>
        <code class="docs-inline">mkAutofocus</code> focuses the host once it
        renders (with an optional delay) — ideal for dialogs and newly-revealed
        forms. Toggle the field below; it grabs focus when it appears.
      </p>
      <docs-example [code]="autofocusCode" [column]="true">
        <button mkButton variant="outline" (click)="showField.set(!showField())">
          {{ showField() ? 'Hide' : 'Show' }} field
        </button>
        @if (showField()) {
          <input
            mkAutofocus
            placeholder="I'm focused automatically"
            style="margin-top: var(--mk-space-2); width: 100%; max-width: 20rem; height: var(--mk-control-height-md); padding: 0 var(--mk-space-3); border: var(--mk-border-width) solid var(--mk-border); border-radius: var(--mk-radius-md); background: var(--mk-surface); color: var(--mk-text);"
          />
        }
      </docs-example>

      <!-- scrollspy -->
      <h2>Scrollspy</h2>
      <p>
        <code class="docs-inline">mkScrollspy</code> tracks which section is in
        view and exposes its <code class="docs-inline">id</code>, so a table of
        contents can highlight the current link. Point it at a selector for the
        sections; read <code class="docs-inline">activeId()</code> off the exported
        instance. Scroll the panel — the active link follows.
      </p>
      <docs-example [code]="scrollspyCode" [column]="true">
        <div class="spy-demo">
          <nav
            class="spy-nav"
            mkScrollspy="section[id]"
            [root]="spyBody"
            [offset]="12"
            #spy="mkScrollspy"
          >
            @for (s of spySections; track s.id) {
              <a
                class="spy-link"
                [class.spy-link--active]="spy.activeId() === s.id"
                [href]="'#' + s.id"
                (click)="scrollToSection($event, s.id, spyBody)"
                >{{ s.label }}</a
              >
            }
          </nav>
          <div class="spy-body" #spyBody>
            @for (s of spySections; track s.id) {
              <section [id]="s.id">
                <h3>{{ s.label }}</h3>
                <p>{{ s.body }}</p>
              </section>
            }
          </div>
        </div>
      </docs-example>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .echo {
        margin: var(--mk-space-2) 0 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .spy-demo {
        display: grid;
        grid-template-columns: 10rem 1fr;
        gap: var(--mk-space-4);
        width: 100%;
      }
      .spy-nav {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-1);
        align-self: start;
        position: sticky;
        top: 0;
      }
      .spy-link {
        padding: var(--mk-space-1) var(--mk-space-3);
        border-left: 2px solid var(--mk-border);
        color: var(--mk-text-muted);
        text-decoration: none;
        font-size: var(--mk-font-size-sm);
      }
      .spy-link:hover {
        color: var(--mk-text);
      }
      .spy-link--active {
        border-left-color: var(--mk-primary);
        color: var(--mk-primary);
        font-weight: var(--mk-font-weight-semibold);
      }
      .spy-body {
        position: relative;
        height: 16rem;
        overflow-y: auto;
        padding: 0 var(--mk-space-4);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
      }
      .spy-body section {
        min-height: 11rem;
      }
      .spy-body h3 {
        margin: 0 0 var(--mk-space-2);
      }
    `,
  ],
})
export class UtilitiesPage {
  protected readonly boxOpen = signal(false);
  protected readonly token = 'sk_live_9f2b7c1a4e8d';
  protected readonly lastCopied = signal('');
  protected readonly showField = signal(false);
  protected readonly autofocusCode = `<input mkAutofocus placeholder="…" />`;

  protected readonly spySections = [
    { id: 'spy-overview', label: 'Overview', body: 'Scrollspy watches your sections and reports the one currently in view.' },
    { id: 'spy-install', label: 'Install', body: 'Add the directive to your nav and point it at a section selector.' },
    { id: 'spy-usage', label: 'Usage', body: 'Bind each link’s active class to activeId(). Keyboard and reduced-motion friendly.' },
    { id: 'spy-api', label: 'API', body: 'Inputs: mkScrollspy (selector), root, offset. Output: activeChange.' },
  ];

  protected scrollToSection(event: Event, id: string, container: HTMLElement): void {
    event.preventDefault();
    const el = container.querySelector<HTMLElement>(`#${id}`);
    if (el) container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  }

  protected readonly scrollspyCode = `<nav mkScrollspy="section[id]" [root]="body" #spy="mkScrollspy">
  @for (s of sections; track s.id) {
    <a [href]="'#' + s.id" [class.active]="spy.activeId() === s.id">{{ s.label }}</a>
  }
</nav>
<div #body class="scroll-body">
  <section id="overview">…</section>
  <section id="install">…</section>
</div>`;

  protected readonly clickOutsideCode = `<div (mkClickOutside)="open.set(false)">
  I close when you click outside me.
</div>`;

  protected readonly copyCode = `<button mkButton [mkCopyToClipboard]="token"
  #c="mkCopyToClipboard" (copiedText)="onCopied($event)">
  {{ c.justCopied() ? '✓ Copied!' : 'Copy token' }}
</button>`;
}
