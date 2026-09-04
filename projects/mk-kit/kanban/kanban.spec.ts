import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MkKanban,
  MkKanbanCardDef,
  MkKanbanColumnFooterDef,
  MkKanbanColumnHeaderDef,
  type MkKanbanCardMovedEvent,
  type MkKanbanColumn,
} from './kanban';

describe('MkKanban', () => {
  let fixture: ComponentFixture<MkKanban>;
  let kanban: MkKanban;

  const board = (): MkKanbanColumn[] => [
    {
      id: 'a',
      title: 'To do',
      cards: [
        { id: 'a1', title: 'A1' },
        { id: 'a2', title: 'A2' },
      ],
    },
    {
      id: 'b',
      title: 'Doing',
      cards: [
        { id: 'b1', title: 'B1' },
        { id: 'b2', title: 'B2' },
      ],
    },
  ];

  /** Build a minimal drop event whose containers report the given list ids. */
  const dropEvent = (fromId: string, toId: string, previousIndex: number, currentIndex: number) =>
    ({
      previousIndex,
      currentIndex,
      previousContainer: { id: () => fromId },
      container: { id: () => toId },
      isPointerEvent: true,
      item: {} as unknown,
    }) as unknown;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkKanban);
    kanban = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('moves a card between columns, updates the model, and emits cardMoved', () => {
    kanban.columns.set(board());
    const ids = (kanban as any).listIds() as string[];

    const moved: MkKanbanCardMovedEvent[] = [];
    kanban.cardMoved.subscribe((e) => moved.push(e));

    // Move card A1 (column A, index 0) to column B, index 1.
    (kanban as any).onDrop(dropEvent(ids[0], ids[1], 0, 1));

    const next = kanban.columns();
    expect(next[0].cards.map((c) => c.id)).toEqual(['a2']);
    expect(next[1].cards.map((c) => c.id)).toEqual(['b1', 'a1', 'b2']);

    expect(moved).toHaveLength(1);
    expect(moved[0]).toMatchObject({
      from: 'a',
      to: 'b',
      fromIndex: 0,
      toIndex: 1,
    });
    expect(moved[0].card.id).toBe('a1');
  });

  it('reorders within a single column immutably', () => {
    const original = board();
    kanban.columns.set(original);
    const ids = (kanban as any).listIds() as string[];

    // Move A2 (index 1) to index 0 within column A.
    (kanban as any).onDrop(dropEvent(ids[0], ids[0], 1, 0));

    const next = kanban.columns();
    expect(next[0].cards.map((c) => c.id)).toEqual(['a2', 'a1']);
    expect(next[1].cards.map((c) => c.id)).toEqual(['b1', 'b2']);
    // Model was replaced, not mutated in place.
    expect(next).not.toBe(original);
    expect(original[0].cards.map((c) => c.id)).toEqual(['a1', 'a2']);
  });

  it('keeps connectedTo identity stable across change detection and drops', () => {
    kanban.columns.set(board());
    fixture.detectChanges();

    const ids = (kanban as any).listIds() as string[];
    const first = (kanban as any).connectedTo(0) as string[];
    expect(first).toEqual([ids[1]]);

    // Same reference on a subsequent CD pass — a fresh array here would dirty
    // MkDropList's `connectedTo` input identity every cycle.
    fixture.detectChanges();
    expect((kanban as any).connectedTo(0)).toBe(first);
    expect((kanban as any).connectedTo(1)).toBe((kanban as any).connectedTo(1));

    // A card move replaces the columns model but not the column count, so the
    // connection arrays (and list ids) must keep their identity too.
    (kanban as any).onDrop(dropEvent(ids[0], ids[1], 0, 0));
    fixture.detectChanges();
    expect((kanban as any).connectedTo(0)).toBe(first);
    expect((kanban as any).listIds()).toBe(ids);
  });

  it('ignores drops whose containers are not part of this board', () => {
    kanban.columns.set(board());
    const moved = vi.fn();
    kanban.cardMoved.subscribe(moved);

    (kanban as any).onDrop(dropEvent('unknown-from', 'unknown-to', 0, 0));

    expect(kanban.columns()[0].cards.map((c) => c.id)).toEqual(['a1', 'a2']);
    expect(moved).not.toHaveBeenCalled();
  });

  describe('column header / footer templates', () => {
    const columns = (): MkKanbanColumn[] => [
      { id: 'a', title: 'To do', cards: [{ id: 'a1', title: 'A1' }, { id: 'a2', title: 'A2' }] },
      { id: 'b', title: 'Done', cards: [] },
    ];

    @Component({
      imports: [MkKanban, MkKanbanCardDef, MkKanbanColumnHeaderDef, MkKanbanColumnFooterDef],
      template: `
        <mk-kanban [(columns)]="board">
          <ng-template mkKanbanColumnFooter let-column let-count="count">
            <button class="add" type="button">+ {{ column.title }} ({{ count }})</button>
          </ng-template>
          <ng-template mkKanbanColumnHeader let-column let-index="index" let-count="count">
            <span class="head">{{ index }}:{{ column.title }}={{ count }}</span>
          </ng-template>
          <ng-template mkKanbanCard let-card let-column="column">
            <em class="card">{{ card.title }}@{{ column.id }}</em>
          </ng-template>
        </mk-kanban>
      `,
    })
    class Host {
      readonly board = signal(columns());
    }

    @Component({
      imports: [MkKanban, MkKanbanColumnHeaderDef],
      template: `
        <mk-kanban [(columns)]="board">
          <ng-template mkKanbanColumnHeader let-column>
            <span class="head">{{ column.title }}</span>
          </ng-template>
          <ng-template let-card>
            <em class="card">{{ card.title }}</em>
          </ng-template>
        </mk-kanban>
      `,
    })
    class PlainCardHost {
      readonly board = signal(columns());
    }

    it('renders header, card and footer templates with their contexts, regardless of order', () => {
      const host = TestBed.createComponent(Host);
      host.detectChanges();
      const el = host.nativeElement as HTMLElement;
      expect([...el.querySelectorAll('.head')].map((h) => h.textContent)).toEqual(['0:To do=2', '1:Done=0']);
      expect(el.querySelector('.mk-kanban__column-title')).toBeNull();
      expect([...el.querySelectorAll('.card')].map((c) => c.textContent)).toEqual(['A1@a', 'A2@a']);
      expect([...el.querySelectorAll('.mk-kanban__column-footer .add')].map((b) => b.textContent)).toEqual([
        '+ To do (2)',
        '+ Done (0)',
      ]);
    });

    it('keeps the pre-0.54 rule: a plain ng-template is the card, even next to a header template', () => {
      const host = TestBed.createComponent(PlainCardHost);
      host.detectChanges();
      const el = host.nativeElement as HTMLElement;
      expect([...el.querySelectorAll('.head')].map((h) => h.textContent)).toEqual(['To do', 'Done']);
      expect([...el.querySelectorAll('.card')].map((c) => c.textContent)).toEqual(['A1', 'A2']);
      expect(el.querySelector('.mk-kanban__column-footer')).toBeNull();
    });
  });
});
