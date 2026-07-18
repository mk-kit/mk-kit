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
          <tr><td>MatFormField + MatInput</td><td>mk-form-field + input[mkInput]</td><td>label/hint/error are inputs; no appearance variants</td></tr>
          <tr><td>MatSelect / MatAutocomplete</td><td>mk-select / mk-autocomplete</td><td>[options] input instead of &lt;mat-option&gt; children</td></tr>
          <tr><td>MatTable + Sort + Paginator</td><td>mk-table + mkSort + mk-pagination</td><td>plain arrays + signals instead of MatTableDataSource</td></tr>
          <tr><td>MatSnackBar</td><td>MkSnackbarService / MkToastService</td><td>bottom snackbar with action, or stacked toasts</td></tr>
          <tr><td>MatSlideToggle / Checkbox / Radio</td><td>mk-switch / mk-checkbox / mk-radio-group</td><td>same CVA bindings</td></tr>
          <tr><td>MatDatepicker / MatTimepicker</td><td>mk-date-picker / mk-time-picker</td><td>native Date, no adapters; locale via provideMkI18n</td></tr>
          <tr><td>MatMenu / Tabs / Stepper / Chips</td><td>mk-menu / mk-tabs / mk-stepper / mk-chip · mk-tag-input</td><td></td></tr>
          <tr><td>MatCard / Divider / List / ProgressBar / Spinner / Tooltip / Badge / ButtonToggle / BottomSheet</td><td>mk-card / mk-divider / mk-list / mk-progress-bar / mk-spinner / [mkTooltip] / mk-badge / mk-button-toggle-group / MkBottomSheetService</td><td>matBadge attribute → mk-badge element</td></tr>
          <tr><td>CDK Overlay / DragDrop / Clipboard / A11y / VirtualScroll</td><td>MkOverlayService · MkAnchoredPanel / &#64;mkornas/ui/dnd / mkCopyToClipboard / MkFocusTrap · MkLiveAnnouncer / mk-virtual-scroll</td><td>keyboard drag built in</td></tr>
        </tbody>
      </table>

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
  protected readonly iconCode = `bootstrapApplication(App, {
  providers: [provideMkMaterialIcons()],
});

<!-- templates: -->
<mk-icon name="delete" />        <!-- renders the trash glyph -->
<mk-icon name="expand_more" />   <!-- renders chevron-down -->

// app-specific SVGs:
inject(MkIconRegistry).register('chef', '<svg viewBox="0 0 24 24">…</svg>');`;
}
