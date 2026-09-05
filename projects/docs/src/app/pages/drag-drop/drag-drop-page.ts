import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkDrag,
  MkDragHandle,
  MkDropList,
  MkDropZone,
  MkSortableList,
  mkMoveItemInArray,
  mkTransferArrayItem,
  type MkDropEvent,
  type MkDropZoneEvent,
  type MkDropZoneHover,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

interface Task {
  readonly id: number;
  readonly label: string;
}

interface BoardCard {
  readonly id: number;
  readonly title: string;
  readonly owner: string;
}

interface BoardColumn {
  readonly id: string;
  readonly title: string;
}

interface NestedItem {
  readonly id: string;
  readonly title: string;
}

interface NestedSection {
  readonly id: string;
  readonly title: string;
  readonly items: NestedItem[];
}

/**
 * Drag & drop components demo page — the low-level `[mkDropList]` + `[mkDrag]`
 * primitives, the `[mkDragHandle]` grip, the `mk-sortable-list` convenience
 * wrapper and the `mkMoveItemInArray` / `mkTransferArrayItem` helpers, shown as
 * live reorderable lists and a connected kanban board.
 */
@Component({
  selector: 'docs-drag-drop-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkDrag, MkDragHandle, MkDropList, MkDropZone, MkSortableList],
  template: `
    <div class="docs-page docs-container">
      <h1>Drag &amp; drop</h1>
      <p class="docs-lead">
        Accessible, pointer-and-keyboard reorderable lists and connected buckets.
        Compose the low-level <code class="docs-inline">[mkDropList]</code> +
        <code class="docs-inline">[mkDrag]</code> directives and apply drops with
        the pure <code class="docs-inline">mkMoveItemInArray</code> /
        <code class="docs-inline">mkTransferArrayItem</code> helpers, or reach for
        the <code class="docs-inline">mk-sortable-list</code> wrapper for the
        common single-list case. Everything is themed with
        <code class="docs-inline">--mk-*</code> tokens.
      </p>

      <p class="dnd-kbd-note">
        <strong>Keyboard operable.</strong> Every draggable item is focusable.
        Tab to an item, press <kbd>Space</kbd> (or <kbd>Enter</kbd>) to pick it
        up, use the <kbd>Arrow</kbd> keys to move it — across into connected
        lists at the ends — <kbd>Space</kbd> again to drop, or <kbd>Esc</kbd> to
        cancel. Mouse, touch and pen dragging work too, and every move is
        announced to screen readers.
      </p>

      <!-- ======================= SORTABLE LIST ======================= -->
      <h2>Sortable list</h2>
      <p>
        A single <code class="docs-inline">[mkDropList]</code> bound to a signal
        array reorders its <code class="docs-inline">[mkDrag]</code> items. The
        directive does <strong>not</strong> mutate your array — handle
        <code class="docs-inline">(mkDropListDropped)</code> and call
        <code class="docs-inline">mkMoveItemInArray</code>. Current order:
        <strong>{{ taskOrder() }}</strong>.
      </p>
      <docs-example [code]="sortableCode" column>
        <ul
          mkDropList
          class="dnd-list"
          mkDropListLabel="Tasks"
          [mkDropListData]="tasks()"
          (mkDropListDropped)="onReorder($event)"
        >
          @for (t of tasks(); track t.id) {
            <li mkDrag [mkDragData]="t" class="dnd-item">
              <span class="dnd-grip" aria-hidden="true">⠿</span>
              {{ t.label }}
            </li>
          }
        </ul>
      </docs-example>

      <p>
        For this common case the <code class="docs-inline">mk-sortable-list</code>
        wrapper is less boilerplate: bind <code class="docs-inline">items</code>
        two-way and it applies the reorder to the model for you. Project one
        <code class="docs-inline">&lt;ng-template&gt;</code> for the row.
      </p>
      <docs-example [code]="wrapperCode" column>
        <mk-sortable-list class="dnd-list" [(items)]="tasks2">
          <ng-template let-item let-i="index">
            <span class="dnd-grip" aria-hidden="true">⠿</span>
            {{ i + 1 }}. {{ item.label }}
          </ng-template>
        </mk-sortable-list>
      </docs-example>

      <h3>MkDropList</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">mkDropListData</code></td>
            <td><code class="docs-inline">readonly T[]</code></td>
            <td><code class="docs-inline">[]</code></td>
            <td>Backing array. Bound, never mutated by the directive.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkDropListId</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><em>auto</em></td>
            <td>Stable id used to connect lists.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkDropListConnectedTo</code></td>
            <td><code class="docs-inline">readonly string[]</code></td>
            <td><code class="docs-inline">[]</code></td>
            <td>Ids of other lists items may transfer into.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkDropListOrientation</code></td>
            <td><code class="docs-inline">'vertical' | 'horizontal'</code></td>
            <td><code class="docs-inline">'vertical'</code></td>
            <td>Layout axis; drives hit-testing and arrow-key direction.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkDropListLabel</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><em>the id</em></td>
            <td>Human-readable list name used in screen-reader announcements when an item crosses into the list.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkDropListDisabled</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Disable dropping into / dragging out of this list.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkDropListDropped</code></td>
            <td><code class="docs-inline">output&lt;MkDropEvent&lt;T&gt;&gt;</code></td>
            <td>—</td>
            <td>Fires on drop (pointer or keyboard). Apply the change yourself.</td>
          </tr>
        </tbody>
      </table>

      <h3>MkDrag</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">mkDragData</code></td>
            <td><code class="docs-inline">T</code></td>
            <td>—</td>
            <td>Arbitrary payload carried on the drop event's item.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkDragDisabled</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Disable dragging this specific item.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkDragTouchDelay</code></td>
            <td><code class="docs-inline">number</code></td>
            <td><code class="docs-inline">300</code></td>
            <td>Long-press delay (ms) before a <em>touch</em> pointer arms the drag; <code class="docs-inline">0</code> arms immediately. Mouse and pen are never delayed.</td>
          </tr>
        </tbody>
      </table>

      <h3>Touch behavior</h3>
      <p>
        On touch screens a swipe scrolls the page as usual — the drag only arms
        after a long-press of about 300&nbsp;ms
        (<code class="docs-inline">mkDragTouchDelay</code>). Moving more than a
        few pixels before the delay elapses is treated as a scroll and the
        pending drag is abandoned. Once armed, the item gets the
        <code class="docs-inline">mk-drag--armed</code> class so you can style
        the lift moment (a subtle scale or shadow works well). Mouse and pen
        drags start immediately, gated only by the usual 5&nbsp;px movement
        threshold.
      </p>
      <p>
        For advanced coordination, the root-provided
        <code class="docs-inline">MkDragDropRegistry</code> service tracks every
        live <code class="docs-inline">[mkDropList]</code> by id and resolves
        the connected travel groups — registration is automatic and you never
        call it yourself; it is exported so tooling and tests can inspect the
        wiring.
      </p>

      <h3>mk-sortable-list</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">items</code></td>
            <td><code class="docs-inline">model&lt;T[]&gt;</code></td>
            <td><code class="docs-inline">[]</code></td>
            <td>Two-way ordered items; reordered in place on drop.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">orientation</code></td>
            <td><code class="docs-inline">'vertical' | 'horizontal'</code></td>
            <td><code class="docs-inline">'vertical'</code></td>
            <td>Layout axis of the list.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">disabled</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Disable reordering.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">trackBy</code></td>
            <td><code class="docs-inline">(index, item) =&gt; unknown</code></td>
            <td><em>identity</em></td>
            <td><code class="docs-inline">&#64;for</code> tracking function.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">sorted</code></td>
            <td><code class="docs-inline">output&lt;MkDropEvent&lt;T&gt;&gt;</code></td>
            <td>—</td>
            <td>Emitted after the model has been reordered.</td>
          </tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <p>
        Applies to every <code class="docs-inline">[mkDrag]</code> item — the
        sortable lists here and the kanban board below inherit it. Each step,
        drop and cancel is announced via the live announcer. The item itself is
        the keyboard target unless it contains a <em>focusable</em>
        <code class="docs-inline">[mkDragHandle]</code> (a
        <code class="docs-inline">&lt;button&gt;</code>), in which case the
        handle is — see <a href="#handle">Drag handle</a>.
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Space</kbd> / <kbd>Enter</kbd> (on a focused item or its handle)</td><td>Pick the item up. Announces its position and the available keys.</td></tr>
          <tr><td><kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd> (while lifted, vertical list)</td><td>Move one position up / down; at the first/last position, cross into the previous / next connected list.</td></tr>
          <tr><td><kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd> (while lifted, vertical list)</td><td>Jump to the previous / next connected list, keeping the closest index.</td></tr>
          <tr><td><kbd>Space</kbd> / <kbd>Enter</kbd> (while lifted)</td><td>Drop the item at the placeholder position — emits <code class="docs-inline">mkDropListDropped</code> with <code class="docs-inline">isPointerEvent: false</code>.</td></tr>
          <tr><td><kbd>Escape</kbd> (while lifted)</td><td>Cancel — the item returns to its starting position.</td></tr>
          <tr><td>Blur (focus leaves the item or handle while lifted)</td><td>Also cancels, so the drag can never get stuck.</td></tr>
        </tbody>
      </table>
      <p>
        In a <code class="docs-inline">horizontal</code> list the axes swap:
        <kbd>ArrowLeft</kbd>/<kbd>ArrowRight</kbd> move within the list and
        <kbd>ArrowUp</kbd>/<kbd>ArrowDown</kbd> cross between connected lists.
      </p>

      <h3>Roles</h3>
      <p>
        The directives keep the ARIA tree valid whatever element you put them
        on. A <code class="docs-inline">&lt;div mkDropList&gt;</code> is a
        <code class="docs-inline">group</code> of
        <code class="docs-inline">role="button"</code> items. A
        <code class="docs-inline">&lt;ul mkDropList&gt;</code> whose
        <code class="docs-inline">&lt;li mkDrag&gt;</code> items are the
        keyboard targets becomes a <code class="docs-inline">listbox</code> of
        <code class="docs-inline">option</code>s (an
        <code class="docs-inline">&lt;li&gt;</code> may not be a button) — give
        it a <code class="docs-inline">mkDropListLabel</code>, a listbox needs a
        name. With focusable handles the
        <code class="docs-inline">&lt;ul&gt;</code> stays a plain list.
        <code class="docs-inline">aria-orientation</code> is only written on
        roles that allow it. Items carry
        <code class="docs-inline">aria-roledescription="Draggable item"</code>
        and <code class="docs-inline">aria-grabbed</code> while lifted.
      </p>

      <!-- ======================== DRAG HANDLE ======================== -->
      <h2 id="handle">Drag handle</h2>
      <p>
        Add a <code class="docs-inline">[mkDragHandle]</code> inside an item and
        pointer drags may only start on that grip — the rest of the row stays
        selectable and clickable. A decorative grip
        (<code class="docs-inline">&lt;span mkDragHandle aria-hidden&gt;</code>)
        leaves the item as the keyboard target. A <em>focusable</em> grip — a
        <code class="docs-inline">&lt;button mkDragHandle&gt;</code> with an
        <code class="docs-inline">aria-label</code> — takes the keyboard drag
        over and the item becomes a plain container: no role, not focusable,
        free to hold inputs, links and buttons of its own (axe
        <code class="docs-inline">nested-interactive</code> stays clean) and,
        for <code class="docs-inline">&lt;li&gt;</code> items, a proper list.
        <code class="docs-inline">mk-repeater</code> rows work this way.
      </p>
      <docs-example [code]="handleCode" column>
        <ul
          mkDropList
          class="dnd-list"
          [mkDropListData]="rows()"
          (mkDropListDropped)="onRowsReorder($event)"
        >
          @for (r of rows(); track r.id) {
            <li mkDrag [mkDragData]="r" class="dnd-item dnd-item--handle">
              <button type="button" mkDragHandle class="dnd-handle" aria-label="Drag to reorder">
                ⠿
              </button>
              <span class="dnd-item__label">{{ r.label }}</span>
            </li>
          }
        </ul>
      </docs-example>

      <!-- ====================== CONNECTED LISTS ====================== -->
      <h2>Connected lists / Kanban</h2>
      <p>
        Wire several lists together with matching
        <code class="docs-inline">mkDropListId</code> /
        <code class="docs-inline">mkDropListConnectedTo</code> ids and items
        transfer between them. In the drop handler, reorder within a column when
        <code class="docs-inline">event.previousContainer === event.container</code>,
        otherwise transfer across. Drag the cards below between the buckets:
      </p>
      <docs-example [code]="boardCode" column>
        <div class="dnd-board">
          @for (col of columns; track col.id) {
            <section class="dnd-col">
              <header class="dnd-col__head">
                {{ col.title }}
                <span class="dnd-col__count">{{ board()[col.id].length }}</span>
              </header>
              <ul
                mkDropList
                class="dnd-col__list"
                [mkDropListId]="col.id"
                [mkDropListLabel]="col.title"
                [mkDropListData]="board()[col.id]"
                [mkDropListConnectedTo]="columnIds"
                (mkDropListDropped)="onBoardDrop($event)"
              >
                @for (card of board()[col.id]; track card.id) {
                  <li mkDrag [mkDragData]="card" class="dnd-card">
                    <span class="dnd-grip" aria-hidden="true">⠿</span>
                    <span class="dnd-card__body">
                      <span class="dnd-card__title">{{ card.title }}</span>
                      <span class="dnd-card__owner">{{ card.owner }}</span>
                    </span>
                  </li>
                }
                @if (board()[col.id].length === 0) {
                  <li class="dnd-col__empty" aria-hidden="true">Drop here</li>
                }
              </ul>
            </section>
          }
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>MkDropEvent field</th><th>Type</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">previousIndex</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>Index in <code class="docs-inline">previousContainer</code> before the drop.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">currentIndex</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>Index it should occupy in <code class="docs-inline">container</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">item</code></td>
            <td><code class="docs-inline">MkDrag&lt;T&gt;</code></td>
            <td>The moved drag directive instance.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">previousContainer</code></td>
            <td><code class="docs-inline">MkDropList&lt;T&gt;</code></td>
            <td>List the item came from (read its <code class="docs-inline">id()</code>).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">container</code></td>
            <td><code class="docs-inline">MkDropList&lt;T&gt;</code></td>
            <td>List it was dropped into.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">isPointerEvent</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code> for pointer drops, <code class="docs-inline">false</code> for keyboard.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="zones">Drop zones</h2>
      <p>
        Not every target is a list. A <code class="docs-inline">[mkDropZone]</code>
        is any element an item can be released on, and instead of an index it
        reports <em>where</em>: client coordinates, the offset inside the zone
        and the 0–1 fraction along each axis — a time on a timeline, a
        priority band, a "focus on this" pane, a trash can. Wire it like another
        list (an id, named in the source list's
        <code class="docs-inline">mkDropListConnectedTo</code>). While an item
        hovers a zone no placeholder is shown; the zone gets
        <code class="docs-inline">mk-drop-zone--receiving</code> and a stream of
        <code class="docs-inline">mkDropZoneMoved</code> events, so it can draw
        its own preview. Zones and lists may overlap — the innermost target under
        the pointer wins. Keyboard users reach zones with the arrow keys that
        cross lists (they sit in the same document-ordered travel group) and
        drop at the centre with Space or Enter.
      </p>
      <p>
        Drag a task onto <strong>Focus now</strong> (it stays in the backlog) or
        onto a time in <strong>Today</strong> (the fraction becomes a quarter-hour):
      </p>
      <docs-example [code]="zoneCode" column>
        <div class="dnd-zones">
          <ul
            mkDropList
            class="dnd-list"
            mkDropListId="backlog"
            mkDropListLabel="Backlog"
            [mkDropListData]="backlog()"
            [mkDropListConnectedTo]="['focus', 'rail']"
            (mkDropListDropped)="onBacklogReorder($event)"
          >
            @for (t of backlog(); track t.id) {
              <li mkDrag [mkDragData]="t" class="dnd-item">
                <span class="dnd-grip" aria-hidden="true">⠿</span>
                <span class="dnd-item__label">{{ t.label }}</span>
              </li>
            }
            @if (backlog().length === 0) {
              <li class="dnd-col__empty" aria-hidden="true">Everything is scheduled</li>
            }
          </ul>
          <section
            mkDropZone
            class="dnd-zone"
            mkDropZoneId="focus"
            mkDropZoneLabel="Focus now"
            (mkDropZoneDropped)="onFocusDrop($event)"
          >
            <span class="dnd-zone__label">Focus now</span>
            @if (focused(); as f) {
              <strong class="dnd-zone__value">{{ f.label }}</strong>
            } @else {
              <span class="dnd-zone__hint">Drop a task here to make it the one thing</span>
            }
          </section>
          <div
            mkDropZone
            class="dnd-rail"
            mkDropZoneId="rail"
            mkDropZoneLabel="Today, 08:00 to 18:00"
            (mkDropZoneMoved)="onRailMove($event)"
            (mkDropZoneLeft)="onRailLeave()"
            (mkDropZoneDropped)="onRailDrop($event)"
          >
            <span class="dnd-zone__label">Today</span>
            @for (h of railHours; track h) {
              <span class="dnd-rail__tick" [style.top.%]="railTop(h * 60)">{{ h }}:00</span>
            }
            @for (s of scheduled(); track s.task.id) {
              <span class="dnd-rail__block" [style.top.%]="railTop(s.minutes)">
                {{ clock(s.minutes) }} · {{ s.task.label }}
              </span>
            }
            @if (railPreview(); as m) {
              <span class="dnd-rail__pill" [style.top.%]="railTop(m)">{{ clock(m) }}</span>
            }
          </div>
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>MkDropZoneEvent field</th><th>Type</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">item</code></td>
            <td><code class="docs-inline">MkDrag&lt;T&gt;</code></td>
            <td>The dragged directive — read <code class="docs-inline">mkDragData()</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">zone</code></td>
            <td><code class="docs-inline">MkDropZone&lt;Z&gt;</code></td>
            <td>The zone it landed on — its <code class="docs-inline">id()</code>, <code class="docs-inline">mkDropZoneData()</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">x</code>, <code class="docs-inline">y</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>Pointer position in client coordinates; the zone's centre for keyboard drops.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">offsetX</code>, <code class="docs-inline">offsetY</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>Position relative to the zone's top-left corner, in CSS pixels.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">fractionX</code>, <code class="docs-inline">fractionY</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>Position as a 0–1 fraction of the zone's width / height (clamped).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">previousContainer</code>, <code class="docs-inline">previousIndex</code></td>
            <td><code class="docs-inline">MkDropList&lt;T&gt;</code>, <code class="docs-inline">number</code></td>
            <td>Where the item came from — remove it there, or leave it (a zone need not consume).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">isPointerEvent</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code> for pointer drops, <code class="docs-inline">false</code> for keyboard.</td>
          </tr>
        </tbody>
      </table>
      <p>
        <code class="docs-inline">mkDropZoneEntered</code> and
        <code class="docs-inline">mkDropZoneMoved</code> carry the same position
        fields (<code class="docs-inline">MkDropZoneHover</code>);
        <code class="docs-inline">mkDropZoneLeft</code> fires when the item moves
        on or the drag is cancelled, never after a drop.
      </p>

      <h2 id="nested">Nested lists</h2>
      <p>
        Drop lists nest: a draggable section can own its own list of draggable
        items. The pointer always targets the <em>innermost</em> connected list
        under it, a section can never be dropped into its own items, and
        dragging an item never picks up the section around it. Give the outer
        items a <code class="docs-inline">mkDragHandle</code> so their whole
        body stays free for the inner drags. Move items within and across the
        sections below, or reorder the sections by their grip:
      </p>
      <docs-example [code]="nestedCode" column>
        <ul
          mkDropList
          class="dnd-list dnd-sections"
          mkDropListId="sections"
          mkDropListLabel="Sections"
          [mkDropListData]="sections()"
          (mkDropListDropped)="onNestedDrop($event)"
        >
          @for (s of sections(); track s.id) {
            <li mkDrag [mkDragData]="s" class="dnd-section">
              <div class="dnd-section__head">
                <button type="button" class="dnd-handle" mkDragHandle [attr.aria-label]="'Reorder section ' + s.title">⠿</button>
                <span class="dnd-section__title">{{ s.title }}</span>
                <span class="dnd-col__count">{{ s.items.length }}</span>
              </div>
              <ul
                mkDropList
                class="dnd-list dnd-sublist"
                [mkDropListId]="'sec-' + s.id"
                [mkDropListLabel]="s.title"
                [mkDropListData]="s.items"
                [mkDropListConnectedTo]="sectionListIds()"
                (mkDropListDropped)="onNestedDrop($event)"
              >
                @for (it of s.items; track it.id) {
                  <li mkDrag [mkDragData]="it" class="dnd-item dnd-subitem">
                    <span class="dnd-grip" aria-hidden="true">⠿</span>
                    {{ it.title }}
                  </li>
                }
                @if (s.items.length === 0) {
                  <li class="dnd-col__empty" aria-hidden="true">Drop here</li>
                }
              </ul>
            </li>
          }
        </ul>
      </docs-example>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      h2 {
        margin-top: var(--mk-space-9, 3rem);
      }
      /* ---- Nested lists ---- */
      .dnd-sections {
        gap: var(--mk-space-3);
      }
      .dnd-section {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-2);
        padding: var(--mk-space-3);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
      }
      .dnd-section__head {
        display: flex;
        align-items: center;
        gap: var(--mk-space-2);
        font-weight: var(--mk-font-weight-semibold);
      }
      .dnd-section__head .dnd-grip {
        cursor: grab;
      }
      .dnd-section__title {
        flex: 1;
      }
      .dnd-sublist {
        min-height: 2.5rem;
        padding: var(--mk-space-2);
        border-radius: var(--mk-radius-md);
        background: var(--mk-bg);
      }
      .dnd-subitem {
        font-size: var(--mk-font-size-sm);
      }
      .dnd-kbd-note {
        padding: var(--mk-space-3) var(--mk-space-4);
        border: var(--mk-border-width) solid var(--mk-border);
        border-left: var(--mk-border-width-strong, 3px) solid var(--mk-primary);
        border-radius: var(--mk-radius-md);
        background: color-mix(in srgb, var(--mk-primary) 6%, var(--mk-surface));
        color: var(--mk-text);
      }
      .dnd-kbd-note kbd {
        display: inline-block;
        padding: 0 var(--mk-space-1);
        font: inherit;
        font-size: var(--mk-font-size-xs);
        line-height: 1.6;
        color: var(--mk-text);
        background: var(--mk-surface);
        border: var(--mk-border-width) solid var(--mk-border);
        border-bottom-width: 2px;
        border-radius: var(--mk-radius-sm);
      }

      /* ---- Single-column lists ---- */
      .dnd-list {
        list-style: none;
        margin: 0;
        padding: var(--mk-space-2);
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-2);
        width: 100%;
        max-width: 24rem;
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface-sunken, var(--mk-surface));
      }
      .dnd-item {
        display: flex;
        align-items: center;
        gap: var(--mk-space-2);
        padding: var(--mk-space-3);
        color: var(--mk-text);
        background: var(--mk-surface);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        box-shadow: var(--mk-shadow-xs, none);
        cursor: grab;
        user-select: none;
      }
      .dnd-item__label {
        flex: 1;
      }
      .dnd-item--handle {
        cursor: default;
      }
      .dnd-item:focus-visible,
      .dnd-card:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
      .dnd-grip {
        color: var(--mk-text-muted);
        line-height: 1;
        cursor: grab;
      }
      .dnd-handle {
        display: inline-flex;
        align-items: center;
        padding: var(--mk-space-1) var(--mk-space-2);
        color: var(--mk-text-muted);
        background: transparent;
        border: none;
        border-radius: var(--mk-radius-sm);
        cursor: grab;
      }
      .dnd-handle:hover {
        color: var(--mk-text);
        background: var(--mk-surface-hover, var(--mk-surface-sunken));
      }

      /* dragging / lifted states applied by the directives */
      :host ::ng-deep .mk-drag--dragging,
      :host ::ng-deep .mk-drag--lifted {
        opacity: 0.9;
        box-shadow: var(--mk-shadow-lg);
        cursor: grabbing;
      }
      :host ::ng-deep .mk-drop-list--receiving {
        outline: var(--mk-border-width) dashed var(--mk-primary);
        outline-offset: 2px;
      }

      /* ---- Drop zones ---- */
      .dnd-zones {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) 9rem;
        gap: var(--mk-space-3);
        width: 100%;
        align-items: stretch;
      }
      @media (max-width: 640px) {
        .dnd-zones { grid-template-columns: 1fr; }
      }
      .dnd-zones .dnd-list { max-width: none; }
      .dnd-zone {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-2);
        padding: var(--mk-space-4);
        border: var(--mk-border-width) dashed var(--mk-border-strong);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
        color: var(--mk-text);
      }
      .dnd-zone__label {
        font-size: var(--mk-font-size-xs);
        font-weight: var(--mk-font-weight-semibold, 600);
        letter-spacing: var(--mk-letter-spacing-wide);
        text-transform: uppercase;
        color: var(--mk-text-muted);
      }
      .dnd-zone__value { font-size: var(--mk-font-size-lg); }
      .dnd-zone__hint { color: var(--mk-text-muted); font-size: var(--mk-font-size-sm); }
      .dnd-rail {
        position: relative;
        min-height: 18rem;
        padding: var(--mk-space-2);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
        overflow: hidden;
      }
      .dnd-rail .dnd-zone__label { position: absolute; top: var(--mk-space-2); left: var(--mk-space-2); }
      .dnd-rail__tick {
        position: absolute;
        left: var(--mk-space-2);
        right: var(--mk-space-2);
        border-top: var(--mk-border-width) solid var(--mk-border-subtle);
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-subtle);
        font-variant-numeric: tabular-nums;
        pointer-events: none;
      }
      .dnd-rail__block,
      .dnd-rail__pill {
        position: absolute;
        left: var(--mk-space-6);
        right: var(--mk-space-2);
        padding: var(--mk-space-1) var(--mk-space-2);
        font-size: var(--mk-font-size-xs);
        border-radius: var(--mk-radius-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: none;
      }
      .dnd-rail__block {
        background: var(--mk-primary-subtle);
        color: var(--mk-primary-subtle-text);
        border-left: var(--mk-border-width-strong) solid var(--mk-primary);
      }
      .dnd-rail__pill {
        background: var(--mk-primary);
        color: var(--mk-primary-contrast);
        font-weight: var(--mk-font-weight-semibold, 600);
        border-top: var(--mk-border-width-strong) solid var(--mk-primary);
      }
      :host ::ng-deep .mk-drop-zone--receiving {
        outline: var(--mk-border-width) dashed var(--mk-primary);
        outline-offset: 2px;
      }
      /* ---- Kanban board ---- */
      .dnd-board {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--mk-space-3);
        width: 100%;
      }
      .dnd-col {
        display: flex;
        flex-direction: column;
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface-sunken, var(--mk-surface));
        overflow: hidden;
      }
      .dnd-col__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--mk-space-2) var(--mk-space-3);
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-semibold, 600);
        color: var(--mk-text);
        border-bottom: var(--mk-border-width) solid var(--mk-border);
      }
      .dnd-col__count {
        min-width: 1.5rem;
        padding: 0 var(--mk-space-1);
        text-align: center;
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
        background: var(--mk-surface);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-full, 999px);
      }
      .dnd-col__list {
        list-style: none;
        margin: 0;
        padding: var(--mk-space-2);
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-2);
        flex: 1;
        min-height: 6rem;
      }
      .dnd-card {
        display: flex;
        align-items: flex-start;
        gap: var(--mk-space-2);
        padding: var(--mk-space-3);
        color: var(--mk-text);
        background: var(--mk-surface);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        box-shadow: var(--mk-shadow-xs, none);
        cursor: grab;
        user-select: none;
      }
      .dnd-card__body {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-1);
      }
      .dnd-card__title {
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-medium, 500);
      }
      .dnd-card__owner {
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
      }
      .dnd-col__empty {
        list-style: none;
        padding: var(--mk-space-4);
        text-align: center;
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
        border: var(--mk-border-width) dashed var(--mk-border);
        border-radius: var(--mk-radius-md);
      }
    `,
  ],
})
export class DragDropPage {
  // ----- Sortable list (raw directives) -------------------------------
  protected readonly tasks = signal<Task[]>([
    { id: 1, label: 'Draft the release notes' },
    { id: 2, label: 'Review open pull requests' },
    { id: 3, label: 'Update the changelog' },
    { id: 4, label: 'Tag the version' },
  ]);

