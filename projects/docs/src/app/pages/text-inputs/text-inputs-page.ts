import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MK_FIELD_PRESETS,
  MkAutosize,
  MkField,
  MkFormField,
  MkIcon,
  MkI18nInput,
  MkInput,
  MkInputGroup,
  MkNumberInput,
  MkOtp,
  MkPasswordInput,
  type MkFieldKind,
  type MkI18nLocale,
  type MkI18nValue,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the TEXT INPUT components of `@mkornas/ui`:
 * Input/Textarea, Textarea autosize, Password input, Number input, OTP/PIN input
 * and the multi-locale I18n input.
 */
@Component({
  selector: 'docs-text-inputs-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkFormField,
    MkIcon,
    MkInput,
    MkInputGroup,
    MkAutosize,
    MkPasswordInput,
    MkNumberInput,
    MkOtp,
    MkI18nInput,
    MkField,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Text inputs</h1>
      <p class="docs-lead">
        Text-entry controls: the <code class="docs-inline">mkInput</code> styling
        directive for native inputs and textareas, autosizing textareas, a password
        field with strength meter, a numeric spinbutton, a segmented OTP/PIN
        field and a multi-locale translatable field. Every control implements
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
      <!-- INPUT GROUP -->
      <!-- ============================================================ -->
      <h2>Input group (prefix / suffix)</h2>
      <p>
        <code class="docs-inline">&lt;mk-input-group&gt;</code> wraps a native
        <code class="docs-inline">input[mkInput]</code> with leading / trailing
        affixes — icons, static text or compact buttons — inside one shared
        control frame. The group carries the border and focus ring; the nested
        input detects it and drops its own chrome. Project affixes with the
        <code class="docs-inline">mkInputPrefix</code> /
        <code class="docs-inline">mkInputSuffix</code> attributes. Inside an
        <code class="docs-inline">mk-form-field</code> the group inherits the
        field's size and invalid state.
      </p>

      <docs-example [code]="inputGroupCode" [column]="true">
        <mk-input-group style="max-width: 26rem;">
          <mk-icon mkInputPrefix name="search" [size]="18" />
          <input mkInput type="search" placeholder="Search…" [(ngModel)]="query" />
        </mk-input-group>
        <mk-form-field label="Price" hint="Gross, VAT included" style="max-width: 26rem;">
          <mk-input-group>
            <input mkInput type="number" min="0" step="0.01" [(ngModel)]="price" />
            <span mkInputSuffix>zł</span>
          </mk-input-group>
        </mk-form-field>
        <p class="echo">Query: {{ query() || '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored (inherited) inside an mk-form-field.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force the invalid frame when used standalone.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Visually reflect a disabled inner control.</td></tr>
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

      <!-- ============================================================ -->
      <!-- I18N INPUT -->
      <!-- ============================================================ -->
      <h2>Translatable input (i18n)</h2>
      <p>
        <code class="docs-inline">&lt;mk-i18n-input&gt;</code> edits the same text
        in several languages from one field — a compact locale switcher over a
        single input, instead of stacking one input per language. It binds a
        <code class="docs-inline">Record&lt;localeCode, string&gt;</code>, so it
        drops into a form as a single control (via
        <code class="docs-inline">formControlName</code> /
        <code class="docs-inline">[(ngModel)]</code>) rather than a nested group.
        Codes listed in <code class="docs-inline">requiredLocales</code> show a
        marker in the switcher while still empty, so a missing translation is
        visible without switching to it. Add
        <code class="docs-inline">multiline</code> for a textarea.
      </p>
      <docs-example [code]="i18nCode" [column]="true">
        <mk-form-field label="Product name" style="max-width: 26rem; width: 100%;">
          <mk-i18n-input
            [(ngModel)]="translations"
            [locales]="locales"
            [requiredLocales]="requiredLocales"
            placeholder="Name in the selected language…"
          />
        </mk-form-field>
        <p class="echo">Value: {{ translationsJson() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>Record&lt;string, string&gt;</td><td>{{ '{}' }}</td><td>Bound value — one string per locale code (via ngModel / formControlName).</td></tr>
          <tr><td>locales</td><td>MkI18nLocale[]</td><td>[]</td><td>Locales offered, in switcher order. The first is the initial tab.</td></tr>
          <tr><td>requiredLocales</td><td>string[]</td><td>[]</td><td>Codes that must be filled; each gets a marker in the switcher while empty.</td></tr>
          <tr><td>multiline</td><td>boolean</td><td>false</td><td>Render a textarea instead of a single-line input.</td></tr>
          <tr><td>rows</td><td>number</td><td>3</td><td>Textarea rows (ignored unless multiline).</td></tr>
          <tr><td>placeholder</td><td>string</td><td>''</td><td>Placeholder for the active locale's input.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size, forwarded to the input and the switcher.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the whole control.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- MKFIELD -->
      <!-- ============================================================ -->
      <h2>Semantic field kinds (mkField)</h2>
      <p>
        <code class="docs-inline">mkField</code> is an attribute directive that
        applies the mobile-keyboard and autofill bundle a field needs —
        <code class="docs-inline">type</code>,
        <code class="docs-inline">inputmode</code>,
        <code class="docs-inline">autocomplete</code>,
        <code class="docs-inline">autocapitalize</code>,
        <code class="docs-inline">autocorrect</code>,
        <code class="docs-inline">spellcheck</code> and
        <code class="docs-inline">enterkeyhint</code> — from a single name. It is
        the fix for the two mistakes every codebase makes: email fields that iOS
        capitalises (no <code class="docs-inline">autocapitalize="off"</code>) and
        address fields the browser can't autofill (no
        <code class="docs-inline">autocomplete</code> at all). It sets attributes
        and nothing else, so it composes with
        <code class="docs-inline">mkInput</code>,
        <code class="docs-inline">&lt;mk-form-field&gt;</code>,
        <code class="docs-inline">[(ngModel)]</code> and reactive forms untouched.
      </p>
      <p>
        <strong>Precedence:</strong> a <em>static</em> attribute you write on the
        element wins — the directive reads the seven attributes once at
        construction and only fills in what you left out, so
        <code class="docs-inline">&lt;input mkField="username" type="password" /&gt;</code>
        stays a password field. A template binding
        (<code class="docs-inline">[attr.autocomplete]="…"</code>) does
        <em>not</em> win: Angular applies host bindings after template bindings,
        so the preset overwrites it. Override with a static attribute.
      </p>

      <docs-example [code]="fieldCode" [column]="true">
        <div class="field-demo">
          <mk-form-field label="Email">
            <input mkInput mkField="email" placeholder="you@example.com" [(ngModel)]="email" />
          </mk-form-field>
          <mk-form-field label="Full name">
            <input mkInput mkField="name" placeholder="Jan Kowalski" [(ngModel)]="fullName" />
          </mk-form-field>
          <mk-form-field label="Street">
            <input mkInput mkField="street" placeholder="Marszałkowska 1" [(ngModel)]="street" />
          </mk-form-field>
          <mk-form-field label="City">
            <input mkInput mkField="city" placeholder="Warszawa" [(ngModel)]="city" />
          </mk-form-field>
          <mk-form-field label="Postal code">
            <input mkInput mkField="postal-code" placeholder="00-001" [(ngModel)]="postalCode" />
          </mk-form-field>
        </div>
      </docs-example>

      <p>
        Every kind and what it applies — the same table is exported as
        <code class="docs-inline">MK_FIELD_PRESETS</code> so you can inspect it or
        spread entries into your own presets. Blank = not set.
      </p>
      <table class="docs-props">
        <thead>
          <tr>
            <th>mkField</th><th>type</th><th>inputmode</th><th>autocomplete</th>
            <th>autocapitalize</th><th>spellcheck</th><th>enterkeyhint</th>
          </tr>
        </thead>
        <tbody>
          @for (row of fieldKinds; track row.kind) {
            <tr>
              <td>{{ row.kind }}</td>
              <td>{{ row.preset.type ?? '—' }}</td>
              <td>{{ row.preset.inputmode ?? '—' }}</td>
              <td>{{ row.preset.autocomplete ?? '—' }}</td>
              <td>{{ row.preset.autocapitalize ?? '—' }}</td>
              <td>{{ row.preset.spellcheck ?? '—' }}</td>
              <td>{{ row.preset.enterkeyhint ?? '—' }}</td>
            </tr>
          }
        </tbody>
      </table>
      <p>
        <code class="docs-inline">autocorrect="off"</code> (non-standard, honoured
        by iOS Safari) is applied wherever
        <code class="docs-inline">spellcheck</code> is <code class="docs-inline">false</code>.
      </p>
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
      .field-demo {
        display: grid;
        gap: var(--mk-space-4);
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        width: 100%;
      }
    `,
  ],
})
export class TextInputsPage {
  // --- Input & Textarea -------------------------------------------------------
  protected readonly name = signal('');
  protected readonly message = signal('');

  // --- Input group ------------------------------------------------------------
  protected readonly query = signal('');
  protected readonly price = signal<number | null>(null);

  // --- Autosize ---------------------------------------------------------------
  protected readonly note = signal('');

  // --- Password input ---------------------------------------------------------
  protected readonly password = signal('');

  // --- Number / OTP -----------------------------------------------------------
  protected readonly qty = signal<number | null>(1);
  protected readonly otp = signal('');

  // --- I18n input -------------------------------------------------------------
  protected readonly locales: MkI18nLocale[] = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'pl', label: 'PL', name: 'Polish' },
    { code: 'de', label: 'DE', name: 'German' },
  ];
  protected readonly requiredLocales = ['en', 'pl'];
  protected readonly translations = signal<MkI18nValue>({ en: 'Notebook' });
  protected readonly translationsJson = computed(() =>
    JSON.stringify(this.translations()),
  );

  // --- mkField ----------------------------------------------------------------
  protected readonly email = signal('');
  protected readonly fullName = signal('');
  protected readonly street = signal('');
  protected readonly city = signal('');
  protected readonly postalCode = signal('');
  /** The exported preset table, flattened for the docs table. */
  protected readonly fieldKinds = (
    Object.keys(MK_FIELD_PRESETS) as MkFieldKind[]
  ).map((kind) => ({ kind, preset: MK_FIELD_PRESETS[kind] }));

  // --- Code snippets (plain strings shown in the code blocks) -----------------
  protected readonly inputCode = `<input mkInput placeholder="Small" size="sm" [(ngModel)]="name" />
<input mkInput placeholder="Medium (default)" [(ngModel)]="name" />
<input mkInput placeholder="Large" size="lg" [(ngModel)]="name" />
<input mkInput placeholder="Invalid" [invalid]="true" />`;

  protected readonly textareaCode = `<textarea mkInput rows="4" placeholder="Your message…" [(ngModel)]="message"></textarea>`;

  protected readonly inputGroupCode = `<mk-input-group>
  <mk-icon mkInputPrefix name="search" [size]="18" />
  <input mkInput type="search" placeholder="Search…" [(ngModel)]="query" />
</mk-input-group>

<mk-form-field label="Price" hint="Gross, VAT included">
  <mk-input-group>
    <input mkInput type="number" formControlName="price" />
    <span mkInputSuffix>zł</span>
  </mk-input-group>
</mk-form-field>`;

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

  protected readonly i18nCode = `locales = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pl', label: 'PL', name: 'Polish' },
  { code: 'de', label: 'DE', name: 'German' },
];

<mk-form-field label="Product name">
  <mk-i18n-input
    formControlName="name"
    [locales]="locales"
    [requiredLocales]="['en', 'pl']"
    placeholder="Name in the selected language…" />
</mk-form-field>`;

  protected readonly fieldCode = `<mk-form-field label="Email">
  <input mkInput mkField="email" formControlName="email" />
</mk-form-field>

<mk-form-field label="Street">
  <input mkInput mkField="street" formControlName="street" />
</mk-form-field>

<!-- the kind can be bound -->
<input mkInput [mkField]="isCompany() ? 'organization' : 'name'" />

<!-- a static attribute wins over the preset -->
<input mkInput mkField="username" type="password" />`;
}
