import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkAutocomplete,
  type MkAutocompleteOption,
  MkButtonToggle,
  MkButtonToggleGroup,
  MkFormField,
  MkInput,
  MkMention,
  type MkMentionOption,
  type MkMentionSearchEvent,
  type MkMentionSelectEvent,
  MkMultiSelect,
  MkTagInput,
  MkTransferList,
  type MkTransferItem,
  MkTreeSelect,
  type MkTreeNode,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

interface Framework {
  label: string;
  value: string;
}

/**
 * Documentation + live demo page for the selection controls of `@mk-kit/ui`:
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
    MkInput,
    MkMention,
    MkMultiSelect,
    MkTagInput,
    MkTransferList,
    MkTreeSelect,
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

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>options</code></td><td><code>MkAutocompleteOption[]</code></td><td><code>[]</code></td><td>The suggestion list. Update it from <code>(search)</code> for async sources.</td></tr>
          <tr><td><code>value</code></td><td><code>model&lt;unknown&gt;</code></td><td><code>null</code></td><td>Two-way selected value (the chosen option's <code>value</code>, or null).</td></tr>
          <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>''</code></td><td>Placeholder shown when the input is empty.</td></tr>
          <tr><td><code>filterMode</code></td><td><code>'contains' | 'startsWith' | 'none'</code></td><td><code>'contains'</code></td><td>How options are filtered against the typed text; <code>'none'</code> for server-driven lists.</td></tr>
          <tr><td><code>minChars</code></td><td><code>number</code></td><td><code>0</code></td><td>Only open the list once this many characters are typed.</td></tr>
          <tr><td><code>loading</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Show a loading row instead of "no results" (async fetches).</td></tr>
          <tr><td><code>requireSelection</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Clear the input on blur unless the text matches a selectable option.</td></tr>
          <tr><td><code>emptyMessage</code></td><td><code>string</code></td><td><code>'No results'</code></td><td>Message shown when nothing matches.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Control size. Ignored inside an <code>mk-form-field</code>.</td></tr>
          <tr><td><code>disabled</code> / <code>invalid</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable the control / force invalid styling standalone.</td></tr>
          <tr><td><code>(search)</code></td><td><code>string</code></td><td>—</td><td>Current input text on every keystroke — drive async loading.</td></tr>
          <tr><td><code>(optionSelected)</code></td><td><code>MkAutocompleteOption</code></td><td>—</td><td>The option committed by click or Enter.</td></tr>
        </tbody>
      </table>

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

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>options</code></td><td><code>MkMultiSelectOption[]</code></td><td><code>[]</code></td><td>The option list. Update it from <code>(search)</code> for async sources.</td></tr>
          <tr><td><code>value</code></td><td><code>model&lt;unknown[]&gt;</code></td><td><code>[]</code></td><td>Two-way array of selected values.</td></tr>
          <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>''</code></td><td>Placeholder shown when nothing is selected.</td></tr>
          <tr><td><code>filterMode</code></td><td><code>'contains' | 'startsWith' | 'none'</code></td><td><code>'contains'</code></td><td>How options are filtered against the typed text; <code>'none'</code> for server-driven lists.</td></tr>
          <tr><td><code>minChars</code></td><td><code>number</code></td><td><code>0</code></td><td>Only open the list once this many characters are typed.</td></tr>
          <tr><td><code>max</code></td><td><code>number</code></td><td><code>0</code></td><td>Maximum number of selections (0 = unlimited).</td></tr>
          <tr><td><code>closeOnSelect</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Close the dropdown after each selection (default keeps it open).</td></tr>
          <tr><td><code>loading</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Show a loading row instead of "no results" (async fetches).</td></tr>
          <tr><td><code>emptyMessage</code></td><td><code>string</code></td><td><code>'No results'</code></td><td>Message shown when nothing matches.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Control size. Ignored inside an <code>mk-form-field</code>.</td></tr>
          <tr><td><code>disabled</code> / <code>invalid</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable the control / force invalid styling standalone.</td></tr>
          <tr><td><code>(search)</code></td><td><code>string</code></td><td>—</td><td>Current query text on every keystroke — drive async loading.</td></tr>
          <tr><td><code>(optionAdded)</code></td><td><code>MkMultiSelectOption</code></td><td>—</td><td>The option just added to the selection.</td></tr>
          <tr><td><code>(optionRemoved)</code></td><td><code>unknown</code></td><td>—</td><td>The value just removed from the selection.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- TAG INPUT -->
      <!-- ============================================================ -->
      <h2>Tag input</h2>
      <p>
        <code class="docs-inline">&lt;mk-tag-input&gt;</code> collects
        <strong>freeform</strong> tags (not from an option list). Type and press
        Enter or comma to add a chip, Backspace on an empty field removes the
        last, and pasting a delimited string adds several at once. Its model is a
        <code class="docs-inline">string[]</code>.
      </p>
      <docs-example [code]="tagInputCode" column>
        <div style="max-width: 26rem; width: 100%;">
          <mk-tag-input placeholder="Add tags…" [(value)]="keywords" />
          <p class="echo">
            Tags: <code class="docs-inline">{{ keywords().join(', ') || '—' }}</code>
          </p>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>value</code></td><td><code>model&lt;string[]&gt;</code></td><td><code>[]</code></td><td>Two-way list of tags.</td></tr>
          <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>''</code></td><td>Placeholder shown in the text field.</td></tr>
          <tr><td><code>max</code></td><td><code>number</code></td><td><code>0</code></td><td>Maximum number of tags (0 = unlimited).</td></tr>
          <tr><td><code>allowDuplicates</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Allow the same tag more than once.</td></tr>
          <tr><td><code>addOnBlur</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Commit the pending text as a tag when the field loses focus.</td></tr>
          <tr><td><code>separators</code></td><td><code>string[]</code></td><td><code>[',']</code></td><td>Extra characters that commit the pending text (Enter always does); pasted strings are split on these.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Control size. Ignored inside an <code>mk-form-field</code>.</td></tr>
          <tr><td><code>disabled</code> / <code>invalid</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable the control / force invalid styling standalone.</td></tr>
          <tr><td><code>(added)</code></td><td><code>string</code></td><td>—</td><td>The tag just added.</td></tr>
          <tr><td><code>(removed)</code></td><td><code>string</code></td><td>—</td><td>The tag just removed.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- TRANSFER LIST -->
      <!-- ============================================================ -->
      <h2>Transfer list</h2>
      <p>
        <code class="docs-inline">&lt;mk-transfer-list&gt;</code> is a dual list
        box (pick list) for shuttling items between an
        <strong>available</strong> and a <strong>selected</strong> list — ideal
        for assigning roles or permissions. Check rows and use the middle move
        buttons, or press Enter on a row to move it across. Its model is the
        array of selected values, and <code class="docs-inline">filterable</code>
        adds a search box over each list.
      </p>
      <docs-example [code]="transferListCode" column>
        <mk-transfer-list
          filterable
          [items]="roles"
          [(value)]="assigned"
          availableLabel="All roles"
          selectedLabel="Assigned"
        />
        <p class="echo">
          Assigned:
          <code class="docs-inline">{{ assigned().join(', ') || '—' }}</code>
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>items</code></td><td><code>MkTransferItem[]</code></td><td><code>[]</code></td><td>All items (value, label, optional disabled).</td></tr>
          <tr><td><code>value</code></td><td><code>model&lt;unknown[]&gt;</code></td><td><code>[]</code></td><td>Two-way array of the values in the selected list.</td></tr>
          <tr><td><code>availableLabel</code></td><td><code>string</code></td><td><code>'Available'</code></td><td>Heading over the available list.</td></tr>
          <tr><td><code>selectedLabel</code></td><td><code>string</code></td><td><code>'Selected'</code></td><td>Heading over the selected list.</td></tr>
          <tr><td><code>filterable</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Add a search box above each list.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Control size.</td></tr>
          <tr><td><code>disabled</code> / <code>invalid</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable the control / force invalid styling standalone.</td></tr>
          <tr><td><code>(change)</code></td><td><code>unknown[]</code></td><td>—</td><td>The new selected values after any move.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Move the active row (roving tabindex).</td></tr>
          <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>Jump to the first / last row.</td></tr>
          <tr><td><kbd>Space</kbd></td><td>Check / uncheck the active row.</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>Move the row to the opposite list.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- TREE SELECT -->
      <!-- ============================================================ -->
      <h2>Tree select</h2>
      <p>
        <code class="docs-inline">&lt;mk-tree-select&gt;</code> is a form field
        whose popover holds a hierarchical
        <code class="docs-inline">&lt;mk-tree&gt;</code>. The trigger shows the
        chosen node's label; opening it reveals the selectable tree in the top
        layer, so it is never clipped. Picking a node sets the value and closes
        the panel. Add <code class="docs-inline">clearable</code> for a reset
        button.
      </p>
      <docs-example [code]="treeSelectCode" column>
        <div style="max-width: 22rem; width: 100%;">
          <mk-tree-select
            [nodes]="categories"
            [(value)]="category"
            clearable
            placeholder="Choose a category…"
          />
          <p class="echo">
            Category:
            <code class="docs-inline">{{ category() ?? '—' }}</code>
          </p>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>nodes</code></td><td><code>MkTreeNode[]</code></td><td><code>[]</code></td><td>The hierarchical options (label, value, children, expanded…).</td></tr>
          <tr><td><code>value</code></td><td><code>model&lt;unknown | null&gt;</code></td><td><code>null</code></td><td>Two-way value of the selected node.</td></tr>
          <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>'Select…'</code></td><td>Trigger text while nothing is selected.</td></tr>
          <tr><td><code>clearable</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Show a reset button when a value is set.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Control size. Ignored inside an <code>mk-form-field</code>.</td></tr>
          <tr><td><code>disabled</code> / <code>invalid</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable the control / force invalid styling standalone.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>On the trigger: open the panel. In the tree: select the active node and close.</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Close the panel and return focus to the trigger.</td></tr>
        </tbody>
      </table>

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

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>value</code></td><td><code>model&lt;unknown&gt;</code></td><td><code>null</code></td><td>Two-way value: a single value, or an array when <code>multiple</code>.</td></tr>
          <tr><td><code>multiple</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Allow any number of pressed items (toolbar mode).</td></tr>
          <tr><td><code>tone</code></td><td><code>MkTone</code></td><td><code>'primary'</code></td><td>Semantic color of the selected segment.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Control size.</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable the whole group.</td></tr>
          <tr><td><code>aria-label</code></td><td><code>string</code></td><td><code>''</code></td><td>Accessible name for the group.</td></tr>
          <tr><td><code>value</code> <span style="color: var(--mk-text-muted);">(item)</span></td><td><code>unknown</code></td><td><code>undefined</code></td><td>On <code>mk-button-toggle</code>: the value this item contributes.</td></tr>
          <tr><td><code>disabled</code> <span style="color: var(--mk-text-muted);">(item)</span></td><td><code>boolean</code></td><td><code>false</code></td><td>On <code>mk-button-toggle</code>: disable just this item.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- MENTION -->
      <!-- ============================================================ -->
      <h2 id="mention">Mention</h2>
      <p>
        <code class="docs-inline">[mkMention]</code> adds mention / hashtag
        autocomplete to a <strong>native</strong>
        <code class="docs-inline">&lt;textarea&gt;</code> or text input. Typing
        a trigger character (<code class="docs-inline">&#64;</code>,
        <code class="docs-inline">#</code>, …) at the start of a word opens a
        top-layer suggestion panel anchored at the caret; picking an option
        replaces the trigger-plus-query with the completed mention and
        dispatches an <code class="docs-inline">input</code> event, so
        <code class="docs-inline">ngModel</code> / reactive-forms bindings stay
        in sync. The element keeps its native textbox semantics and follows the
        ARIA activedescendant pattern while the panel is open.
      </p>
      <p>
        An option's <code class="docs-inline">trigger</code> field scopes it to
        one trigger character — here the people only appear after
        <code class="docs-inline">&#64;</code> and the tags only after
        <code class="docs-inline">#</code>. Last pick:
        <code class="docs-inline">{{ mentionPick() }}</code>
      </p>
      <docs-example [code]="mentionCode" column>
        <div style="max-width: 26rem; width: 100%;">
          <textarea
            mkInput
            mkMention
            rows="3"
            [mentionTriggers]="['@', '#']"
            [mentionOptions]="mentionDirectory"
            (mentionSelect)="onMentionSelect($event)"
            placeholder="Type @ for people or # for tags…"
            aria-label="Comment with mentions"
            style="width: 100%"
          ></textarea>
        </div>
      </docs-example>

      <h3>Async / server-driven suggestions</h3>
      <p>
        Set <code class="docs-inline">mentionFilter="none"</code> and drive
        <code class="docs-inline">mentionOptions</code> yourself from the
        <code class="docs-inline">(mentionSearch)</code> output —
        <code class="docs-inline">mentionLoading</code> keeps the panel open
        with a spinner row while results are in flight. Here a
        <code class="docs-inline">setTimeout</code> stands in for the server
        round-trip.
      </p>
      <docs-example [code]="mentionAsyncCode" column>
        <div style="max-width: 26rem; width: 100%;">
          <textarea
            mkInput
            mkMention
            rows="3"
            mentionFilter="none"
            [mentionOptions]="mentionResults()"
            [mentionLoading]="mentionSearching()"
            (mentionSearch)="onMentionSearch($event)"
            (mentionSelect)="onMentionSelect($event)"
            placeholder="Type @ to search the directory…"
            aria-label="Comment with async mentions"
            style="width: 100%"
          ></textarea>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mentionTriggers</code></td><td><code>readonly string[]</code></td><td><code>['&#64;']</code></td><td>Single characters that start a mention session.</td></tr>
          <tr><td><code>mentionOptions</code></td><td><code>readonly MkMentionOption[]</code></td><td><code>[]</code></td><td>The suggestion pool: <code>{{ '{' }} value, label, hint?, trigger? {{ '}' }}</code>. An option's <code>trigger</code> scopes it to one trigger character; without it the option is offered for every trigger.</td></tr>
          <tr><td><code>mentionFilter</code></td><td><code>'contains' | 'startsWith' | 'none'</code></td><td><code>'contains'</code></td><td>How suggestions are narrowed against the typed query (over label + value); <code>'none'</code> for server-driven lists.</td></tr>
          <tr><td><code>mentionLoading</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Keep the panel open with a loading row while async results are pending.</td></tr>
          <tr><td><code>mentionInsert</code></td><td><code>(option, trigger) =&gt; string</code></td><td><code>null</code></td><td>Builds the inserted text. Default: trigger + label + a trailing space.</td></tr>
          <tr><td><code>(mentionSearch)</code></td><td><code>{{ '{' }} trigger, query {{ '}' }}</code></td><td>—</td><td>Emits whenever the active query changes — drive async loading.</td></tr>
          <tr><td><code>(mentionSelect)</code></td><td><code>{{ '{' }} option, trigger {{ '}' }}</code></td><td>—</td><td>Emits after an option has been inserted into the control.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Move the active suggestion (wraps around).</td></tr>
          <tr><td><kbd>Enter</kbd> / <kbd>Tab</kbd></td><td>Insert the active suggestion.</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Dismiss the panel for this trigger position — an enclosing dialog stays open.</td></tr>
        </tbody>
      </table>
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
  protected readonly keywords = signal<string[]>(['design', 'ux']);
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

  // --- transfer list demo ---
  protected readonly roles: MkTransferItem[] = [
    { value: 'admin', label: 'Administrator' },
    { value: 'editor', label: 'Editor' },
    { value: 'author', label: 'Author' },
    { value: 'reviewer', label: 'Reviewer' },
    { value: 'viewer', label: 'Viewer' },
    { value: 'billing', label: 'Billing manager' },
  ];
  protected readonly assigned = signal<unknown[]>(['editor', 'reviewer']);

  // --- tree select demo ---
  protected readonly categories: MkTreeNode[] = [
    {
      label: 'Electronics',
      value: 'electronics',
      expanded: true,
      children: [
        { label: 'Phones', value: 'phones' },
        { label: 'Laptops', value: 'laptops' },
        { label: 'Cameras', value: 'cameras' },
      ],
    },
    {
      label: 'Home & Garden',
      value: 'home',
      children: [
        { label: 'Furniture', value: 'furniture' },
        { label: 'Kitchen', value: 'kitchen' },
      ],
    },
  ];
  protected readonly category = signal<unknown | null>(null);

  // --- mention demos ---
  protected readonly mentionDirectory: MkMentionOption[] = [
    { value: 'ada', label: 'ada', hint: 'Ada Lovelace', trigger: '@' },
    { value: 'grace', label: 'grace', hint: 'Grace Hopper', trigger: '@' },
    { value: 'alan', label: 'alan', hint: 'Alan Turing', trigger: '@' },
    { value: 'katherine', label: 'katherine', hint: 'Katherine Johnson', trigger: '@' },
    { value: 'release', label: 'release', hint: '12 posts', trigger: '#' },
    { value: 'design', label: 'design', hint: '31 posts', trigger: '#' },
    { value: 'a11y', label: 'a11y', hint: '9 posts', trigger: '#' },
    { value: 'perf', label: 'perf', hint: '17 posts', trigger: '#' },
  ];
  protected readonly mentionPick = signal('—');

  protected onMentionSelect(e: MkMentionSelectEvent): void {
    this.mentionPick.set(`${e.trigger}${e.option.label}`);
  }

  private readonly mentionUsers: MkMentionOption[] = [
    { value: 'ada.lovelace', label: 'ada.lovelace', hint: 'ada@example.com' },
    { value: 'alan.turing', label: 'alan.turing', hint: 'alan@example.com' },
    { value: 'grace.hopper', label: 'grace.hopper', hint: 'grace@example.com' },
    { value: 'katherine.johnson', label: 'katherine.johnson', hint: 'kat@example.com' },
    { value: 'margaret.hamilton', label: 'margaret.hamilton', hint: 'margaret@example.com' },
    { value: 'radia.perlman', label: 'radia.perlman', hint: 'radia@example.com' },
  ];
  protected readonly mentionResults = signal<MkMentionOption[]>([]);
  protected readonly mentionSearching = signal(false);
  private mentionTimer: ReturnType<typeof setTimeout> | null = null;

  /** Fake directory lookup: resolves ~400 ms after the last keystroke. */
  protected onMentionSearch(e: MkMentionSearchEvent): void {
    if (this.mentionTimer) clearTimeout(this.mentionTimer);
    this.mentionSearching.set(true);
    const q = e.query.toLowerCase();
    this.mentionTimer = setTimeout(() => {
      this.mentionTimer = null;
      this.mentionResults.set(
        this.mentionUsers.filter(
          (u) =>
            u.label.toLowerCase().includes(q) ||
            (u.hint ?? '').toLowerCase().includes(q),
        ),
      );
      this.mentionSearching.set(false);
    }, 400);
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

  protected readonly tagInputCode = `keywords = signal<string[]>(['design', 'ux']);

<mk-tag-input placeholder="Add tags…" [(value)]="keywords" />`;

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

  protected readonly transferListCode = `roles = signal<MkTransferItem[]>([
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Editor' },
  // …
]);
assigned = signal<unknown[]>(['editor', 'reviewer']);

<mk-transfer-list
  filterable
  [items]="roles"
  [(value)]="assigned"
  availableLabel="All roles"
  selectedLabel="Assigned" />`;

  protected readonly treeSelectCode = `categories = signal<MkTreeNode[]>([
  {
    label: 'Electronics', value: 'electronics', expanded: true,
    children: [
      { label: 'Phones', value: 'phones' },
      { label: 'Laptops', value: 'laptops' },
    ],
  },
  // …
]);

<mk-tree-select
  [nodes]="categories"
  [(value)]="category"
  clearable
  placeholder="Choose a category…" />`;

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

  protected readonly mentionCode = `// An option's \`trigger\` scopes it to one trigger character:
directory: MkMentionOption[] = [
  { value: 'ada',     label: 'ada',     hint: 'Ada Lovelace', trigger: '@' },
  { value: 'grace',   label: 'grace',   hint: 'Grace Hopper', trigger: '@' },
  { value: 'release', label: 'release', hint: '12 posts',     trigger: '#' },
  { value: 'design',  label: 'design',  hint: '31 posts',     trigger: '#' },
];

<textarea mkInput mkMention rows="3"
  [mentionTriggers]="['@', '#']"
  [mentionOptions]="directory"
  (mentionSelect)="onPick($event)"   <!-- { option, trigger } -->
></textarea>`;

  protected readonly mentionAsyncCode = `<textarea mkInput mkMention rows="3"
  mentionFilter="none"
  [mentionOptions]="results()"
  [mentionLoading]="searching()"
  (mentionSearch)="onSearch($event)"
></textarea>

// onSearch({ trigger, query }): debounce, fetch, then
//   results.set(…); searching.set(false);
// The panel shows a spinner row while mentionLoading is true.`;
}
