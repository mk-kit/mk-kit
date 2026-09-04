import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkAlert,
  MkBadge,
  MkButton,
  MkKanban,
  MkKanbanCardDef,
  MkKanbanColumnFooterDef,
  MkKanbanColumnHeaderDef,
  type MkKanbanCardMovedEvent,
  type MkKanbanColumn,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for `<mk-kanban>` — the drag-and-drop board
 * built on the dnd group's connected drop lists.
 */
@Component({
  selector: 'docs-kanban-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkAlert, MkBadge, MkButton, MkKanban, MkKanbanCardDef, MkKanbanColumnHeaderDef, MkKanbanColumnFooterDef],
  template: `
    <div class="docs-page docs-container">
      <h1>Kanban</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-kanban&gt;</code> is a board of columns
        whose cards can be <strong>reordered within a column and dragged
        between columns</strong> — by mouse, touch <em>and</em> keyboard. It is
        built on the dnd group's connected
        <code class="docs-inline">[mkDropList]</code> /
        <code class="docs-inline">[mkDrag]</code> directives, so it inherits
        their pointer physics, long-press touch handling and WCAG&nbsp;2.1.1
        keyboard dragging (with screen-reader announcements) for free.
      </p>

      <!-- ============================================================ -->
      <h2>Board</h2>
      <p>
        Bind <code class="docs-inline">columns</code> two-way — the model is
        updated <strong>immutably</strong> on every drop — and listen to
        <code class="docs-inline">(cardMoved)</code> for move events. Drag a
        card below; the last move is echoed under the board.
      </p>
      <docs-example [code]="kanbanCode" [column]="true">
        <mk-kanban [(columns)]="board" (cardMoved)="onMoved($event)" style="width: 100%" />
        <p class="echo" aria-live="polite">
          @if (lastMove(); as move) {
            Moved "{{ move.card.title }}" from
            <code class="docs-inline">{{ move.from }}</code
            >[{{ move.fromIndex }}] to
            <code class="docs-inline">{{ move.to }}</code
            >[{{ move.toIndex }}] — {{ moveCount() }} move{{
              moveCount() === 1 ? '' : 's'
            }} so far.
          } @else {
            No cards moved yet — try dragging one.
          }
        </p>
      </docs-example>

      <mk-alert tone="info" variant="soft" title="The consumer owns the data">
        The board never mutates your objects: each drop produces a
        <em>new</em> <code class="docs-inline">columns</code> array (new column
        and <code class="docs-inline">cards</code> arrays for the affected
        columns), written back through the two-way binding.
        <code class="docs-inline">(cardMoved)</code> fires <em>after</em> that
        write with <code class="docs-inline">{{ '{' }} card, from, to,
        fromIndex, toIndex {{ '}' }}</code> — use it to persist the move
        (PATCH the card's status/position), not to update the board yourself.
        To reject a move, write the previous array back into your signal.
      </mk-alert>

      <!-- ============================================================ -->
      <h2>Custom card template</h2>
      <p>
        Cards are <code class="docs-inline">{{ '{' }} id, title {{ '}' }}</code>
        plus any extra fields you need. Project an
        <code class="docs-inline">&lt;ng-template&gt;</code> to render them
        yourself — it receives the card as
        <code class="docs-inline">$implicit</code> and the owning column as
        <code class="docs-inline">column</code>.
      </p>
      <docs-example [code]="templateCode" [column]="true">
        <mk-kanban [(columns)]="board" style="width: 100%">
          <ng-template let-card let-column="column">
            <div style="display: grid; gap: var(--mk-space-1);">
              <strong>{{ card.title }}</strong>
              <span style="display: flex; gap: var(--mk-space-2); align-items: center;">
                <mk-badge [tone]="column.id === 'done' ? 'success' : 'neutral'" size="sm">
                  {{ card['tag'] ?? column.title }}
                </mk-badge>
                <span style="color: var(--mk-text-subtle); font-size: var(--mk-font-size-sm);">
                  {{ card['assignee'] }}
                </span>
              </span>
            </div>
          </ng-template>
        </mk-kanban>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Column header and footer templates</h2>
      <p>
        Since 0.54 a column's header and footer are yours to render, too.
        <code class="docs-inline">mkKanbanColumnHeader</code> replaces the
        default title + count (put rename / delete / "add here" actions
        there), <code class="docs-inline">mkKanbanColumnFooter</code> renders
        under the card list (a quick-add control, say). Both receive
        <code class="docs-inline">{{ '{' }} $implicit: column, index, count {{ '}' }}</code>.
        When you project several templates, mark the card one with
        <code class="docs-inline">mkKanbanCard</code>; a single plain
        <code class="docs-inline">&lt;ng-template&gt;</code> keeps working.
      </p>
      <docs-example [code]="slotsCode" [column]="true">
        <mk-kanban [(columns)]="board" style="width: 100%">
          <ng-template mkKanbanColumnHeader let-column let-count="count">
            <span style="display: flex; align-items: center; gap: var(--mk-space-2); width: 100%;">
              <strong style="flex: 1 1 auto;">{{ column.title }}</strong>
              <mk-badge size="sm" tone="neutral">{{ count }}</mk-badge>
              <button mkButton size="sm" variant="ghost" tone="neutral" type="button" (click)="addCard(column)">+</button>
            </span>
          </ng-template>
          <ng-template mkKanbanCard let-card>
            <strong>{{ card.title }}</strong>
          </ng-template>
          <ng-template mkKanbanColumnFooter let-column>
            <button mkButton size="sm" variant="ghost" tone="neutral" type="button" style="width: 100%" (click)="addCard(column)">
              + Add to {{ column.title }}
            </button>
          </ng-template>
        </mk-kanban>
      </docs-example>

      <!-- ============================================================ -->
      <h2>API</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>[(columns)]</code></td><td><code>MkKanbanColumn[]</code></td><td><code>[]</code></td><td>The board's columns and their cards (two-way). Replaced immutably on every drop.</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable all dragging on the board (columns and cards stay visible).</td></tr>
          <tr><td><code>(cardMoved)</code></td><td><code>MkKanbanCardMovedEvent</code></td><td>—</td><td>Fires after the model update: <code>{{ '{' }} card, from, to, fromIndex, toIndex {{ '}' }}</code> (<code>from</code>/<code>to</code> are column ids).</td></tr>
          <tr><td><code>ng-template[mkKanbanCard]</code></td><td>slot</td><td>—</td><td>Card renderer; context: <code>$implicit</code> = card, <code>column</code> = owning column. A single plain <code>ng-template</code> is treated as the card renderer too.</td></tr>
          <tr><td><code>ng-template[mkKanbanColumnHeader]</code></td><td>slot</td><td>—</td><td>Replaces the default header (title + count); context: <code>$implicit</code> = column, <code>index</code>, <code>count</code>.</td></tr>
          <tr><td><code>ng-template[mkKanbanColumnFooter]</code></td><td>slot</td><td>—</td><td>Rendered under the card list of every column; same context as the header.</td></tr>
        </tbody>
      </table>
      <p>
        <code class="docs-inline">MkKanbanColumn</code> is
        <code class="docs-inline">{{ '{' }} id, title, cards {{ '}' }}</code>;
        <code class="docs-inline">MkKanbanCard</code> is
        <code class="docs-inline">{{ '{' }} id, title, …extra fields {{ '}' }}</code>.
        Both <code class="docs-inline">id</code>s are the stable identities used
        for tracking and in move events — keep them unique and stable across
        renders.
      </p>

      <!-- ============================================================ -->
      <h2>Keyboard</h2>
      <p>
        Every card is focusable (<code class="docs-inline">role="button"</code>,
        <code class="docs-inline">aria-roledescription="Draggable item"</code>)
        and each step is announced to screen readers via the live announcer.
        Column lists are vertical, so the arrow-key axes map as follows:
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td>Tab</td><td>Move focus between cards.</td></tr>
          <tr><td>Space / Enter</td><td>Pick the focused card up; press again to drop it at the placeholder.</td></tr>
          <tr><td>↑ / ↓</td><td>While lifted: move up / down within the current column (crossing into the adjacent column at the ends).</td></tr>
          <tr><td>← / →</td><td>While lifted: move to the previous / next column, keeping the position where possible.</td></tr>
          <tr><td>Esc</td><td>Cancel the lift — the card snaps back (blurring the card also cancels).</td></tr>
        </tbody>
      </table>

      <h3>Touch</h3>
      <p>
        On touch screens a swipe over the board scrolls the page as usual — a
        card only lifts after a <strong>long-press</strong> (the dnd module's
        <code class="docs-inline">mkDragTouchDelay</code>, 300&nbsp;ms by
        default; the board uses the default). While armed the card carries the
        <code class="docs-inline">mk-drag--armed</code> class so you can style
        the lift moment. Mouse and pen drags start immediately.
      </p>
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
      .echo {
        margin: 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class KanbanPage {
  protected readonly board = signal<MkKanbanColumn[]>([
    {
      id: 'todo',
      title: 'To do',
      cards: [
        { id: 't1', title: 'Draft release notes', tag: 'Docs', assignee: 'Ada' },
        { id: 't2', title: 'Audit colour tokens', tag: 'Design', assignee: 'Grace' },
        { id: 't3', title: 'Write kanban docs', tag: 'Docs', assignee: 'Linus' },
        { id: 't4', title: 'Triage a11y feedback', tag: 'A11y', assignee: 'Ada' },
      ],
    },
    {
      id: 'doing',
      title: 'In progress',
      cards: [
        { id: 'd1', title: 'Ship countdown component', tag: 'Feature', assignee: 'Grace' },
        { id: 'd2', title: 'Review DnD a11y', tag: 'A11y', assignee: 'Margaret' },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      cards: [
        { id: 'x1', title: 'Set up docs site', tag: 'Chore', assignee: 'Linus' },
        { id: 'x2', title: 'Publish v1 to npm', tag: 'Release', assignee: 'Margaret' },
      ],
    },
  ]);

  protected readonly lastMove = signal<MkKanbanCardMovedEvent | null>(null);
  protected readonly moveCount = signal(0);

  protected onMoved(event: MkKanbanCardMovedEvent): void {
    this.lastMove.set(event);
    this.moveCount.update((n) => n + 1);
  }

  protected readonly kanbanCode = `board = signal<MkKanbanColumn[]>([
  { id: 'todo', title: 'To do', cards: [{ id: 't1', title: 'Draft release notes' }] },
  { id: 'done', title: 'Done', cards: [] },
]);

<mk-kanban [(columns)]="board" (cardMoved)="persist($event)" />`;

  protected addCard(column: MkKanbanColumn): void {
    const n = this.board().reduce((sum, c) => sum + c.cards.length, 0) + 1;
    this.board.update((cols) =>
      cols.map((c) => (c.id === column.id ? { ...c, cards: [...c.cards, { id: `n${n}`, title: `New card ${n}` }] } : c)),
    );
  }

  protected readonly slotsCode = `<mk-kanban [(columns)]="board">
  <ng-template mkKanbanColumnHeader let-column let-count="count">
    <strong>{{ column.title }}</strong>
    <mk-badge size="sm">{{ count }}</mk-badge>
    <button mkButton size="sm" variant="ghost" (click)="addCard(column)">+</button>
  </ng-template>
  <ng-template mkKanbanCard let-card>
    <strong>{{ card.title }}</strong>
  </ng-template>
  <ng-template mkKanbanColumnFooter let-column>
    <button mkButton size="sm" variant="ghost" (click)="addCard(column)">+ Add to {{ column.title }}</button>
  </ng-template>
</mk-kanban>`;

  protected readonly templateCode = `<mk-kanban [(columns)]="board">
  <ng-template let-card let-column="column">
    <strong>{{ card.title }}</strong>
    <mk-badge size="sm">{{ card.tag }}</mk-badge>
  </ng-template>
</mk-kanban>`;
}
