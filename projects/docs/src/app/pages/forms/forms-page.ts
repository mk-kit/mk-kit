import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MkButton,
  MkCodeEditor,
  type MkCodeValidity,
  MkFileUpload,
  type MkUploadFile,
  type MkUploadFn,
  MkFormField,
  MkFormErrorSummary,
  type MkFormError,
  MkInput,
  MkNumberInput,
  MkSelect,
  type MkSelectOption,
  MkSubmitInput,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the FORM structure components of `@mkornas/ui`:
 * FormField, Form error summary, Select, Submit input, File upload and Code editor.
 */
@Component({
  selector: 'docs-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DocsExample,
    MkFormField,
    MkFormErrorSummary,
    MkInput,
    MkSelect,
    MkNumberInput,
    MkFileUpload,
    MkCodeEditor,
    MkButton,
    MkSubmitInput,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Forms</h1>
      <p class="docs-lead">
        Form structure and composite fields: the accessible
        <code class="docs-inline">&lt;mk-form-field&gt;</code> wrapper, a
        submit-time error summary, a custom select, a code-and-apply submit
        input, a file-upload dropzone and a code editor. Every control implements
        <code class="docs-inline">ControlValueAccessor</code> and exposes a
        two-way model, so it works with <code class="docs-inline">[(ngModel)]</code>,
        reactive forms and native <code class="docs-inline">[(value)]</code>
        bindings. Wrap any control in
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
          <tr><td>error</td><td>string | null</td><td>null</td><td>Explicit error message; overrides the automatic one.</td></tr>
          <tr><td>errorMessages</td><td>MkErrorMessages | null</td><td>null</td><td>Per-field wording for automatic errors, keyed by ValidationErrors key.</td></tr>
          <tr><td>errorOn</td><td>'touched' | 'dirty' | 'always'</td><td>'touched'</td><td>When an automatic error becomes visible.</td></tr>
          <tr><td>required</td><td>boolean</td><td>false</td><td>Adds a required indicator + aria-required. Derived from the control's validators when it is bound to a form.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Visually reflect a disabled control. Derived from the bound control.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size; nested controls inherit it.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- REACTIVE FORMS -->
      <!-- ============================================================ -->
      <h2>Reactive forms</h2>
      <p>
        Every mk-kit control implements
        <code class="docs-inline">ControlValueAccessor</code>, so
        <code class="docs-inline">formControlName</code>,
        <code class="docs-inline">[formControl]</code> and
        <code class="docs-inline">[(ngModel)]</code> all work, and
        <code class="docs-inline">disable()</code> /
        <code class="docs-inline">enable()</code> drive the disabled state.
      </p>
      <p>
        Controls with constraint inputs also implement
        <code class="docs-inline">Validator</code>: <code class="docs-inline">[min]</code>,
        <code class="docs-inline">[max]</code>, <code class="docs-inline">[minLength]</code>,
        <code class="docs-inline">required</code> and the format checks
        (card number, IBAN, postal code) report errors on the bound control,
        and re-validate when the constraint changes. And a
        <code class="docs-inline">mk-form-field</code> wrapping a bound control
        shows the first error itself — once the control is touched or dirty, or
        the form is submitted — with no
        <code class="docs-inline">[error]</code> binding at all. Blur the fields
        below, or submit, to see it.
      </p>

      <docs-example [code]="reactiveCode" [column]="true">
        <form class="es-form" [formGroup]="profile" (ngSubmit)="profile.markAllAsTouched()">
          <mk-form-error-summary
            [form]="profile"
            [labels]="profileLabels"
          />
          <mk-form-field label="Email">
            <input mkInput type="email" formControlName="email" />
          </mk-form-field>
          <mk-form-field label="Age" [errorMessages]="ageMessages">
            <mk-number-input formControlName="age" [min]="18" [max]="120" />
          </mk-form-field>
          <button mkButton type="submit">Submit</button>
        </form>
        <p class="echo">Status: {{ profile.status }}</p>
      </docs-example>

      <p>
        Messages come from the <code class="docs-inline">validation</code> group
        of the i18n table, so a single
        <code class="docs-inline">provideMkI18n({{ '{' }} validation: … {{ '}' }})</code>
        localises every field; <code class="docs-inline">errorMessages</code>
        overrides a key for one field only.
      </p>

      <!-- ============================================================ -->
      <!-- FORM ERROR SUMMARY -->
      <!-- ============================================================ -->
      <h2>Form error summary</h2>
      <p>
        <code class="docs-inline">&lt;mk-form-error-summary&gt;</code> lists a
        form's validation errors at the top on a failed submit; each entry links
        to — and focuses — its field. Following the WAI/GOV.UK pattern it is an
        <code class="docs-inline">alert</code> region; call
        <code class="docs-inline">focus()</code> after a failed submit to send
        screen-reader and keyboard users straight to the problems. Submit the
        form empty to see it.
      </p>

      <docs-example [code]="errorSummaryCode" [column]="true">
        <form
          class="es-form"
          (ngSubmit)="submitErrorDemo(esSummary, esEmailField, esAgeField)"
        >
          <mk-form-error-summary #esSummary [errors]="esErrors(esEmailField, esAgeField)" />
          <mk-form-field
            #esEmailField
            label="Email"
            required
            [error]="esSubmitted() && !esEmailValid() ? 'Enter a valid email address' : null"
          >
            <input mkInput type="email" [(ngModel)]="esEmail" name="esEmail" />
          </mk-form-field>
          <mk-form-field
            #esAgeField
            label="Age"
            required
            [error]="esSubmitted() && !esAgeValid() ? 'Age must be a whole number' : null"
          >
            <input mkInput [(ngModel)]="esAge" name="esAge" />
          </mk-form-field>
          <button mkButton type="submit">Submit</button>
        </form>
      </docs-example>

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
      <!-- SUBMIT INPUT -->
      <!-- ============================================================ -->
      <h2>Submit input</h2>
      <p>
        <code class="docs-inline">&lt;mk-submit-input&gt;</code> is the
        "type a code and apply it" pattern as one connected control — discount
        codes, gift cards, invite codes, newsletter sign-up, quick search. The
        input and its action button share a single frame; the button is disabled
        while the value is blank and shows a spinner while
        <code class="docs-inline">loading</code>.
        <code class="docs-inline">(submitted)</code> emits the
        <strong>trimmed</strong> value on click or on Enter.
      </p>
      <p>
        These controls almost always sit inside a bigger form, so Enter must not
        trigger <em>that</em> form's submit: the action is a
        <code class="docs-inline">type="button"</code> and the Enter keydown is
        <code class="docs-inline">preventDefault()</code>-ed, which suppresses
        the browser's implicit submission. Pass
        <code class="docs-inline">[submitOnEnter]="false"</code> to hand Enter
        back to the enclosing form.
      </p>
      <p>
        The button is configured, not projected:
        <code class="docs-inline">buttonLabel</code> sets its caption, and adding
        <code class="docs-inline">buttonIcon</code> switches it to the square
        icon-only variant where the same label becomes its
        <code class="docs-inline">aria-label</code> — so the action is always
        named for assistive tech.
      </p>

      <docs-example [code]="submitInputCode" [column]="true">
        <mk-form-field label="Discount code" hint="Try SUMMER10">
          <mk-submit-input
            buttonLabel="Apply"
            placeholder="SUMMER10"
            clearable
            [loading]="applying()"
            [(value)]="discountCode"
            (submitted)="applyCode($event)"
          />
        </mk-form-field>
        <p class="echo">Applied: {{ appliedCode() || '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string&gt;</td><td>''</td><td>Two-way value ([(value)] / [(ngModel)] / formControl).</td></tr>
          <tr><td>buttonLabel</td><td>string</td><td>i18n 'Submit'</td><td>Button caption — or its aria-label in the icon variant.</td></tr>
          <tr><td>buttonIcon</td><td>string</td><td>''</td><td>Registered icon name; switches to the icon-only button.</td></tr>
          <tr><td>buttonVariant / buttonTone</td><td>MkVariant / MkTone</td><td>'solid' / 'primary'</td><td>Button styling, forwarded to mkButton.</td></tr>
          <tr><td>loading</td><td>boolean</td><td>false</td><td>Spinner in the button; blocks submitting while an action runs.</td></tr>
          <tr><td>clearable</td><td>boolean</td><td>false</td><td>Show a clear affix while the value is non-empty.</td></tr>
          <tr><td>submitOnEnter</td><td>boolean</td><td>true</td><td>Enter submits the control without submitting the enclosing form.</td></tr>
          <tr><td>label</td><td>string</td><td>''</td><td>Accessible name for the input when used outside an mk-form-field.</td></tr>
          <tr><td>placeholder / type / autocomplete</td><td>string</td><td>'' / 'text' / 'off'</td><td>Passed through to the inner input.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
          <tr><td>invalid / disabled</td><td>boolean</td><td>false</td><td>Force invalid styling / disable input + button.</td></tr>
          <tr><td>(submitted)</td><td>string</td><td>—</td><td>Emits the trimmed value on click or Enter.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- FILE UPLOAD -->
      <!-- ============================================================ -->
      <h2>File upload</h2>
      <p>
        <code class="docs-inline">&lt;mk-file-upload&gt;</code> is an accessible
        click-or-drag dropzone with multi-file support, type/size/count
        validation, image thumbnails and per-file progress. Provide an
        <code class="docs-inline">uploadFn</code> to stream each accepted file to
        your backend (it reports progress and resolves/rejects); the dropzone is
        a real button, so Enter/Space opens the native picker.
      </p>

      <docs-example [code]="fileUploadCode" [column]="true">
        <mk-file-upload
          accept="image/*"
          multiple
          [maxSize]="5000000"
          [maxFiles]="4"
          hint="PNG, JPG or GIF up to 5 MB — max 4 files"
          [uploadFn]="fakeUpload"
          [(files)]="uploads"
        />
        <p class="echo">
          Tracked: {{ uploads().length }} file(s) —
          {{ uploadSummary() }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>accept</td><td>string</td><td>''</td><td>Native accept filter (e.g. <code class="docs-inline">image/*</code>, <code class="docs-inline">.pdf,.doc</code>).</td></tr>
          <tr><td>multiple</td><td>boolean</td><td>false</td><td>Allow selecting more than one file.</td></tr>
          <tr><td>maxSize</td><td>number</td><td>0</td><td>Max bytes per file (0 = unlimited).</td></tr>
          <tr><td>maxFiles</td><td>number</td><td>0</td><td>Max files kept (0 = unlimited).</td></tr>
          <tr><td>uploadFn</td><td>MkUploadFn | null</td><td>null</td><td>Async handler; reports progress + resolves/rejects.</td></tr>
          <tr><td>files</td><td>model&lt;MkUploadFile[]&gt;</td><td>[]</td><td>Two-way tracked file list.</td></tr>
          <tr><td>(filesSelected)</td><td>File[]</td><td>—</td><td>Accepted files each time files are added.</td></tr>
          <tr><td>(rejected)</td><td>MkUploadRejection[]</td><td>—</td><td>Rejected files with a reason.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- CODE EDITOR -->
      <!-- ============================================================ -->
      <h2>Code editor</h2>
      <p>
        <code class="docs-inline">&lt;mk-code-editor&gt;</code> is a lightweight,
        dependency-free code field with syntax highlighting. With
        <code class="docs-inline">language="json"</code> it validates on every
        change (inline error + <code class="docs-inline">(validate)</code>) and
        offers <code class="docs-inline">format()</code> to pretty-print — ideal
        for a CMS <code class="docs-inline">json</code> field. Tab inserts spaces;
        press Escape then Tab to move focus out (never a keyboard trap).
      </p>

      <docs-example [code]="codeEditorCode" [column]="true">
        <div style="width: 100%;">
          <mk-code-editor
            #jsonEditor
            language="json"
            [rows]="9"
            ariaLabel="Configuration JSON"
            [(value)]="config"
            (validate)="jsonValid.set($event)"
          />
          <div style="display: flex; align-items: center; gap: var(--mk-space-2); margin-top: var(--mk-space-2);">
            <button mkButton variant="outline" size="sm" (click)="jsonEditor.format()">
              Format
            </button>
            <span class="echo">
              {{ jsonValid().valid ? '✓ valid JSON' : '✗ ' + jsonValid().error }}
            </span>
          </div>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>language</td><td>'json' | 'plaintext'</td><td>'plaintext'</td><td>Highlighting + validation mode.</td></tr>
          <tr><td>value</td><td>model&lt;string&gt;</td><td>''</td><td>Two-way editor content.</td></tr>
          <tr><td>rows</td><td>number</td><td>8</td><td>Visible rows (minimum height).</td></tr>
          <tr><td>lineNumbers</td><td>boolean</td><td>true</td><td>Show a line-number gutter.</td></tr>
          <tr><td>tabSize</td><td>number</td><td>2</td><td>Spaces inserted by Tab / used by format().</td></tr>
          <tr><td>wrap</td><td>boolean</td><td>false</td><td>Soft-wrap instead of horizontal scroll.</td></tr>
          <tr><td>readOnly / disabled</td><td>boolean</td><td>false</td><td>Read-only / disabled states.</td></tr>
          <tr><td>format()</td><td>method</td><td>—</td><td>Pretty-print valid JSON (via exportAs template ref).</td></tr>
          <tr><td>(validate)</td><td>MkCodeValidity</td><td>—</td><td>Emits {{ '{ valid, error }' }} on change.</td></tr>
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
      .es-form {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-4);
        max-width: 28rem;
        width: 100%;
      }
    `,
  ],
})
export class FormsPage {
  // --- FormField --------------------------------------------------------------
  protected readonly email = signal('');
  protected readonly emailError = computed(() => {
    const v = this.email();
    if (!v) return null;
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : 'Enter a valid email address.';
  });

  // --- Form error summary ---------------------------------------------------
  protected readonly esEmail = signal('');
  protected readonly esAge = signal('');
  protected readonly esSubmitted = signal(false);

  protected esEmailValid(): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.esEmail());
  }
  protected esAgeValid(): boolean {
    const v = this.esAge().trim();
    return v !== '' && Number.isInteger(Number(v));
  }
  protected esErrors(email: MkFormField, age: MkFormField): MkFormError[] {
    if (!this.esSubmitted()) return [];
    const errors: MkFormError[] = [];
    if (!this.esEmailValid())
      errors.push({ fieldId: email.controlId, message: 'Enter a valid email address' });
    if (!this.esAgeValid())
      errors.push({ fieldId: age.controlId, message: 'Age must be a whole number' });
    return errors;
  }
  protected submitErrorDemo(
    summary: MkFormErrorSummary,
    email: MkFormField,
    age: MkFormField,
  ): void {
    this.esSubmitted.set(true);
    // Focus the summary once it has rendered with the new errors.
    if (this.esErrors(email, age).length) setTimeout(() => summary.focus());
  }

  // --- Select ---------------------------------------------------------------
  protected readonly roleOptions: readonly MkSelectOption[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' },
    { label: 'Owner (locked)', value: 'owner', disabled: true },
  ];
  protected readonly role = signal<unknown>(null);

  // --- Submit input ---------------------------------------------------------
  protected readonly discountCode = signal('');
  protected readonly appliedCode = signal('');
  protected readonly applying = signal(false);

  /** Demo action: fakes a round-trip to the server, then echoes the code. */
  protected applyCode(code: string): void {
    this.applying.set(true);
    setTimeout(() => {
      this.applying.set(false);
      this.appliedCode.set(code.toUpperCase());
      this.discountCode.set('');
    }, 900);
  }

  // --- File upload ----------------------------------------------------------
  protected readonly uploads = signal<MkUploadFile[]>([]);
  protected readonly uploadSummary = computed(() => {
    const files = this.uploads();
    if (!files.length) return 'none yet';
    const done = files.filter((f) => f.status === 'success').length;
    return `${done} uploaded`;
  });

  /** Demo uploader: streams fake progress, then resolves. */
  protected readonly fakeUpload: MkUploadFn = (_file, onProgress) =>
    new Promise<void>((resolve) => {
      let pct = 0;
      const tick = () => {
        pct += 20;
        onProgress(pct);
        if (pct >= 100) resolve();
        else setTimeout(tick, 220);
      };
      setTimeout(tick, 220);
    });

  // --- Code editor ----------------------------------------------------------
  protected readonly config = signal(
    '{"theme":"dark","features":{"search":true,"beta":false},"limits":[10,20,30]}',
  );
  protected readonly jsonValid = signal<MkCodeValidity>({
    valid: true,
    error: null,
  });

  // --- Reactive forms demo ---------------------------------------------------
  protected readonly profileLabels = { email: 'Email address', age: 'Age' };
  protected readonly ageMessages = { min: 'You must be 18 or over' };
  protected readonly profile = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    age: new FormControl<number | null>(null, Validators.required),
  });

  // --- Code snippets (plain strings shown in the code blocks) ---------------
  protected readonly formFieldCode = `<mk-form-field
  label="Email"
  hint="We never share it."
  required
  [error]="emailError()"
>
  <input mkInput type="email" placeholder="you@example.com" [(ngModel)]="email" />
</mk-form-field>`;

  protected readonly errorSummaryCode = `<form (ngSubmit)="onSubmit()">
  <mk-form-error-summary #summary [errors]="errors()" />

  <mk-form-field #emailField label="Email" [error]="emailError()">
    <input mkInput [(ngModel)]="email" name="email" />
  </mk-form-field>
  <!-- … more fields … -->
  <button mkButton type="submit">Submit</button>
</form>

onSubmit() {
  this.submitted.set(true);
  if (this.errors().length) this.summary.focus();  // move focus to the list
}
// errors(): { fieldId: field.controlId, message: '…' }[]`;

  protected readonly reactiveCode = `profile = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  age: new FormControl<number | null>(null, Validators.required),
});

<form [formGroup]="profile" (ngSubmit)="submit()">
  <mk-form-error-summary [form]="profile"
    [labels]="profileLabels" />

  <!-- no [error] binding: the field reads the control itself -->
  <mk-form-field label="Email">
    <input mkInput type="email" formControlName="email" />
  </mk-form-field>

  <!-- [min] reports a \`min\` error; errorMessages rewords it here only -->
  <mk-form-field label="Age" [errorMessages]="ageMessages">
    <mk-number-input formControlName="age" [min]="18" [max]="120" />
  </mk-form-field>

  <button mkButton type="submit">Submit</button>
</form>`;

  protected readonly selectCode = `roleOptions: MkSelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Owner (locked)', value: 'owner', disabled: true },
];

<mk-select placeholder="Pick a role" [options]="roleOptions" [(value)]="role" />`;

  protected readonly submitInputCode = `<mk-form-field label="Discount code" hint="Try SUMMER10">
  <mk-submit-input
    buttonLabel="Apply"
    placeholder="SUMMER10"
    clearable
    [loading]="applying()"
    [(value)]="discountCode"
    (submitted)="applyCode($event)" />
</mk-form-field>

// Icon-only variant — buttonLabel becomes the aria-label:
<mk-submit-input buttonIcon="search" buttonLabel="Search" [(value)]="query" />`;

  protected readonly fileUploadCode = `<mk-file-upload
  accept="image/*"
  multiple
  [maxSize]="5_000_000"
  [maxFiles]="4"
  hint="PNG, JPG or GIF up to 5 MB — max 4 files"
  [uploadFn]="upload"
  [(files)]="uploads" />`;

  protected readonly codeEditorCode = `<mk-code-editor #editor language="json" [rows]="9" [(value)]="config"
  (validate)="jsonValid.set($event)" />
<button mkButton variant="outline" size="sm" (click)="editor.format()">Format</button>`;
}
