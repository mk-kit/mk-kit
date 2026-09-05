import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkDrag } from './drag';
import { MkDropList } from './drop-list';
import { MkDropZone } from './drop-zone';
import type { MkDropZoneEvent, MkDropZoneHover } from './drag-drop.types';

/**
 * A backlog list connected to a zone and a second list, with deterministic
 * mocked geometry:
 *
 *   list A  x 0–100,   y 0–300  (a0, a1 stacked in 100px rows)
 *   zone    x 200–400, y 0–100
 *   list B  x 500–600, y 0–300  (empty)
 *
 * Document order is A, zone, B — the keyboard travel group.
 */
@Component({
  imports: [MkDrag, MkDropList, MkDropZone],
  template: `
    <div
      class="list-a"
      mkDropList
      mkDropListId="a"
      [mkDropListConnectedTo]="['z', 'b']"
      [mkDropListData]="a"
      (mkDropListDropped)="dropped($event)"
    >
      @for (row of a; track row.id) {
        <div class="item" mkDrag [mkDragData]="row"></div>
      }
    </div>
    <div
      class="zone"
      mkDropZone
      mkDropZoneId="z"
      mkDropZoneLabel="Focus now"
      [mkDropZoneDisabled]="zoneDisabled"
      (mkDropZoneEntered)="entered($event)"
      (mkDropZoneMoved)="moved($event)"
      (mkDropZoneLeft)="left($event)"
      (mkDropZoneDropped)="zoneDropped($event)"
    ></div>
    <div class="list-b" mkDropList mkDropListId="b" [mkDropListConnectedTo]="['a']" [mkDropListData]="b"></div>
  `,
})
class ZoneHost {
  a = [{ id: 'a0' }, { id: 'a1' }];
  b: { id: string }[] = [];
  zoneDisabled = false;
  readonly dropped = vi.fn();
  readonly entered = vi.fn();
  readonly moved = vi.fn();
  readonly left = vi.fn();
  readonly zoneDropped = vi.fn();
}