  protected readonly taskOrder = computed(() =>
    this.tasks()
      .map((t) => t.id)
      .join(' → '),
  );

  protected onReorder(event: MkDropEvent<Task>): void {
    const next = [...this.tasks()];
    mkMoveItemInArray(next, event.previousIndex, event.currentIndex);
    this.tasks.set(next);
  }

  // ----- Sortable list (mk-sortable-list wrapper) ---------------------
  protected readonly tasks2 = signal<Task[]>([
    { id: 1, label: 'Design' },
    { id: 2, label: 'Build' },
    { id: 3, label: 'Test' },
    { id: 4, label: 'Ship' },
  ]);

  // ----- Drag handle list ---------------------------------------------
  protected readonly rows = signal<Task[]>([
    { id: 1, label: 'Only the grip drags this row' },
    { id: 2, label: 'Text stays selectable' },
    { id: 3, label: 'Buttons still clickable' },
  ]);

  protected onRowsReorder(event: MkDropEvent<Task>): void {
    const next = [...this.rows()];
    mkMoveItemInArray(next, event.previousIndex, event.currentIndex);
    this.rows.set(next);
  }

  // ----- Drop zones ---------------------------------------------------
  protected readonly zoneCode = `<ul mkDropList mkDropListId="backlog" mkDropListLabel="Backlog"
    [mkDropListData]="backlog()" [mkDropListConnectedTo]="['focus', 'rail']"
    (mkDropListDropped)="onBacklogReorder($event)">
  @for (t of backlog(); track t.id) {
    <li mkDrag [mkDragData]="t">{{ t.label }}</li>
  }
</ul>

<!-- a target that is not a list: reports WHERE the item was dropped -->
<section mkDropZone mkDropZoneId="focus" mkDropZoneLabel="Focus now"
         (mkDropZoneDropped)="focused.set($event.item.mkDragData())">
  …
</section>

<div mkDropZone mkDropZoneId="rail" mkDropZoneLabel="Today, 08:00 to 18:00"
     (mkDropZoneMoved)="preview.set(minutesAt($event.fractionY))"
     (mkDropZoneLeft)="preview.set(null)"
     (mkDropZoneDropped)="schedule($event.item.mkDragData(), minutesAt($event.fractionY))">
  …
</div>

// 08:00–18:00 rail: the vertical fraction is the time, snapped to 15 min
minutesAt(fraction: number): number {
  return 8 * 60 + Math.round((10 * 60 * fraction) / 15) * 15;
}`;

