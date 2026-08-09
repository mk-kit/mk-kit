import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MkCountdown, MkInput, MkQrCode, MkVirtualScroll } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Misc display components demo page — Countdown, QR code and Virtual scroll.
 * The former residents of this page moved to their own homes: Kanban to
 * `/components/kanban`, the code/diff/JSON-viewer trio to
 * `/components/markdown` and the Carousel to `/components/images`.
 */
@Component({
  selector: 'docs-data-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, RouterLink, MkCountdown, MkInput, MkQrCode, MkVirtualScroll],
  template: `
    <div class="docs-page docs-container">
      <h1>Misc display</h1>
      <p class="docs-lead">
        Specialised display components that don't belong to a bigger family: a
        live <strong>countdown</strong>, dependency-free SVG
        <strong>QR codes</strong> and a <strong>virtual scroll</strong> list
        for huge datasets. Each ships with a pure, standalone helper
        (<code class="docs-inline">mkSplitDuration</code>,
        <code class="docs-inline">mkEncodeQr</code>) and is themed with
        <code class="docs-inline">--mk-*</code> tokens.
      </p>

      <!-- ========================== COUNTDOWN ======================== -->
      <h2>Countdown</h2>
      <p>
        <code class="docs-inline">&lt;mk-countdown&gt;</code> counts down
        <strong>live</strong>, ticking every second toward a target
        <code class="docs-inline">to</code> date and showing the remaining days,
        hours, minutes and seconds. It emits
        <code class="docs-inline">finished</code> once the instant passes, stops
        ticking while the tab is hidden (resyncing on return) and re-arms when
        <code class="docs-inline">to</code> moves into the future again.
      </p>
      <docs-example [code]="countdownCode" [column]="true">
        <mk-countdown [to]="launchDate" />
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>to</code></td><td><code>Date | null</code></td><td><code>null</code></td><td>The target instant to count down to.</td></tr>
          <tr><td><code>showDays</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the days segment; when off, days roll into the hours value.</td></tr>
          <tr><td><code>showLabels</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the textual label beneath each value.</td></tr>
          <tr><td><code>pad</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Zero-pad values to two digits.</td></tr>
          <tr><td><code>finishedText</code></td><td><code>string</code></td><td><code>''</code></td><td>Text to show instead of zeros once the countdown finishes.</td></tr>
          <tr><td><code>(finished)</code></td><td><code>void</code></td><td>—</td><td>Fires exactly once when the target instant is reached.</td></tr>
        </tbody>
      </table>
      <p>
        The splitter is exported standalone:
        <code class="docs-inline">mkSplitDuration(ms)</code> turns a
        millisecond duration into
        <code class="docs-inline">{{ '{' }} days, hours, minutes, seconds {{ '}' }}</code>
        (negative inputs clamp to zero). Screen readers get a polite live
        region that only announces on minute rollovers — never every second.
      </p>

      <!-- =========================== QR CODE ========================= -->
      <h2>QR code</h2>
      <p>
        <code class="docs-inline">&lt;mk-qr-code&gt;</code> renders a QR code as
        crisp SVG — no dependencies (the encoder, Reed–Solomon ECC and masking
        are implemented in-house; byte mode / UTF-8, versions 1–10). Set
        <code class="docs-inline">value</code>,
        <code class="docs-inline">ecc</code> (L/M/Q/H) and
        <code class="docs-inline">size</code>; it's theme-aware by default.
      </p>
      <docs-example [code]="qrCode" [column]="true">
        <div style="display: flex; gap: var(--mk-space-6); flex-wrap: wrap; align-items: flex-start;">
          <mk-qr-code [value]="qrValue()" [size]="160" />
          <div style="display: grid; gap: var(--mk-space-2); max-width: 22rem; width: 100%;">
            <input mkInput [value]="qrValue()" (input)="qrValue.set($any($event.target).value)" />
            <p class="echo">Encodes the text above — try editing it.</p>
          </div>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>value</code></td><td><code>string</code></td><td>required</td><td>The text to encode (UTF-8, byte mode).</td></tr>
          <tr><td><code>ecc</code></td><td><code>'L' | 'M' | 'Q' | 'H'</code></td><td><code>'M'</code></td><td>Error-correction level (~7% / ~15% / ~25% / ~30%).</td></tr>
          <tr><td><code>size</code></td><td><code>number</code></td><td><code>160</code></td><td>Rendered pixel size of the (square) SVG.</td></tr>
          <tr><td><code>quietZone</code></td><td><code>number</code></td><td><code>4</code></td><td>Light margin around the code, in modules (spec recommends 4).</td></tr>
          <tr><td><code>color</code></td><td><code>string</code></td><td><code>'var(--mk-text)'</code></td><td>Dark-module colour.</td></tr>
          <tr><td><code>background</code></td><td><code>string</code></td><td><code>'var(--mk-surface)'</code></td><td>Background / quiet-zone colour.</td></tr>
          <tr><td><code>label</code></td><td><code>string</code></td><td><code>''</code></td><td>Accessible label; when omitted it carries the encoded content ("QR code: …").</td></tr>
        </tbody>
      </table>
      <p>
        The encoder is exported standalone:
        <code class="docs-inline">mkEncodeQr(value, ecc)</code> returns the raw
        module matrix (<code class="docs-inline">boolean[][]</code>,
        <code class="docs-inline">true</code> = dark) for custom renderers.
      </p>

      <!-- ======================== VIRTUAL SCROLL ===================== -->
      <h2>Virtual scroll</h2>
      <p>
        <code class="docs-inline">&lt;mk-virtual-scroll&gt;</code> renders only the
        rows visible in the viewport (plus a small overscan), so a list of
        thousands of fixed-height items stays smooth. Give the host a height and a
        row template. This list has <strong>10,000 rows</strong>.
      </p>
      <docs-example [code]="virtualScrollCode" [column]="true">
        <mk-virtual-scroll
          [items]="bigList"
          [itemHeight]="36"
          style="height: 16rem; width: 100%; border: var(--mk-border-width) solid var(--mk-border); border-radius: var(--mk-radius-md);"
        >
          <ng-template let-row let-i="index">
            <div style="display: flex; gap: var(--mk-space-3); align-items: center; height: 100%; padding: 0 var(--mk-space-3); border-bottom: var(--mk-border-width) solid var(--mk-border-subtle);">
              <span style="color: var(--mk-text-subtle); width: 4rem; font-variant-numeric: tabular-nums;">#{{ i }}</span>
              <span>{{ row.name }}</span>
            </div>
          </ng-template>
        </mk-virtual-scroll>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>items</code></td><td><code>readonly unknown[]</code></td><td><code>[]</code></td><td>The full list of items.</td></tr>
          <tr><td><code>itemHeight</code></td><td><code>number</code></td><td><code>40</code></td><td>Fixed height of each row in px.</td></tr>
          <tr><td><code>overscan</code></td><td><code>number</code></td><td><code>4</code></td><td>Extra rows rendered above/below the viewport to smooth fast scrolls.</td></tr>
          <tr><td><code>ng-template</code></td><td>slot</td><td>—</td><td>The row template: <code>&lt;ng-template let-row let-i="index"&gt;</code>.</td></tr>
        </tbody>
      </table>

      <!-- ========================= MOVED SECTIONS ==================== -->
      <h2>Kanban</h2>
      <p>
        The drag-and-drop <code class="docs-inline">&lt;mk-kanban&gt;</code>
        board — pointer, touch and keyboard dragging, custom card templates —
        has its own page now.
        <a routerLink="/components/kanban">See the Kanban docs →</a>
      </p>

      <h2>Code block, diff &amp; JSON viewer</h2>
      <p>
        <code class="docs-inline">&lt;mk-code&gt;</code>,
        <code class="docs-inline">&lt;mk-diff&gt;</code> and
        <code class="docs-inline">&lt;mk-json-viewer&gt;</code> moved to the
        Code &amp; content page, alongside the code editor and markdown.
        <a routerLink="/components/markdown">See the Code &amp; content docs →</a>
      </p>

      <h2>Carousel</h2>
      <p>
        <code class="docs-inline">&lt;mk-carousel&gt;</code> lives with the
        rest of the media components now.
        <a routerLink="/components/images">See the Images &amp; lightbox docs →</a>
      </p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      h2 {
        margin-top: var(--mk-space-9, 3rem);
      }
    `,
  ],
})
export class DataPage {
  protected readonly bigList = Array.from({ length: 10000 }, (_, i) => ({
    name: `Item number ${i + 1}`,
  }));

  // ----- Countdown -----------------------------------------------------
  /** A few days out; computed at construction so SSR/build stays stable. */
  protected readonly launchDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  protected readonly countdownCode = `<mk-countdown [to]="launchDate" (finished)="onLaunch()" />`;

  protected readonly virtualScrollCode = `<mk-virtual-scroll [items]="rows" [itemHeight]="36"
  style="height: 16rem;">
  <ng-template let-row let-i="index">#{{ '{{ i }}' }} — {{ '{{ row.name }}' }}</ng-template>
</mk-virtual-scroll>`;

  // ----- QR code -------------------------------------------------------
  protected readonly qrValue = signal('https://github.com/mkornas/mk-kit');
  protected readonly qrCode = `<mk-qr-code value="https://example.com" ecc="M" [size]="160" />`;
}
