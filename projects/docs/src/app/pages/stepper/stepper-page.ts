import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkButton,
  MkCheckbox,
  MkFormField,
  MkInput,
  MkStep,
  MkStepper,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `<mk-stepper>` / `<mk-step>`
 * navigation components of `@mk-kit/ui`.
 */
@Component({
  selector: 'docs-stepper-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkStepper,
    MkStep,
    MkButton,
    MkFormField,
    MkInput,
    MkCheckbox,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Stepper</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-stepper&gt;</code> walks a user through
        an ordered sequence of <code class="docs-inline">&lt;mk-step&gt;</code>s.
        The header rail is an ARIA <code class="docs-inline">tablist</code> with
        roving tabindex (Arrow / Home / End); the body is a single visible panel.
        Move with the <code class="docs-inline">next()</code> /
        <code class="docs-inline">previous()</code> /
        <code class="docs-inline">reset()</code> API or by clicking a reachable
        step.
      </p>

      <!-- ============================================================ -->
      <h2>Horizontal</h2>
      <p>
        The default. Bind <code class="docs-inline">[(selectedIndex)]</code> and
        drive movement with buttons.
      </p>
      <docs-example [code]="horizontalCode" column>
        <div style="width: 100%;">
          <mk-stepper #s [(selectedIndex)]="index">
            <mk-step label="Account" description="Your login">
              <p>Step one — create your account.</p>
            </mk-step>
            <mk-step label="Profile" description="About you">
              <p>Step two — tell us about yourself.</p>
            </mk-step>
            <mk-step label="Done">
              <p>All set! Review and finish.</p>
            </mk-step>
          </mk-stepper>
          <div style="display: flex; gap: var(--mk-space-2); margin-top: var(--mk-space-3);">
            <button mkButton variant="outline" (click)="s.previous()">Back</button>
            <button mkButton (click)="s.next()">Next</button>
            <button mkButton variant="ghost" (click)="s.reset()">Reset</button>
          </div>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Linear &amp; validated</h2>
      <p>
        With <code class="docs-inline">linear</code> a step is only reachable
        once every earlier required step reports
        <code class="docs-inline">completed</code>. Bind
        <code class="docs-inline">[completed]</code> to your form state — the
        header shows a ✓ and later steps unlock. Optional steps can be skipped.
      </p>
      <docs-example [code]="linearCode" column>
        <div style="width: 100%; max-width: 30rem;">
          <mk-stepper #ls linear [(selectedIndex)]="lIndex">
            <mk-step label="Name" [completed]="!!name()">
              <mk-form-field label="Full name" required>
                <input mkInput [(ngModel)]="name" placeholder="Ada Lovelace" />
              </mk-form-field>
            </mk-step>
            <mk-step label="Terms" [completed]="accepted()">
              <mk-checkbox [(checked)]="accepted">
                I accept the terms
              </mk-checkbox>
            </mk-step>
            <mk-step label="Newsletter" optional>
              <p>Optional — you can skip this step.</p>
            </mk-step>
            <mk-step label="Finish">
              <p>🎉 Complete.</p>
            </mk-step>
          </mk-stepper>
          <div style="display: flex; gap: var(--mk-space-2); margin-top: var(--mk-space-3);">
            <button mkButton variant="outline" (click)="ls.previous()">Back</button>
            <button mkButton (click)="ls.next()">Next</button>
          </div>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Vertical</h2>
      <p>Set <code class="docs-inline">orientation="vertical"</code>.</p>
      <docs-example [code]="verticalCode" column>
        <div style="width: 100%; max-width: 26rem;">
          <mk-stepper orientation="vertical" [(selectedIndex)]="vIndex">
            <mk-step label="Order placed" description="We got it">
              <p>Your order has been received.</p>
            </mk-step>
            <mk-step label="Packed" description="In the warehouse">
              <p>Items packed and labelled.</p>
            </mk-step>
            <mk-step label="Shipped" description="On the way">
              <p>Out for delivery.</p>
            </mk-step>
          </mk-stepper>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>API</h2>

      <h3><code class="docs-inline">&lt;mk-stepper&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>selectedIndex</code></td><td><code>model&lt;number&gt;</code></td><td><code>0</code></td><td>Zero-based index of the active step (two-way).</td></tr>
          <tr><td><code>orientation</code></td><td><code>'horizontal' | 'vertical'</code></td><td><code>'horizontal'</code></td><td>Header rail orientation.</td></tr>
          <tr><td><code>linear</code></td><td><code>boolean</code></td><td><code>false</code></td><td>A step is only reachable once every earlier required step is completed.</td></tr>
          <tr><td><code>(selectionChange)</code></td><td><code>output&lt;number&gt;</code></td><td>—</td><td>Emits the newly selected index whenever the active step changes.</td></tr>
          <tr><td><code>next()</code> / <code>previous()</code></td><td><code>method</code></td><td>—</td><td>Move to the adjacent step (forward only if reachable).</td></tr>
          <tr><td><code>reset()</code></td><td><code>method</code></td><td>—</td><td>Return to the first step and clear every step's completed flag.</td></tr>
        </tbody>
      </table>

      <h3><code class="docs-inline">&lt;mk-step&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>label</code></td><td><code>string</code></td><td><code>''</code></td><td>Title shown in the step header.</td></tr>
          <tr><td><code>description</code></td><td><code>string</code></td><td><code>''</code></td><td>Optional secondary line under the label.</td></tr>
          <tr><td><code>completed</code></td><td><code>model&lt;boolean&gt;</code></td><td><code>false</code></td><td>Marks the step complete (two-way; drives linear gating and the ✓).</td></tr>
          <tr><td><code>optional</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Skippable in a <code>linear</code> stepper.</td></tr>
          <tr><td><code>hasError</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Shows the error state in the header (e.g. failed validation).</td></tr>
          <tr><td><code>editable</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Allow returning to this step after it is completed.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard (header rail)</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>→</kbd> / <kbd>↓</kbd></td><td>Focus and select the next reachable step (wraps).</td></tr>
          <tr><td><kbd>←</kbd> / <kbd>↑</kbd></td><td>Focus and select the previous reachable step (wraps).</td></tr>
          <tr><td><kbd>Home</kbd></td><td>Jump to the first reachable step.</td></tr>
          <tr><td><kbd>End</kbd></td><td>Jump to the last reachable step.</td></tr>
        </tbody>
      </table>
    </div>
  `,
})
export class StepperPage {
  protected readonly index = signal(0);
  protected readonly lIndex = signal(0);
  protected readonly vIndex = signal(1);

  protected readonly name = signal('');
  protected readonly accepted = signal(false);

  protected readonly horizontalCode = `<mk-stepper #s [(selectedIndex)]="index">
  <mk-step label="Account" description="Your login">…</mk-step>
  <mk-step label="Profile" description="About you">…</mk-step>
  <mk-step label="Done">…</mk-step>
</mk-stepper>
<button mkButton (click)="s.previous()">Back</button>
<button mkButton (click)="s.next()">Next</button>`;

  protected readonly linearCode = `<mk-stepper linear [(selectedIndex)]="i">
  <mk-step label="Name" [completed]="!!name()">…</mk-step>
  <mk-step label="Terms" [completed]="accepted()">…</mk-step>
  <mk-step label="Newsletter" optional>…</mk-step>
  <mk-step label="Finish">…</mk-step>
</mk-stepper>`;

  protected readonly verticalCode = `<mk-stepper orientation="vertical" [(selectedIndex)]="i">
  <mk-step label="Order placed" description="We got it">…</mk-step>
  <mk-step label="Packed" description="In the warehouse">…</mk-step>
  <mk-step label="Shipped" description="On the way">…</mk-step>
</mk-stepper>`;
}