  protected readonly backlog = signal<Task[]>([
    { id: 1, label: 'Finish the Q3 deck' },
    { id: 2, label: 'Call the dentist' },
    { id: 3, label: 'Review the pull request' },
    { id: 4, label: 'Meal-plan the week' },
  ]);
  protected readonly focused = signal<Task | null>(null);
  protected readonly scheduled = signal<{ task: Task; minutes: number }[]>([]);
  protected readonly railPreview = signal<number | null>(null);
  protected readonly railHours = [8, 10, 12, 14, 16, 18];

  private static readonly RAIL_START = 8 * 60;
  private static readonly RAIL_END = 18 * 60;

  protected railTop(minutes: number): number {
    const { RAIL_START, RAIL_END } = DragDropPage;
    return ((minutes - RAIL_START) / (RAIL_END - RAIL_START)) * 100;
  }

  protected clock(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private minutesAt(fraction: number): number {
    const { RAIL_START, RAIL_END } = DragDropPage;
    return RAIL_START + Math.round(((RAIL_END - RAIL_START) * fraction) / 15) * 15;
  }

  protected onBacklogReorder(event: MkDropEvent<Task>): void {
    const next = [...this.backlog()];
    mkMoveItemInArray(next, event.previousIndex, event.currentIndex);
    this.backlog.set(next);
  }

  protected onFocusDrop(event: MkDropZoneEvent<Task>): void {
    this.focused.set(event.item.mkDragData() ?? null);
  }

  protected onRailMove(event: MkDropZoneHover<Task>): void {
    this.railPreview.set(this.minutesAt(event.fractionY));
  }

  protected onRailLeave(): void {
    this.railPreview.set(null);
  }

  protected onRailDrop(event: MkDropZoneEvent<Task>): void {
    const task = event.item.mkDragData();
    this.railPreview.set(null);
    if (!task) return;
    const minutes = this.minutesAt(event.fractionY);
    this.scheduled.update((list) => [...list.filter((s) => s.task.id !== task.id), { task, minutes }]);
    this.backlog.update((list) => list.filter((t) => t.id !== task.id));
  }

  // ----- Connected kanban board ---------------------------------------
  protected readonly columns: readonly BoardColumn[] = [
    { id: 'todo', title: 'To do' },
    { id: 'doing', title: 'In progress' },
    { id: 'done', title: 'Done' },
  ];

  protected readonly columnIds: readonly string[] = this.columns.map((c) => c.id);

  protected readonly board = signal<Record<string, BoardCard[]>>({
    todo: [
      { id: 1, title: 'Spec the API', owner: 'Ada' },
      { id: 2, title: 'Gather feedback', owner: 'Grace' },
    ],
    doing: [{ id: 3, title: 'Build the prototype', owner: 'Alan' }],
    done: [{ id: 4, title: 'Kickoff meeting', owner: 'Katherine' }],
  });

  protected onBoardDrop(event: MkDropEvent<BoardCard>): void {
    const from = event.previousContainer.id();
    const to = event.container.id();
    const next = { ...this.board() };
    if (from === to) {
      const arr = [...next[to]];
      mkMoveItemInArray(arr, event.previousIndex, event.currentIndex);
      next[to] = arr;
    } else {
      const fromArr = [...next[from]];
      const toArr = [...next[to]];
      mkTransferArrayItem(fromArr, toArr, event.previousIndex, event.currentIndex);
      next[from] = fromArr;
      next[to] = toArr;
    }
    this.board.set(next);
  }

  // ----- Nested lists ----------------------------------------------------
  protected readonly sections = signal<NestedSection[]>([
    {
      id: 'start',
      title: 'Getting started',
      items: [
        { id: 'n1', title: 'Install the package' },
        { id: 'n2', title: 'Import the theme' },
      ],
    },
    {
      id: 'build',
      title: 'Build the screen',
      items: [
        { id: 'n3', title: 'Add the app shell' },
        { id: 'n4', title: 'Wire the table' },
        { id: 'n5', title: 'Add the form' },
      ],
    },
    { id: 'ship', title: 'Ship it', items: [{ id: 'n6', title: 'Run the visual sweep' }] },
  ]);

  /** Every section's list id — items may travel between any of them. */
  protected readonly sectionListIds = computed(() => this.sections().map((s) => `sec-${s.id}`));

  // Two list types share one handler (sections + items) — `any` keeps the
  // generic invariance of MkDropEvent<T> out of the way.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected onNestedDrop(event: MkDropEvent<any>): void {
    const from = event.previousContainer.id();
    const to = event.container.id();
    if (to === 'sections' && from === 'sections') {
      const next = [...this.sections()];
      mkMoveItemInArray(next, event.previousIndex, event.currentIndex);
      this.sections.set(next);
      return;
    }
    if (from === 'sections' || to === 'sections') return; // sections stay sections
    const next = this.sections().map((s) => ({ ...s, items: [...s.items] }));
    const src = next.find((s) => `sec-${s.id}` === from)!;
    const dst = next.find((s) => `sec-${s.id}` === to)!;
    if (src === dst) mkMoveItemInArray(src.items, event.previousIndex, event.currentIndex);
    else mkTransferArrayItem(src.items, dst.items, event.previousIndex, event.currentIndex);
    this.sections.set(next);
  }

