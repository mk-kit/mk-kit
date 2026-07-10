import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  MkButton,
  MkEmptyState,
  MkTimeline,
  MkTimelineItem,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `mk-empty-state` and `mk-timeline`
 * dashboard components of `@mkornas/ui`.
 */
@Component({
  selector: 'docs-empty-timeline-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkEmptyState, MkTimeline, MkTimelineItem, MkButton],
  template: `
    <div class="docs-page docs-container">
      <h1>Empty state &amp; timeline</h1>
      <p class="docs-lead">
        Two dashboard staples: a centered placeholder for "nothing here yet"
        situations, and a vertical timeline for activity feeds and status.
      </p>

      <!-- ============================================================ -->
      <h2>Empty state</h2>
      <p>
        Give <code class="docs-inline">&lt;mk-empty-state&gt;</code> an
        <code class="docs-inline">icon</code>,
        <code class="docs-inline">title</code> and
        <code class="docs-inline">description</code>, and put call-to-action
        buttons in the <code class="docs-inline">mkEmptyStateActions</code> slot.
      </p>
      <docs-example [code]="emptyCode" column>
        <div style="border: 1px solid var(--mk-border-subtle); border-radius: var(--mk-radius-lg); width: 100%; max-width: 34rem;">
          <mk-empty-state
            icon="search"
            title="No results found"
            description="We couldn't find anything matching your filters. Try broadening your search."
          >
            <button mkButton mkEmptyStateActions variant="outline">Clear filters</button>
            <button mkButton mkEmptyStateActions>New search</button>
          </mk-empty-state>
        </div>
      </docs-example>

      <h3>First-run / empty collection</h3>
      <docs-example [code]="emptyCreateCode" column>
        <div style="border: 1px solid var(--mk-border-subtle); border-radius: var(--mk-radius-lg); width: 100%; max-width: 34rem;">
          <mk-empty-state
            icon="plus"
            title="No projects yet"
            description="Create your first project to get started."
          >
            <button mkButton mkEmptyStateActions>Create project</button>
          </mk-empty-state>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>icon</code></td><td><code>string</code></td><td><code>''</code></td><td>Name of a registered icon shown above the title.</td></tr>
          <tr><td><code>title</code></td><td><code>string</code></td><td><code>''</code></td><td>Main heading, e.g. "No invoices yet".</td></tr>
          <tr><td><code>description</code></td><td><code>string</code></td><td><code>''</code></td><td>Supporting sentence under the title.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Overall scale of the block (icon, spacing, type).</td></tr>
          <tr><td><code>[mkEmptyStateMedia]</code></td><td><code>slot</code></td><td>—</td><td>Custom illustration projected in place of <code>icon</code>.</td></tr>
          <tr><td><code>[mkEmptyStateActions]</code></td><td><code>slot</code></td><td>—</td><td>Call-to-action buttons rendered under the text.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Timeline</h2>
      <p>
        <code class="docs-inline">&lt;mk-timeline&gt;</code> wraps
        <code class="docs-inline">&lt;mk-timeline-item&gt;</code>s, each with a
        tone-coloured marker (optionally an
        <code class="docs-inline">icon</code>),
        <code class="docs-inline">time</code>,
        <code class="docs-inline">heading</code> and projected body.
      </p>
      <docs-example [code]="timelineCode" column>
        <div style="width: 100%; max-width: 32rem;">
          <mk-timeline>
            <mk-timeline-item tone="success" icon="check" time="09:32" heading="Order placed">
              Payment of $128.00 confirmed.
            </mk-timeline-item>
            <mk-timeline-item tone="primary" icon="download" time="11:05" heading="Packed">
              Items packed and labelled in warehouse #3.
            </mk-timeline-item>
            <mk-timeline-item tone="info" time="14:20" heading="Shipped">
              Handed to the courier — tracking #MK-90421.
            </mk-timeline-item>
            <mk-timeline-item tone="neutral" time="Pending" heading="Out for delivery">
              Estimated tomorrow by 6pm.
            </mk-timeline-item>
          </mk-timeline>
        </div>
      </docs-example>

      <h3>Activity feed with tones</h3>
      <docs-example [code]="feedCode" column>
        <div style="width: 100%; max-width: 32rem;">
          <mk-timeline>
            <mk-timeline-item tone="primary" time="2m ago" heading="Ada commented on #482">
              "Looks good — ship it."
            </mk-timeline-item>
            <mk-timeline-item tone="danger" icon="error" time="1h ago" heading="Build failed">
              3 tests failed on <code class="docs-inline">main</code>.
            </mk-timeline-item>
            <mk-timeline-item tone="success" icon="check" time="1h ago" heading="Deploy succeeded">
              v0.1.0 is live in production.
            </mk-timeline-item>
          </mk-timeline>
        </div>
      </docs-example>

      <p>
        <code class="docs-inline">&lt;mk-timeline&gt;</code> itself has no
        inputs — it draws the rail and exposes the list semantics. Each
        <code class="docs-inline">&lt;mk-timeline-item&gt;</code> takes:
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>tone</code></td><td><code>'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'</code></td><td><code>'primary'</code></td><td>Semantic colour of the marker dot.</td></tr>
          <tr><td><code>icon</code></td><td><code>string</code></td><td><code>''</code></td><td>Name of a registered icon rendered inside the marker.</td></tr>
          <tr><td><code>time</code></td><td><code>string</code></td><td><code>''</code></td><td>Time or label shown above the heading (e.g. "09:30", "2m ago").</td></tr>
          <tr><td><code>heading</code></td><td><code>string</code></td><td><code>''</code></td><td>Event title; projected content becomes the body.</td></tr>
        </tbody>
      </table>
    </div>
  `,
})
export class EmptyTimelinePage {
  protected readonly emptyCode = `<mk-empty-state icon="search" title="No results found"
  description="We couldn't find anything matching your filters.">
  <button mkButton mkEmptyStateActions variant="outline">Clear filters</button>
  <button mkButton mkEmptyStateActions>New search</button>
</mk-empty-state>`;

  protected readonly emptyCreateCode = `<mk-empty-state icon="plus" title="No projects yet"
  description="Create your first project to get started.">
  <button mkButton mkEmptyStateActions>Create project</button>
</mk-empty-state>`;

  protected readonly timelineCode = `<mk-timeline>
  <mk-timeline-item tone="success" icon="check" time="09:32" heading="Order placed">
    Payment of $128.00 confirmed.
  </mk-timeline-item>
  <mk-timeline-item tone="info" time="14:20" heading="Shipped">
    Handed to the courier — tracking #MK-90421.
  </mk-timeline-item>
</mk-timeline>`;

  protected readonly feedCode = `<mk-timeline>
  <mk-timeline-item tone="danger" icon="error" time="1h ago" heading="Build failed">
    3 tests failed on main.
  </mk-timeline-item>
  <mk-timeline-item tone="success" icon="check" time="1h ago" heading="Deploy succeeded">
    v0.1.0 is live in production.
  </mk-timeline-item>
</mk-timeline>`;
}
