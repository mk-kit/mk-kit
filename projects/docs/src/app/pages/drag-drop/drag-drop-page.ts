import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkDrag,
  MkDragHandle,
  MkDropList,
  MkSortableList,
  mkMoveItemInArray,
  mkTransferArrayItem,
  type MkDropEvent,
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

/**
 * Drag & drop components demo page — the low-level `[mkDropList]` + `[mkDrag]`
 * primitives, the `[mkDragHandle]` grip, the `mk-sortable-list` convenience
 * wrapper and the `mkMoveItemInArray` / `mkTransferArrayItem` helpers, shown as
 * live reorderable lists and a connected kanban board.
 */
@Component({
  selector: 'docs-drag-drop-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkDrag, MkDragHandle, MkDropList, MkSortableList],
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
        </tbody>
      </table>

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

      <!-- ======================== DRAG HANDLE ======================== -->
      <h2>Drag handle</h2>
      <p>
        Add a <code class="docs-inline">[mkDragHandle]</code> inside an item and
        pointer drags may only start on that grip — the rest of the row stays
        selectable and clickable. (Keyboard dragging still uses the whole
        focused item.)
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

  // ----- Code snippets -------------------------------------------------
  protected readonly sortableCode = `<ul mkDropList
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