  // ----- Code snippets -------------------------------------------------
  protected readonly nestedCode = `<ul mkDropList mkDropListId="sections" [mkDropListData]="sections()"
    (mkDropListDropped)="onNestedDrop($event)">
  @for (s of sections(); track s.id) {
    <li mkDrag [mkDragData]="s">
      <!-- a focusable handle keeps the section a plain list item around its inner list -->
      <button mkDragHandle [attr.aria-label]="'Reorder section ' + s.title">⠿</button> {{ s.title }}
      <ul mkDropList [mkDropListId]="'sec-' + s.id" [mkDropListData]="s.items"
          [mkDropListLabel]="s.title" [mkDropListConnectedTo]="sectionListIds()"
          (mkDropListDropped)="onNestedDrop($event)">
        @for (it of s.items; track it.id) {
          <li mkDrag [mkDragData]="it">{{ it.title }}</li>
        }
      </ul>
    </li>
  }
</ul>

onNestedDrop(e: MkDropEvent) {
  const from = e.previousContainer.id(), to = e.container.id();
  if (from === 'sections' && to === 'sections') { /* reorder sections */ }
  else if (from === to) { /* mkMoveItemInArray within a section */ }
  else { /* mkTransferArrayItem between sections */ }
}`;

  protected readonly sortableCode = `<ul mkDropList mkDropListLabel="Tasks"
    [mkDropListData]="tasks()"
    (mkDropListDropped)="onReorder($event)">
  @for (t of tasks(); track t.id) {
    <li mkDrag [mkDragData]="t">{{ t.label }}</li>
  }
</ul>

onReorder(e: MkDropEvent<Task>) {
  const next = [...this.tasks()];
  mkMoveItemInArray(next, e.previousIndex, e.currentIndex);
  this.tasks.set(next);
}`;

