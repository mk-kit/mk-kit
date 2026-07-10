import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkAutosize,
  MkFormField,
  MkInput,
  MkNumberInput,
  MkOtp,
  MkPasswordInput,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the TEXT INPUT components of `@mkornas/ui`:
 * Input/Textarea, Textarea autosize, Password input, Number input and OTP/PIN input.
 */
@Component({
  selector: 'docs-text-inputs-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkFormField,
    MkInput,
    MkAutosize,
    MkPasswordInput,
    MkNumberInput,
    MkOtp,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Text inputs</h1>
      <p class="docs-lead">
        Text-entry controls: the <code class="docs-inline">mkInput</code> styling
        directive for native inputs and textareas, autosizing textareas, a password
        field with strength meter, a numeric spinbutton and a segmented OTP/PIN
        field. Every control implements
        <code class="docs-inline">ControlValueAccessor</code>, so it works with
        <code class="docs-inline">[(ngModel)]</code>, reactive forms and native
        <code class="docs-inline">[(value)]</code> bindings — and each one wires
        itself to a wrapping <code class="docs-inline">&lt;mk-form-field&gt;</code>
        automatically.
      </p>

      <!-- ============================================================ -->
      <!-- INPUT & TEXTAREA -->
      <!-- ============================================================ -->
      <h2>Input &amp; Textarea</h2>
      <p>
        <code class="docs-inline">mkInput</code> is an attribute-selector applied to
        a native <code class="docs-inline">&lt;input&gt;</code> or
        <code class="docs-inline">&lt;textarea&gt;</code>, so all native semantics,
        keyboard behaviour and form integration come for free — it only layers on
        tokenised styling and aria state. Standalone it accepts
        <code class="docs-inline">size</code> and <code class="docs-inline">invalid</code>;
        inside a form field it inherits both.
      </p>

      <docs-example [code]="inputCode" [column]="true">
        <input mkInput placeholder="Small" size="sm" [(ngModel)]="name" />
        <input mkInput placeholder="Medium (default)" [(ngModel)]="name" />
        <input mkInput placeholder="Large" size="lg" [(ngModel)]="name" />
        <input mkInput placeholder="Invalid" [invalid]="true" />
        <p class="echo">Name: {{ name() || '—' }}</p>
      </docs-example>

      <docs-example [code]="textareaCode" [column]="true">
        <textarea mkInput rows="4" placeholder="Your message…" [(ngModel)]="message"></textarea>
        <p class="echo">{{ message().length }} characters</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored (inherited) inside an mk-form-field.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid visual + aria-invalid when used standalone.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- TEXTAREA AUTOSIZE -->
      <!-- ============================================================ -->
      <h2>Textarea autosize</h2>
      <p>
        <code class="docs-inline">mkAutosize</code> grows a
        <code class="docs-inline">&lt;textarea&gt;</code> to fit its content,
        between <code class="docs-inline">mkAutosizeMinRows</code> and
        <code class="docs-inline">mkAutosizeMaxRows</code>. Type to watch it grow.
      </p>
      <docs-example [code]="autosizeCode" [column]="true">
        <textarea
          mkInput
          mkAutosize
          [mkAutosizeMinRows]="2"
          [mkAutosizeMaxRows]="8"
          [mkAutosizeValue]="note()"
          placeholder="Type a few lines…"
          [(ngModel)]="note"
          style="width: 100%; max-width: 30rem;"
        ></textarea>
      </docs-example>

      <!-- ============================================================ -->
      <!-- PASSWORD INPUT -->
      <!-- ============================================================ -->
      <h2>Password input</h2>
      <p>
        <code class="docs-inline">&lt;mk-password-input&gt;</code> is a password
        field with a reveal toggle (show/hide the characters), an optional 0–4
        strength meter and an optional rules checklist that ticks off as the
        password grows. It implements
        <code class="docs-inline">ControlValueAccessor</code> over a string with a
        two-way <code class="docs-inline">[(value)]</code> model and, inside an
        <code class="docs-inline">&lt;mk-form-field&gt;</code>, wires its label,
        description and validity automatically.
      </p>

      <docs-example [code]="passwordCode" [column]="true">
        <div style="max-width: 26rem; width: 100%;">
          <mk-password-input
            [(value)]="password"
            showStrength
            showRules
            [minLength]="10"
            placeholder="Create a password"
          />
        </div>
        <mk-form-field label="Password" style="max-width: 26rem; width: 100%;">
          <mk-password-input [(value)]="password" [minLength]="10" placeholder="Create a password" />
        </mk-form-field>
        <p class="echo">{{ password().length }} characters</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string&gt;</td><td>''</td><td>Two-way password value ([(value)] / [(ngModel)]).</td></tr>
          <tr><td>placeholder</td><td>string</td><td>''</td><td>Placeholder shown when empty.</td></tr>
          <tr><td>showStrength</td><td>boolean</td><td>false</td><td>Show the 0–4 strength meter below the field.</td></tr>
          <tr><td>showRules</td><td>boolean</td><td>false</td><td>Show the rules checklist below the field.</td></tr>
          <tr><td>minLength</td><td>number</td><td>8</td><td>Minimum length used by the strength score and rules.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling when standalone.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- NUMBER INPUT -->
      <!-- ============================================================ -->
      <h2>Number input</h2>
      <p>
        <code class="docs-inline">&lt;mk-number-input&gt;</code> is a numeric field
        with −/+ steppers, clamping and Arrow-key stepping
        (<code class="docs-inline">spinbutton</code>).
      </p>
      <docs-example [code]="numberCode" [column]="true">
        <mk-number-input [(value)]="qty" [min]="0" [max]="20" [step]="1" />
        <p class="echo">Quantity: {{ qty() ?? '—' }}</p>
      </docs-example>

      <!-- ============================================================ -->
      <!-- OTP / PIN INPUT -->
      <!-- ============================================================ -->
      <h2>OTP / PIN input</h2>
      <p>
        <code class="docs-inline">&lt;mk-otp&gt;</code> is a segmented one-time-code
        field: auto-advance, Backspace-to-previous, Arrow navigation and full-code
        paste.
      </p>
      <docs-example [code]="otpCode" [column]="true">
        <mk-otp [(value)]="otp" [length]="6" />
        <p class="echo">Code: {{ otp() || '—' }}</p>
      </docs-example>
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
export class TextInputsPage {
  // --- Input & Textarea -------------------------------------------------------
  protected readonly name = signal('');
  protected readonly message = signal('');

  // --- Autosize ---------------------------------------------------------------
  protected readonly note = signal('');

  // --- Password input ---------------------------------------------------------
  protected readonly password = signal('');

  // --- Number / OTP -----------------------------------------------------------
  protected readonly qty = signal<number | null>(1);
  protected readonly otp = signal('');

  // --- Code snippets (plain strings shown in the code blocks) -----------------
  protected readonly inputCode = `<input mkInput placeholder="Small" size="sm" [(ngModel)]="name" />
<input mkInput placeholder="Medium (default)" [(ngModel)]="name" />
<input mkInput placeholder="Large" size="lg" [(ngModel)]="name" />
<input mkInput placeholder="Invalid" [invalid]="true" />`;

  protected readonly textareaCode = `<textarea mkInput rows="4" placeholder="Your message…" [(ngModel)]="message"></textarea>`;

  protected readonly autosizeCode = `<textarea mkInput mkAutosize [mkAutosizeMaxRows]="8"
  [mkAutosizeValue]="note()" [(ngModel)]="note"></textarea>`;

  protected readonly passwordCode = `<mk-password-input
  [(value)]="password"
  showStrength
  showRules
  [minLength]="10"
  placeholder="Create a password" />

<mk-form-field label="Password">
  <mk-password-input [(value)]="password" [minLength]="10" placeholder="Create a password" />
</mk-form-field>`;

  protected readonly numberCode = `<mk-number-input [(value)]="qty" [min]="0" [max]="20" [step]="1" />`;
  protected readonly otpCode = `<mk-otp [(value)]="code" [length]="6" />`;
}
