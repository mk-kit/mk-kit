import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkDrag } from './drag';
import { MkDragHandle } from './drag-handle';
import { MkDropList } from './drop-list';

/**
 * Two-level structure: sections (outer list, dragged by a handle) each own a
 * nested list of items. Every list is connected to every other so the
 * hit-test has to pick the innermost list under the pointer, not the first
 * registered one (the outer list is registered first).
 */
@Component({
  imports: [MkDrag, MkDragHandle, MkDropList],
  template: `
    <div
      mkDropList
      class="root"
      mkDropListId="root"
      [mkDropListConnectedTo]="['inner-a', 'inner-b']"
      [mkDropListData]="sections"
      (mkDropListDropped)="dropped($event)"
    >
      @for (s of sections; track s.id) {
        <div class="section" [attr.data-id]="s.id" mkDrag [mkDragData]="s">
          <span class="grip" mkDragHandle>::</span>
          <div
            mkDropList
            class="inner"
            [mkDropListId]="'inner-' + s.id"
            [mkDropListConnectedTo]="['root', 'inner-a', 'inner-b']"
            [mkDropListData]="s.items"
            (mkDropListDropped)="dropped($event)"
          >
            @for (it of s.items; track it) {
              <div class="item" [attr.data-id]="it" mkDrag [mkDragData]="it"></div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
class NestedListsHost {
  sections = [
    { id: 'a', items: ['a0', 'a1'] },
    { id: 'b', items: ['b0'] },
  ];
  readonly dropped = vi.fn();
}

interface Drop {
  previousContainer: MkDropList;
  container: MkDropList;
  previousIndex: number;
  currentIndex: number;
}

describe('MkDrag nested drop lists', () => {
  const pev = (type: string, x: number, y: number) =>
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', clientX: x, clientY: y });
  const rect = (x: number, y: number, w: number, h: number): DOMRect =>
    ({ x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h, toJSON: () => ({}) }) as DOMRect;
  const mockRect = (el: HTMLElement, r: DOMRect) => vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(r);

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
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: true })) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as { matchMedia?: unknown }).matchMedia;
    TestBed.resetTestingModule();
  });

  function setup() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(NestedListsHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const q = (sel: string) => el.querySelector(sel) as HTMLElement;
    const root = q('.root');
    const secA = q('.section[data-id="a"]');
    const secB = q('.section[data-id="b"]');
    const innerA = secA.querySelector('.inner') as HTMLElement;
    const innerB = secB.querySelector('.inner') as HTMLElement;
    const a0 = q('.item[data-id="a0"]');
    const a1 = q('.item[data-id="a1"]');
    const b0 = q('.item[data-id="b0"]');
    // Layout: root 0–600 tall; section A 0–300 (inner A 40–280), section B 300–600 (inner B 340–580).
    mockRect(root, rect(0, 0, 300, 600));
    mockRect(secA, rect(0, 0, 300, 300));
    mockRect(secB, rect(0, 300, 300, 300));
    mockRect(innerA, rect(20, 40, 260, 240));
    mockRect(innerB, rect(20, 340, 260, 240));
    mockRect(a0, rect(20, 40, 260, 50));
    mockRect(a1, rect(20, 100, 260, 50));
    mockRect(b0, rect(20, 340, 260, 50));
    const dropped = fixture.componentInstance.dropped;
    /** Press on `pressTarget`, move (events land on `item`, the capturing element), release. */
    const drag = (item: HTMLElement, from: [number, number], to: [number, number], pressTarget: HTMLElement = item) => {
      pressTarget.dispatchEvent(pev('pointerdown', from[0], from[1]));
      item.dispatchEvent(pev('pointermove', from[0], from[1] + 8)); // cross the threshold
      flushRaf();
      item.dispatchEvent(pev('pointermove', to[0], to[1]));
      flushRaf();
      item.dispatchEvent(pev('pointerup', to[0], to[1]));
      fixture.detectChanges();
    };
    const last = () => dropped.mock.calls.at(-1)![0] as Drop;
    return { fixture, el, root, secA, secB, innerA, innerB, a0, a1, b0, dropped, drag, last };
  }

  it('reorders within a nested list', () => {
    const { a0, drag, last } = setup();
    drag(a0, [100, 60], [100, 140]); // below a1's midpoint (125)
    expect(last().previousContainer.id()).toBe('inner-a');
    expect(last().container.id()).toBe('inner-a');
    expect(last()).toMatchObject({ previousIndex: 0, currentIndex: 1 });
  });

  it('moves nested → nested: the innermost list under the pointer wins over the root list', () => {
    const { a0, drag, last } = setup();
    drag(a0, [100, 60], [100, 400]); // inside inner B (also inside root and section B)
    expect(last().previousContainer.id()).toBe('inner-a');
    expect(last().container.id()).toBe('inner-b');
    expect(last().currentIndex).toBe(1); // below b0's midpoint (365)
  });

  it('moves nested → root when the pointer is over the root list but outside any inner list', () => {
    const { a0, drag, last } = setup();
    drag(a0, [100, 60], [100, 590]); // root area below inner B (ends at 580)
    expect(last().container.id()).toBe('root');
    expect(last().currentIndex).toBe(2); // after both sections
  });

  it("moves root → nested: a section dropped into another section's list", () => {
    const { secB, drag, last } = setup();
    const grip = secB.querySelector('.grip') as HTMLElement;
    drag(secB, [10, 310], [100, 60], grip); // inside inner A
    expect(last().previousContainer.id()).toBe('root');
    expect(last().container.id()).toBe('inner-a');
    expect(last().currentIndex).toBe(0);
  });

  it('never targets a list nested inside the dragged item itself', () => {
    const { secA, drag, last } = setup();
    const grip = secA.querySelector('.grip') as HTMLElement;
    drag(secA, [10, 10], [100, 150], grip); // over section A's own inner list
    expect(last().container.id()).toBe('root');
  });

  it("a press or a key on a nested item never starts the outer item's drag", () => {
    const { fixture, a0, secA, drag, dropped } = setup();
    drag(a0, [100, 60], [100, 400]);
    // Only the inner drop fired; the section itself was never hidden/dragged.
    expect(dropped).toHaveBeenCalledTimes(1);
    expect(secA.style.display).not.toBe('none');
    // Keyboard: Space on the inner item lifts the inner item only.
    a0.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(a0.classList.contains('mk-drag--lifted')).toBe(true);
    expect(secA.classList.contains('mk-drag--lifted')).toBe(false);
    a0.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
});
