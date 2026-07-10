import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  MkSelect,
  type MkSelectOption,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the FORM structure components of `@mkornas/ui`:
 * FormField, Form error summary, Select, File upload and Code editor.
 */
@Component({
  selector: 'docs-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkFormField,
    MkFormErrorSummary,
    MkInput,
    MkSelect,
    MkFileUpload,
    MkCodeEditor,
    MkButton,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Forms</h1>
      <p class="docs-lead">
        Form structure and composite fields: the accessible
        <code class="docs-inline">&lt;mk-form-field&gt;</code> wrapper, a
        submit-time error summary, a custom select, a file-upload dropzone and a
        code editor. Every control implements
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
          <tr><td>error</td><td>string | null</td><td>null</td><td>Error message; non-empty marks the field invalid.</td></tr>
          <tr><td>required</td><td>boolean</td><td>false</td><td>Adds a required indicator + aria-required.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Visually reflect a disabled control.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size; nested controls inherit it.</td></tr>
        </tbody>
      </table>

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

  protected readonly selectCode = `roleOptions: MkSelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Owner (locked)', value: 'owner', disabled: true },
];

<mk-select placeholder="Pick a role" [options]="roleOptions" [(value)]="role" />`;

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
