import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkAvatar,
  MkAvatarGroup,
  MkBadge,
  MkBadgeOverlay,
  MkButton,
  MkChip,
  MkIcon,
  MkTag,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Badges & labels demo page — Badge, Badge overlay, Tag, Chip and Avatar.
 */
@Component({
  selector: 'docs-badges-avatars-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkAvatar,
    MkAvatarGroup,
    MkBadge,
    MkBadgeOverlay,
    MkButton,
    MkChip,
    MkIcon,
    MkTag,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Badges & labels</h1>
      <p class="docs-lead">
        Compact labels and identity marks: badges for counts and status, tags
        for metadata, interactive chips for filters and selections, and avatars
        with initials fallback and grouping. Every component is themed with
        <code class="docs-inline">--mk-*</code> tokens and ships with sensible
        accessibility defaults.
      </p>

      <!-- =========================== BADGE =========================== -->
      <h2>Badge</h2>
      <p>
        A compact status pill for counts or short state labels. Use
        <code class="docs-inline">dot</code> for a minimal notification
        indicator with no text.
      </p>
      <docs-example [code]="badgeCode">
        <mk-badge tone="success">Active</mk-badge>
        <mk-badge tone="warning" variant="soft">Pending</mk-badge>
        <mk-badge tone="danger" variant="solid">3</mk-badge>
        <mk-badge tone="info" variant="outline">Beta</mk-badge>
        <mk-badge tone="danger" dot aria-label="Unread" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'primary'</code></td>
            <td>primary · neutral · success · warning · danger · info</td>
          </tr>
          <tr>
            <td><code class="docs-inline">variant</code></td>
            <td><code class="docs-inline">'solid' | 'soft' | 'outline'</code></td>
            <td><code class="docs-inline">'soft'</code></td>
            <td>Visual treatment.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Size scale.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">dot</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Render as a tiny textless dot.</td>
          </tr>
        </tbody>
      </table>

      <!-- ======================= BADGE OVERLAY ======================= -->
      <h2>Badge overlay</h2>
      <p>
        <code class="docs-inline">[mkBadgeOverlay]</code> anchors a small badge
        — a count, a dot or a short label — to a corner of <em>any</em>
        element: an icon button, an avatar, a tab. The host stays a single tab
        stop; the badge is a decorative child. Counts above
        <code class="docs-inline">mkBadgeOverlayMax</code> (99) collapse to
        <code class="docs-inline">99+</code>, positions use logical insets so
        <code class="docs-inline">top-end</code> flips in RTL, and
        <code class="docs-inline">mkBadgeOverlayAriaLabel</code> is what a
        screen reader hears (wired with
        <code class="docs-inline">aria-describedby</code>, so it is announced
        after the host's own <code class="docs-inline">aria-label</code>).
      </p>
      <docs-example [code]="badgeOverlayCode" column>
        <div style="display: flex; gap: var(--mk-space-5); align-items: center; flex-wrap: wrap">
          <button
            mkButton
            iconOnly
            variant="soft"
            tone="neutral"
            aria-label="Notifications"
            [mkBadgeOverlay]="unread()"
            mkBadgeOverlayTone="danger"
            [mkBadgeOverlayAriaLabel]="unread() + ' unread'"
          >
            <mk-icon name="bell" />
          </button>
          <button
            mkButton
            iconOnly
            variant="soft"
            tone="neutral"
            aria-label="Inbox"
            mkBadgeOverlay="new"
            mkBadgeOverlayTone="info"
            mkBadgeOverlayPosition="top-start"
          >
            <mk-icon name="inbox" />
          </button>
          <button
            mkButton
            iconOnly
            variant="soft"
            tone="neutral"
            aria-label="Messages"
            mkBadgeOverlay
            mkBadgeOverlayDot
            mkBadgeOverlayTone="success"
            mkBadgeOverlayAriaLabel="New messages"
          >
            <mk-icon name="message-square" />
          </button>
          <mk-avatar
            name="Ada Lovelace"
            size="lg"
            [mkBadgeOverlay]="7"
            mkBadgeOverlayTone="primary"
            mkBadgeOverlayPosition="bottom-end"
            mkBadgeOverlayAriaLabel="7 mentions"
          />
          <mk-avatar
            name="Grace Hopper"
            size="lg"
            shape="rounded"
            mkBadgeOverlay
            mkBadgeOverlayDot
            mkBadgeOverlayTone="warning"
            mkBadgeOverlayPosition="bottom-start"
            mkBadgeOverlayAriaLabel="Away"
          />
        </div>
        <div style="display: flex; gap: var(--mk-space-2); align-items: center">
          <button mkButton size="sm" variant="outline" tone="neutral" (click)="unread.set(unread() + 40)">
            +40 unread
          </button>
          <button mkButton size="sm" variant="ghost" tone="neutral" (click)="unread.set(0)">
            Mark all read
          </button>
          <span style="color: var(--mk-text-muted); font-size: var(--mk-font-size-sm)">
            {{ unread() }} unread — a count of 0 hides the badge; over 99 shows "99+".
          </span>
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">mkBadgeOverlay</code></td>
            <td><code class="docs-inline">string | number | null</code></td>
            <td><code class="docs-inline">null</code></td>
            <td>Content. Empty / <code class="docs-inline">null</code> hides the badge (unless <code class="docs-inline">dot</code>).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkBadgeOverlayPosition</code></td>
            <td><code class="docs-inline">'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'</code></td>
            <td><code class="docs-inline">'top-end'</code></td>
            <td>Anchored corner; logical, so it mirrors in RTL.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkBadgeOverlayTone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'primary'</code></td>
            <td>Same tone scale as <code class="docs-inline">mk-badge</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkBadgeOverlayDot</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Textless dot; the content is ignored.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkBadgeOverlayMax</code></td>
            <td><code class="docs-inline">number</code></td>
            <td><code class="docs-inline">99</code></td>
            <td>Numbers above it render as <code class="docs-inline">max+</code>; <code class="docs-inline">0</code> disables the cap.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkBadgeOverlayHidden</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Hide without removing the directive.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkBadgeOverlayAriaLabel</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Screen-reader text ("3 unread"): a visually hidden description on the host. The visible badge becomes <code class="docs-inline">aria-hidden</code>.</td>
          </tr>
        </tbody>
      </table>

      <!-- ============================ TAG ============================ -->
      <h2>Tag</h2>
      <p>
        A non-interactive label for categories, keywords or metadata. For an
        interactive token use <code class="docs-inline">mk-chip</code> instead.
      </p>
      <docs-example [code]="tagCode">
        <mk-tag>Design</mk-tag>
        <mk-tag tone="info" variant="outline">Beta</mk-tag>
        <mk-tag tone="success" variant="solid">Stable</mk-tag>
        <mk-tag tone="warning" size="sm">Draft</mk-tag>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'neutral'</code></td>
            <td>Semantic color tone.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">variant</code></td>
            <td><code class="docs-inline">'solid' | 'soft' | 'outline'</code></td>
            <td><code class="docs-inline">'soft'</code></td>
            <td>Visual treatment.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Size scale.</td>
          </tr>
        </tbody>
      </table>

      <!-- ============================ CHIP =========================== -->
      <h2>Chip</h2>
      <p>
        An interactive, optionally selectable or removable token — ideal for
        filters and active selections. The filters below are wired to component
        state:
        <strong>{{ selectedFilters().join(', ') || 'none selected' }}</strong>.
      </p>
      <docs-example [code]="chipCode" column>
        <div style="display: flex; gap: var(--mk-space-2); flex-wrap: wrap">
          @for (f of filters; track f) {
            <mk-chip
              selectable
              tone="primary"
              [selected]="selectedFilters().includes(f)"
              (selectedChange)="toggleFilter(f, $event)"
            >
              {{ f }}
            </mk-chip>
          }
        </div>
        <mk-chip removable tone="neutral" (removed)="removedNote.set('Removed the token')">
          Removable
        </mk-chip>
        @if (removedNote()) {
          <span style="color: var(--mk-text-muted)">{{ removedNote() }}</span>
        }
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'neutral'</code></td>
            <td>Semantic color tone.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">variant</code></td>
            <td><code class="docs-inline">'solid' | 'soft' | 'outline'</code></td>
            <td><code class="docs-inline">'soft'</code></td>
            <td>Visual treatment.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selectable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Toggle a selected state on click / Enter / Space.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">removable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Show a remove button; Delete/Backspace also remove.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">disabled</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Disable all interaction.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selected</code></td>
            <td><code class="docs-inline">model&lt;boolean&gt;</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Two-way selected state (with <code class="docs-inline">selectedChange</code>).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">removed</code></td>
            <td><code class="docs-inline">output&lt;void&gt;</code></td>
            <td>—</td>
            <td>Emitted when the chip is removed.</td>
          </tr>
        </tbody>
      </table>

      <!-- =========================== AVATAR ========================== -->
      <h2>Avatar</h2>
      <p>
        A user/entity image that falls back to initials derived from
        <code class="docs-inline">name</code>. Wrap several in
        <code class="docs-inline">mk-avatar-group</code> with a
        <code class="docs-inline">max</code> to collapse overflow into a "+N"
        bubble.
      </p>
      <docs-example [code]="avatarCode" column>
        <div style="display: flex; gap: var(--mk-space-3); align-items: center">
          <mk-avatar name="Ada Lovelace" status="online" />
          <mk-avatar name="Grace Hopper" shape="rounded" status="busy" />
          <mk-avatar name="Alan Turing" size="lg" />
        </div>
        <mk-avatar-group [max]="3">
          <mk-avatar name="Ada Lovelace" />
          <mk-avatar name="Grace Hopper" />
          <mk-avatar name="Alan Turing" />
          <mk-avatar name="Katherine Johnson" />
          <mk-avatar name="Edsger Dijkstra" />
        </mk-avatar-group>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">src</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Image URL; auto-falls back on load error.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">name</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Drives initials fallback and default label.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Size scale.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">shape</code></td>
            <td><code class="docs-inline">'circle' | 'rounded'</code></td>
            <td><code class="docs-inline">'circle'</code></td>
            <td>Outline shape.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">status</code></td>
            <td><code class="docs-inline">'online' | 'offline' | 'away' | 'busy'</code></td>
            <td>—</td>
            <td>Presence dot; omit for none.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">max</code> <em>(group)</em></td>
            <td><code class="docs-inline">number</code></td>
            <td>—</td>
            <td>Avatars shown before collapsing to "+N".</td>
          </tr>
        </tbody>
      </table>
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
export class BadgesAvatarsPage {
  // ----- Chip filters --------------------------------------------------
  protected readonly filters = ['Open', 'In progress', 'Closed'];
  protected readonly selectedFilters = signal<string[]>(['Open']);
  protected readonly removedNote = signal('');

  // ----- Badge overlay ---------------------------------------------------
  protected readonly unread = signal(3);

  protected toggleFilter(filter: string, selected: boolean): void {
    this.selectedFilters.update((current) =>
      selected
        ? [...current, filter]
        : current.filter((f) => f !== filter),
    );
  }

  // ----- Code snippets -------------------------------------------------
  protected readonly badgeCode = `<mk-badge tone="success">Active</mk-badge>
<mk-badge tone="warning" variant="soft">Pending</mk-badge>
<mk-badge tone="danger" variant="solid">3</mk-badge>
<mk-badge tone="info" variant="outline">Beta</mk-badge>
<mk-badge tone="danger" dot aria-label="Unread" />`;

  protected readonly badgeOverlayCode = `<!-- count on an icon button -->
<button mkButton iconOnly aria-label="Notifications"
        [mkBadgeOverlay]="unread()" mkBadgeOverlayTone="danger"
        [mkBadgeOverlayAriaLabel]="unread() + ' unread'">
  <mk-icon name="bell" />
</button>

<!-- short label, other corner -->
<button mkButton iconOnly aria-label="Inbox"
        mkBadgeOverlay="new" mkBadgeOverlayTone="info"
        mkBadgeOverlayPosition="top-start">
  <mk-icon name="inbox" />
</button>

<!-- dot only -->
<button mkButton iconOnly aria-label="Messages"
        mkBadgeOverlay mkBadgeOverlayDot mkBadgeOverlayTone="success"
        mkBadgeOverlayAriaLabel="New messages">
  <mk-icon name="message-square" />
</button>

<!-- on an avatar -->
<mk-avatar name="Ada Lovelace" size="lg"
           [mkBadgeOverlay]="7" mkBadgeOverlayPosition="bottom-end"
           mkBadgeOverlayAriaLabel="7 mentions" />`;

  protected readonly tagCode = `<mk-tag>Design</mk-tag>
<mk-tag tone="info" variant="outline">Beta</mk-tag>
<mk-tag tone="success" variant="solid">Stable</mk-tag>
<mk-tag tone="warning" size="sm">Draft</mk-tag>`;

  protected readonly chipCode = `<mk-chip
  selectable
  tone="primary"
  [selected]="active().includes(f)"
  (selectedChange)="toggle(f, $event)">
  {{ f }}
</mk-chip>

<mk-chip removable (removed)="drop()">Removable</mk-chip>`;

  protected readonly avatarCode = `<mk-avatar name="Ada Lovelace" status="online" />
<mk-avatar name="Grace Hopper" shape="rounded" status="busy" />
<mk-avatar name="Alan Turing" size="lg" />

<mk-avatar-group [max]="3">
  <mk-avatar name="Ada Lovelace" />
  <mk-avatar name="Grace Hopper" />
  <mk-avatar name="Alan Turing" />
  <mk-avatar name="Katherine Johnson" />
</mk-avatar-group>`;
}
