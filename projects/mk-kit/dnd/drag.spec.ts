import {
  Component,
  provideZonelessChangeDetection,
  viewChildren,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkDrag } from './drag';
import { MkDragHandle } from './drag-handle';
import { MkDropList } from './drop-list';

/**
 * A draggable category whose body contains a nested drop list of draggable
 * products — the menu-builder shape. Each level has its own drag handle.
 */
@Component({
  imports: [MkDrag, MkDragHandle, MkDropList],
  template: `
    <div mkDropList [mkDropListData]="cats">
      <div mkDrag [mkDragData]="cats[0]">
        <span class="outer-handle" mkDragHandle>::</span>
        <div mkDropList [mkDropListData]="prods">
          <div mkDrag [mkDragData]="prods[0]">
            <span class="inner-handle" mkDragHandle>::</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
class NestedHost {
  cats = [{ id: 'c1' }];
  prods = [{ id: 'p1' }];
  readonly drags = viewChildren(MkDrag);
}

describe('MkDrag nested handles', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('scopes handles to the nearest mkDrag ancestor so inner handles do not arm the outer item', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(NestedHost);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const outerHandle = el.querySelector('.outer-handle')!;
    const innerHandle = el.querySelector('.inner-handle')!;

    const drags = fixture.componentInstance.drags();
    // Outer = the one whose host is NOT inside the other's host.
    const outer = drags.find((d) => !drags.some((o) => o !== d && o.element.contains(d.element)))!;
    const inner = drags.find((d) => d !== outer)!;

    const own = (d: MkDrag) =>
      (d as unknown as { ownHandles: () => { element: Element }[] })
        .ownHandles()
        .map((h) => h.element);

    // The outer item owns only its own handle — never the nested product handle.
    expect(own(outer)).toContain(outerHandle);
    expect(own(outer)).not.toContain(innerHandle);
    // The inner item owns its own handle.
    expect(own(inner)).toEqual([innerHandle]);
  });
});

/** A plain vertical list — the kanban-card shape (whole item draggable). */
@Component({
  imports: [MkDrag, MkDropList],
  template: `
    <div mkDropList [mkDropListData]="rows" (mkDropListDropped)="dropped($event)">
      @for (row of rows; track row.id) {
        <div class="item" mkDrag [mkDragData]="row" [mkDragTouchDelay]="delay"></div>
      }
    </div>
  `,
})
class TouchHost {
  rows = [{ id: 'a' }, { id: 'b' }];
  delay = 300;
  readonly dropped = vi.fn();
}

describe('MkDrag touch long-press', () => {
  /** Pointer event with sensible defaults for a first (primary) touch. */
  const pev = (type: string, x: number, y: number, pointerType = 'touch') =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType,
      clientX: x,
      clientY: y,
    });

  function setup(delay = 300) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TouchHost);
    fixture.componentInstance.delay = delay;
    fixture.detectChanges();
    const item = fixture.nativeElement.querySelector('.item') as HTMLElement;
    return { fixture, item };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no matchMedia; reduced motion = true keeps the settle sync.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as { matchMedia?: unknown }).matchMedia;
    TestBed.resetTestingModule();
  });

  it('arms after the long press (movement within the slop is tolerated) and then drags', () => {
    const { fixture, item } = setup();

    item.dispatchEvent(pev('pointerdown', 0, 0));
    // A tiny wobble within the 10px slop must not cancel the press.
    item.dispatchEvent(pev('pointermove', 4, 4));
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(item.classList.contains('mk-drag--armed')).toBe(true);
    // Armed: the element opts out of native panning for the rest of the gesture.
    expect(item.style.touchAction).toBe('none');

    // From here the normal 5px threshold applies and moves are consumed.
    const move = pev('pointermove', 20, 0);
    item.dispatchEvent(move);
    fixture.detectChanges();
    expect(item.classList.contains('mk-drag--dragging')).toBe(true);
    expect(move.defaultPrevented).toBe(true);

    item.dispatchEvent(pev('pointerup', 20, 0));
    fixture.detectChanges();
    expect(fixture.componentInstance.dropped).toHaveBeenCalledTimes(1);
    expect(item.classList.contains('mk-drag--armed')).toBe(false);
    expect(item.style.touchAction).toBe('');
  });

  it('treats a move beyond the slop before the timer as a scroll — no drag, no preventDefault', () => {
    const { fixture, item } = setup();

    item.dispatchEvent(pev('pointerdown', 0, 0));
    const scroll = pev('pointermove', 0, 24);
    item.dispatchEvent(scroll);
    // The browser keeps the gesture: we never preventDefault a scroll.
    expect(scroll.defaultPrevented).toBe(false);

    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(item.classList.contains('mk-drag--armed')).toBe(false);
    expect(item.style.touchAction).toBe('');

    // The session is dead — further movement starts nothing.
    item.dispatchEvent(pev('pointermove', 0, 60));
    fixture.detectChanges();
    expect(item.classList.contains('mk-drag--dragging')).toBe(false);
    expect(fixture.componentInstance.dropped).not.toHaveBeenCalled();
  });

  it('keeps the immediate threshold behavior for mouse pointers', () => {
    const { fixture, item } = setup();

    item.dispatchEvent(pev('pointerdown', 0, 0, 'mouse'));
    item.dispatchEvent(pev('pointermove', 10, 10, 'mouse'));
    fixture.detectChanges();
    // No timer needed — the drag starts as soon as the 5px threshold is crossed.
    expect(item.classList.contains('mk-drag--dragging')).toBe(true);
    // The armed class is a touch lift-moment affordance only.
    expect(item.classList.contains('mk-drag--armed')).toBe(false);

    item.dispatchEvent(pev('pointerup', 10, 10, 'mouse'));
    fixture.detectChanges();
    expect(fixture.componentInstance.dropped).toHaveBeenCalledTimes(1);
  });

  it('clears the pending timer on pointerup — a tap never arms', () => {
    const { fixture, item } = setup();

    item.dispatchEvent(pev('pointerdown', 0, 0));
    item.dispatchEvent(pev('pointerup', 0, 0));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(item.classList.contains('mk-drag--armed')).toBe(false);
    expect(item.style.touchAction).toBe('');
    expect(fixture.componentInstance.dropped).not.toHaveBeenCalled();
  });

  it('mkDragTouchDelay=0 arms touch immediately (legacy behavior)', () => {
    const { fixture, item } = setup(0);

    item.dispatchEvent(pev('pointerdown', 0, 0));
    const move = pev('pointermove', 10, 10);
    item.dispatchEvent(move);
    fixture.detectChanges();

    expect(item.classList.contains('mk-drag--dragging')).toBe(true);
    expect(move.defaultPrevented).toBe(true);

    item.dispatchEvent(pev('pointerup', 10, 10));
    fixture.detectChanges();
    expect(fixture.componentInstance.dropped).toHaveBeenCalledTimes(1);
  });

  it('suppresses the context menu during a touch press and restores it after', () => {
    const { item } = setup();

    item.dispatchEvent(pev('pointerdown', 0, 0));
    const during = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    item.dispatchEvent(during);
    expect(during.defaultPrevented).toBe(true);

    item.dispatchEvent(pev('pointerup', 0, 0));
    const after = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    item.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
});

/**
 * Two connected lists with deterministic mocked geometry — exercises the
 * frame-coalesced pointer path: the layout snapshot taken at lift, the
 * idempotent placeholder sync, and the flush-on-release drop.
 *
 * Geometry: list A at x 0–100 holds a0/a1/a2 stacked in 100px rows;
 * list B at x 200–300 holds b0/b1 the same way.
 */
@Component({
  imports: [MkDrag, MkDropList],
  template: `
    <div
      class="list-a"
      mkDropList
      mkDropListId="a"
      [mkDropListConnectedTo]="['b']"
      [mkDropListData]="a"
      (mkDropListDropped)="dropped($event)"
    >
      @for (row of a; track row.id) {
        <div class="item" mkDrag [mkDragData]="row"></div>
      }
    </div>
    <div
      class="list-b"
      mkDropList
      mkDropListId="b"
      [mkDropListConnectedTo]="['a']"
      [mkDropListData]="b"
      (mkDropListDropped)="dropped($event)"
    >
      @for (row of b; track row.id) {
        <div class="item" mkDrag [mkDragData]="row"></div>
      }
    </div>
  `,
})
class ConnectedHost {
  a = [{ id: 'a0' }, { id: 'a1' }, { id: 'a2' }];
  b = [{ id: 'b0' }, { id: 'b1' }];
  readonly dropped = vi.fn();
}

describe('MkDrag frame-coalesced pointer moves', () => {
  /** Primary mouse pointer event (no long-press delay involved). */
  const pev = (type: string, x: number, y: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: x,
      clientY: y,
    });

  const rect = (x: number, y: number, w = 100, h = 100): DOMRect =>
    ({
      x,
      y,
      width: w,
      height: h,
      top: y,
      left: x,
      right: x + w,
      bottom: y + h,
      toJSON: () => ({}),
    }) as DOMRect;

  const mockRect = (el: HTMLElement, r: DOMRect) =>
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(r);

  // Captured-callback rAF stub: frames only run when the test flushes them,
  // and cancelAnimationFrame really cancels (same shape the drag relies on).
  let rafCbs: Map<number, FrameRequestCallback>;
  let nextRaf = 1;
  const flushRaf = () => {
    const cbs = [...rafCbs.values()];
    rafCbs.clear();
    for (const cb of cbs) cb(0);
  };

  beforeEach(() => {
    rafCbs = new Map();
    nextRaf = 1;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextRaf++;
      rafCbs.set(id, cb);
      return id;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCbs.delete(id);
    });
    // jsdom has no matchMedia; reduced motion = true keeps the settle sync.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as { matchMedia?: unknown }).matchMedia;
    TestBed.resetTestingModule();
  });

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ConnectedHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const listA = el.querySelector('.list-a') as HTMLElement;
    const listB = el.querySelector('.list-b') as HTMLElement;
    const [a0, a1, a2] = Array.from(
      listA.querySelectorAll('.item'),
    ) as HTMLElement[];
    const [b0, b1] = Array.from(listB.querySelectorAll('.item')) as HTMLElement[];
    const spies = {
      listA: mockRect(listA, rect(0, 0, 100, 300)),
      listB: mockRect(listB, rect(200, 0, 100, 300)),
      a0: mockRect(a0, rect(0, 0)),
      a1: mockRect(a1, rect(0, 100)),
      a2: mockRect(a2, rect(0, 200)),
      b0: mockRect(b0, rect(200, 0)),
      b1: mockRect(b1, rect(200, 100)),
    };
    return { fixture, listA, listB, a0, spies };
  }

  it('measures every list and item once at lift — never again per move', () => {
    const { fixture, a0, spies } = setup();

    a0.dispatchEvent(pev('pointerdown', 50, 50));
    a0.dispatchEvent(pev('pointermove', 50, 60)); // crosses the 5px threshold — lift
    flushRaf();

    // Lift snapshot: the dragged item (origin/preview), each list, each other item.
    const liftCounts = Object.fromEntries(
      Object.entries(spies).map(([k, s]) => [k, s.mock.calls.length]),
    );
    expect(liftCounts).toEqual({
      listA: 1,
      listB: 1,
      a0: 1,
      a1: 1,
      a2: 1,
      b0: 1,
      b1: 1,
    });

    // Five same-index moves, each with its frame flushed: all hits, no layout.
    for (let i = 1; i <= 5; i++) {
      a0.dispatchEvent(pev('pointermove', 50, 60 + i));
      flushRaf();
    }
    for (const [k, s] of Object.entries(spies)) {
      expect(s.mock.calls.length, `${k} re-measured during moves`).toBe(
        liftCounts[k],
      );
    }

    a0.dispatchEvent(pev('pointerup', 50, 65));
    fixture.detectChanges();
    expect(fixture.componentInstance.dropped).toHaveBeenCalledTimes(1);
  });

  it('leaves the placeholder DOM untouched while consecutive moves keep the same index', () => {
    const { listA, a0 } = setup();

    a0.dispatchEvent(pev('pointerdown', 50, 50));
    a0.dispatchEvent(pev('pointermove', 50, 60));
    flushRaf();

    const ph = listA.querySelector('.mk-drop-placeholder') as HTMLElement;
    expect(ph).toBeTruthy();
    const removeSpy = vi.spyOn(ph, 'remove');
    const childrenBefore = [...listA.children];

    for (const y of [62, 64, 66]) {
      a0.dispatchEvent(pev('pointermove', 50, y));
      flushRaf();
    }
    expect(removeSpy).not.toHaveBeenCalled();
    expect(listA.children.length).toBe(childrenBefore.length);
    expect(
      [...listA.children].every((c, i) => c === childrenBefore[i]),
    ).toBe(true);

    // Positive control: crossing the next item's midpoint re-inserts exactly once.
    a0.dispatchEvent(pev('pointermove', 50, 180));
    flushRaf();
    expect(removeSpy).toHaveBeenCalledTimes(1);

    a0.dispatchEvent(pev('pointerup', 50, 180));
  });

  it('flushes the pending frame on pointerup so the drop lands at the final coordinates', () => {
    const { fixture, listA, listB, a0 } = setup();
    const dropped = fixture.componentInstance.dropped;

    a0.dispatchEvent(pev('pointerdown', 50, 50));
    // Rapid moves with NO frame ever running — the pointer ends over list B,
    // below both of its items.
    a0.dispatchEvent(pev('pointermove', 50, 60));
    a0.dispatchEvent(pev('pointermove', 150, 80));
    a0.dispatchEvent(pev('pointermove', 250, 150));
    a0.dispatchEvent(pev('pointerup', 250, 150));
    fixture.detectChanges();

    expect(dropped).toHaveBeenCalledTimes(1);
    const ev = dropped.mock.calls[0][0] as {
      container: MkDropList;
      previousContainer: MkDropList;
      currentIndex: number;
      previousIndex: number;
      isPointerEvent: boolean;
    };
    expect(ev.previousContainer.element).toBe(listA);
    expect(ev.container.element).toBe(listB);
    expect(ev.previousIndex).toBe(0);
    expect(ev.currentIndex).toBe(2);
    expect(ev.isPointerEvent).toBe(true);
  });
});
