import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface HarnessDoc {
  name: string;
  host: string;
  methods: string;
}

const HARNESSES: HarnessDoc[] = [
  { name: 'MkButtonHarness', host: 'button[mkButton], a[mkButton]', methods: 'text(), click(), isDisabled(), isLoading(), tone(), variant(), size(), focus()' },
  { name: 'MkInputHarness', host: '[mkInput]', methods: 'value(), setValue(v), type(text), clear(), placeholder(), isInvalid(), isRequired(), isDisabled(), focus(), blur()' },
  { name: 'MkCheckboxHarness', host: 'mk-checkbox', methods: 'label(), isChecked(), isIndeterminate(), check(), uncheck(), toggle(), isDisabled()' },
  { name: 'MkSwitchHarness', host: 'mk-switch', methods: 'label(), isChecked(), check(), uncheck(), toggle(), isDisabled()' },
  { name: 'MkRadioGroupHarness', host: 'mk-radio-group', methods: 'radios(), labels(), checkedLabel(), checkedIndex(), select(index | label | RegExp)' },
  { name: 'MkSelectHarness', host: 'mk-select', methods: 'valueText(), placeholder(), open(), close(), isOpen(), options(), selectOption(index | label | RegExp), isDisabled(), isInvalid()' },
  { name: 'MkFormFieldHarness', host: 'mk-form-field', methods: 'label(), hint(), error(), hasError(), isRequired(), control(HarnessType)' },
  { name: 'MkTabsHarness', host: 'mk-tabs', methods: 'labels(), selectedIndex(), selectedLabel(), select(index | label | RegExp), isDisabled(tab), selectedPanelText()' },
  { name: 'MkMenuHarness', host: '[mkMenuTriggerFor] (matched by aria-haspopup="menu")', methods: 'open(), close(), isOpen(), items(), clickItem(index | text | RegExp), isItemDisabled(item)' },
  { name: 'MkTableHarness', host: 'mk-table', methods: 'headers(), rows(), rowCount(), cellTexts(), sortBy(column), sortDirection(column), toggleAll(), selectedRowCount(), isEmpty(), emptyMessage()' },
  { name: 'MkTableRowHarness', host: 'tr.mk-table__row', methods: 'cells(), cell(i), isSelected(), toggleSelected(), isExpanded(), toggleExpanded(), click()' },
  { name: 'MkDialogHarness', host: '.mk-overlay-panel[role=dialog] — via loader.document()', methods: 'title(), bodyText(), buttons(), clickButton(index | text | RegExp), close(), pressEscape(), input()' },
  { name: 'MkToastHarness', host: 'mk-toast — via loader.document()', methods: 'title(), message(), tone(), actionLabel(), clickAction(), dismiss()' },
];

/**
 * Guide for `@mk-kit/ui/testing` — the component harnesses. Static content:
 * the harnesses run inside a TestBed, so there is nothing to demo live; the
 * code samples are the real usage.
 */
