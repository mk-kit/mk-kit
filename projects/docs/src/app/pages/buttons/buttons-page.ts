import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkButton,
  MkMenu,
  MkMenuItem,
  MkSplitButton,
  MkIcon,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

@Component({
  selector: 'docs-buttons-page',
  imports: [MkButton, MkSplitButton, MkMenu, MkMenuItem, DocsExample, MkIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Buttons</h1>
      <p class="docs-lead">
        A single <code class="docs-inline">mkButton</code> attribute enhances any native
        <code class="docs-inline">&lt;button&gt;</code> or
        <code class="docs-inline">&lt;a&gt;</code> — so semantics, keyboard behaviour and
        focus come for free. Five variants × six tones × three sizes, all themed by tokens.
      </p>

      <h2>Variants</h2>
      <p>Choose a visual treatment with the <code class="docs-inline">variant</code> input.</p>
      <docs-example [column]="true" [code]="variantsCode">
        <div class="row">
          <button mkButton variant="solid">Solid</button>
          <button mkButton variant="soft">Soft</button>
          <button mkButton variant="outline">Outline</button>
          <button mkButton variant="ghost">Ghost</button>
          <button mkButton variant="link">Link</button>
        </div>
      </docs-example>

      <h2>Tones</h2>
      <p>Six semantic tones map onto the token color families and adapt to light/dark.</p>
      <docs-example [column]="true" [code]="tonesCode">
        <div class="row">
          <button mkButton tone="primary">Primary</button>
          <button mkButton tone="neutral">Neutral</button>
          <button mkButton tone="success">Success</button>
          <button mkButton tone="warning">Warning</button>
          <button mkButton tone="danger">Danger</button>
          <button mkButton tone="info">Info</button>
        </div>
        <div class="row">
          <button mkButton variant="soft" tone="primary">Primary</button>
          <button mkButton variant="soft" tone="neutral">Neutral</button>
          <button mkButton variant="soft" tone="success">Success</button>
          <button mkButton variant="soft" tone="warning">Warning</button>
          <button mkButton variant="soft" tone="danger">Danger</button>
          <button mkButton variant="soft" tone="info">Info</button>
        </div>
        <div class="row">
          <button mkButton variant="outline" tone="primary">Primary</button>
          <button mkButton variant="outline" tone="neutral">Neutral</button>
          <button mkButton variant="outline" tone="success">Success</button>
          <button mkButton variant="outline" tone="warning">Warning</button>
          <button mkButton variant="outline" tone="danger">Danger</button>
          <button mkButton variant="outline" tone="info">Info</button>
        </div>
      </docs-example>

      <h2>Sizes</h2>
      <docs-example [code]="sizesCode">
        <button mkButton size="sm">Small</button>
        <button mkButton size="md">Medium</button>
        <button mkButton size="lg">Large</button>
      </docs-example>

      <h2>Loading</h2>
      <p>
        <code class="docs-inline">[loading]</code> shows a spinner, sets
        <code class="docs-inline">aria-busy</code> and blocks interaction without
        collapsing the layout. Click to try:
      </p>
      <docs-example [code]="loadingCode">
        <button mkButton tone="primary" [loading]="saving()" (click)="save()">
          {{ saving() ? 'Saving…' : 'Save changes' }}
        </button>
        <button mkButton variant="outline" tone="neutral" [loading]="true">Always loading</button>
      </docs-example>

      <h2>Icon-only</h2>
      <p>
        Set <code class="docs-inline">iconOnly</code> for a square button. Always provide
        an <code class="docs-inline">aria-label</code> so it's announced.
      </p>
      <docs-example [code]="iconCode">
        <button mkButton iconOnly aria-label="Add item"><mk-icon name="plus" /></button>
        <button mkButton iconOnly variant="soft" tone="neutral" aria-label="Settings"><mk-icon name="settings" /></button>
        <button mkButton iconOnly variant="ghost" tone="danger" aria-label="Delete"><mk-icon name="trash" /></button>
        <button mkButton iconOnly size="lg" tone="success" aria-label="Confirm"><mk-icon name="check" /></button>
      </docs-example>

      <h2>Full width & disabled</h2>
      <docs-example [column]="true" [code]="stateCode">
        <button mkButton fullWidth tone="primary">Full width</button>
        <div class="row">
          <button mkButton disabled>Disabled</button>
          <button mkButton variant="soft" disabled>Disabled soft</button>
          <a mkButton variant="link" href="#" >Anchor button</a>
        </div>
      </docs-example>

      <h2>Split button</h2>
      <p>
        <code class="docs-inline">&lt;mk-split-button&gt;</code> pairs a primary
        action with a menu of alternatives. The main segment emits
        <code class="docs-inline">action</code>; the chevron is a menu button for
        the <code class="docs-inline">mk-menu</code> passed in
        <code class="docs-inline">[menu]</code> (ArrowDown / Enter / Space open it
        and focus the first item, Escape closes). Both segments share
        <code class="docs-inline">variant</code>, <code class="docs-inline">tone</code>
        and <code class="docs-inline">size</code>; <code class="docs-inline">loading</code>
        spins the main segment and disables the chevron.
      </p>
      <docs-example [code]="splitCode">
        <mk-split-button [menu]="saveMenu" tone="primary" [loading]="splitSaving()" (action)="splitSave()">
          Save
        </mk-split-button>
        <mk-menu #saveMenu="mkMenu">
          <mk-menu-item (action)="splitStatus.set('Saved as…')">Save as…</mk-menu-item>
          <mk-menu-item (action)="splitStatus.set('Saved as template')">Save as template</mk-menu-item>
          <mk-menu-item danger (action)="splitStatus.set('Discarded')">Discard changes</mk-menu-item>
        </mk-menu>
        <mk-split-button [menu]="exportMenu" variant="outline" tone="neutral" (action)="splitStatus.set('Exported CSV')">
          Export CSV
        </mk-split-button>
        <mk-menu #exportMenu="mkMenu">
          <mk-menu-item (action)="splitStatus.set('Exported JSON')">JSON</mk-menu-item>
          <mk-menu-item (action)="splitStatus.set('Exported PDF')">PDF</mk-menu-item>
        </mk-menu>
        <mk-split-button [menu]="exportMenu" variant="soft" tone="success" size="sm" (action)="splitStatus.set('Published')">
          Publish
        </mk-split-button>
      </docs-example>
      <p class="echo" aria-live="polite">{{ splitStatus() }}</p>

      <table class="docs-props">
        <thead>
          <tr><th>Input / output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>menu</td><td>MkMenu</td><td>required</td><td>The menu the chevron segment opens.</td></tr>
          <tr><td>variant</td><td>'solid' | 'soft' | 'outline' | 'ghost' | 'link'</td><td>'solid'</td><td>Shared by both segments.</td></tr>
          <tr><td>tone</td><td>MkTone</td><td>'primary'</td><td>Shared by both segments.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Shared by both segments.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable both segments.</td></tr>
          <tr><td>loading</td><td>boolean</td><td>false</td><td>Spinner on the main segment; chevron disabled meanwhile.</td></tr>
          <tr><td>fullWidth</td><td>boolean</td><td>false</td><td>Stretch to the container; the main segment grows.</td></tr>
          <tr><td>type</td><td>'button' | 'submit'</td><td>'button'</td><td>Type of the main segment.</td></tr>
          <tr><td>menuLabel</td><td>string</td><td>'More actions'</td><td>Accessible name of the chevron segment (i18n <code>moreActions</code>).</td></tr>
          <tr><td>(action)</td><td>output&lt;void&gt;</td><td>—</td><td>Main segment activated (not while disabled or loading).</td></tr>
        </tbody>
      </table>

      <h2>API</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>variant</code></td><td><code>'solid' | 'soft' | 'outline' | 'ghost' | 'link'</code></td><td><code>'solid'</code></td><td>Visual treatment.</td></tr>
          <tr><td><code>tone</code></td><td><code>'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'</code></td><td><code>'primary'</code></td><td>Semantic color family.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Control size.</td></tr>
          <tr><td><code>loading</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Shows spinner, sets aria-busy, blocks clicks.</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disables the control (native for button, aria for anchor).</td></tr>
          <tr><td><code>iconOnly</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Square icon button (add an aria-label).</td></tr>
          <tr><td><code>fullWidth</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Stretch to container width.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-3);
        align-items: center;
      }
    `,
  ],
})
export class ButtonsPage {
  protected readonly saving = signal(false);

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 1600);
  }

  protected readonly splitStatus = signal('Nothing yet.');
  protected readonly splitSaving = signal(false);
  protected splitSave(): void {
    this.splitSaving.set(true);
    this.splitStatus.set('Saving…');
    setTimeout(() => {
      this.splitSaving.set(false);
      this.splitStatus.set('Saved');
    }, 900);
  }

  protected readonly splitCode = `<mk-split-button [menu]="saveMenu" tone="primary" [loading]="saving()" (action)="save()">
  Save
</mk-split-button>
<mk-menu #saveMenu="mkMenu">
  <mk-menu-item (action)="saveAs()">Save as…</mk-menu-item>
  <mk-menu-item (action)="saveTemplate()">Save as template</mk-menu-item>
  <mk-menu-item danger (action)="discard()">Discard changes</mk-menu-item>
</mk-menu>`;

  protected readonly variantsCode = `<button mkButton variant="solid">Solid</button>
<button mkButton variant="soft">Soft</button>
<button mkButton variant="outline">Outline</button>
<button mkButton variant="ghost">Ghost</button>
<button mkButton variant="link">Link</button>`;

  protected readonly tonesCode = `<button mkButton tone="primary">Primary</button>
<button mkButton tone="success">Success</button>
<button mkButton tone="danger">Danger</button>
<!-- combine with any variant -->
<button mkButton variant="soft" tone="warning">Warning</button>
<button mkButton variant="outline" tone="info">Info</button>`;

  protected readonly sizesCode = `<button mkButton size="sm">Small</button>
<button mkButton size="md">Medium</button>
<button mkButton size="lg">Large</button>`;

  protected readonly loadingCode = `<button mkButton tone="primary" [loading]="saving()" (click)="save()">
  {{ saving() ? 'Saving…' : 'Save changes' }}
</button>`;

  protected readonly iconCode = `<button mkButton iconOnly aria-label="Add item"><mk-icon name="plus" /></button>
<button mkButton iconOnly variant="soft" tone="neutral" aria-label="Settings"><mk-icon name="settings" /></button>
<button mkButton iconOnly variant="ghost" tone="danger" aria-label="Delete"><mk-icon name="trash" /></button>`;

  protected readonly stateCode = `<button mkButton fullWidth tone="primary">Full width</button>
<button mkButton disabled>Disabled</button>
<a mkButton variant="link" href="/docs">Anchor button</a>`;
}