describe('MkDropZone', () => {
  const pev = (type: string, x: number, y: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: x,
      clientY: y,
    });
  const key = (k: string) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });

  const rect = (x: number, y: number, w = 100, h = 100): DOMRect =>
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

  function setup(zoneDisabled = false) {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ZoneHost);
    fixture.componentInstance.zoneDisabled = zoneDisabled;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const listA = el.querySelector('.list-a') as HTMLElement;
    const listB = el.querySelector('.list-b') as HTMLElement;
    const zone = el.querySelector('.zone') as HTMLElement;
    const [a0, a1] = Array.from(listA.querySelectorAll('.item')) as HTMLElement[];
    mockRect(listA, rect(0, 0, 100, 300));
    mockRect(zone, rect(200, 0, 200, 100));
    mockRect(listB, rect(500, 0, 100, 300));
    mockRect(a0, rect(0, 0));
    mockRect(a1, rect(0, 100));
    const host = fixture.componentInstance;
    return { fixture, host, listA, listB, zone, a0 };
  }

  /** Lift a0 with the mouse: press, then cross the 5px threshold. */
  function lift(a0: HTMLElement) {
    a0.dispatchEvent(pev('pointerdown', 50, 50));
    a0.dispatchEvent(pev('pointermove', 50, 60));
    flushRaf();
  }

  it('exposes a named group', () => {
    const { zone } = setup();
    expect(zone.getAttribute('role')).toBe('group');
    expect(zone.getAttribute('aria-label')).toBe('Focus now');
  });

  it('pointer: hovering a zone hides the placeholder and streams positions; releasing drops on it', () => {
    const { fixture, host, listA, zone, a0 } = setup();
    lift(a0);
    expect(listA.querySelector('.mk-drop-placeholder')).toBeTruthy();

    a0.dispatchEvent(pev('pointermove', 300, 25));
    flushRaf();
    fixture.detectChanges();

    expect(zone.classList.contains('mk-drop-zone--receiving')).toBe(true);
    expect(listA.classList.contains('mk-drop-list--receiving')).toBe(false);
    expect(listA.querySelector('.mk-drop-placeholder')).toBeNull();
    expect(host.entered).toHaveBeenCalledTimes(1);
    const enter = host.entered.mock.calls[0][0] as MkDropZoneHover;
    expect(enter.zone.element).toBe(zone);
    expect(enter.offsetX).toBe(100);
    expect(enter.offsetY).toBe(25);
    expect(enter.fractionX).toBe(0.5);
    expect(enter.fractionY).toBe(0.25);
    expect(enter.isPointerEvent).toBe(true);

    a0.dispatchEvent(pev('pointermove', 320, 25));
    flushRaf();
    expect(host.moved).toHaveBeenCalledTimes(1);
    expect((host.moved.mock.calls[0][0] as MkDropZoneHover).fractionX).toBeCloseTo(0.6);

    a0.dispatchEvent(pev('pointerup', 320, 25));
    fixture.detectChanges();

    expect(host.zoneDropped).toHaveBeenCalledTimes(1);
    const drop = host.zoneDropped.mock.calls[0][0] as MkDropZoneEvent;
    expect(drop.previousContainer.element).toBe(listA);
    expect(drop.previousIndex).toBe(0);
    expect(drop.fractionX).toBeCloseTo(0.6);
    expect(drop.isPointerEvent).toBe(true);
    expect(host.dropped).not.toHaveBeenCalled();
    expect(host.left).not.toHaveBeenCalled();
    expect(zone.classList.contains('mk-drop-zone--receiving')).toBe(false);
    expect(listA.querySelector('.mk-drop-placeholder')).toBeNull();
    expect(a0.style.display).toBe('');
  });

  it('pointer: moving off a zone back into a list reports "left" and restores the placeholder', () => {
    const { fixture, host, listA, zone, a0 } = setup();
    lift(a0);
    a0.dispatchEvent(pev('pointermove', 300, 25));
    flushRaf();
    a0.dispatchEvent(pev('pointermove', 50, 150));
    flushRaf();
    fixture.detectChanges();

    expect(host.left).toHaveBeenCalledTimes(1);
    expect(zone.classList.contains('mk-drop-zone--receiving')).toBe(false);
    expect(listA.classList.contains('mk-drop-list--receiving')).toBe(true);
    expect(listA.querySelector('.mk-drop-placeholder')).toBeTruthy();

    a0.dispatchEvent(pev('pointerup', 50, 150));
    fixture.detectChanges();
    expect(host.dropped).toHaveBeenCalledTimes(1);
    expect(host.zoneDropped).not.toHaveBeenCalled();
  });

  it('pointer: a cancelled drag over a zone reports "left" and drops nowhere', () => {
    const { fixture, host, zone, a0 } = setup();
    lift(a0);
    a0.dispatchEvent(pev('pointermove', 300, 25));
    flushRaf();
    a0.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }));
    fixture.detectChanges();

    expect(host.left).toHaveBeenCalledTimes(1);
    expect(host.zoneDropped).not.toHaveBeenCalled();
    expect(host.dropped).not.toHaveBeenCalled();
    expect(zone.classList.contains('mk-drop-zone--receiving')).toBe(false);
  });

  it('pointer: a disabled zone is not a target', () => {
    const { fixture, host, listA, a0 } = setup(true);
    lift(a0);
    a0.dispatchEvent(pev('pointermove', 300, 25));
    flushRaf();
    expect(host.entered).not.toHaveBeenCalled();
    expect(listA.querySelector('.mk-drop-placeholder')).toBeTruthy();
    a0.dispatchEvent(pev('pointerup', 300, 25));
    fixture.detectChanges();
    // Nothing under the pointer: the item settles back into its own list.
    expect(host.dropped).toHaveBeenCalledTimes(1);
    expect(host.zoneDropped).not.toHaveBeenCalled();
  });

  it('keyboard: arrows walk lists and zones in document order; Enter drops at the zone centre', () => {
    const { fixture, host, listA, listB, zone, a0 } = setup();
    a0.focus();
    a0.dispatchEvent(key('Enter'));
    fixture.detectChanges();
    expect(a0.classList.contains('mk-drag--lifted')).toBe(true);
    expect(listA.querySelector('.mk-drop-placeholder')).toBeTruthy();

    a0.dispatchEvent(key('ArrowRight'));
    fixture.detectChanges();
    expect(zone.classList.contains('mk-drop-zone--receiving')).toBe(true);
    expect(listA.querySelector('.mk-drop-placeholder')).toBeNull();
    expect(host.entered).toHaveBeenCalledTimes(1);
    const enter = host.entered.mock.calls[0][0] as MkDropZoneHover;
    expect(enter.isPointerEvent).toBe(false);
    expect(enter.fractionX).toBe(0.5);
    expect(enter.fractionY).toBe(0.5);

    // Past the zone lies list B; back again returns to the zone.
    a0.dispatchEvent(key('ArrowRight'));
    fixture.detectChanges();
    expect(host.left).toHaveBeenCalledTimes(1);
    expect(listB.classList.contains('mk-drop-list--receiving')).toBe(true);
    expect(listB.querySelector('.mk-drop-placeholder')).toBeTruthy();
    a0.dispatchEvent(key('ArrowLeft'));
    fixture.detectChanges();
    expect(zone.classList.contains('mk-drop-zone--receiving')).toBe(true);
    expect(listB.querySelector('.mk-drop-placeholder')).toBeNull();

    a0.dispatchEvent(key('Enter'));
    fixture.detectChanges();
    expect(host.zoneDropped).toHaveBeenCalledTimes(1);
    const drop = host.zoneDropped.mock.calls[0][0] as MkDropZoneEvent;
    expect(drop.isPointerEvent).toBe(false);
    expect(drop.previousContainer.element).toBe(listA);
    expect(drop.previousIndex).toBe(0);
    expect(drop.x).toBe(300);
    expect(drop.y).toBe(50);
    expect(a0.classList.contains('mk-drag--lifted')).toBe(false);
    expect(zone.classList.contains('mk-drop-zone--receiving')).toBe(false);
    expect(host.dropped).not.toHaveBeenCalled();
  });

  it('keyboard: Escape on a zone cancels and reports "left"', () => {
    const { fixture, host, listA, zone, a0 } = setup();
    a0.focus();
    a0.dispatchEvent(key('Enter'));
    a0.dispatchEvent(key('ArrowRight'));
    a0.dispatchEvent(key('Escape'));
    fixture.detectChanges();
    expect(host.left).toHaveBeenCalledTimes(1);
    expect(host.zoneDropped).not.toHaveBeenCalled();
    expect(zone.classList.contains('mk-drop-zone--receiving')).toBe(false);
    expect(listA.querySelector('.mk-drop-placeholder')).toBeNull();
    expect(a0.classList.contains('mk-drag--lifted')).toBe(false);
  });

  it('keyboard: a disabled zone is skipped', () => {
    const { fixture, host, listB, a0 } = setup(true);
    a0.focus();
    a0.dispatchEvent(key('Enter'));
    a0.dispatchEvent(key('ArrowRight'));
    fixture.detectChanges();
    expect(host.entered).not.toHaveBeenCalled();
    expect(listB.classList.contains('mk-drop-list--receiving')).toBe(true);
    a0.dispatchEvent(key('Escape'));
  });
});
