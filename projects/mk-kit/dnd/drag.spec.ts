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