@Component({
  selector: 'docs-testing-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Testing</h1>
      <p class="docs-lead">
        <code class="docs-inline">&#64;mk-kit/ui/testing</code> ships
        <strong>component harnesses</strong>: small objects that drive an
        mk-kit component the way a user does — open the select, pick
        “Editor”, read the field's error — so your specs never depend on the
        component's internal DOM. Zero extra dependencies; works with
        zoneless and zone-based <code class="docs-inline">TestBed</code>s.
      </p>

      <h2 id="quick-start">Quick start</h2>
      <p>
        Create a loader from the fixture, ask it for harnesses by type, act,
        assert. Every interaction runs change detection and awaits
        <code class="docs-inline">whenStable()</code>, so the next read sees
        the updated view.
      </p>
      <pre class="tp-code"><code>{{ quickStart }}</code></pre>

      <h2 id="loader">Finding harnesses</h2>
      <ul>
        <li>
          <code class="docs-inline">loader.get(Type, filters?)</code> — first
          match, throws with a readable message when there is none.
          <code class="docs-inline">getAll</code>,
          <code class="docs-inline">getOrNull</code> and
          <code class="docs-inline">has</code> do what they say.
        </li>
        <li>
          Filters: <code class="docs-inline">&#123; selector: '.save' &#125;</code>
          narrows by a CSS selector on the host,
          <code class="docs-inline">&#123; text: 'Save' &#125;</code> /
          <code class="docs-inline">&#123; text: /save/i &#125;</code> by the
          host's text.
        </li>
        <li>
          <code class="docs-inline">loader.within(element)</code> scopes
          lookups; <code class="docs-inline">field.control(MkInputHarness)</code>
          is the common case.
        </li>
        <li>
          <strong>Overlays live in <code class="docs-inline">document.body</code></strong>
          — dialogs, toasts, menu panels, select listboxes are teleported
          there. Use <code class="docs-inline">loader.document()</code> to
          look them up (the select and menu harnesses do this for you).
        </li>
        <li>
          Escape hatch: every harness exposes
          <code class="docs-inline">host</code>, an
          <code class="docs-inline">MkTestElement</code> with
          <code class="docs-inline">text()</code>,
          <code class="docs-inline">attr()</code>,
          <code class="docs-inline">click()</code>,
          <code class="docs-inline">type()</code>,
          <code class="docs-inline">sendKeys('Escape', 'Control+a')</code> and the raw
          <code class="docs-inline">native</code> element.
        </li>
      </ul>

      <h2 id="overlays">Dialogs and toasts</h2>
      <pre class="tp-code"><code>{{ overlays }}</code></pre>

      <h2 id="harnesses">Harnesses</h2>
      <div class="tp-scroll">
        <table class="tp-table">
          <thead>
            <tr><th>Harness</th><th>Host</th><th>Key methods</th></tr>
          </thead>
          <tbody>
            @for (h of harnesses; track h.name) {
              <tr>
                <td><code>{{ h.name }}</code></td>
                <td><code>{{ h.host }}</code></td>
                <td>{{ h.methods }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p>
        Full signatures are in the
        <a routerLink="/api" [queryParams]="{ entry: 'testing' }">API reference</a>.
        Components without a dedicated harness are still reachable through
        <code class="docs-inline">loader.element('mk-rating')</code>, which
        returns an <code class="docs-inline">MkTestElement</code>.
      </p>

      <h2 id="own">Writing your own</h2>
      <p>
        Extend <code class="docs-inline">MkHarness</code>, declare the
        <code class="docs-inline">hostSelector</code>, and expose intent-level
        methods. The same loader finds it.
      </p>
      <pre class="tp-code"><code>{{ own }}</code></pre>
    </div>
  `,
  styles: [
    `
      .tp-code {
        margin: var(--mk-space-3) 0 var(--mk-space-6);
        padding: var(--mk-space-4) var(--mk-space-5);
        background: var(--mk-code-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        color: var(--mk-text);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: var(--mk-line-height-normal);
        overflow-x: auto;
        white-space: pre;
      }
      .tp-scroll {
        overflow-x: auto;
      }
      .tp-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mk-font-size-sm);
      }
      .tp-table th,
      .tp-table td {
        text-align: left;
        vertical-align: top;
        padding: var(--mk-space-2) var(--mk-space-3);
        border-bottom: 1px solid var(--mk-border);
      }
      .tp-table th {
        color: var(--mk-text-muted);
        font-weight: var(--mk-font-weight-semibold);
        white-space: nowrap;
      }
      .tp-table td:first-child {
        white-space: nowrap;
      }
      .tp-table code {
        font-family: var(--mk-font-mono);
        font-size: 0.9em;
      }
      .tp-table td:first-child code {
        color: var(--mk-primary);
        font-weight: var(--mk-font-weight-medium);
      }
    `,
  ],
})
export class TestingPage {
  protected readonly harnesses = HARNESSES;

  protected readonly quickStart = `import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  MkHarnessLoader, MkFormFieldHarness, MkInputHarness,
  MkSelectHarness, MkButtonHarness,
} from '@mk-kit/ui/testing';
import { UserForm } from './user-form';

it('saves a user', async () => {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(UserForm);
  const loader = MkHarnessLoader.fromFixture(fixture);

  const name = await loader.get(MkFormFieldHarness, { text: /name/i });
  await (await name.control(MkInputHarness)).setValue('Jane Doe');

  const role = await loader.get(MkSelectHarness);
  await role.selectOption('Editor');           // opens the listbox, clicks the option
  expect(role.valueText()).toBe('Editor');

  await (await loader.get(MkButtonHarness, { text: 'Save' })).click();
  expect(fixture.componentInstance.saved()).toEqual({ name: 'Jane Doe', role: 'editor' });
});`;

  protected readonly overlays = `import { MkDialogHarness, MkToastHarness } from '@mk-kit/ui/testing';

// A confirm dialog opened by MkDialogService — it lives in document.body.
const dialog = await loader.document().get(MkDialogHarness);
expect(dialog.title()).toBe('Delete user?');
await dialog.clickButton('Delete');

// Toasts, too.
const toast = await loader.document().get(MkToastHarness);
expect(toast.tone()).toBe('success');
expect(toast.message()).toBe('User deleted');
await toast.dismiss();`;

  protected readonly own = `import { MkHarness } from '@mk-kit/ui/testing';

export class UserCardHarness extends MkHarness {
  static override readonly hostSelector = 'app-user-card';

  name(): string {
    return this.host.child('.user-card__name').text();
  }

  async open(): Promise<void> {
    await this.host.child('button').click();   // settles change detection for you
  }
}

const card = await loader.get(UserCardHarness, { text: /jane/i });
await card.open();`;
}
