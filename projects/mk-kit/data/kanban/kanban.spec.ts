import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkKanban, type MkKanbanCardMovedEvent, type MkKanbanColumn } from './kanban';

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

  it('ignores drops whose containers are not part of this board', () => {
    kanban.columns.set(board());
    const moved = vi.fn();
    kanban.cardMoved.subscribe(moved);

    (kanban as any).onDrop(dropEvent('unknown-from', 'unknown-to', 0, 0));

    expect(kanban.columns()[0].cards.map((c) => c.id)).toEqual(['a1', 'a2']);
    expect(moved).not.toHaveBeenCalled();
  });
});
