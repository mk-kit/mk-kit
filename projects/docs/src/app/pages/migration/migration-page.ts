import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsExample } from '../../shared/docs-example';

/**
 * Angular Material → mk-kit migration guide (condensed from MIGRATION.md).
 */
@Component({
  selector: 'docs-migration-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample],
  template: `
    <div class="docs-page docs-container">
      <h1>Migrating from Angular Material</h1>
      <p class="docs-lead">
        Every Material module a typical admin app uses has an mk-kit
        counterpart, selectors and tokens never collide, and both libraries
        are standalone-component based — so you migrate
        <strong>incrementally, view by view, with both installed</strong>.
        The full guide lives in <code class="docs-inline">MIGRATION.md</code>;
        this page is the map.
      </p>

      <h2>Component map</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Angular Material</th><th>mk-kit</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>MatButton</td><td>button[mkButton]</td><td>variant / tone / size / iconOnly / loading</td></tr>
          <tr><td>MatIcon (ligatures)</td><td>&lt;mk-icon name&gt;</td><td>provideMkMaterialIcons() keeps your names — see below</td></tr>
          <tr><td>MatDialog</td><td>MkDialogService</td><td>open(Cmp, {{ '{' }} data {{ '}' }}) · MK_OVERLAY_DATA · MkOverlayRef · await ref.afterClosed</td></tr>
          <tr><td>MatFormField + MatInput + MatError</td><td>mk-form-field + input[mkInput]</td><td>label/hint are inputs; the error is derived from the bound control like mat-error (no ErrorStateMatcher — see below); no appearance variants</td></tr>
          <tr><td>MatSelect / MatAutocomplete</td><td>mk-select / mk-autocomplete</td><td>[options] input instead of &lt;mat-option&gt; children</td></tr>
          <tr><td>MatTable + Sort + Paginator</td><td>mk-table + mkSort + mk-pagination</td><td>plain arrays + signals instead of MatTableDataSource</td></tr>
          <tr><td>MatSnackBar</td><td>MkSnackbarService / MkToastService</td><td>bottom snackbar with action, or stacked toasts</td></tr>
          <tr><td>MatSlideToggle / Checkbox / Radio</td><td>mk-switch / mk-checkbox / mk-radio-group</td><td>same CVA bindings</td></tr>
          <tr><td>MatDatepicker / MatTimepicker</td><td>mk-date-picker / mk-time-picker</td><td>native Date, no adapters; locale via provideMkI18n</td></tr>
          <tr><td>MatMenu / Tabs / Stepper / Chips</td><td>mk-menu / mk-tabs / mk-stepper / mk-chip · mk-tag-input</td><td></td></tr>
          <tr><td>MatCard / Divider / List / ProgressBar / Spinner / Tooltip / Badge / ButtonToggle / BottomSheet</td><td>mk-card / mk-divider / mk-list / mk-progress-bar / mk-spinner / [mkTooltip] / mk-badge / mk-button-toggle-group / MkBottomSheetService</td><td>matBadge attribute → mk-badge element</td></tr>
          <tr><td>CDK Overlay / DragDrop / Clipboard / A11y / VirtualScroll</td><td>MkOverlayService · MkAnchoredPanel / &#64;mk-kit/ui/dnd / mkCopyToClipboard / MkFocusTrap · MkLiveAnnouncer / mk-virtual-scroll</td><td>keyboard drag built in</td></tr>
        </tbody>
      </table>

      <h2>Errors and validation</h2>
      <p>
        There is no <code class="docs-inline">&lt;mat-error&gt;</code> element
        and no <code class="docs-inline">ErrorStateMatcher</code>.
        <code class="docs-inline">mk-form-field</code> picks up the projected
        control's <code class="docs-inline">NgControl</code> and renders the
        first error itself, wording it from the
        <code class="docs-inline">validation</code> i18n table — so the common
        case loses the per-field <code class="docs-inline">&#64;if</code> ladder
        entirely. The <code class="docs-inline">errorOn</code> input replaces a
        custom matcher (<code class="docs-inline">'touched'</code> is Material's
        default behaviour), and <code class="docs-inline">errorMessages</code>
        rewords a single key.
      </p>
      <docs-example [code]="errorCode" [column]="true">
        <p class="echo">One field, no error plumbing — see the code.</p>
      </docs-example>
      <p>
        Constraint inputs behave like Material's validator directives:
        <code class="docs-inline">[min]</code> / <code class="docs-inline">[max]</code>
        on a date picker report <code class="docs-inline">mkMinDate</code> /
        <code class="docs-inline">mkMaxDate</code> (Material's
        <code class="docs-inline">matDatepickerMin</code> /
        <code class="docs-inline">matDatepickerMax</code>), numeric controls
        report the standard <code class="docs-inline">min</code> /
        <code class="docs-inline">max</code> keys, and
        <code class="docs-inline">required</code> on
        <code class="docs-inline">mk-checkbox</code> behaves like
        <code class="docs-inline">Validators.requiredTrue</code>.
      </p>

      <h2>Icons: keep your Material names</h2>
      <p>
        The built-in set is ~95 Feather-style SVG glyphs.
        <code class="docs-inline">provideMkMaterialIcons()</code> adds ~185
        Material Symbols aliases (<code class="docs-inline">delete → trash</code>,
        <code class="docs-inline">expand_more → chevron-down</code>,
        <code class="docs-inline">visibility_off → eye-off</code>, …), so
        ligature names survive a find-and-replace of the tag — and the
        Symbols font download disappears.
      </p>
      <docs-example [code]="iconCode" [column]="true">
        <p class="echo">
          &lt;mat-icon&gt;qr_code_scanner&lt;/mat-icon&gt; →
          &lt;mk-icon name="qr_code_scanner" /&gt;
        </p>
      </docs-example>

      <h2>Theming</h2>
      <p>
        <code class="docs-inline">mat.theme()</code> becomes CSS custom
        properties: import the stylesheet, set
        <code class="docs-inline">--mk-primary</code> and friends (the
        <a href="/theme-builder">theme builder</a> generates the sheet). Dark
        mode is built in via
        <code class="docs-inline">data-mk-theme</code> /
        <code class="docs-inline">MkThemeService</code> — hand-rolled
        <code class="docs-inline">body.dark</code> token sets get deleted.
        Density: <code class="docs-inline">data-mk-density="compact"</code>.
      </p>

      <h2>Honest gaps</h2>
      <ul>
        <li>No <code class="docs-inline">MatTableDataSource</code> — you own sort/filter/page with signals (usually less code).</li>
        <li>Select/autocomplete options are data inputs, not projected <code class="docs-inline">&lt;mat-option&gt;</code> templates.</li>
        <li>One field look — <code class="docs-inline">appearance="outline"</code> attributes just get deleted.</li>
        <li>Ripples are opt-in (<code class="docs-inline">mkRipple</code>); service APIs are Promise/signal-based, not Observable.</li>
      </ul>

      <h2>Suggested order</h2>
      <p>
        Theme tokens → icons (alias provider) → buttons/tooltips/spinners →
        form fields → dialogs &amp; bottom sheets → tables → pickers, chips,
        snackbars, menus — then drop
        <code class="docs-inline">&#64;angular/material</code> and prune the
        <code class="docs-inline">.mat-*</code> override CSS. Full details,
        including per-surface before/after snippets, in
        <code class="docs-inline">MIGRATION.md</code>.
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
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class MigrationPage {
  protected readonly errorCode = `// Material
<mat-form-field>
  <mat-label>Email</mat-label>
  <input matInput formControlName="email" />
  @if (form.controls.email.hasError('required')) {
    <mat-error>Email is required</mat-error>
  }
  @if (form.controls.email.hasError('email')) {
    <mat-error>Enter a valid email address</mat-error>
  }
</mat-form-field>

// mk-kit — the field reads the control and words the error itself
<mk-form-field label="Email">
  <input mkInput formControlName="email" />
</mk-form-field>`;

  protected readonly iconCode = `bootstrapApplication(App, {
  providers: [provideMkMaterialIcons()],
});

<!-- templates: -->
<mk-icon name="delete" />        <!-- renders the trash glyph -->
<mk-icon name="expand_more" />   <!-- renders chevron-down -->

// app-specific SVGs:
inject(MkIconRegistry).register('chef', '<svg viewBox="0 0 24 24">…</svg>');`;
}
