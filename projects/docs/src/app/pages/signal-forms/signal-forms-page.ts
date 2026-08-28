import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormField,
  disabled,
  email,
  form,
  min,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import {
  MkButton,
  MkCheckbox,
  MkDynamicSchema,
  MkFormErrorSummary,
  MkFormField,
  MkInput,
  MkNumberInput,
  MkPasswordInput,
  MkSelect,
  type MkSelectOption,
  MkSwitch,
  MkToastService,
  mkDynamicDefaults,
  mkDynamicFormToSignalSchema,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

const COUNTRIES: MkSelectOption[] = [
  { label: 'Poland', value: 'pl' },
  { label: 'Germany', value: 'de' },
  { label: 'Spain', value: 'es' },
];

const KINDS: MkSelectOption[] = [
  { label: 'Person', value: 'person' },
  { label: 'Company', value: 'company' },
];

const CUSTOMER: MkDynamicSchema = {
  fields: [
    { key: 'name', type: 'text', label: 'Full name', required: true, validators: { minLength: 2 } },
    { key: 'kind', type: 'select', label: 'Type', default: 'person', options: KINDS },
    { key: 'company', type: 'text', label: 'Company', required: true, showWhen: { field: 'kind', eq: 'company' } },
    { key: 'seats', type: 'number', label: 'Seats', default: 1, validators: { min: 1, max: 50 } },
    { key: 'newsletter', type: 'switch', label: 'Newsletter', default: true },
  ],
};

const CONTROLS: Array<[string, string, string]> = [
  ['input[mkInput] / textarea[mkInput]', 'native value (string)', 'required, readonly, min/max(length) reach the DOM; use mk-number-input for numeric models'],
  ['mk-number-input · mk-currency-input · mk-numeric-keypad', 'value: number | null', 'min / max from the schema'],
  ['mk-select · mk-autocomplete · mk-listbox · mk-cascader · mk-tree-select', 'value', 'required from the schema'],
  ['mk-multi-select · mk-tag-input · mk-transfer-list', 'value: array', 'use minLength / maxLength — required() accepts an empty array'],
  ['mk-checkbox · mk-switch', 'checked: boolean', 'required() means "must be on"'],
  ['mk-radio-group · mk-button-toggle-group', 'value', 'the field name becomes the radio name'],
  ['mk-slider · mk-range-slider · mk-rating', 'value: number', 'min / max from the schema (rating: max = stars)'],
  ['mk-date-picker · mk-datetime-picker · mk-month-picker · mk-week-picker · mk-calendar · mk-mini-date', 'value: Date | null', 'minDate / maxDate → min / max'],
  ['mk-time-picker', 'value: string | Date | null', 'min / max as HH:mm'],
  ['mk-password-input · mk-otp · phone / postal / IBAN / card / tax-id inputs · mk-color-picker · mk-code-editor · mk-signature-pad · mk-rich-text · mk-block-editor · mk-file-upload', 'value', 'CVA path; invalid gated on touch'],
];

/**
 * Signal Forms docs: a login form bound with `[formField]`, form-field errors
 * on touch, the error summary over a field tree, and a dynamic-form schema
 * converted to a Signal Forms schema.
 */
@Component({
  selector: 'docs-signal-forms-page',
  imports: [
    DocsExample,
    RouterLink,
    JsonPipe,
    FormField,
    MkFormField,
    MkFormErrorSummary,
    MkInput,
    MkPasswordInput,
    MkCheckbox,
    MkSelect,
    MkNumberInput,
    MkSwitch,
    MkButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Signal Forms</h1>
      <p class="docs-lead">
        Angular 22 ships <strong>Signal Forms</strong>
        (<code class="docs-inline">&#64;angular/forms/signals</code>): a
        <code class="docs-inline">form()</code> around a model signal, schema
        rules such as <code class="docs-inline">required()</code> and
        <code class="docs-inline">minLength()</code>, and a
        <code class="docs-inline">[formField]</code> directive that binds one
        field to one control. Every mk-kit control binds with it,
        <code class="docs-inline">&lt;mk-form-field&gt;</code> and
        <code class="docs-inline">&lt;mk-form-error-summary&gt;</code> read the
        field state, and a <a routerLink="/components/dynamic-form">dynamic-form</a>
        schema converts to a Signal Forms schema. Reactive forms and
        <code class="docs-inline">ngModel</code> keep working unchanged.
      </p>

      <h2 id="login">Binding controls</h2>
      <p>
        Create the form from a model signal and a schema, then bind each control
        with <code class="docs-inline">[formField]</code>. The model is the source
        of truth: typing updates it, and setting it updates the controls. Errors
        appear once a field is touched, and <code class="docs-inline">submit()</code>
        marks every field touched before running the action.
      </p>
      <docs-example [code]="loginCode" exampleTitle="Login form" [stackblitz]="false">
        <div class="sf-demo">
          <form class="sf-form" (submit)="signIn($event)">
            <mk-form-field label="Email">
              <input mkInput type="email" placeholder="you@example.com" [formField]="login.email" />
            </mk-form-field>
            <mk-form-field label="Password" hint="At least 8 characters.">
              <mk-password-input [formField]="login.password" />
            </mk-form-field>
            <mk-checkbox [formField]="login.remember">Remember me</mk-checkbox>
            <div class="sf-actions">
              <button mkButton type="submit" [loading]="login().submitting()">Sign in</button>
              <button mkButton type="button" variant="ghost" (click)="login().reset(); loginModel.set({ email: '', password: '', remember: false })">Reset</button>
            </div>
          </form>
          <pre class="sf-value"><code>{{ loginModel() | json }}
touched: {{ login().touched() }}  valid: {{ login().valid() }}</code></pre>
        </div>
      </docs-example>

      <h2 id="form-field">Form field errors</h2>
      <p>
        <code class="docs-inline">&lt;mk-form-field&gt;</code> finds the
        <code class="docs-inline">[formField]</code> binding on its control and
        derives the required marker, the disabled look and the error text from
        the field's <code class="docs-inline">required()</code>,
        <code class="docs-inline">disabled()</code>,
        <code class="docs-inline">touched()</code> and
        <code class="docs-inline">errors()</code>. Built-in error kinds are worded
        through the same <code class="docs-inline">validation</code> i18n table as
        reactive forms; a <code class="docs-inline">message</code> given to a rule
        wins over the table, and <code class="docs-inline">errorMessages</code> /
        <code class="docs-inline">errorOn</code> work as before. When the control is
        nested deeper, point the wrapper at the field with
        <code class="docs-inline">[field]</code>.
      </p>
      <docs-example [code]="fieldCode" exampleTitle="Errors on touch" [stackblitz]="false">
        <div class="sf-demo">
          <form class="sf-form" (submit)="saveProfile($event)">
            <mk-form-error-summary [field]="profile" [labels]="{ country: 'Country', age: 'Age', nickname: 'Nickname' }" />
            <mk-form-field label="Nickname" hint="Shown on your posts.">
              <input mkInput [formField]="profile.nickname" />
            </mk-form-field>
            <mk-form-field label="Country" [field]="profile.country">
              <div class="sf-row">
                <mk-select [formField]="profile.country" [options]="countries" />
              </div>
            </mk-form-field>
            <mk-form-field label="Age" [errorMessages]="{ min: 'You must be 18 or over' }">
              <mk-number-input [formField]="profile.age" />
            </mk-form-field>
            <mk-form-field label="Member id" hint="Assigned by the system.">
              <input mkInput [formField]="profile.memberId" />
            </mk-form-field>
            <div class="sf-actions">
              <button mkButton type="submit">Save</button>
              <button mkButton type="button" variant="outline" (click)="profile().markAsTouched()">Touch all</button>
              <button mkButton type="button" variant="ghost" (click)="profile().reset()">Untouch</button>
            </div>
          </form>
          <pre class="sf-value"><code>{{ profileModel() | json }}</code></pre>
        </div>
      </docs-example>

      <h2 id="summary">Error summary</h2>
      <p>
        Give <code class="docs-inline">&lt;mk-form-error-summary&gt;</code> the
        root field (<code class="docs-inline">[field]="profile"</code>, shown above)
        and it lists <code class="docs-inline">errorSummary()</code>: one entry per
        invalid field, named through <code class="docs-inline">labels</code> by
        dotted path, each linking to the control bound with
        <code class="docs-inline">[formField]</code>. With the default
        <code class="docs-inline">showOn="submit"</code> entries appear for touched
        fields — <code class="docs-inline">submit()</code> touches them all — and
        focus moves to the summary after the form's
        <code class="docs-inline">submit</code> event.
      </p>
      <pre class="sf-code"><code>{{ summaryCode }}</code></pre>

      <h2 id="dynamic">Dynamic-form schema → Signal Forms</h2>
      <p>
        <code class="docs-inline">mkDynamicFormToSignalSchema(definition)</code>
        turns a <a routerLink="/components/dynamic-form">dynamic-form</a> JSON
        definition into a <code class="docs-inline">Schema</code> for
        <code class="docs-inline">form()</code>: <code class="docs-inline">required</code>,
        <code class="docs-inline">min</code> / <code class="docs-inline">max</code> /
        <code class="docs-inline">minLength</code> / <code class="docs-inline">maxLength</code> /
        <code class="docs-inline">pattern</code> / <code class="docs-inline">email</code>,
        <code class="docs-inline">custom</code> validator functions,
        <code class="docs-inline">disabled</code> / <code class="docs-inline">disabledWhen</code>
        → <code class="docs-inline">disabled()</code>, <code class="docs-inline">showWhen</code>
        → <code class="docs-inline">hidden()</code>, nested groups and arrays (with
        <code class="docs-inline">minItems</code> / <code class="docs-inline">maxItems</code>).
        The renderer is unchanged — you write the template, so hide fields with
        <code class="docs-inline">&#64;if (!f.company().hidden())</code>. Unlike the
        renderer, a hidden field keeps its value in the model.
      </p>
      <docs-example [code]="dynamicCode" exampleTitle="Converted schema" [stackblitz]="false">
        <div class="sf-demo">
          <form class="sf-form" (submit)="saveCustomer($event)">
            <mk-form-field label="Full name">
              <input mkInput [formField]="customer.name" />
            </mk-form-field>
            <mk-form-field label="Type">
              <div class="sf-row">
                <mk-select [formField]="customer.kind" [options]="kinds" />
              </div>
            </mk-form-field>
            @if (!customer.company().hidden()) {
              <mk-form-field label="Company">
                <input mkInput [formField]="customer.company" />
              </mk-form-field>
            }
            <mk-form-field label="Seats">
              <mk-number-input [formField]="customer.seats" />
            </mk-form-field>
            <mk-switch [formField]="customer.newsletter">Newsletter</mk-switch>
            <div class="sf-actions">
              <button mkButton type="submit">Save customer</button>
            </div>
          </form>
          <pre class="sf-value"><code>{{ customerModel() | json }}</code></pre>
        </div>
      </docs-example>

      <h2 id="how">How the binding works</h2>
      <ul>
        <li>
          The directive is <code class="docs-inline">FormField</code> with the
          selector <code class="docs-inline">[formField]</code> (Angular 22.0); import
          it from <code class="docs-inline">&#64;angular/forms/signals</code> next to the
          mk-kit control.
        </li>
        <li>
          mk-kit controls keep their <code class="docs-inline">ControlValueAccessor</code>
          (so <code class="docs-inline">ngModel</code> and reactive forms still work)
          and expose the <code class="docs-inline">FormValueControl</code> /
          <code class="docs-inline">FormCheckboxControl</code> surface: a typed
          <code class="docs-inline">value</code> / <code class="docs-inline">checked</code>
          model plus <code class="docs-inline">disabled</code>,
          <code class="docs-inline">required</code>, <code class="docs-inline">invalid</code>
          and, where they exist, <code class="docs-inline">readonly</code>,
          <code class="docs-inline">min</code> / <code class="docs-inline">max</code> /
          <code class="docs-inline">minLength</code> inputs. Angular routes the value
          through the accessor and writes every one of those inputs from the field
          state, so the template is type-checked against the field and the schema
          drives the control's constraints.
        </li>
        <li>
          Because the field owns them, binding <code class="docs-inline">required</code>,
          <code class="docs-inline">[disabled]</code>, <code class="docs-inline">[min]</code>
          or <code class="docs-inline">[value]</code> on the same element as
          <code class="docs-inline">[formField]</code> is a compile error — put them
          in the schema (<code class="docs-inline">required(p.email)</code>,
          <code class="docs-inline">disabled(p.id)</code>, <code class="docs-inline">min(p.age, 18)</code>).
        </li>
        <li>
          A field is <code class="docs-inline">invalid()</code> from the first render;
          mk-kit controls only paint the invalid state once the field is touched or
          dirty — the moment <code class="docs-inline">mk-form-field</code> shows the
          message. <code class="docs-inline">submit()</code> touches everything.
        </li>
        <li>
          Touch is reported on blur (the accessor's <code class="docs-inline">onTouched</code>),
          so <code class="docs-inline">debounce(p.search, 'blur')</code> works with
          every control.
        </li>
      </ul>
      <div class="sf-scroll">
        <table class="sf-table">
          <thead><tr><th>Control</th><th>Bound model</th><th>Notes</th></tr></thead>
          <tbody>
            @for (row of controls; track row[0]) {
              <tr><td><code>{{ row[0] }}</code></td><td>{{ row[1] }}</td><td>{{ row[2] }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .sf-demo {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        gap: var(--mk-space-6);
        width: 100%;
        align-items: start;
      }
      @media (max-width: 900px) {
        .sf-demo {
          grid-template-columns: 1fr;
        }
      }
      .sf-form {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-4);
      }
      .sf-row {
        display: block;
      }
      .sf-actions {
        display: flex;
        gap: var(--mk-space-2);
        flex-wrap: wrap;
      }
      .sf-value,
      .sf-code {
        margin: 0;
        padding: var(--mk-space-4);
        background: var(--mk-code-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xs);
        line-height: var(--mk-line-height-normal);
        color: var(--mk-text);
        overflow: auto;
        white-space: pre;
      }
      .sf-code {
        margin: var(--mk-space-3) 0 var(--mk-space-6);
        font-size: var(--mk-font-size-sm);
      }
      .sf-scroll {
        overflow-x: auto;
      }
      .sf-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mk-font-size-sm);
      }
      .sf-table th,
      .sf-table td {
        text-align: left;
        vertical-align: top;
        padding: var(--mk-space-2) var(--mk-space-3);
        border-bottom: 1px solid var(--mk-border);
      }
      .sf-table th {
        color: var(--mk-text-muted);
        font-weight: var(--mk-font-weight-semibold);
        white-space: nowrap;
      }
      .sf-table code {
        font-family: var(--mk-font-mono);
        font-size: 0.9em;
        color: var(--mk-primary);
      }
    `,
  ],
})
export class SignalFormsPage {
  private readonly toast = inject(MkToastService);
  protected readonly countries = COUNTRIES;
  protected readonly controls = CONTROLS;
  protected readonly kinds = KINDS;

  // --- Login ----------------------------------------------------------------
  protected readonly loginModel = signal({ email: '', password: '', remember: false });
  protected readonly login = form(this.loginModel, (p) => {
    required(p.email, { message: 'Enter your email address' });
    email(p.email);
    required(p.password);
    minLength(p.password, 8);
  });

  protected signIn(event: Event): void {
    event.preventDefault();
    void submit(this.login, async (f) => {
      await new Promise((r) => setTimeout(r, 600));
      this.toast.success(`Signed in as ${f().value().email}`, { title: 'Welcome back' });
      return undefined;
    });
  }

  // --- Profile --------------------------------------------------------------
  protected readonly profileModel = signal({
    nickname: '',
    country: null as string | null,
    age: null as number | null,
    memberId: 'MK-2048',
  });
  protected readonly profile = form(this.profileModel, (p) => {
    required(p.nickname);
    minLength(p.nickname, 3);
    required(p.country);
    required(p.age);
    min(p.age, 18);
    disabled(p.memberId);
  });

  protected saveProfile(event: Event): void {
    event.preventDefault();
    void submit(this.profile, async () => {
      this.toast.success('Profile saved');
      return undefined;
    });
  }

  // --- Dynamic schema -------------------------------------------------------
  protected readonly customerModel = signal(mkDynamicDefaults(CUSTOMER.fields) as {
    name: string;
    kind: string;
    company: string;
    seats: number;
    newsletter: boolean;
  });
  protected readonly customer = form(this.customerModel, mkDynamicFormToSignalSchema(CUSTOMER));

  protected saveCustomer(event: Event): void {
    event.preventDefault();
    void submit(this.customer, async (f) => {
      this.toast.success(`Saved ${f().value().name}`, { title: 'Customer saved' });
      return undefined;
    });
  }

  protected readonly loginCode = `import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { MkButton, MkCheckbox, MkFormField, MkInput, MkPasswordInput } from '@mk-kit/ui';

@Component({
  imports: [FormField, MkFormField, MkInput, MkPasswordInput, MkCheckbox, MkButton],
  template: \`
    <form (submit)="signIn($event)">
      <mk-form-field label="Email">
        <input mkInput type="email" [formField]="login.email" />
      </mk-form-field>
      <mk-form-field label="Password" hint="At least 8 characters.">
        <mk-password-input [formField]="login.password" />
      </mk-form-field>
      <mk-checkbox [formField]="login.remember">Remember me</mk-checkbox>
      <button mkButton type="submit" [loading]="login().submitting()">Sign in</button>
    </form>
  \`,
})
export class LoginPage {
  readonly model = signal({ email: '', password: '', remember: false });
  readonly login = form(this.model, (p) => {
    required(p.email, { message: 'Enter your email address' });
    email(p.email);
    required(p.password);
    minLength(p.password, 8);
  });

  signIn(event: Event) {
    event.preventDefault();
    submit(this.login, async (f) => {
      await this.auth.signIn(f().value());
      return undefined; // or [{ fieldTree: f.password, kind: 'server', message: 'Wrong password' }]
    });
  }
}`;

  protected readonly fieldCode = `<!-- the wrapper finds the [formField] binding on its control -->
<mk-form-field label="Nickname" hint="Shown on your posts.">
  <input mkInput [formField]="profile.nickname" />
</mk-form-field>

<!-- nested deeper: point the wrapper at the field explicitly -->
<mk-form-field label="Country" [field]="profile.country">
  <div><mk-select [formField]="profile.country" [options]="countries" /></div>
</mk-form-field>

<!-- per-field wording, keyed like reactive ValidationErrors -->
<mk-form-field label="Age" [errorMessages]="{ min: 'You must be 18 or over' }">
  <mk-number-input [formField]="profile.age" />
</mk-form-field>

readonly profile = form(this.model, (p) => {
  required(p.nickname);
  minLength(p.nickname, 3);
  required(p.country);
  required(p.age);
  min(p.age, 18);
  disabled(p.memberId);   // mk-form-field picks up the disabled look
});`;

  protected readonly summaryCode = `<form (submit)="save($event)">
  <mk-form-error-summary [field]="profile"
    [labels]="{ country: 'Country', age: 'Age', 'address.city': 'City' }" />
  …
</form>

save(event: Event) {
  event.preventDefault();
  submit(this.profile, async () => { … });   // marks every field touched → entries + focus
}`;

  protected readonly dynamicCode = `import { form } from '@angular/forms/signals';
import { MkDynamicSchema, mkDynamicDefaults, mkDynamicFormToSignalSchema } from '@mk-kit/ui/dynamic-form';

const definition: MkDynamicSchema = {
  fields: [
    { key: 'name', type: 'text', label: 'Full name', required: true, validators: { minLength: 2 } },
    { key: 'kind', type: 'select', label: 'Type', default: 'person', options: kinds },
    { key: 'company', type: 'text', label: 'Company', required: true,
      showWhen: { field: 'kind', eq: 'company' } },
    { key: 'seats', type: 'number', label: 'Seats', default: 1, validators: { min: 1, max: 50 } },
    { key: 'newsletter', type: 'switch', label: 'Newsletter', default: true },
  ],
};

readonly model = signal(mkDynamicDefaults(definition.fields));
readonly customer = form(this.model, mkDynamicFormToSignalSchema(definition));

<!-- you own the template; hidden() follows showWhen -->
@if (!customer.company().hidden()) {
  <mk-form-field label="Company">
    <input mkInput [formField]="customer.company" />
  </mk-form-field>
}`;
}
