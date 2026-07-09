import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MkButton } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

@Component({
  selector: 'docs-buttons-page',
  imports: [MkButton, DocsExample],
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
        <button mkButton iconOnly aria-label="Add item">＋</button>
        <button mkButton iconOnly variant="soft" tone="neutral" aria-label="Settings">⚙</button>
        <button mkButton iconOnly variant="ghost" tone="danger" aria-label="Delete">🗑</button>
        <button mkButton iconOnly size="lg" tone="success" aria-label="Confirm">✓</button>
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

  protected readonly iconCode = `<button mkButton iconOnly aria-label="Add item">＋</button>
<button mkButton iconOnly variant="soft" tone="neutral" aria-label="Settings">⚙</button>
<button mkButton iconOnly variant="ghost" tone="danger" aria-label="Delete">🗑</button>`;

  protected readonly stateCode = `<button mkButton fullWidth tone="primary">Full width</button>
<button mkButton disabled>Disabled</button>
<a mkButton variant="link" href="/docs">Anchor button</a>`;
}
