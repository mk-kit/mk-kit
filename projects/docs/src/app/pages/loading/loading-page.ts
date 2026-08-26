import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  MkChip,
  MkProgressBar,
  MkSkeleton,
  MkSkeletonPreset,
  MkSpinner,
  MkBlockUi,
  MkBlockUiService,
  MkButton,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Loading & progress demo page — Progress bar, Spinner, Skeleton and the
 * skeleton presets.
 */
@Component({
  selector: 'docs-loading-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkChip, MkProgressBar, MkSkeleton, MkSkeletonPreset, MkSpinner, MkBlockUi, MkButton],
  template: `
    <div class="docs-page docs-container">
      <h1>Loading & progress</h1>
      <p class="docs-lead">
        Indicators for pending work: determinate and indeterminate progress
        bars, spinners with screen-reader labels, and skeleton placeholders —
        as a primitive and as ready-made presets. Every component is themed
        with <code class="docs-inline">--mk-*</code> tokens and ships with
        sensible accessibility defaults.
      </p>

      <!-- ======================== PROGRESS BAR ======================= -->
      <h2>Progress bar</h2>
      <p>
        A determinate (0–100) or indeterminate progress indicator with
        <code class="docs-inline">role="progressbar"</code>. The live value below
        is driven by component state:
        <strong>{{ progress() }}%</strong>.
      </p>
      <docs-example [code]="progressCode" column>
        <mk-progress-bar
          [value]="progress()"
          label="Uploading"
          showValue
          style="width: 100%"
        />
        <div style="display: flex; gap: var(--mk-space-2)">
          <mk-chip selectable (selectedChange)="step(-10)">−10</mk-chip>
          <mk-chip selectable (selectedChange)="step(10)">+10</mk-chip>
        </div>
        <mk-progress-bar indeterminate tone="info" label="Loading" style="width: 100%" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">value</code></td>
            <td><code class="docs-inline">number</code></td>
            <td><code class="docs-inline">0</code></td>
            <td>Completion 0–100 (clamped).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">indeterminate</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Animated bar with no known completion.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'primary'</code></td>
            <td>Fill tone.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Track thickness.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">label</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Visible caption; also labels the bar.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">showValue</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Show numeric percentage (determinate only).</td>
          </tr>
        </tbody>
      </table>

      <!-- =========================== SPINNER ========================= -->
      <h2>Spinner</h2>
      <p>
        A circular indeterminate loading indicator with
        <code class="docs-inline">role="status"</code> and a visually-hidden
        label announced to assistive tech.
      </p>
      <docs-example [code]="spinnerCode">
        <mk-spinner size="sm" />
        <mk-spinner />
        <mk-spinner size="lg" tone="neutral" label="Fetching results" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Size scale.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'primary'</code></td>
            <td>Semantic color tone.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">label</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">'Loading'</code></td>
            <td>Visually-hidden status label.</td>
          </tr>
        </tbody>
      </table>

      <!-- ========================== SKELETON ========================= -->
      <h2>Block UI</h2>
      <p>
        <code class="docs-inline">[mkBlockUi]</code> covers any element with a
        translucent panel and a spinner while something is in flight: the
        contents become <code class="docs-inline">inert</code> (no clicks, no
        Tab stops), the host gets <code class="docs-inline">aria-busy</code>,
        and an optional <code class="docs-inline">mkBlockUiMessage</code>
        explains what is happening. <code class="docs-inline">mkBlockUiDelay</code>
        holds it back for fast operations so nothing flashes. For the whole
        page, <code class="docs-inline">MkBlockUiService.block()</code>
        returns a release function and is reference-counted.
      </p>
      <docs-example [code]="blockCode" column>
        <div class="block-demo" [mkBlockUi]="blocking()" mkBlockUiMessage="Refreshing orders…" [mkBlockUiDelay]="150">
          <h3>Orders</h3>
          <p>1,204 open · 86 shipping today · 12 refund requests</p>
          <button mkButton size="sm" variant="outline" tone="neutral">Export</button>
        </div>
        <div style="display: flex; gap: var(--mk-space-2); margin-top: var(--mk-space-3)">
          <button mkButton size="sm" (click)="blockRegion()">Block this card for 2.5 s</button>
          <button mkButton size="sm" variant="outline" tone="neutral" (click)="blockPage()">Block the page for 2 s</button>
        </div>
      </docs-example>

      <h2>Skeleton</h2>
      <p>
        A shimmering placeholder shown while content loads. It is
        <code class="docs-inline">aria-hidden</code>; mark the surrounding region
        <code class="docs-inline">aria-busy="true"</code> so assistive tech knows
        content is pending.
      </p>
      <docs-example [code]="skeletonCode" column>
        <div style="display: flex; gap: var(--mk-space-3); align-items: center; width: 100%">
          <mk-skeleton shape="circle" [width]="40" [height]="40" />
          <div style="flex: 1">
            <mk-skeleton shape="text" [lines]="3" />
          </div>
        </div>
        <mk-skeleton shape="rect" width="100%" [height]="120" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">shape</code></td>
            <td><code class="docs-inline">'text' | 'rect' | 'circle'</code></td>
            <td><code class="docs-inline">'text'</code></td>
            <td>Placeholder geometry.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">width</code></td>
            <td><code class="docs-inline">string | number</code></td>
            <td>—</td>
            <td>Number (px) or any CSS length.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">height</code></td>
            <td><code class="docs-inline">string | number</code></td>
            <td>—</td>
            <td>Number (px) or any CSS length.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">lines</code></td>
            <td><code class="docs-inline">number</code></td>
            <td><code class="docs-inline">1</code></td>
            <td>Line count for <code class="docs-inline">shape="text"</code>.</td>
          </tr>
        </tbody>
      </table>

      <h2>Skeleton presets</h2>
      <p>
        <code class="docs-inline">&lt;mk-skeleton-preset&gt;</code> assembles
        ready-made loading layouts — <code class="docs-inline">paragraph</code>,
        <code class="docs-inline">card</code>, <code class="docs-inline">list</code>
        or <code class="docs-inline">table</code> — from the skeleton primitive.
      </p>
      <docs-example [code]="skeletonPresetCode" [column]="true">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: var(--mk-space-6); width: 100%;">
          <mk-skeleton-preset preset="card" />
          <mk-skeleton-preset preset="list" [rows]="3" />
          <mk-skeleton-preset preset="table" [rows]="3" [columns]="4" />
        </div>
      </docs-example>
    </div>
  `,
  styles: [
    `.block-demo { padding: var(--mk-space-4); border: var(--mk-border-width) solid var(--mk-border); border-radius: var(--mk-radius-lg); } .block-demo h3 { margin: 0 0 var(--mk-space-2); }`,
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
export class LoadingPage {
  private readonly blockUi = inject(MkBlockUiService);
  protected readonly blocking = signal(false);

  protected blockRegion(): void {
    this.blocking.set(true);
    setTimeout(() => this.blocking.set(false), 2500);
  }

  protected blockPage(): void {
    const release = this.blockUi.block('Exporting report…');
    setTimeout(release, 2000);
  }

  protected readonly blockCode = `<mk-card [mkBlockUi]="saving()" mkBlockUiMessage="Saving…">…</mk-card>
<form [mkBlockUi]="submitting()" [mkBlockUiDelay]="300">…</form>

// Whole page, reference-counted
const release = this.blockUi.block('Exporting…');
try { await this.api.export(); } finally { release(); }`;

  // ----- Progress ------------------------------------------------------
  protected readonly progress = signal(40);

  protected step(delta: number): void {
    this.progress.update((v) => Math.min(100, Math.max(0, v + delta)));
  }

  // ----- Code snippets -------------------------------------------------
  protected readonly progressCode = `<mk-progress-bar
  [value]="progress()"
  label="Uploading"
  showValue />

<mk-progress-bar indeterminate tone="info" label="Loading" />`;

  protected readonly spinnerCode = `<mk-spinner size="sm" />
<mk-spinner />
<mk-spinner size="lg" tone="neutral" label="Fetching results" />`;

  protected readonly skeletonCode = `<mk-skeleton shape="circle" [width]="40" [height]="40" />
<mk-skeleton shape="text" [lines]="3" />
<mk-skeleton shape="rect" width="100%" [height]="120" />`;

  protected readonly skeletonPresetCode = `<mk-skeleton-preset preset="card" />
<mk-skeleton-preset preset="list" [rows]="3" />
<mk-skeleton-preset preset="table" [rows]="3" [columns]="4" />`;
}
