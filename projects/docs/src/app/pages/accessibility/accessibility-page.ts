import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MkAlert, MkBadge } from '@mk-kit/ui';

/** One component family and the keyboard model it implements. */
interface Family {
  name: string;
  path: string;
  roles: string;
  keys: string;
}

/**
 * Accessibility statement — what `@mk-kit/ui` targets, what the repo
 * verifies automatically, what it does not, and where to report problems.
 *
 * Every figure here is derived from the source tree (`a11y-smoke.spec.ts`,
 * `contrast-smoke.spec.ts`, `mk-kit.css`, the harnesses) — keep them in sync
 * when those change.
 */
@Component({
  selector: 'docs-accessibility-page',
  imports: [MkAlert, MkBadge, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <mk-badge tone="primary" variant="soft">WCAG 2.1 AA</mk-badge>
      <h1>Accessibility statement</h1>
      <p class="docs-lead">
        <strong>mk-kit</strong> targets <strong>WCAG&nbsp;2.1 level&nbsp;AA</strong> for every
        component it ships. This page says what that means in practice: what the library does by
        default, what the repository checks on every commit, what it knowingly does not check yet,
        and how to tell us when something is wrong.
      </p>

      <h2>What we commit to</h2>
      <p>
        The component authoring spec makes accessibility a hard rule, not a polish step. Every
        component must use the correct semantic element or role, wire
        <code class="docs-inline">aria-*</code> attributes completely, be fully operable from the
        keyboard (Arrow keys, Home/End, Enter/Space, Escape where they apply), render a visible
        <code class="docs-inline">:focus-visible</code> ring from the shared focus-ring tokens, keep
        hit targets at 44&nbsp;px where relevant, and never convey information by colour alone.
        Status changes go through <code class="docs-inline">MkLiveAnnouncer</code>; ids for
        <code class="docs-inline">aria-labelledby</code> /
        <code class="docs-inline">aria-describedby</code> come from
        <code class="docs-inline">mkUniqueId()</code>. Overlays trap focus, mark the rest of the
        document <code class="docs-inline">inert</code>, restore focus on close, and a single Escape
        listener closes only the topmost overlay that opted into it.
      </p>

      <h2>What is verified automatically</h2>
      <p>These suites run in CI on every push and block a release when they fail.</p>
      <ul class="a11y-list">
        <li>
          <strong>axe-core smoke</strong>
          (<code class="docs-inline">projects/mk-kit/a11y-smoke.spec.ts</code>) —
          {{ axeCases }} host fixtures, one per component or tightly-coupled family, rendered
          through TestBed in jsdom and audited with the <em>default axe-core rule set</em> (the WCAG
          2.x A/AA rules plus axe's best-practice rules), asserting zero violations. Every rule is
          enabled except <code class="docs-inline">color-contrast</code> (see the gaps below).
          Findings this suite has caught and fixed include
          <code class="docs-inline">aria-allowed-attr</code> and
          <code class="docs-inline">nested-interactive</code> in drag &amp; drop.
        </li>
        <li>
          <strong>Token contrast</strong>
          (<code class="docs-inline">projects/mk-kit/contrast-smoke.spec.ts</code>) — reads the
          compiled theme and holds {{ contrastPairs }} text/background token pairs (subtle and muted
          text on the page, surface and sunken surfaces; primary-subtle text on primary-subtle; text
          on <code class="docs-inline">--mk-surface-2</code>) to <strong>4.5:1</strong> in
          <em>both</em> the light and the dark theme, with the same maths the heatmap uses at
          runtime. It also pins two pairs that are known to fail so nobody starts relying on them
          (listed under gaps).
        </li>
        <li>
          <strong>Keyboard specs</strong> — around thirty component specs drive the widgets with
          synthetic Arrow / Home / End / Enter / Escape events and assert focus,
          <code class="docs-inline">aria-activedescendant</code>,
          <code class="docs-inline">aria-expanded</code> and selection state: menus, select and
          listbox, tree, tabs, stepper, calendar, sliders, rating, the org chart, drag &amp; drop
          (<code class="docs-inline">dnd/drag-a11y.spec.ts</code> covers every ARIA shape a drop
          list can take) and more.
        </li>
        <li>
          <strong>SSR smoke</strong> — the whole library is rendered on the server so no component
          depends on browser globals for its markup.
        </li>
        <li>
          <strong>Visual regression</strong> — a Playwright sweep screenshots representative docs
          pages in light and dark against the production build. It guards layout and theming, not
          ARIA (see gaps).
        </li>
      </ul>

      <h2>Testing your own app</h2>
      <p>
        <code class="docs-inline">&#64;mk-kit/ui/testing</code> ships
        <code class="docs-inline">MkHarnessLoader</code> and {{ harnessCount }}
        harnesses (button, input, checkbox, switch, radio and radio group, select, form field, table
        and table row, dialog, toast, tabs, menu) that drive components the way a user does — click,
        type, keyboard — so your specs exercise the real accessible surface instead of internal
        state. See
        <a routerLink="/testing">Testing</a>. The a11y and contrast smoke specs are plain vitest
        files you can copy into your project and point at your own fixtures.
      </p>

      <h2>Theme and preference support</h2>
      <ul class="a11y-list">
        <li>
          <strong>Light and dark</strong> — follows
          <code class="docs-inline">prefers-color-scheme</code> or an explicit
          <code class="docs-inline">data-mk-theme="light" | "dark"</code>;
          <code class="docs-inline">MkThemeService</code> persists the choice.
        </li>
        <li>
          <strong>High contrast</strong> —
          <code class="docs-inline">data-mk-contrast="high"</code> swaps the colour tokens for a
          high-contrast set in both themes, and the same set is applied automatically for
          <code class="docs-inline">prefers-contrast: more</code>
          unless the app opts out with
          <code class="docs-inline">data-mk-contrast="normal"</code>.
          <code class="docs-inline">MkThemeService.contrast()</code> /
          <code class="docs-inline">setContrast()</code> expose it.
        </li>
        <li>
          <strong>Forced colours</strong> (Windows High Contrast) — under
          <code class="docs-inline">forced-colors: active</code> the tokens map to the system
          palette and state that was carried by a background only (selection, checked toggles,
          slider fills, tab ink bars) is re-expressed with
          <code class="docs-inline">Highlight</code> /
          <code class="docs-inline">HighlightText</code> and borders.
        </li>
        <li>
          <strong>Reduced motion</strong> — transitions and animations collapse under
          <code class="docs-inline">prefers-reduced-motion: reduce</code>, both in the theme
          stylesheet and per component.
        </li>
        <li>
          <strong>Density</strong> —
          <code class="docs-inline">data-mk-density="compact" | "touch"</code>
          retunes control heights; the touch preset raises them to 48&nbsp;px (<a
            routerLink="/touch"
            >Touch &amp; mobile</a
          >).
        </li>
        <li>
          <strong>RTL</strong> — layout and arrow-key axes flip under
          <code class="docs-inline">dir="rtl"</code>.
        </li>
        <li>
          <strong>Announcements in your language</strong> — every built-in string a screen reader
          hears (drag &amp; drop moves, pagination, sort state, close buttons, loading, the default
          names of unlabeled widgets) is a key in
          <code class="docs-inline">provideMkI18n()</code>
          (<a routerLink="/core-services">Core &amp; services</a>).
        </li>
      </ul>
      <p>
        Theme details, including the token lists, are on the
        <a routerLink="/theming">Theming</a> page.
      </p>

      <h2>Keyboard model by component family</h2>
      <p>
        The patterns follow the WAI-ARIA Authoring Practices. Composite widgets use a roving tab
        stop (one Tab stop per widget, arrows inside) or
        <code class="docs-inline">aria-activedescendant</code> where focus has to stay in an input.
      </p>
      <div class="a11y-table-wrap">
        <table class="docs-props a11y-table">
          <thead>
            <tr>
              <th>Family</th>
              <th>Roles</th>
              <th>Keys</th>
            </tr>
          </thead>
          <tbody>
            @for (f of families; track f.name) {
              <tr>
                <td>
                  <a [routerLink]="f.path">{{ f.name }}</a>
                </td>
                <td>{{ f.roles }}</td>
                <td>{{ f.keys }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <h2>Known gaps</h2>
      <p>Being honest about coverage matters more than the badge. As of this release:</p>
      <ol class="a11y-list">
        @for (gap of gaps; track gap) {
          <li>{{ gap }}</li>
        }
      </ol>

      <h2>Reporting a problem</h2>
      <mk-alert tone="info" title="Found a barrier?">
        Open an issue at
        <a href="https://github.com/mk-kit/mk-kit/issues" rel="noopener"
          >github.com/mk-kit/mk-kit/issues</a
        >
        with the component, the assistive technology and browser you used, and what you expected.
        Accessibility bugs are treated as defects, not feature requests, and fixes ship in the next
        patch release.
      </mk-alert>
    </div>
  `,
  styles: [
    `
      .a11y-list {
        line-height: var(--mk-line-height-relaxed);
      }
      .a11y-list li + li {
        margin-top: var(--mk-space-2);
      }
      .a11y-table-wrap {
        overflow-x: auto;
      }
      .a11y-table td:first-child {
        white-space: nowrap;
      }
    `,
  ],
})
export class AccessibilityPage {
  /** Host fixtures in `projects/mk-kit/a11y-smoke.spec.ts` (`CASES`). */
  protected readonly axeCases = 49;
  /** Token pairs in `projects/mk-kit/contrast-smoke.spec.ts` (`PAIRS`). */
  protected readonly contrastPairs = 7;
  /** Harness classes exported from `@mk-kit/ui/testing`. */
  protected readonly harnessCount = 14;

  protected readonly families: Family[] = [
    {
      name: 'Menus',
      path: '/components/navigation',
      roles:
        'menu / menuitem, opened from a trigger with aria-haspopup and aria-expanded; context menus share the model',
      keys: 'Trigger: Enter, Space, ArrowDown or ArrowUp opens and focuses the first item. Inside: ArrowUp/ArrowDown move, Home/End jump, ArrowRight/ArrowLeft open and close submenus (flipped in RTL), typeahead jumps by label, Enter activates, Escape closes and returns focus to the trigger.',
    },
    {
      name: 'Select, listbox and combobox',
      path: '/components/selection',
      roles:
        'combobox + listbox / option (select, autocomplete, multi-select); listbox / option with aria-multiselectable (listbox); aria-activedescendant keeps focus on the input',
      keys: 'ArrowUp/ArrowDown move the active option, Home/End jump (the listbox adds PageUp/PageDown), typeahead matches labels, Enter or Space selects, Escape closes the popup without changing the value.',
    },
    {
      name: 'Tree and org chart',
      path: '/components/tree',
      roles:
        'tree / treeitem / group with aria-level, aria-expanded and aria-selected; roving tab stop',
      keys: 'ArrowUp/ArrowDown move between visible nodes, ArrowRight expands or steps into children, ArrowLeft collapses or steps to the parent (axes swap in RTL and for the left-oriented org chart), Home/End jump, Enter or Space selects; the org chart adds * to expand all siblings and +/- to expand or collapse.',
    },
    {
      name: 'Tabs and stepper',
      path: '/components/navigation',
      roles:
        'tablist / tab / tabpanel for both; vertical steppers also mark the active step with aria-current="step"',
      keys: 'ArrowLeft/ArrowRight (ArrowUp/ArrowDown when vertical) move between tabs and select as they go, Home/End jump to the first and last tab, Tab leaves the tablist for the panel.',
    },
    {
      name: 'Dialogs, drawers and sheets',
      path: '/components/dialogs',
      roles:
        'dialog or alertdialog with aria-modal, named by its title; the rest of the page is inert while open',
      keys: 'Focus moves into the dialog on open and is trapped; Tab cycles inside; Escape closes the topmost overlay only; focus returns to the previously focused element on close. Draggable dialogs also move with the arrow keys from their title bar and Home re-centres them.',
    },
    {
      name: 'Tables and data grid',
      path: '/components/table',
      roles:
        'native table semantics; sortable headers are buttons with aria-sort; column resizers are separators; row selection uses checkboxes',
      keys: 'Sortable headers: Enter or Space cycles the sort and the change is announced. Resizers: ArrowLeft/ArrowRight resize by 10 px, Shift+Arrow by 1 px (mirrored in RTL). Reorderable columns: Alt+ArrowLeft/ArrowRight move the focused header. Editable cells: Enter or F2 edits, Enter commits, Escape cancels.',
    },
    {
      name: 'Drag and drop',
      path: '/components/drag-drop',
      roles:
        'group or listbox named by mkDropListLabel; items are buttons or options with aria-roledescription, aria-pressed and aria-grabbed; a focusable mkDragHandle carries the drag when rows hold their own controls',
      keys: 'Space or Enter picks up an item, arrows move it within the list and across connected lists at the ends, Space or Enter drops, Escape cancels. Every step is announced through MkLiveAnnouncer.',
    },
  ];

  /** Everything here is derived from the specs and stylesheet — keep it honest. */
  protected readonly gaps: string[] = [
    'Colour contrast is not audited by axe: jsdom cannot paint, so the color-contrast rule is disabled in the a11y smoke. Contrast is instead held to 4.5:1 for 7 named token pairs per theme; the high-contrast preset and per-component colour combinations (badges, chart fills, tone variants) are not machine-checked.',
    'The axe smoke covers 49 statically renderable fixtures. Open overlay states — dialogs, menus, tooltips, popovers, the select/combobox popup, toasts — are not run through axe; they rely on their own unit specs and manual review.',
    'There is no browser-based automated accessibility run: the Playwright sweep is screenshot regression only. Nothing verifies real focus rings, hit-target sizes or reflow at 320 px / 400 % zoom automatically.',
    'No formal screen-reader test matrix (NVDA, JAWS, VoiceOver, TalkBack) is maintained and no third-party audit, VPAT or ACR has been produced. Behaviour with assistive technology is verified ad hoc by the maintainers.',
    'Two token pairs are known to fail AA and must not be used for readable text: --mk-text-disabled on --mk-surface (both themes; disabled text is exempt under 1.4.3 but stays hard to read) and --mk-primary on --mk-primary-subtle in the dark theme (about 3.3:1).',
    'Drag and drop announcements fall back to an auto-generated list id when a drop list has no mkDropListLabel, so cross-list moves read as gibberish until the app names its lists.',
  ];
}
