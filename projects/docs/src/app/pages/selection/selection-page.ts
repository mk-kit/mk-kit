import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkAutocomplete,
  type MkAutocompleteOption,
  MkButtonToggle,
  MkButtonToggleGroup,
  MkFormField,
  MkMultiSelect,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

interface Framework {
  label: string;
  value: string;
}

/**
 * Documentation + live demo page for the selection controls of `@mkornas/ui`:
 * the filtering Autocomplete combobox and the segmented ButtonToggle group.
 */
@Component({
  selector: 'docs-selection-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkAutocomplete,
    MkButtonToggle,
    MkButtonToggleGroup,
    MkFormField,
    MkMultiSelect,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Selection</h1>
      <p class="docs-lead">
        Two ARIA-complete selection controls: the
        <code class="docs-inline">&lt;mk-autocomplete&gt;</code> combobox that
        suggests options as you type, and the
        <code class="docs-inline">&lt;mk-button-toggle-group&gt;</code> segmented
        control for single- or multiple-choice switches. Both implement
        <code class="docs-inline">ControlValueAccessor</code> and a two-way
        <code class="docs-inline">[(value)]</code> model.
      </p>

      <!-- ============================================================ -->
      <!-- AUTOCOMPLETE -->
      <!-- ============================================================ -->
      <h2>Autocomplete</h2>
      <p>
        A text input with a popup listbox. Filtering
        (<code class="docs-inline">contains</code> /
        <code class="docs-inline">startsWith</code>) is built in — type to narrow
        the list, use Arrow keys to move, Enter to commit, Esc to close. The
        clear button and chevron come for free.
      </p>
      <docs-example [code]="basicCode" column>
        <div style="max-width: 22rem; width: 100%;">
          <mk-autocomplete
            placeholder="Search a framework…"
            [options]="frameworks"
            [(value)]="picked"
          />
          <p class="echo">
            Selected value: <code class="docs-inline">{{ picked() ?? '—' }}</code>
          </p>
        </div>
      </docs-example>

      <h3>Inside a form field</h3>
      <p>
        Wrapped in <code class="docs-inline">&lt;mk-form-field&gt;</code> it
        inherits the label, hint, error and required wiring automatically.
      </p>
      <docs-example [code]="fieldCode" column>
        <div style="max-width: 22rem; width: 100%;">
          <mk-form-field
            label="Framework"
            hint="Start typing to filter"
            required
          >
            <mk-autocomplete
              placeholder="e.g. Angular"
              [options]="frameworks"
              [(value)]="picked2"
            />
          </mk-form-field>
        </div>
      </docs-example>

      <h3>Async / server-driven suggestions</h3>
      <p>
        Set <code class="docs-inline">filterMode="none"</code> and drive the
        <code class="docs-inline">options</code> input yourself from the
        <code class="docs-inline">(search)</code> output. Here the list is
        filtered on a keystroke to mimic a fetch, with a
        <code class="docs-inline">loading</code> row.
      </p>
      <docs-example [code]="asyncCode" column>
        <div style="max-width: 22rem; width: 100%;">
          <mk-autocomplete
            placeholder="Search users…"
            filterMode="none"
            [options]="userResults()"
            [loading]="searching()"
            emptyMessage="No users match"
            (search)="onUserSearch($event)"
            [(value)]="userId"
          />
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <!-- MULTI-SELECT -->
      <!-- ============================================================ -->
      <h2>Multi-select</h2>
      <p>
        A combobox that commits <strong>multiple</strong> values, rendering each
        selection as a removable chip. Type to filter, Arrow keys move,
        Enter/Space toggles the active option, Backspace on an empty query
        removes the last chip. The dropdown renders in the top layer, so it is
        never clipped by a scrolling container.
      </p>
      <docs-example [code]="multiSelectCode" column>
        <div style="max-width: 26rem; width: 100%;">
          <mk-multi-select
            placeholder="Add frameworks…"
            [options]="frameworks"
            [(value)]="tags"
          />
          <p class="echo">
            Selected: <code class="docs-inline">{{ tags().join(', ') || '—' }}</code>
          </p>
        </div>
      </docs-example>

      <h3>Async source, capped, in a form field</h3>
      <p>
        Set <code class="docs-inline">filterMode="none"</code> and drive
        <code class="docs-inline">options</code> from the
        <code class="docs-inline">search</code> output for server-side results;
        <code class="docs-inline">max</code> caps the number of selections.
        Chips keep their labels even after an option leaves the async list.
      </p>
      <docs-example [code]="multiAsyncCode" column>
        <div style="max-width: 26rem; width: 100%;">
          <mk-form-field label="Reviewers" hint="Pick up to 3" required>
            <mk-multi-select
              placeholder="Search people…"
              filterMode="none"
              [max]="3"
              [options]="userResults()"
              [loading]="searching()"
              (search)="onUserSearch($event)"
              [(value)]="reviewers"
            />
          </mk-form-field>
          <p class="echo">
            Reviewers:
            <code class="docs-inline">{{ reviewers().join(', ') || '—' }}</code>
          </p>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <!-- BUTTON TOGGLE -->
      <!-- ============================================================ -->
      <h2>Button toggle</h2>
      <p>
        A segmented control. In single-select mode (default) the group is a
        <code class="docs-inline">radiogroup</code> with roving tabindex — Arrow
        keys move and select. Great for view switches and filters.
      </p>
      <docs-example [code]="toggleCode" column>
        <mk-button-toggle-group [(value)]="view" aria-label="View mode">
          <mk-button-toggle value="grid">Grid</mk-button-toggle>
          <mk-button-toggle value="list">List</mk-button-toggle>
          <mk-button-toggle value="board">Board</mk-button-toggle>
        </mk-button-toggle-group>
        <p class="echo">
          View: <code class="docs-inline">{{ view() }}</code>
        </p>
      </docs-example>

      <h3>Multiple selection</h3>
      <p>
        Add <code class="docs-inline">multiple</code> to let any number of items
        be pressed. The value becomes an array and each item exposes
        <code class="docs-inline">aria-pressed</code>.
      </p>
      <docs-example [code]="multiCode" column>
        <mk-button-toggle-group
          multiple
          tone="neutral"
          [(value)]="formats"
          aria-label="Text format"
        >
          <mk-button-toggle value="bold" aria-label="Bold"><b>B</b></mk-button-toggle>
          <mk-button-toggle value="italic" aria-label="Italic"><i>I</i></mk-button-toggle>
          <mk-button-toggle value="underline" aria-label="Underline"><u>U</u></mk-button-toggle>
        </mk-button-toggle-group>
        <p class="echo">
          Active: <code class="docs-inline">{{ formats().join(', ') || '—' }}</code>
        </p>
      </docs-example>

      <h3>Tones &amp; sizes</h3>
      <docs-example [code]="toneCode" column>
        <div style="display: flex; flex-direction: column; gap: var(--mk-space-3); align-items: flex-start;">
          <mk-button-toggle-group size="sm" tone="success" [(value)]="pill" aria-label="Small">
            <mk-button-toggle value="on">On</mk-button-toggle>
            <mk-button-toggle value="off">Off</mk-button-toggle>
          </mk-button-toggle-group>
          <mk-button-toggle-group tone="info" [(value)]="range" aria-label="Range">
            <mk-button-toggle value="d">Day</mk-button-toggle>
            <mk-button-toggle value="w">Week</mk-button-toggle>
            <mk-button-toggle value="m">Month</mk-button-toggle>
            <mk-button-toggle value="y" [disabled]="true">Year</mk-button-toggle>
          </mk-button-toggle-group>
          <mk-button-toggle-group size="lg" tone="danger" [(value)]="sev" aria-label="Severity">
            <mk-button-toggle value="low">Low</mk-button-toggle>
            <mk-button-toggle value="high">High</mk-button-toggle>
          </mk-button-toggle-group>
        </div>
      </docs-example>
    </div>
  `,
})
export class SelectionPage {
  protected readonly frameworks: MkAutocompleteOption[] = [
    { label: 'Angular', value: 'angular' },
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
    { label: 'Svelte', value: 'svelte' },
    { label: 'Solid', value: 'solid' },
    { label: 'Qwik', value: 'qwik' },
    { label: 'Preact', value: 'preact' },
    { label: 'Ember (legacy)', value: 'ember', disabled: true },
  ];

  protected readonly picked = signal<unknown>(null);
  protected readonly picked2 = signal<unknown>(null);
  protected readonly tags = signal<unknown[]>(['angular']);
  protected readonly reviewers = signal<unknown[]>([]);

  // --- async demo ---
  private readonly allUsers: Framework[] = [
    { label: 'Ada Lovelace', value: 'u1' },
    { label: 'Alan Turing', value: 'u2' },
    { label: 'Grace Hopper', value: 'u3' },
    { label: 'Katherine Johnson', value: 'u4' },
    { label: 'Linus Torvalds', value: 'u5' },
    { label: 'Margaret Hamilton', value: 'u6' },
  ];
  protected readonly userId = signal<unknown>(null);
  protected readonly searching = signal(false);
  protected readonly userResults = signal<MkAutocompleteOption[]>([]);

  protected onUserSearch(text: string): void {
    const q = text.trim().toLowerCase();
    if (!q) {
      this.userResults.set([]);
      this.searching.set(false);
      return;
    }
    this.searching.set(true);
    // Synchronous filter standing in for a debounced HTTP call.
    this.userResults.set(
      this.allUsers.filter((u) => u.label.toLowerCase().includes(q)),
    );
    this.searching.set(false);
  }

  // --- toggle demos ---
  protected readonly view = signal<unknown>('grid');
  protected readonly formats = signal<unknown[]>(['bold']);
  protected readonly pill = signal<unknown>('on');
  protected readonly range = signal<unknown>('w');
  protected readonly sev = signal<unknown>('low');

  protected readonly basicCode = `<mk-autocomplete
  placeholder="Search a framework…"
  [options]="frameworks"
  [(value)]="picked" />`;

  protected readonly fieldCode = `<mk-form-field label="Framework" hint="Start typing to filter" required>
  <mk-autocomplete [options]="frameworks" [(value)]="picked" />
</mk-form-field>`;

  protected readonly multiSelectCode = `<mk-multi-select
  placeholder="Add frameworks…"
  [options]="frameworks"
  [(value)]="tags" />`;

  protected readonly multiAsyncCode = `<mk-form-field label="Reviewers" hint="Pick up to 3" required>
  <mk-multi-select
    filterMode="none"
    [max]="3"
    [options]="userResults()"
    [loading]="searching()"
    (search)="onUserSearch($event)"
    [(value)]="reviewers" />
</mk-form-field>`;

  protected readonly asyncCode = `<mk-autocomplete
  filterMode="none"
  [options]="userResults()"
  [loading]="searching()"
  (search)="onUserSearch($event)"
  [(value)]="userId" />`;

  protected readonly toggleCode = `<mk-button-toggle-group [(value)]="view" aria-label="View mode">
  <mk-button-toggle value="grid">Grid</mk-button-toggle>
  <mk-button-toggle value="list">List</mk-button-toggle>
  <mk-button-toggle value="board">Board</mk-button-toggle>
</mk-button-toggle-group>`;

  protected readonly multiCode = `<mk-button-toggle-group multiple tone="neutral" [(value)]="formats">
  <mk-button-toggle value="bold" aria-label="Bold"><b>B</b></mk-button-toggle>
  <mk-button-toggle value="italic" aria-label="Italic"><i>I</i></mk-button-toggle>
  <mk-button-toggle value="underline" aria-label="Underline"><u>U</u></mk-button-toggle>
</mk-button-toggle-group>`;

  protected readonly toneCode = `<mk-button-toggle-group tone="info" [(value)]="range">
  <mk-button-toggle value="d">Day</mk-button-toggle>
  <mk-button-toggle value="w">Week</mk-button-toggle>
  <mk-button-toggle value="m">Month</mk-button-toggle>
  <mk-button-toggle value="y" [disabled]="true">Year</mk-button-toggle>
</mk-button-toggle-group>`;
}
