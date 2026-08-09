import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MkButton,
  MkFileUpload,
  type MkUploadFile,
  type MkUploadFn,
  MkFormField,
  MkFormErrorSummary,
  type MkFormError,
  MkInput,
  MkNumberInput,
  MkRepeater,
  MkRepeaterEmpty,
  MkRepeaterRow,
  MkSelect,
  type MkSelectOption,
  MkSubmitInput,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

interface OrderLine {
  name: string;
  qty: number;
}

/**
 * Documentation + live demo page for the FORM structure components of `@mkornas/ui`:
 * FormField, Form error summary, Select, Submit input, File upload and Repeater.
 */
@Component({
  selector: 'docs-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    DocsExample,
    MkFormField,
    MkFormErrorSummary,
    MkInput,
    MkSelect,
    MkNumberInput,
    MkFileUpload,
    MkButton,
    MkRepeater,
    MkRepeaterEmpty,
    MkRepeaterRow,
    MkSubmitInput,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Forms</h1>
      <p class="docs-lead">
        Form structure and composite fields: the accessible
        <code class="docs-inline">&lt;mk-form-field&gt;</code> wrapper, a
        submit-time error summary, a custom select, a code-and-apply submit
        input, a file-upload dropzone and a repeater for editable lists. Every
        control implements
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
        <code class="docs-inline">alert</code> region, and when the surrounding
        form is submitted with errors <strong>focus moves to the summary
        automatically</strong>, taking screen-reader and keyboard users straight
        to the problems. Opt out with
        <code class="docs-inline">[autoFocus]="false"</code>; the public
        <code class="docs-inline">focus()</code> method remains for manual
        flows, e.g. errors that only arrive from the server. Submit the form
        empty to see it.
      </p>

      <docs-example [code]="errorSummaryCode" [column]="true">
        <form
          class="es-form"
          (ngSubmit)="submitErrorDemo()"
        >
          <mk-form-error-summary [errors]="esErrors(esEmailField, esAgeField)" />
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

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>errors</td><td>readonly MkFormError[]</td><td>[]</td><td>Explicit {{ '{ fieldId, message }' }} entries. When non-empty they win over <code class="docs-inline">form</code> — useful for server-side errors.</td></tr>
          <tr><td>form</td><td>AbstractControl | null</td><td>null</td><td>Collect entries from this control tree instead: one per invalid control, worded from the <code class="docs-inline">validation</code> i18n table.</td></tr>
          <tr><td>labels</td><td>Record&lt;string, string&gt;</td><td>{{ '{}' }}</td><td>Field names for automatic entries, keyed by control path (the path itself is used without one).</td></tr>
          <tr><td>errorMessages</td><td>MkErrorMessages | null</td><td>null</td><td>Per-key wording overrides for automatic entries, as on mk-form-field.</td></tr>
          <tr><td>showOn</td><td>'submit' | 'always'</td><td>'submit'</td><td>When automatic entries appear: after the form is submitted, or as soon as they exist.</td></tr>
          <tr><td>summaryTitle</td><td>string</td><td>i18n 'There is a problem'</td><td>Heading shown above the list.</td></tr>
          <tr><td>autoFocus</td><td>boolean</td><td>true</td><td>Move focus to the summary automatically when the surrounding form is submitted with errors. Disable to drive focus yourself.</td></tr>
          <tr><td>focus()</td><td>method</td><td>—</td><td>Move keyboard focus to the summary (no-op while there are no errors) — for manual flows.</td></tr>
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
        The <code class="docs-inline">&lt;mk-code-editor&gt;</code> field —
        a lightweight, dependency-free code textarea with syntax highlighting,
        JSON validation and <code class="docs-inline">format()</code> — is
        documented with the other code &amp; content components.
        <a routerLink="/components/markdown">See the Code &amp; content docs →</a>
      </p>

      <!-- ============================================================ -->
      <!-- REPEATER -->
      <!-- ============================================================ -->
      <h2 id="repeater">Repeater</h2>
      <p>
        <code class="docs-inline">&lt;mk-repeater&gt;</code> is the
        schema-friendly editable list: it renders one instance of your
        projected <code class="docs-inline">mkRepeaterRow</code> template per
        item, with add / remove / drag-and-drop reorder built in.
        <code class="docs-inline">items</code> is a two-way model (and the
        component is a <code class="docs-inline">ControlValueAccessor</code>
        over <code class="docs-inline">T[]</code>), every mutation produces a
        <strong>new array</strong>, and rows are tracked by item identity so
        removing a middle row keeps the other rows' input state intact.
      </p>
      <p>
        Here <code class="docs-inline">[factory]</code> creates a fresh
        <code class="docs-inline">{{ '{' }} name, qty {{ '}' }}</code> row,
        <code class="docs-inline">[min]="1"</code> keeps at least one row (its
        remove button disables) and <code class="docs-inline">[max]="5"</code>
        disables the add button at five. With
        <code class="docs-inline">reorderable</code>, each row gets a drag
        handle — pointer or keyboard (Space/Enter picks up, arrows move,
        Escape cancels), and each move is announced to screen readers.
      </p>
      <docs-example [code]="repeaterCode" [column]="true">
        <div style="max-width: 30rem; width: 100%;">
          <mk-repeater
            [(items)]="lines"
            [factory]="newLine"
            [min]="1"
            [max]="5"
            reorderable
            addLabel="Add line"
            (added)="onLineAdded($event)"
            (removed)="onLineRemoved($event)"
            (moved)="onLineMoved($event)"
          >
            <ng-template mkRepeaterRow let-item let-i="index">
              <div style="display: flex; gap: var(--mk-space-2); width: 100%;">
                <input
                  mkInput
                  placeholder="Item name"
                  [attr.aria-label]="'Name, row ' + (i + 1)"
                  [(ngModel)]="$any(item).name"
                  style="flex: 1"
                />
                <input
                  mkInput
                  type="number"
                  min="1"
                  [attr.aria-label]="'Quantity, row ' + (i + 1)"
                  [(ngModel)]="$any(item).qty"
                  style="width: 5.5rem"
                />
              </div>
            </ng-template>
            <ng-template mkRepeaterEmpty>No lines yet — add one.</ng-template>
          </mk-repeater>
          <p class="echo">
            {{ lines().length }} line(s) — last change: {{ repeaterStatus() }}
          </p>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>items</td><td>model&lt;T[]&gt;</td><td>[]</td><td>Two-way rows ([(items)] / [(ngModel)] / formControl). Every mutation sets a new array.</td></tr>
          <tr><td>factory</td><td>() =&gt; T</td><td>() =&gt; {{ '{}' }}</td><td>Creates the item appended by the add button.</td></tr>
          <tr><td>min</td><td>number</td><td>0</td><td>Minimum rows — remove buttons disable at (or below) it.</td></tr>
          <tr><td>max</td><td>number</td><td>0</td><td>Maximum rows (0 = unlimited) — the add button disables at it.</td></tr>
          <tr><td>reorderable</td><td>boolean</td><td>false</td><td>Per-row drag handles; pointer + keyboard reorder, announced via the live announcer.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the whole control (add, remove and reorder).</td></tr>
          <tr><td>addLabel</td><td>string</td><td>i18n 'Add row'</td><td>Add-button caption.</td></tr>
          <tr><td>(added)</td><td>{{ '{ item, index }' }}</td><td>—</td><td>Emitted after the add button appended a factory-made item.</td></tr>
          <tr><td>(removed)</td><td>{{ '{ item, index }' }}</td><td>—</td><td>Emitted after a row was removed.</td></tr>
          <tr><td>(moved)</td><td>{{ '{ from, to }' }}</td><td>—</td><td>Emitted after a row was reordered (drag or keyboard).</td></tr>
          <tr><td>mkRepeaterRow</td><td>ng-template</td><td>required</td><td>Row template; context: item (implicit, <code class="docs-inline">let-item</code>) + <code class="docs-inline">let-i="index"</code>.</td></tr>
          <tr><td>mkRepeaterEmpty</td><td>ng-template</td><td>—</td><td>Optional empty state shown instead of the row list while there are no items.</td></tr>
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
  protected submitErrorDemo(): void {
    // The summary focuses itself on a submit with errors (autoFocus).
    this.esSubmitted.set(true);
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

  // --- Reactive forms demo ---------------------------------------------------
  protected readonly profileLabels = { email: 'Email address', age: 'Age' };
  protected readonly ageMessages = { min: 'You must be 18 or over' };
  protected readonly profile = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    age: new FormControl<number | null>(null, Validators.required),
  });

  // --- Repeater ---------------------------------------------------------------
  protected readonly lines = signal<OrderLine[]>([
    { name: 'Espresso beans 1 kg', qty: 2 },
    { name: 'Oat milk 1 l', qty: 6 },
  ]);
  protected readonly repeaterStatus = signal('—');

  /** Fresh row appended by the add button. */
  protected readonly newLine = (): OrderLine => ({ name: '', qty: 1 });

  protected onLineAdded(e: { item: OrderLine; index: number }): void {
    this.repeaterStatus.set(`added row ${e.index + 1}`);
  }
  protected onLineRemoved(e: { item: OrderLine; index: number }): void {
    this.repeaterStatus.set(`removed "${e.item.name || 'empty row'}" (row ${e.index + 1})`);
  }
  protected onLineMoved(e: { from: number; to: number }): void {
    this.repeaterStatus.set(`moved row ${e.from + 1} → ${e.to + 1}`);
  }

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
  <!-- Focuses itself when the form is submitted with errors
       (opt out with [autoFocus]="false" and call focus() yourself). -->
  <mk-form-error-summary [errors]="errors()" />

  <mk-form-field #emailField label="Email" [error]="emailError()">
    <input mkInput [(ngModel)]="email" name="email" />
  </mk-form-field>
  <!-- … more fields … -->
  <button mkButton type="submit">Submit</button>
</form>

onSubmit() { this.submitted.set(true); }
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

  protected readonly repeaterCode = `interface OrderLine { name: string; qty: number; }

lines = signal<OrderLine[]>([{ name: 'Espresso beans 1 kg', qty: 2 }]);
newLine = (): OrderLine => ({ name: '', qty: 1 });   // fresh row per click

<mk-repeater [(items)]="lines" [factory]="newLine"
             [min]="1" [max]="5" reorderable addLabel="Add line"
             (added)="onAdded($event)"      <!-- { item, index } -->
             (removed)="onRemoved($event)"  <!-- { item, index } -->
             (moved)="onMoved($event)">     <!-- { from, to } -->
  <ng-template mkRepeaterRow let-item let-i="index">
    <input mkInput [(ngModel)]="$any(item).name" />
    <input mkInput type="number" min="1" [(ngModel)]="$any(item).qty" />
  </ng-template>
  <ng-template mkRepeaterEmpty>No lines yet — add one.</ng-template>
</mk-repeater>`;
}
