import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import {
  MkButton,
  MkHovercard,
  MkHovercardTrigger,
  MkPopconfirm,
  MkPopconfirmTrigger,
  MkPopover,
  MkPopoverTrigger,
  MkTooltip,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation page for the anchored floating components: Tooltip, Popover,
 * Popconfirm, and Hovercard.
 */
@Component({
  selector: 'docs-popovers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkButton,
    MkTooltip,
    MkPopover,
    MkPopoverTrigger,
    MkPopconfirm,
    MkPopconfirmTrigger,
    MkHovercard,
    MkHovercardTrigger,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Tooltips &amp; popovers</h1>
      <p class="docs-lead">
        Floating content anchored to a trigger:
        <code class="docs-inline">Tooltip</code>s on hover/focus, click-opened
        <code class="docs-inline">Popover</code> panels, inline
        <code class="docs-inline">Popconfirm</code> confirmations, and rich
        <code class="docs-inline">Hovercard</code> previews — all rendered in
        the top layer and fully accessible.
      </p>

      <!-- =========================== TOOLTIP =========================== -->
      <h2>Tooltip</h2>
      <p>
        The <code class="docs-inline">[mkTooltip]</code> directive shows a themed
        tooltip on hover <em>and</em> keyboard focus, hides on blur, mouse-leave,
        or <kbd>Escape</kbd>, and wires the trigger to the tooltip via
        <code class="docs-inline">aria-describedby</code>. Set
        <code class="docs-inline">mkTooltipPlacement</code> to position it.
        Hover or focus the buttons below.
      </p>
      <docs-example [code]="tooltipCode">
        <button mkButton variant="ghost" [mkTooltip]="'Appears on top'">
          Top
        </button>
        <button
          mkButton
          variant="ghost"
          [mkTooltip]="'Appears below'"
          mkTooltipPlacement="bottom"
        >
          Bottom
        </button>
        <button
          mkButton
          variant="ghost"
          [mkTooltip]="'To the left'"
          mkTooltipPlacement="left"
        >
          Left
        </button>
        <button
          mkButton
          variant="ghost"
          [mkTooltip]="'To the right'"
          mkTooltipPlacement="right"
        >
          Right
        </button>
        <span
          class="docs-tip-target"
          tabindex="0"
          [mkTooltip]="'Works on any focusable element'"
          mkTooltipPlacement="bottom-start"
        >
          Any element
        </span>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr>
            <th>Input</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">mkTooltip</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">''</code></td>
            <td>Tooltip text. When empty the tooltip is suppressed.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkTooltipPlacement</code></td>
            <td><code class="docs-inline">MkPlacement</code></td>
            <td><code class="docs-inline">'top'</code></td>
            <td>
              top | top-start | top-end | bottom | bottom-start | bottom-end |
              left | right.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ============================ POPOVER ============================ -->
      <h2>Popover</h2>
      <p>
        <code class="docs-inline">&lt;mk-popover&gt;</code> is a non-modal floating
        panel for rich content, opened by click via
        <code class="docs-inline">mkPopoverTriggerFor</code>. It renders in the top
        layer (never clipped), moves focus inside on open, and closes on Escape,
        outside click or Tabbing out.
      </p>
      <docs-example [code]="popoverCode">
        <button mkButton variant="outline" [mkPopoverTriggerFor]="info">
          Shipping details
        </button>
        <mk-popover #info ariaLabel="Shipping details">
          <h4 style="margin: 0 0 var(--mk-space-1);">Free shipping</h4>
          <p style="margin: 0; color: var(--mk-text-muted); font-size: var(--mk-font-size-sm);">
            Orders over $50 ship free and arrive in 2–3 business days.
          </p>
        </mk-popover>
      </docs-example>

      <!-- ============================ POPCONFIRM ============================ -->
      <h2>Popconfirm</h2>
      <p>
        <code class="docs-inline">&lt;mk-popconfirm&gt;</code> is an inline
        confirmation popover for row-level destructive actions — lighter than a
        modal dialog. It emits <code class="docs-inline">(confirm)</code> and
        <code class="docs-inline">(cancel)</code> (the latter also on Escape or
        outside click).
      </p>
      <docs-example [code]="popconfirmCode">
        <button mkButton tone="danger" [mkPopconfirmFor]="del">Delete item</button>
        <mk-popconfirm
          #del
          title="Delete item?"
          message="This can’t be undone."
          confirmText="Delete"
          (confirm)="onDeleted()"
        />
        <p class="echo">{{ deleteStatus() }}</p>
      </docs-example>

      <!-- ============================ HOVERCARD ============================ -->
      <h2>Hovercard</h2>
      <p>
        <code class="docs-inline">&lt;mk-hovercard&gt;</code> is a rich hover
        preview (in the spirit of GitHub user cards), opened on hover/focus of a
        trigger via <code class="docs-inline">[mkHovercardFor]</code>. Unlike a
        tooltip it projects arbitrary content; unlike a popover it opens on hover
        after a short delay and stays open while you move onto the card. Hover the
        mention below.
      </p>
      <docs-example [code]="hovercardCode">
        <p style="margin: 0;">
          Reviewed by
          <a href="#" class="docs-mention" [mkHovercardFor]="ada">@ada</a>
          two hours ago.
        </p>
        <mk-hovercard #ada ariaLabel="Ada Lovelace">
          <div class="docs-hovercard">
            <span class="docs-hovercard-avatar" aria-hidden="true">AL</span>
            <div>
              <strong class="docs-hovercard-name">Ada Lovelace</strong>
              <span class="docs-hovercard-role">Principal Engineer · Core</span>
              <p class="docs-hovercard-bio">
                Works on the compiler and analytical engine. Occasionally writes
                the first program.
              </p>
            </div>
          </div>
        </mk-hovercard>
      </docs-example>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .docs-tip-target {
        display: inline-flex;
        align-items: center;
        padding: var(--mk-space-2) var(--mk-space-3);
        border: 1px dashed var(--mk-border);
        border-radius: var(--mk-radius-md);
        color: var(--mk-text-muted);
        cursor: help;
      }
      .docs-tip-target:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
      .docs-mention {
        color: var(--mk-primary);
        font-weight: var(--mk-font-weight-medium);
        text-decoration: none;
      }
      .docs-mention:hover {
        text-decoration: underline;
      }
      .docs-hovercard {
        display: flex;
        gap: var(--mk-space-3);
        max-width: 20rem;
      }
      .docs-hovercard-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--mk-radius-full);
        background: var(--mk-primary);
        color: var(--mk-primary-contrast);
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-bold);
      }
      .docs-hovercard-name {
        display: block;
      }
      .docs-hovercard-role {
        display: block;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .docs-hovercard-bio {
        margin: var(--mk-space-2) 0 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class PopoversPage {
  protected readonly deleteStatus = signal('Nothing deleted yet.');

  protected onDeleted(): void {
    this.deleteStatus.set('Item deleted ✓');
  }

  // --------------------------- Code snippets ---------------------------
  protected readonly tooltipCode = `<button mkButton [mkTooltip]="'Appears on top'">Top</button>

<button mkButton [mkTooltip]="'Appears below'" mkTooltipPlacement="bottom">
  Bottom
</button>

<!-- Works on any focusable element -->
<span tabindex="0" [mkTooltip]="'Works anywhere'" mkTooltipPlacement="right">
  Any element
</span>`;

  protected readonly popoverCode = `<button mkButton [mkPopoverTriggerFor]="info">Shipping details</button>
<mk-popover #info ariaLabel="Shipping details">
  <h4>Free shipping</h4>
  <p>Orders over $50 ship free and arrive in 2–3 business days.</p>
</mk-popover>`;

  protected readonly popconfirmCode = `<button mkButton tone="danger" [mkPopconfirmFor]="del">Delete item</button>
<mk-popconfirm #del title="Delete item?" message="This can’t be undone."
  confirmText="Delete" (confirm)="onDeleted()" />`;

  protected readonly hovercardCode = `<a href="/u/ada" [mkHovercardFor]="ada">@ada</a>
<mk-hovercard #ada ariaLabel="Ada Lovelace">
  <div class="card">
    <span class="avatar">AL</span>
    <div>
      <strong>Ada Lovelace</strong>
      <span>Principal Engineer · Core</span>
      <p>Works on the compiler and analytical engine.</p>
    </div>
  </div>
</mk-hovercard>`;
}
