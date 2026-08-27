import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MkButton, MkDynamicFieldDef, MkDynamicForm, MkDynamicSchema, MkRating, MkToastService } from '@mk-kit/ui';
import { inject } from '@angular/core';
import { DocsExample } from '../../shared/docs-example';

const CUSTOMER_SCHEMA: MkDynamicSchema = {
  columns: 2,
  fields: [
    { type: 'section', label: 'Customer', hint: 'Who is this account for?' },
    { key: 'kind', type: 'toggle', label: 'Type', default: 'person', span: 12, options: [
      { label: 'Person', value: 'person' },
      { label: 'Company', value: 'company' },
    ] },
    { key: 'name', type: 'text', label: 'Full name', required: true, validators: { minLength: 2 }, placeholder: 'Jane Doe' },
    { key: 'email', type: 'email', label: 'Email', required: true, placeholder: 'jane@example.com' },
    { key: 'company', type: 'text', label: 'Company', required: true, showWhen: { field: 'kind', eq: 'company' } },
    { key: 'vat', type: 'text', label: 'VAT number', hint: 'EU format, e.g. PL1234567890', showWhen: { field: 'kind', eq: 'company' }, validators: { pattern: '^[A-Z]{2}[0-9A-Z]{8,12}$' } },
    { key: 'phone', type: 'phone', label: 'Phone', props: { country: 'PL' } },
    { key: 'since', type: 'date', label: 'Customer since' },
    { key: 'plan', type: 'select', label: 'Plan', default: 'free', options: [
      { label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }, { label: 'Enterprise', value: 'enterprise' },
    ] },
    { key: 'seats', type: 'number', label: 'Seats', default: 5, validators: { min: 1, max: 500 }, showWhen: { field: 'plan', in: ['pro', 'enterprise'] } },
    { key: 'budget', type: 'currency', label: 'Monthly budget', props: { currency: 'EUR' }, showWhen: { field: 'plan', eq: 'enterprise' } },
    { key: 'tags', type: 'tags', label: 'Tags', span: 12, placeholder: 'Type and press Enter' },
    { type: 'group', key: 'address', label: 'Billing address', columns: 2, fields: [
      { key: 'street', type: 'text', label: 'Street', span: 12 },
      { key: 'city', type: 'text', label: 'City' },
      { key: 'zip', type: 'text', label: 'Postal code', validators: { pattern: '^\\d{2}-\\d{3}$' }, hint: '00-000' },
    ] },
    { type: 'array', key: 'contacts', label: 'Contacts', hint: 'At least one, up to three.', min: 1, max: 3, addLabel: 'Add contact', columns: 2,
      default: [{ role: 'billing' }],
      fields: [
        { key: 'name', type: 'text', label: 'Name', required: true },
        { key: 'role', type: 'select', label: 'Role', options: [
          { label: 'Billing', value: 'billing' }, { label: 'Technical', value: 'tech' }, { label: 'Owner', value: 'owner' },
        ] },
      ] },
    { key: 'satisfaction', type: 'custom', label: 'How happy are they?', props: { renderer: 'stars' } },
    { key: 'newsletter', type: 'switch', label: 'Send the monthly newsletter', default: true, span: 12 },
    { key: 'terms', type: 'checkbox', label: 'Accepts the terms', required: true, span: 12 },
  ],
};

