import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkButton,
  MkCheckbox,
  MkFormField,
  MkInput,
  MkStep,
  MkStepper,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `<mk-stepper>` / `<mk-step>`
 * navigation components of `@mkornas/ui`.
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
