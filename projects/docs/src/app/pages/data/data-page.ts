import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkCarousel,
  MkCarouselSlide,
  MkCode,
  MkCountdown,
  MkDiff,
  MkInput,
  MkKanban,
  MkQrCode,
  type MkKanbanColumn,
  MkVirtualScroll,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Data display components demo page — Code block, Virtual scroll, Carousel,
 * Diff, QR code, Kanban and Countdown.
 */
@Component({
  selector: 'docs-data-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkCode,
    MkCountdown,
    MkInput,
    MkKanban,
    MkQrCode,
    MkVirtualScroll,
    MkCarousel,
    MkCarouselSlide,
    MkDiff,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Data display</h1>
      <p class="docs-lead">
        Rich content renderers for specialised data: syntax-highlighted code
        blocks, a virtualised list for huge datasets, a carousel, text diffs,
        SVG QR codes, a drag-and-drop kanban board and a live countdown. Every
        component is themed with
        <code class="docs-inline">--mk-*</code> tokens and ships with sensible
        accessibility defaults.
      </p>

      <h2>Code block</h2>
      <p>
        <code class="docs-inline">&lt;mk-code&gt;</code> is a read-only, themed code
        block with syntax highlighting, an optional filename header, line numbers
        and a copy button (it reuses the tokenizer + copy directive).
      </p>
      <docs-example [code]="codeBlockCode" [column]="true">
        <mk-code
          language="json"
          filename="config.json"
          [lineNumbers]="true"
          [code]="sampleJson"
        />
      </docs-example>

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

      <h2>Carousel</h2>
      <p>
        <code class="docs-inline">&lt;mk-carousel&gt;</code> is an accessible
        slides/gallery — prev/next arrows, dot indicators, Arrow-key navigation
        and optional autoplay (pauses on hover/focus). Mark each slide with
        <code class="docs-inline">mkCarouselSlide</code>.
      </p>
      <docs-example [code]="carouselCode" [column]="true">
        <div style="max-width: 30rem; width: 100%;">
          <mk-carousel ariaLabel="Highlights">
            @for (c of slides; track c.title) {
              <div mkCarouselSlide [style.background]="c.bg" style="padding: var(--mk-space-8) var(--mk-space-4); text-align: center; color: #fff;">
                <h3 style="margin: 0 0 var(--mk-space-1);">{{ c.title }}</h3>
                <p style="margin: 0; opacity: 0.85;">{{ c.body }}</p>
              </div>
            }
          </mk-carousel>
        </div>
      </docs-example>

      <h2>Diff</h2>
      <p>
        <code class="docs-inline">&lt;mk-diff&gt;</code> compares two versions of
        text (a revision "before → after") with an LCS line diff and intra-line
        word highlighting. Render <code class="docs-inline">unified</code>
        (single column, +/−) or <code class="docs-inline">split</code>
        (side-by-side).
      </p>
      <docs-example [code]="diffCode" [column]="true">
        <div style="display: flex; flex-direction: column; gap: var(--mk-space-4); width: 100%;">
          <mk-diff [before]="diffBefore" [after]="diffAfter" />
          <mk-diff [before]="diffBefore" [after]="diffAfter" mode="split" beforeLabel="v3" afterLabel="v4" />
        </div>
      </docs-example>

      <!-- =========================== QR CODE ========================= -->
      <h2>QR code</h2>
      <p>
        <code class="docs-inline">&lt;mk-qr-code&gt;</code> renders a QR code as
        crisp SVG — no dependencies (the encoder, Reed–Solomon ECC and masking are
        implemented in-house). Set <code class="docs-inline">value</code>,
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

      <!-- =========================== KANBAN ========================== -->
      <h2>Kanban</h2>
      <p>
        <code class="docs-inline">&lt;mk-kanban&gt;</code> is a board of columns
        whose cards are <strong>draggable between columns</strong> (and reorderable
        within one) with both pointer and keyboard dragging. Bind
        <code class="docs-inline">columns</code> two-way — the model is updated
        immutably on every drop — and listen to
        <code class="docs-inline">cardMoved</code> for move events.
      </p>
      <docs-example [code]="kanbanCode" [column]="true">
        <mk-kanban [(columns)]="board" style="width: 100%" />
      </docs-example>

      <!-- ========================== COUNTDOWN ======================== -->
      <h2>Countdown</h2>
      <p>
        <code class="docs-inline">&lt;mk-countdown&gt;</code> counts down
        <strong>live</strong>, ticking every second toward a target
        <code class="docs-inline">to</code> date and showing the remaining days,
        hours, minutes and seconds. It emits
        <code class="docs-inline">finished</code> once the instant passes.
      </p>
      <docs-example [code]="countdownCode" [column]="true">
        <mk-countdown [to]="launchDate" />
      </docs-example>
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
  protected readonly sampleJson =
    '{\n  "theme": "dark",\n  "retries": 3,\n  "features": ["search", "export"]\n}';
  protected readonly bigList = Array.from({ length: 10000 }, (_, i) => ({
    name: `Item number ${i + 1}`,
  }));
  protected readonly slides = [
    { title: 'Fast', body: 'Signals + OnPush everywhere.', bg: 'var(--mk-primary)' },
    { title: 'Accessible', body: 'WCAG 2.1 AA out of the box.', bg: 'var(--mk-success)' },
    { title: 'Themeable', body: 'Every colour is a CSS variable.', bg: 'var(--mk-info)' },
  ];

  // ----- Kanban --------------------------------------------------------
  protected readonly board = signal<MkKanbanColumn[]>([
    {
      id: 'todo',
      title: 'To do',
      cards: [
        { id: 't1', title: 'Draft release notes' },
        { id: 't2', title: 'Audit colour tokens' },
        { id: 't3', title: 'Write kanban docs' },
      ],
    },
    {
      id: 'doing',
      title: 'In progress',
      cards: [
        { id: 'd1', title: 'Ship countdown component' },
        { id: 'd2', title: 'Review DnD a11y' },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      cards: [
        { id: 'x1', title: 'Set up docs site' },
        { id: 'x2', title: 'Publish v1 to npm' },
      ],
    },
  ]);

  protected readonly kanbanCode = `<mk-kanban [(columns)]="board" (cardMoved)="onMoved($event)" />`;

  // ----- Countdown -----------------------------------------------------
  /** A few days out; computed at construction so SSR/build stays stable. */
  protected readonly launchDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  protected readonly countdownCode = `<mk-countdown [to]="launchDate" (finished)="onLaunch()" />`;

  protected readonly codeBlockCode = `<mk-code language="json" filename="config.json"
  lineNumbers [code]="json" />`;
  protected readonly virtualScrollCode = `<mk-virtual-scroll [items]="rows" [itemHeight]="36"
  style="height: 16rem;">
  <ng-template let-row let-i="index">#{{ '{{ i }}' }} — {{ '{{ row.name }}' }}</ng-template>
</mk-virtual-scroll>`;
  protected readonly carouselCode = `<mk-carousel ariaLabel="Highlights">
  <div mkCarouselSlide>…</div>
  <div mkCarouselSlide>…</div>
</mk-carousel>`;

  protected readonly diffBefore = `title: Getting started
theme: light
retries: 3
Draft the quick brown fox.`;
  protected readonly diffAfter = `title: Getting started
theme: dark
retries: 5
Draft the slow brown fox.
published: true`;
  protected readonly diffCode = `<mk-diff [before]="v1" [after]="v2" />
<mk-diff [before]="v1" [after]="v2" mode="split" />`;

  // ----- QR code -------------------------------------------------------
  protected readonly qrValue = signal('https://github.com/mkornas/mk-kit');
  protected readonly qrCode = `<mk-qr-code value="https://example.com" ecc="M" [size]="160" />`;
}