const TYPES: Array<[string, string, string]> = [
  ['text · email · password · url · tel · search', 'mkInput / mk-password-input', 'password: showStrength, showRules, minLength'],
  ['textarea', 'textarea[mkInput]', 'rows'],
  ['number', 'mk-number-input', 'min, max, step'],
  ['currency', 'mk-currency-input', 'currency, locale, min, max'],
  ['date · time · datetime', 'mk-date-picker / mk-time-picker / mk-datetime-picker', 'min, max, clearable, step, hour12'],
  ['select · multi-select · autocomplete', 'mk-select / mk-multi-select / mk-autocomplete', 'options on the field; max, requireSelection'],
  ['radio · toggle', 'mk-radio-group / mk-button-toggle-group', 'options on the field; orientation, multiple'],
  ['checkbox · switch', 'mk-checkbox / mk-switch', 'label becomes the control text; required = must be on'],
  ['slider · rating', 'mk-slider / mk-rating', 'min, max, step'],
  ['color · tags · phone', 'mk-color-picker / mk-tag-input / mk-phone-input', 'swatches, max, country, valueFormat'],
  ['file', 'mk-file-upload', 'accept, multiple, maxSize, maxFiles'],
  ['code', 'mk-code-editor', 'language, rows'],
  ['custom', 'your ng-template[mkDynamicField]', 'props.renderer picks the template'],
  ['group', 'nested FormGroup in a fieldset', 'fields, columns, label, hint'],
  ['array', 'FormArray of groups with add / remove', 'fields, min, max, addLabel, default'],
  ['section', 'heading + description, no value', 'label, hint'],
];

/**
 * Dynamic form docs: one realistic schema exercising conditions, groups,
 * arrays and a custom renderer, the live value beside it, and the type table.
 */
