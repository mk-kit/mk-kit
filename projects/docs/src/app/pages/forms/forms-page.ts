import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkCheckbox,
  MkFormField,
  MkInput,
  MkRadio,
  MkRadioGroup,
  MkSelect,
  type MkSelectOption,
  MkSlider,
  MkSwitch,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the FORM components of `@mkornas/ui`:
 * FormField, Input/Textarea, Select, Checkbox, Radio group, Switch and Slider.
 */
@Component({
  selector: 'docs-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkFormField,
    MkInput,
    MkSelect,
    MkCheckbox,
    MkRadioGroup,
    MkRadio,
    MkSwitch,
    MkSlider,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Forms</h1>
      <p class="docs-lead">
        Accessible, signal-driven form controls. Every control implements
        <code class="docs-inline">ControlValueAccessor</code> and exposes a
        two-way model, so it works with <code class="docs-inline">[(ngModel)]</code>,
        reactive forms and native <code class="docs-inline">[(value)]</code> /
        <code class="docs-inline">[(checked)]</code> bindings. Wrap any control in
        <code class="docs-inline">&lt;mk-form-field&gt;</code> for a real
        <code class="docs-inline">&lt;label&gt;</code>, hint, error and required
        wiring — done automatically via dependency injection.
      </p>

      <!-- ============================================================ -->
      <!-- FORM FIELD -->
      <!-- ============================================================ -->
      <h2>FormField</h2>
      <p>
        <code class="docs-inline">&lt;mk-form-field&gt;</code> is the accessible
        wrapper: it renders a real <code class="docs-inline">&lt;label for&gt;</code>,
        an optional hint, a required indicator and a
        <code class="docs-inline">role="alert"</code> error region. Nested controls
        adopt its id, <code class="docs-inline">aria-describedby</code>,
        <code class="docs-inline">aria-invalid</code> and size automatically.
      </p>

      <docs-example [code]="formFieldCode" [column]="true">
        <mk-form-field
          label="Email"
          hint="We never share it."
          required
          [error]="emailError()"
        >
          <input mkInput type="email" placeholder="you@example.com" [(ngModel)]="email" />
        </mk-form-field>
        <p class="echo">Value: {{ email() || '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>label</td><td>string</td><td>''</td><td>Visible label, rendered as a real &lt;label for&gt;.</td></tr>
          <tr><td>hint</td><td>string</td><td>''</td><td>Helper text below the control (hidden while an error shows).</td></tr>
          <tr><td>error</td><td>string | null</td><td>null</td><td>Error message; non-empty marks the field invalid.</td></tr>
          <tr><td>required</td><td>boolean</td><td>false</td><td>Adds a required indicator + aria-required.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Visually reflect a disabled control.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size; nested controls inherit it.</td></tr>
        </tbody>
      </table>

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
      <!-- SELECT -->
      <!-- ============================================================ -->
      <h2>Select</h2>
      <p>
        <code class="docs-inline">&lt;mk-select&gt;</code> is a fully custom,
        accessible single-select implementing the ARIA listbox/combobox pattern.
        Options are supplied via the <code class="docs-inline">options</code> input.
        Keyboard: Up/Down to move, Home/End to jump, Enter/Space to select, Esc to
        close, plus typeahead.
      </p>

      <docs-example [code]="selectCode" [column]="true">
        <mk-select placeholder="Pick a role" [options]="roleOptions" [(value)]="role" />
        <p class="echo">Selected: {{ role() ?? '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>options</td><td>readonly MkSelectOption[]</td><td>[]</td><td>List of &#123; label, value, disabled? &#125; options.</td></tr>
          <tr><td>placeholder</td><td>string</td><td>'Select…'</td><td>Shown when nothing is selected.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling + aria-invalid when standalone.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>value</td><td>model&lt;unknown&gt;</td><td>null</td><td>Two-way selected value ([(value)] / [(ngModel)]).</td></tr>
        </tbody>
      </table>

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

      <!-- ============================================================ -->
      <!-- SLIDER -->
      <!-- ============================================================ -->
      <h2>Slider</h2>
      <p>
        <code class="docs-inline">&lt;mk-slider&gt;</code> is a single-value range
        slider with <code class="docs-inline">role="slider"</code>, a filled track and
        a draggable thumb. Keyboard: Arrows step, Page Up/Down take larger steps,
        Home/End jump to the bounds. Two-way via
        <code class="docs-inline">[(value)]</code>.
      </p>

      <docs-example [code]="sliderCode" [column]="true">
        <mk-slider [min]="0" [max]="100" [step]="5" [(value)]="volume" aria-label="Volume" />
        <p class="echo">Volume: {{ volume() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>min</td><td>number</td><td>0</td><td>Minimum value.</td></tr>
          <tr><td>max</td><td>number</td><td>100</td><td>Maximum value.</td></tr>
          <tr><td>step</td><td>number</td><td>1</td><td>Step increment (must be &gt; 0).</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Track/thumb thickness.</td></tr>
          <tr><td>tone</td><td>MkTone</td><td>'primary'</td><td>Semantic color of the filled track + thumb.</td></tr>
          <tr><td>aria-label</td><td>string</td><td>''</td><td>Accessible label for the thumb.</td></tr>
          <tr><td>value</td><td>model&lt;number&gt;</td><td>0</td><td>Two-way current value.</td></tr>
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
export class FormsPage {
  // --- FormField / Input ----------------------------------------------------
  protected readonly email = signal('');
  protected readonly emailError = computed(() => {
    const v = this.email();
    if (!v) return null;
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : 'Enter a valid email address.';
  });
  protected readonly name = signal('');
  protected readonly message = signal('');

  // --- Select ---------------------------------------------------------------
  protected readonly roleOptions: readonly MkSelectOption[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' },
    { label: 'Owner (locked)', value: 'owner', disabled: true },
  ];
  protected readonly role = signal<unknown>(null);

  // --- Checkbox -------------------------------------------------------------
  protected readonly accepted = signal(false);
  protected readonly newsletter = signal(true);

  // --- Radio ----------------------------------------------------------------
  protected readonly plan = signal<unknown>('free');

  // --- Switch ---------------------------------------------------------------
  protected readonly notify = signal(true);
  protected readonly dark = signal(false);

  // --- Slider ---------------------------------------------------------------
  protected readonly volume = signal(40);

  // --- Code snippets (plain strings shown in the code blocks) ---------------
  protected readonly formFieldCode = `<mk-form-field
  label="Email"
  hint="We never share it."
  required
  [error]="emailError()"
>
  <input mkInput type="email" placeholder="you@example.com" [(ngModel)]="email" />
</mk-form-field>`;

  protected readonly inputCode = `<input mkInput placeholder="Small" size="sm" [(ngModel)]="name" />
<input mkInput placeholder="Medium (default)" [(ngModel)]="name" />
<input mkInput placeholder="Large" size="lg" [(ngModel)]="name" />
<input mkInput placeholder="Invalid" [invalid]="true" />`;

  protected readonly textareaCode = `<textarea mkInput rows="4" placeholder="Your message…" [(ngModel)]="message"></textarea>`;

  protected readonly selectCode = `roleOptions: MkSelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Owner (locked)', value: 'owner', disabled: true },
];

<mk-select placeholder="Pick a role" [options]="roleOptions" [(value)]="role" />`;

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

  protected readonly sliderCode = `<mk-slider [min]="0" [max]="100" [step]="5" [(value)]="volume" aria-label="Volume" />`;
}
