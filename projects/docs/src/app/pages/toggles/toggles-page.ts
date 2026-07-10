import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MkCheckbox, MkRadio, MkRadioGroup, MkSwitch } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the TOGGLE components of `@mkornas/ui`:
 * Checkbox, Radio group and Switch.
 */
@Component({
  selector: 'docs-toggles-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkCheckbox, MkRadioGroup, MkRadio, MkSwitch],
  template: `
    <div class="docs-page docs-container">
      <h1>Toggles &amp; switches</h1>
      <p class="docs-lead">
        On/off and pick-one controls: checkbox, radio group and switch. Every
        control implements <code class="docs-inline">ControlValueAccessor</code>
        and exposes a two-way model, so it works with
        <code class="docs-inline">[(ngModel)]</code>, reactive forms and native
        <code class="docs-inline">[(checked)]</code> /
        <code class="docs-inline">[(value)]</code> bindings — all built on native
        keyboard semantics with semantic tones and sizes.
      </p>

      <!-- ============================================================ -->
      <!-- CHECKBOX -->
      <!-- ============================================================ -->
      <h2>Checkbox</h2>
      <p>
        <code class="docs-inline">&lt;mk-checkbox&gt;</code> wraps a visually-hidden
        native <code class="docs-inline">input[type=checkbox]</code> (native keyboard
        + form semantics) with a custom box. Supports an
        <code class="docs-inline">indeterminate</code> ("mixed") state, a two-way
        <code class="docs-inline">[(checked)]</code> model and semantic tones.
      </p>

      <docs-example [code]="checkboxCode" [column]="true">
        <mk-checkbox [(checked)]="accepted">Accept terms</mk-checkbox>
        <mk-checkbox [(checked)]="newsletter" tone="success">Subscribe to newsletter</mk-checkbox>
        <mk-checkbox [checked]="true" disabled>Disabled &amp; checked</mk-checkbox>
        <p class="echo">Accepted: {{ accepted() }} · Newsletter: {{ newsletter() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>checked</td><td>model&lt;boolean&gt;</td><td>false</td><td>Two-way checked state.</td></tr>
          <tr><td>indeterminate</td><td>model&lt;boolean&gt;</td><td>false</td><td>Two-way "mixed" state; cleared when the user toggles.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>required</td><td>boolean</td><td>false</td><td>Mark required (adds aria-required).</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size.</td></tr>
          <tr><td>tone</td><td>MkTone</td><td>'primary'</td><td>Semantic color of the checked box.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- RADIO GROUP -->
      <!-- ============================================================ -->
      <h2>Radio group</h2>
      <p>
        <code class="docs-inline">&lt;mk-radio-group&gt;</code> is an ARIA
        <code class="docs-inline">radiogroup</code> coordinating projected
        <code class="docs-inline">&lt;mk-radio&gt;</code> children with roving tabindex
        and Arrow-key navigation (wrapping, skipping disabled). It holds the value;
        each radio contributes its <code class="docs-inline">value</code>.
      </p>

      <docs-example [code]="radioCode" [column]="true">
        <mk-radio-group [(value)]="plan" aria-label="Plan" orientation="horizontal">
          <mk-radio [value]="'free'">Free</mk-radio>
          <mk-radio [value]="'pro'">Pro</mk-radio>
          <mk-radio [value]="'team'" [disabled]="true">Team (soon)</mk-radio>
        </mk-radio-group>
        <p class="echo">Plan: {{ plan() ?? '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Component</th><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>mk-radio-group</td><td>value</td><td>model&lt;unknown&gt;</td><td>null</td><td>Two-way selected value.</td></tr>
          <tr><td>mk-radio-group</td><td>disabled</td><td>boolean</td><td>false</td><td>Disable the whole group.</td></tr>
          <tr><td>mk-radio-group</td><td>required</td><td>boolean</td><td>false</td><td>Mark required (aria-required).</td></tr>
          <tr><td>mk-radio-group</td><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Size applied to all child radios.</td></tr>
          <tr><td>mk-radio-group</td><td>tone</td><td>MkTone</td><td>'primary'</td><td>Tone applied to all child radios.</td></tr>
          <tr><td>mk-radio-group</td><td>name</td><td>string</td><td>auto</td><td>Shared name grouping (defaults to a generated id).</td></tr>
          <tr><td>mk-radio-group</td><td>orientation</td><td>'horizontal' | 'vertical'</td><td>'vertical'</td><td>Layout + arrow-key mapping.</td></tr>
          <tr><td>mk-radio</td><td>value</td><td>unknown</td><td>null</td><td>Value contributed to the group when selected.</td></tr>
          <tr><td>mk-radio</td><td>disabled</td><td>boolean</td><td>false</td><td>Disable just this radio.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- SWITCH -->
      <!-- ============================================================ -->
      <h2>Switch</h2>
      <p>
        <code class="docs-inline">&lt;mk-switch&gt;</code> is a toggle with
        <code class="docs-inline">role="switch"</code> and an animated knob, operable
        with Space/Enter. It projects its label and exposes a two-way
        <code class="docs-inline">[(checked)]</code> model.
      </p>

      <docs-example [code]="switchCode" [column]="true">
        <mk-switch [(checked)]="notify">Email notifications</mk-switch>
        <mk-switch [(checked)]="dark" tone="success" size="lg">Dark mode</mk-switch>
        <p class="echo">Notify: {{ notify() }} · Dark: {{ dark() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>checked</td><td>model&lt;boolean&gt;</td><td>false</td><td>Two-way on/off state.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size.</td></tr>
          <tr><td>tone</td><td>MkTone</td><td>'primary'</td><td>Semantic color of the "on" track.</td></tr>
          <tr><td>aria-label</td><td>string</td><td>''</td><td>Accessible label when no text is projected.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .echo {
        margin: 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class TogglesPage {
  // --- Checkbox -------------------------------------------------------------
  protected readonly accepted = signal(false);
  protected readonly newsletter = signal(true);

  // --- Radio ----------------------------------------------------------------
  protected readonly plan = signal<unknown>('free');

  // --- Switch ---------------------------------------------------------------
  protected readonly notify = signal(true);
  protected readonly dark = signal(false);

  // --- Code snippets (plain strings shown in the code blocks) ---------------
  protected readonly checkboxCode = `<mk-checkbox [(checked)]="accepted">Accept terms</mk-checkbox>
<mk-checkbox [(checked)]="newsletter" tone="success">Subscribe to newsletter</mk-checkbox>
<mk-checkbox [checked]="true" disabled>Disabled &amp; checked</mk-checkbox>`;

  protected readonly radioCode = `<mk-radio-group [(value)]="plan" aria-label="Plan" orientation="horizontal">
  <mk-radio [value]="'free'">Free</mk-radio>
  <mk-radio [value]="'pro'">Pro</mk-radio>
  <mk-radio [value]="'team'" [disabled]="true">Team (soon)</mk-radio>
</mk-radio-group>`;

  protected readonly switchCode = `<mk-switch [(checked)]="notify">Email notifications</mk-switch>
<mk-switch [(checked)]="dark" tone="success" size="lg">Dark mode</mk-switch>`;
}