@Component({
  selector: 'docs-dynamic-form-page',
  imports: [DocsExample, MkDynamicForm, MkDynamicFieldDef, MkButton, MkRating, JsonPipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Dynamic form</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-dynamic-form&gt;</code> renders a whole
        form from a JSON schema — every mk-kit control, nested groups, editable
        lists, declarative validators and show/hide conditions — and manages one
        reactive <code class="docs-inline">FormGroup</code> for it. Describe the
        model; the admin screen follows.
      </p>

      <h2 id="example">Customer form</h2>
      <p>
        Switch the type to <em>Company</em> and two fields appear; pick a paid
        plan to reveal seats and budget. Hidden fields are excluded from the
        value. Contacts is an <code class="docs-inline">array</code> field with
        min 1 / max 3, the address a <code class="docs-inline">group</code>, and
        satisfaction a <code class="docs-inline">custom</code> renderer backed by
        <code class="docs-inline">mk-rating</code>.
      </p>
      <docs-example [code]="exampleCode" exampleTitle="Customer form" [stackblitz]="false">
        <div class="df-demo">
          <mk-dynamic-form #df [schema]="schema" [(value)]="value" (formSubmit)="onSubmit($event)">
            <ng-template mkDynamicField="stars" let-control="control">
              <mk-rating [formControl]="control" [max]="5" ariaLabel="Satisfaction" />
            </ng-template>
            <button mkButton type="submit">Save customer</button>
            <button mkButton type="button" variant="ghost" (click)="df.reset()">Reset</button>
          </mk-dynamic-form>
          <pre class="df-value"><code>{{ value() | json }}</code></pre>
        </div>
      </docs-example>

      <h2 id="schema">The schema</h2>
      <p>
        A schema is plain data — store it, ship it from an API, or let a form
        builder emit it. Each field has a <code class="docs-inline">key</code>
        (its place in the value), a <code class="docs-inline">type</code>, and
        optional <code class="docs-inline">label</code>,
        <code class="docs-inline">hint</code>,
        <code class="docs-inline">placeholder</code>,
        <code class="docs-inline">required</code>,
        <code class="docs-inline">default</code>,
        <code class="docs-inline">validators</code>,
        <code class="docs-inline">options</code>,
        <code class="docs-inline">props</code>,
        <code class="docs-inline">span</code>,
        <code class="docs-inline">showWhen</code> and
        <code class="docs-inline">disabledWhen</code>.
      </p>
      <pre class="df-code"><code>{{ schemaCode }}</code></pre>

      <h3 id="validators">Validators</h3>
      <p>
        <code class="docs-inline">required</code> plus
        <code class="docs-inline">validators: {{ '{' }} min, max, minLength, maxLength, pattern, email, custom {{ '}' }}</code>.
        Messages come from <code class="docs-inline">mk-form-field</code>'s
        i18n validation table, so a required field says "This field is required"
        in the app's language without any extra wiring.
        <code class="docs-inline">custom</code> takes Angular
        <code class="docs-inline">ValidatorFn</code>s for the rest. Array fields
        get <code class="docs-inline">minItems</code> /
        <code class="docs-inline">maxItems</code> errors from
        <code class="docs-inline">min</code> / <code class="docs-inline">max</code>.
      </p>

      <h3 id="conditions">Conditions</h3>
      <p>
        <code class="docs-inline">showWhen</code> hides <em>and disables</em> a
        field, so the emitted <code class="docs-inline">value</code> only carries
        what the user could see (<code class="docs-inline">form.getRawValue()</code>
        still has everything). <code class="docs-inline">disabledWhen</code>
        keeps the field visible. Conditions are serialisable:
      </p>
      <pre class="df-code"><code>{{ conditionsCode }}</code></pre>
      <p>
        Dotted paths reach into groups (<code class="docs-inline">address.country</code>).
        Inside an array item the condition sees the item's own value, with the
        whole form under <code class="docs-inline">$root</code> and the position
        under <code class="docs-inline">$index</code>. A function
        <code class="docs-inline">(value) =&gt; boolean</code> works too when the
        schema lives in TypeScript.
      </p>

      <h3 id="layout">Layout</h3>
      <p>
        Fields sit in a 12-column grid. <code class="docs-inline">columns</code>
        on the schema (or a group / array) sets how many fields share a row;
        <code class="docs-inline">span</code> overrides one field (1–12).
        Sections, groups and arrays span the full width unless told otherwise.
        Under 640px everything stacks.
      </p>

      <h2 id="types">Field types</h2>
      <div class="df-scroll">
        <table class="df-table">
          <thead><tr><th>type</th><th>Renders</th><th>props it understands</th></tr></thead>
          <tbody>
            @for (t of types; track t[0]) {
              <tr><td><code>{{ t[0] }}</code></td><td>{{ t[1] }}</td><td>{{ t[2] }}</td></tr>
            }
          </tbody>
        </table>
      </div>
      <p>
        Anything a control accepts as an input can be passed through
        <code class="docs-inline">props</code>; the table lists what each type
        forwards. Need more? Register a <code class="docs-inline">custom</code>
        renderer — it receives the <code class="docs-inline">control</code> and
        the field, and still sits inside the standard
        <code class="docs-inline">mk-form-field</code>.
      </p>

      <h2 id="api">Working with the form</h2>
      <ul>
        <li><code class="docs-inline">[(value)]</code> — two-way, visible fields only.</li>
        <li><code class="docs-inline">(formSubmit)</code> — emits the value when the form is submitted and valid; <code class="docs-inline">(invalidSubmit)</code> fires otherwise, after every control is marked touched so messages show.</li>
        <li><code class="docs-inline">form</code> — the live <code class="docs-inline">FormGroup</code>: subscribe, add validators, read <code class="docs-inline">getRawValue()</code>.</li>
        <li><code class="docs-inline">valid()</code>, <code class="docs-inline">patch(partial)</code>, <code class="docs-inline">reset(value?)</code>, <code class="docs-inline">touchAll()</code>.</li>
        <li><code class="docs-inline">disabled</code>, <code class="docs-inline">labelPosition="float"</code>, <code class="docs-inline">size</code> apply to every field.</li>
        <li>Pure helpers for tests and servers: <code class="docs-inline">mkDynamicForm(schema, value?)</code>, <code class="docs-inline">mkDynamicDefaults(fields)</code>, <code class="docs-inline">mkDynamicValidators(field)</code>, <code class="docs-inline">mkDynamicCondition(cond, value)</code>, <code class="docs-inline">mkDynamicFlatten(fields)</code>.</li>
      </ul>
    </div>
  `,
  styles: [
    `
      .df-demo {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        gap: var(--mk-space-6);
        width: 100%;
        align-items: start;
      }
      @media (max-width: 900px) {
        .df-demo {
          grid-template-columns: 1fr;
        }
      }
      .df-value,
      .df-code {
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
      .df-value {
        position: sticky;
        top: calc(var(--mk-header-height) + var(--mk-space-4));
        max-height: 70vh;
      }
      .df-code {
        margin: var(--mk-space-3) 0 var(--mk-space-6);
        font-size: var(--mk-font-size-sm);
      }
      .df-scroll {
        overflow-x: auto;
      }
      .df-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mk-font-size-sm);
      }
      .df-table th,
      .df-table td {
        text-align: left;
        vertical-align: top;
        padding: var(--mk-space-2) var(--mk-space-3);
        border-bottom: 1px solid var(--mk-border);
      }
      .df-table th {
        color: var(--mk-text-muted);
        font-weight: var(--mk-font-weight-semibold);
        white-space: nowrap;
      }
      .df-table code {
        font-family: var(--mk-font-mono);
        font-size: 0.9em;
        color: var(--mk-primary);
      }
    `,
  ],
})
export class DynamicFormPage {
  private readonly toast = inject(MkToastService);
  protected readonly schema = CUSTOMER_SCHEMA;
  protected readonly types = TYPES;
  protected readonly value = signal<Record<string, unknown>>({});

  protected onSubmit(value: Record<string, unknown>): void {
    this.toast.success(`Saved ${value['name'] || 'customer'}`, { title: 'Customer saved' });
  }

  protected readonly exampleCode = `<mk-dynamic-form [schema]="schema" [(value)]="value" (formSubmit)="save($event)">
  <ng-template mkDynamicField="stars" let-control="control">
    <mk-rating [formControl]="control" [max]="5" />
  </ng-template>
  <button mkButton type="submit">Save customer</button>
</mk-dynamic-form>`;

  protected readonly schemaCode = `import { MkDynamicSchema } from '@mk-kit/ui/dynamic-form';

const schema: MkDynamicSchema = {
  columns: 2,
  fields: [
    { type: 'section', label: 'Customer' },
    { key: 'kind', type: 'toggle', label: 'Type', default: 'person', span: 12,
      options: [{ label: 'Person', value: 'person' }, { label: 'Company', value: 'company' }] },
    { key: 'name', type: 'text', label: 'Full name', required: true, validators: { minLength: 2 } },
    { key: 'email', type: 'email', label: 'Email', required: true },
    { key: 'company', type: 'text', label: 'Company', required: true,
      showWhen: { field: 'kind', eq: 'company' } },
    { key: 'plan', type: 'select', label: 'Plan', default: 'free', options: plans },
    { key: 'seats', type: 'number', label: 'Seats', validators: { min: 1, max: 500 },
      showWhen: { field: 'plan', in: ['pro', 'enterprise'] } },
    { type: 'group', key: 'address', label: 'Billing address', fields: [
      { key: 'street', type: 'text', label: 'Street', span: 12 },
      { key: 'city', type: 'text', label: 'City' },
      { key: 'zip', type: 'text', label: 'Postal code', validators: { pattern: '^\\\\d{2}-\\\\d{3}$' } },
    ] },
    { type: 'array', key: 'contacts', label: 'Contacts', min: 1, max: 3, addLabel: 'Add contact', fields: [
      { key: 'name', type: 'text', label: 'Name', required: true },
      { key: 'role', type: 'select', label: 'Role', options: roles },
    ] },
    { key: 'satisfaction', type: 'custom', label: 'How happy are they?', props: { renderer: 'stars' } },
    { key: 'terms', type: 'checkbox', label: 'Accepts the terms', required: true },
  ],
};`;

  protected readonly conditionsCode = `showWhen: { field: 'kind', eq: 'company' }
showWhen: { field: 'plan', in: ['pro', 'enterprise'] }
showWhen: { field: 'tags', empty: false }
disabledWhen: { field: 'locked', truthy: true }
showWhen: { and: [{ field: 'kind', eq: 'company' }, { not: { field: 'vat', empty: true } }] }
showWhen: { field: '$root.plan', eq: 'enterprise' }   // inside an array item`;
}
