import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkAutofocus,
  MkButton,
  MkClickOutside,
  MkCopyToClipboard,
  MkHotkey,
  MkInfiniteScroll,
  MkIntersect,
  MkInput,
  MkMask,
  MkRipple,
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
    MkHotkey,
    MkAutofocus,
    MkScrollspy,
    MkIntersect,
    MkInfiniteScroll,
    MkRipple,
    MkInput,
    MkMask,
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

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkClickOutsideEnabled</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Disable the listener without removing the directive.</td></tr>
          <tr><td><code>(mkClickOutside)</code></td><td><code>PointerEvent</code></td><td>—</td><td>Fires when a pointerdown lands outside the host (capture phase).</td></tr>
        </tbody>
      </table>

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

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkCopyToClipboard</code></td><td><code>string</code></td><td>required</td><td>The text copied when the host is clicked (or <code>copy()</code> is called).</td></tr>
          <tr><td><code>mkCopyFeedbackDuration</code></td><td><code>number</code></td><td><code>1500</code></td><td>How long (ms) <code>justCopied()</code> stays true after a copy.</td></tr>
          <tr><td><code>(copiedText)</code></td><td><code>string</code></td><td>—</td><td>The copied text, on success.</td></tr>
          <tr><td><code>(copyFailed)</code></td><td><code>unknown</code></td><td>—</td><td>The error, when the clipboard write fails.</td></tr>
        </tbody>
      </table>

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

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkAutofocus</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Whether to focus. The bare attribute means true.</td></tr>
          <tr><td><code>mkAutofocusDelay</code></td><td><code>number</code></td><td><code>0</code></td><td>Delay (ms) before focusing — e.g. to wait out an entrance animation.</td></tr>
        </tbody>
      </table>

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

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkScrollspy</code></td><td><code>string</code></td><td>required</td><td>CSS selector for the section elements to track (queried within <code>root</code>).</td></tr>
          <tr><td><code>root</code></td><td><code>HTMLElement | null</code></td><td><code>null</code></td><td>Scroll container; null tracks the whole document / viewport.</td></tr>
          <tr><td><code>offset</code></td><td><code>number</code></td><td><code>96</code></td><td>Distance (px) below the root's top at which a section becomes active — raise for sticky headers.</td></tr>
          <tr><td><code>(activeChange)</code></td><td><code>string | null</code></td><td>—</td><td>The active section id whenever it changes; also readable as <code>activeId()</code> via <code>exportAs</code>.</td></tr>
        </tbody>
      </table>

      <!-- intersect -->
      <h2>Intersect (reveal on scroll)</h2>
      <p>
        <code class="docs-inline">mkIntersect</code> wraps
        <code class="docs-inline">IntersectionObserver</code>: it emits
        <code class="docs-inline">(mkIntersect)</code> as the host enters/leaves
        the viewport and exposes an
        <code class="docs-inline">intersecting()</code> signal. Add
        <code class="docs-inline">once</code> to fire a single time (lazy loading,
        one-shot animations). Scroll the box — the card fades in when it appears.
      </p>
      <docs-example [code]="intersectCode" [column]="true">
        <div class="io-demo" #ioRoot>
          <p class="io-hint">Scroll down ↓</p>
          <div
            class="io-target"
            mkIntersect
            [root]="ioRoot"
            rootMargin="0px 0px -20px 0px"
            #io="mkIntersect"
            [class.io-target--in]="io.intersecting()"
          >
            {{ io.intersecting() ? '✓ In view' : 'Out of view' }}
          </div>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>root</code></td><td><code>HTMLElement | null</code></td><td><code>null</code></td><td>Element used as the observer viewport; null means the browser viewport.</td></tr>
          <tr><td><code>rootMargin</code></td><td><code>string</code></td><td><code>'0px'</code></td><td>Margin grown/shrunk around the root before computing intersection.</td></tr>
          <tr><td><code>threshold</code></td><td><code>number | number[]</code></td><td><code>0</code></td><td>Visibility ratio(s) at which the observer fires.</td></tr>
          <tr><td><code>once</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Emit the first time the host becomes visible, then disconnect.</td></tr>
          <tr><td><code>(mkIntersect)</code></td><td><code>boolean</code></td><td>—</td><td>The host's <code>isIntersecting</code> state on every change; also readable as <code>intersecting()</code> via <code>exportAs</code>.</td></tr>
        </tbody>
      </table>

      <!-- infinite scroll -->
      <h2>Infinite scroll</h2>
      <p>
        <code class="docs-inline">mkInfiniteScroll</code> emits
        <code class="docs-inline">(mkInfiniteScroll)</code> when its scroll
        container nears the bottom, so you can load the next page. It fires once
        per approach and re-arms after you scroll back up.
        <code class="docs-inline">disabled</code> pauses it while loading or when
        everything is loaded. Loaded <strong>{{ feedItems().length }}</strong> of
        60 items.
      </p>
      <docs-example [code]="infiniteCode" [column]="true">
        <div
          class="feed"
          mkInfiniteScroll
          [distance]="80"
          [disabled]="feedDone()"
          (mkInfiniteScroll)="loadMore()"
        >
          @for (n of feedItems(); track n) {
            <div class="feed-item">Item #{{ n }}</div>
          }
          @if (feedDone()) {
            <div class="feed-end">— end —</div>
          }
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>distance</code></td><td><code>number</code></td><td><code>200</code></td><td>Distance (px) from the bottom at which the output fires.</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Pause firing — e.g. while a page loads or when everything is loaded.</td></tr>
          <tr><td><code>(mkInfiniteScroll)</code></td><td><code>void</code></td><td>—</td><td>Fires once per approach to the bottom; re-arms after scrolling away.</td></tr>
        </tbody>
      </table>

      <!-- ripple -->
      <h2>Ripple</h2>
      <p>
        <code class="docs-inline">mkRipple</code> adds a Material-style press
        ripple to any surface. It makes the host a positioned, clipping container
        and paints a short-lived wave from the pointer;
        <code class="docs-inline">mkRippleCentered</code> starts from the middle,
        <code class="docs-inline">mkRippleColor</code> tints it, and it respects
        reduced-motion. Press the surfaces below.
      </p>
      <docs-example [code]="rippleCode" [column]="true">
        <div class="ripple-demo">
          <button mkButton mkRipple>Button</button>
          <div class="ripple-tile" mkRipple mkRippleColor="var(--mk-primary)">
            Card surface
          </div>
          <ul class="ripple-list">
            <li mkRipple>Inbox</li>
            <li mkRipple>Archive</li>
            <li mkRipple>Trash</li>
          </ul>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkRippleColor</code></td><td><code>string</code></td><td><code>''</code></td><td>Wave color (any CSS color). Defaults to the host's <code>currentColor</code>.</td></tr>
          <tr><td><code>mkRippleCentered</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Start every ripple from the center instead of the pointer.</td></tr>
          <tr><td><code>mkRippleDisabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Turn the effect off.</td></tr>
        </tbody>
      </table>

      <!-- mask -->
      <h2>Input mask</h2>
      <p>
        <code class="docs-inline">mkMask</code> formats an input as you type
        against a token pattern — <code class="docs-inline">0</code> = digit,
        <code class="docs-inline">A</code> = letter,
        <code class="docs-inline">*</code> = alphanumeric; any other character is
        an inserted literal. Read the raw value with
        <code class="docs-inline">(unmaskedChange)</code>.
      </p>
      <docs-example [code]="maskCode" [column]="true">
        <div class="mask-demo">
          <input mkInput mkMask="(000) 000-0000" placeholder="(___) ___-____"
            (unmaskedChange)="phone.set($event)" />
          <input mkInput mkMask="0000 0000 0000 0000" placeholder="Card number" />
          <input mkInput mkMask="00/00/0000" placeholder="DD/MM/YYYY" />
          <p class="echo">Raw phone: {{ phone() || '—' }}</p>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkMask</code></td><td><code>string</code></td><td>required</td><td>The token pattern: <code>0</code> digit, <code>A</code> letter, <code>*</code> alphanumeric; other characters are literals.</td></tr>
          <tr><td><code>(maskedChange)</code></td><td><code>string</code></td><td>—</td><td>The formatted value, on every change.</td></tr>
          <tr><td><code>(unmaskedChange)</code></td><td><code>string</code></td><td>—</td><td>The raw value (token characters only), on every change.</td></tr>
        </tbody>
      </table>

      <!-- hotkeys -->
      <h2>Hotkeys</h2>
      <p>
        <code class="docs-inline">[mkHotkey]</code> binds a keyboard shortcut to
        an element via <code class="docs-inline">MkHotkeysService</code>: a
        <code class="docs-inline">&lt;button&gt;</code> host is clicked when the
        combo fires, any other host emits
        <code class="docs-inline">(mkHotkeyPressed)</code>. Use
        <code class="docs-inline">mod</code> for ⌘ on Mac / Ctrl elsewhere, and
        space-separated chords like <code class="docs-inline">g h</code>. By
        default shortcuts are ignored while you type in an input (opt in with
        <code class="docs-inline">mkHotkeyAllowInInput</code>). Try
        <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd>, then press <kbd>g</kbd> then
        <kbd>h</kbd>.
      </p>
      <docs-example [code]="hotkeysCode" [column]="true">
        <div class="hotkey-demo">
          <button mkButton mkHotkey="mod+k" (click)="onHotkey('mod+k')">
            Search (⌘K)
          </button>
          <button
            mkButton
            variant="outline"
            mkHotkey="g h"
            (click)="onHotkey('g h')"
          >
            Go home (g h)
          </button>
        </div>
        <p class="echo">Last shortcut: {{ lastHotkey() || '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkHotkey</code></td><td><code>string</code></td><td>required</td><td>The combo or space-separated chord to bind, e.g. <code>mod+k</code>, <code>g h</code>, <code>?</code>.</td></tr>
          <tr><td><code>mkHotkeyAllowInInput</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Fire even while an editable field is focused.</td></tr>
          <tr><td><code>mkHotkeyPreventDefault</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Call <code>preventDefault()</code> when the hotkey fires.</td></tr>
          <tr><td><code>(mkHotkeyPressed)</code></td><td><code>KeyboardEvent</code></td><td>—</td><td>Fires when the combo triggers and the host is not a button/link (those are clicked instead).</td></tr>
        </tbody>
      </table>
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
      .io-demo {
        height: 12rem;
        overflow-y: auto;
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
      }
      .io-hint {
        height: 14rem;
        margin: 0;
        display: grid;
        place-items: center;
        color: var(--mk-text-subtle);
      }
      .io-target {
        margin: 0 var(--mk-space-4) var(--mk-space-4);
        padding: var(--mk-space-6);
        display: grid;
        place-items: center;
        font-weight: var(--mk-font-weight-semibold);
        color: var(--mk-text-muted);
        background: var(--mk-surface-2);
        border-radius: var(--mk-radius-md);
        opacity: 0;
        transform: translateY(1rem);
        transition:
          opacity var(--mk-duration-slow, 400ms) var(--mk-ease-standard),
          transform var(--mk-duration-slow, 400ms) var(--mk-ease-standard);
      }
      .io-target--in {
        opacity: 1;
        transform: none;
        color: var(--mk-success);
      }
      .feed {
        height: 14rem;
        overflow-y: auto;
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
      }
      .feed-item {
        padding: var(--mk-space-3) var(--mk-space-4);
        border-bottom: var(--mk-border-width) solid var(--mk-border-subtle);
      }
      .feed-end {
        padding: var(--mk-space-4);
        text-align: center;
        color: var(--mk-text-subtle);
      }
      .ripple-demo {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: var(--mk-space-4);
      }
      .ripple-tile {
        display: grid;
        place-items: center;
        width: 10rem;
        height: 5rem;
        color: var(--mk-text);
        background: var(--mk-surface);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        cursor: pointer;
        user-select: none;
      }
      .ripple-list {
        margin: 0;
        padding: 0;
        list-style: none;
        width: 12rem;
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        overflow: hidden;
      }
      .ripple-list li {
        padding: var(--mk-space-3) var(--mk-space-4);
        border-bottom: var(--mk-border-width) solid var(--mk-border-subtle);
        cursor: pointer;
        user-select: none;
      }
      .ripple-list li:last-child {
        border-bottom: 0;
      }
      .mask-demo {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-3);
        max-width: 20rem;
      }
      .hotkey-demo {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-3);
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

  // --- Infinite scroll ------------------------------------------------------
  protected readonly feedItems = signal<number[]>(
    Array.from({ length: 20 }, (_, i) => i + 1),
  );
  protected readonly feedDone = computed(() => this.feedItems().length >= 60);

  protected loadMore(): void {
    const start = this.feedItems().length;
    if (start >= 60) return;
    this.feedItems.update((items) => [
      ...items,
      ...Array.from({ length: 10 }, (_, i) => start + i + 1),
    ]);
  }

  protected readonly intersectCode = `<div class="target" mkIntersect once
  #io="mkIntersect" [class.in-view]="io.intersecting()">
  {{ io.intersecting() ? 'In view' : 'Out of view' }}
</div>`;

  protected readonly infiniteCode = `<div class="feed" mkInfiniteScroll
  [disabled]="loading() || done()" (mkInfiniteScroll)="loadMore()">
  @for (item of items(); track item.id) { … }
</div>`;

  protected readonly rippleCode = `<button mkButton mkRipple>Button</button>

<div class="tile" mkRipple mkRippleColor="var(--mk-primary)">Card</div>

<li mkRipple>Inbox</li>`;

  protected readonly phone = signal('');
  protected readonly maskCode = `<input mkInput mkMask="(000) 000-0000"
  (unmaskedChange)="phone.set($event)" />

<input mkInput mkMask="0000 0000 0000 0000" />   <!-- card -->
<input mkInput mkMask="00/00/0000" />            <!-- date -->`;

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

  // --- Hotkeys --------------------------------------------------------------
  protected readonly lastHotkey = signal('');

  protected onHotkey(name: string): void {
    this.lastHotkey.set(name);
  }

  // On a <button>/<a> host, [mkHotkey] click()s the host, so wire (click);
  // other hosts emit (mkHotkeyPressed). mod = ⌘ on Mac / Ctrl elsewhere.
  // Note: the browser may swallow real Ctrl+K, but most combos reach the handler.
  protected readonly hotkeysCode = `<!-- button host: the hotkey clicks it, so listen on (click) -->
<button mkButton mkHotkey="mod+k" (click)="onHotkey('mod+k')">Search (⌘K)</button>

<!-- a two-step chord: press g, then h -->
<button mkButton mkHotkey="g h" (click)="onHotkey('g h')">Go home</button>

<!-- non-button host emits (mkHotkeyPressed) instead -->
<div mkHotkey="?" (mkHotkeyPressed)="showHelp()">…</div>`;
}
