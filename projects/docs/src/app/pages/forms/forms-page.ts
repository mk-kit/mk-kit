import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkButton,
  MkCheckbox,
  MkCodeEditor,
  type MkCodeValidity,
  MkFileUpload,
  type MkUploadFile,
  type MkUploadFn,
  MkFormField,
  MkFormErrorSummary,
  type MkFormError,
  MkInput,
  MkAutosize,
  MkColorPicker,
  MkNumberInput,
  MkOtp,
  MkPasswordInput,
  MkRadio,
  MkRangeSlider,
  type MkRange,
  MkRadioGroup,
  MkRating,
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
    MkFormErrorSummary,
    MkInput,
    MkSelect,
    MkCheckbox,
    MkRadioGroup,
    MkRadio,
    MkSwitch,
    MkSlider,
    MkFileUpload,
    MkCodeEditor,
    MkButton,
    MkRating,
    MkNumberInput,
    MkOtp,
    MkPasswordInput,
    MkAutosize,
    MkColorPicker,
    MkRangeSlider,
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

      <!-- ============================================================ -->
      <!-- RATING / NUMBER / OTP / AUTOSIZE -->
      <!-- ============================================================ -->
      <h2>Rating</h2>
      <p>
        <code class="docs-inline">&lt;mk-rating&gt;</code> is a star rating input
        (and read-only display) following the ARIA slider pattern — click/hover a
        star, or focus and use Arrow keys.
      </p>
      <docs-example [code]="ratingCode" [column]="true">
        <mk-rating [(value)]="score" />
        <p class="echo">Score: {{ score() }} / 5 · <mk-rating [value]="4" readonly size="sm" /> (read-only)</p>
      </docs-example>

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

      <h2>Color picker</h2>
      <p>
        <code class="docs-inline">&lt;mk-color-picker&gt;</code> is a compact color
        control: a live swatch that opens the native OS picker, an editable hex
        field and an optional row of preset swatches.
      </p>
      <docs-example [code]="colorCode" [column]="true">
        <mk-color-picker [(value)]="brand" [swatches]="palette" />
        <p class="echo">Value: <code class="docs-inline">{{ brand() }}</code></p>
      </docs-example>

      <h2>Range slider</h2>
      <p>
        <code class="docs-inline">&lt;mk-range-slider&gt;</code> selects a
        <code class="docs-inline">[low, high]</code> range with two thumbs (each a
        <code class="docs-inline">role="slider"</code>); the thumbs can't cross.
      </p>
      <docs-example [code]="rangeCode" [column]="true">
        <div style="max-width: 26rem; width: 100%;">
          <mk-range-slider [min]="0" [max]="1000" [step]="10" [(value)]="priceRange" />
          <p class="echo">Range: {{ priceRange()[0] }} – {{ priceRange()[1] }}</p>
        </div>
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
  // --- FormField / Input ----------------------------------------------------
  protected readonly email = signal('');
  protected readonly emailError = computed(() => {
    const v = this.email();
    if (!v) return null;
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : 'Enter a valid email address.';
  });
  protected readonly name = signal('');
  protected readonly message = signal('');

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

  // --- File upload ----------------------------------------------------------
  protected readonly uploads = signal<MkUploadFile[]>([]);
  protected readonly uploadSummary = computed(() => {
    const files = this.uploads();
    if (!files.length) return 'none yet';
    const done = files.filter((f) => f.status === 'success').length;
    return `${done} uploaded`;
  });

  // --- Password input -------------------------------------------------------
  protected readonly password = signal('');

  // --- Rating / number / otp / autosize -------------------------------------
  protected readonly score = signal(3);
  protected readonly qty = signal<number | null>(1);
  protected readonly otp = signal('');
  protected readonly note = signal('');
  protected readonly brand = signal('#4f46e5');
  protected readonly palette = [
    '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#111827',
  ];

  protected readonly passwordCode = `<mk-password-input
  [(value)]="password"
  showStrength
  showRules
  [minLength]="10"
  placeholder="Create a password" />

<mk-form-field label="Password">
  <mk-password-input [(value)]="password" [minLength]="10" placeholder="Create a password" />
</mk-form-field>`;

  protected readonly ratingCode = `<mk-rating [(value)]="score" />`;
  protected readonly colorCode = `<mk-color-picker [(value)]="brand" [swatches]="palette" />`;
  protected readonly priceRange = signal<MkRange>([200, 750]);
  protected readonly rangeCode = `<mk-range-slider [min]="0" [max]="1000" [step]="10" [(value)]="priceRange" />`;
  protected readonly numberCode = `<mk-number-input [(value)]="qty" [min]="0" [max]="20" [step]="1" />`;
  protected readonly otpCode = `<mk-otp [(value)]="code" [length]="6" />`;
  protected readonly autosizeCode = `<textarea mkInput mkAutosize [mkAutosizeMaxRows]="8"
  [mkAutosizeValue]="note()" [(ngModel)]="note"></textarea>`;

  // --- Code editor ----------------------------------------------------------
  protected readonly config = signal(
    '{"theme":"dark","features":{"search":true,"beta":false},"limits":[10,20,30]}',
  );
  protected readonly jsonValid = signal<MkCodeValidity>({
    valid: true,
    error: null,
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

  // --- Code snippets (plain strings shown in the code blocks) ---------------
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