  protected readonly wrapperCode = `<mk-sortable-list [(items)]="tasks">
  <ng-template let-item let-i="index">
    {{ i + 1 }}. {{ item.label }}
  </ng-template>
</mk-sortable-list>`;

  protected readonly handleCode = `<li mkDrag [mkDragData]="r">
  <button mkDragHandle aria-label="Drag to reorder">⠿</button>
  <span>{{ r.label }}</span>
</li>`;

  protected readonly boardCode = `<ul mkDropList
    [mkDropListId]="col.id"
    [mkDropListLabel]="col.title"
    [mkDropListData]="board()[col.id]"
    [mkDropListConnectedTo]="columnIds"
    (mkDropListDropped)="onBoardDrop($event)">
  @for (card of board()[col.id]; track card.id) {
    <li mkDrag [mkDragData]="card">{{ card.title }}</li>
  }
</ul>

onBoardDrop(e: MkDropEvent<BoardCard>) {
  const from = e.previousContainer.id();
  const to = e.container.id();
  const next = { ...this.board() };
  if (e.previousContainer === e.container) {
    const arr = [...next[to]];
    mkMoveItemInArray(arr, e.previousIndex, e.currentIndex);
    next[to] = arr;
  } else {
    const fromArr = [...next[from]];
    const toArr = [...next[to]];
    mkTransferArrayItem(fromArr, toArr, e.previousIndex, e.currentIndex);
    next[from] = fromArr;
    next[to] = toArr;
  }
  this.board.set(next);
}`;
}
