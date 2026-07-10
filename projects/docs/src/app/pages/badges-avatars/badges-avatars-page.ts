import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MkAvatar, MkAvatarGroup, MkBadge, MkChip, MkTag } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Badges & labels demo page — Badge, Tag, Chip and Avatar.
 */
@Component({
  selector: 'docs-badges-avatars-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkAvatar, MkAvatarGroup, MkBadge, MkChip, MkTag],
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
