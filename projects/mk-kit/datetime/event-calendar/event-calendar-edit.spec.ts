import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkLiveAnnouncer } from '@mk-kit/ui/core';
import {
  MkEventCalendar,
  type MkCalendarEvent,
  type MkCalendarEventEdit,
} from './event-calendar';

/**
 * Editable time grid: drag-to-move / drag-to-resize plus the keyboard path.
 *
 * Geometry is mocked so the math is exact: each column is 100px wide and
 * 840px tall for the default 8–22 grid (14 h = 840 min) → 1 px per minute,
 * with week columns at left = index * 100.
 */
describe('MkEventCalendar editable time grid', () => {
  const rect = (left: number, top: number, width: number, height: number): DOMRect =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  const pev = (type: string, x: number, y: number, opts: PointerEventInit = {}) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: x,
      clientY: y,
      ...opts,
    });

  const kev = (key: string, opts: KeyboardEventInit = {}) =>
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });

  const click = () => new MouseEvent('click', { bubbles: true, cancelable: true });

  /** Thu Jul 23 2026, 18:00–19:30 — Thursday is column 4 of a Sunday-first week. */
  const baseEvents = (): MkCalendarEvent[] => [
    {
      date: new Date(2026, 6, 23),
      title: 'Rezerwacja',
      start: new Date(2026, 6, 23, 18, 0),
      end: new Date(2026, 6, 23, 19, 30),
    },
  ];

  function setup(
    view: 'week' | 'day',
    opts: { editable?: boolean; events?: MkCalendarEvent[] } = {},
  ) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture: ComponentFixture<MkEventCalendar> =
      TestBed.createComponent(MkEventCalendar);
    const cmp = fixture.componentInstance;
    const events = opts.events ?? baseEvents();
    fixture.componentRef.setInput('view', view);
    fixture.componentRef.setInput('viewDate', new Date(2026, 6, 23));
    fixture.componentRef.setInput('editable', opts.editable ?? true);
    fixture.componentRef.setInput('events', events);
    fixture.detectChanges();

    // 1 px per minute; week columns side by side, 100px apart.
    const cols = fixture.nativeElement.querySelectorAll('.mk-event-calendar__col');
    cols.forEach((col: Element, i: number) => {
      vi.spyOn(col, 'getBoundingClientRect').mockReturnValue(
        rect(i * 100, 0, 100, 840),
      );
    });

    // Run the coalesced move pass synchronously (the drag rAF-coalesces
    // pointermoves; the trailing frame is flushed on pointerup regardless).
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      },
    );

    const block = fixture.nativeElement.querySelector(
      '.mk-event-calendar__block',
    ) as HTMLButtonElement;
    return { fixture, cmp, events, block };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('drag-to-move emits snapped times and never mutates the input events', () => {
    const { fixture, cmp, events, block } = setup('week');
    const moved: MkCalendarEventEdit[] = [];
    cmp.eventMove.subscribe((e) => moved.push(e));

    // Grab in Thu's column (left 400) and pull up 37px → snaps to −30 min.
    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointermove', 450, 663));
    fixture.detectChanges();

    // Mid-drag: compositor-friendly lift + live time range + target outline.
    expect(block.style.transform).toBe('translate(0px, -30px)');
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(true);
    expect(block.textContent).toContain('17:30 – 19:00');
    expect(
      fixture.nativeElement.querySelector('.mk-event-calendar__drop-outline'),
    ).toBeTruthy();

    block.dispatchEvent(pev('pointerup', 450, 663));
    fixture.detectChanges();

    expect(moved).toHaveLength(1);
    expect(moved[0].event).toBe(events[0]);
    expect(moved[0].start.getDate()).toBe(23);
    expect(moved[0].start.getHours()).toBe(17);
    expect(moved[0].start.getMinutes()).toBe(30);
    expect(moved[0].end.getHours()).toBe(19);
    expect(moved[0].end.getMinutes()).toBe(0);

    // Consumer owns the data: the source event and array are untouched.
    expect(cmp.events()).toBe(events);
    expect(events[0].start!.getHours()).toBe(18);
    expect(events[0].start!.getMinutes()).toBe(0);

    // Drag state fully cleared.
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(false);
    expect(
      fixture.nativeElement.querySelector('.mk-event-calendar__drop-outline'),
    ).toBeFalsy();
  });

  it('week view: dragging across columns moves the event to that day', () => {
    const { fixture, cmp, block } = setup('week');
    const moved: MkCalendarEventEdit[] = [];
    cmp.eventMove.subscribe((e) => moved.push(e));

    // Thu (col 4, x≈450) → Mon (col 1, x≈150); no meaningful vertical delta.
    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointermove', 150, 700));
    block.dispatchEvent(pev('pointerup', 150, 700));
    fixture.detectChanges();

    expect(moved).toHaveLength(1);
    expect(moved[0].start.getDate()).toBe(20); // Mon Jul 20
    expect(moved[0].start.getHours()).toBe(18);
    expect(moved[0].end.getHours()).toBe(19);
    expect(moved[0].end.getMinutes()).toBe(30);
  });

  it('drag-to-resize emits a snapped end and respects the minimum duration', () => {
    const { fixture, cmp, block } = setup('day');
    const resized: MkCalendarEventEdit[] = [];
    cmp.eventResize.subscribe((e) => resized.push(e));
    const handle = block.querySelector(
      '.mk-event-calendar__resize-handle',
    ) as HTMLElement;

    // Pull the bottom edge down 33px → +30 min → ends 20:00.
    handle.dispatchEvent(pev('pointerdown', 50, 790));
    block.dispatchEvent(pev('pointermove', 50, 823));
    block.dispatchEvent(pev('pointerup', 50, 823));
    fixture.detectChanges();

    expect(resized).toHaveLength(1);
    expect(resized[0].start.getHours()).toBe(18); // start untouched
    expect(resized[0].end.getHours()).toBe(20);
    expect(resized[0].end.getMinutes()).toBe(0);

    // Pull far past the start → the end clamps to start + snapMinutes.
    handle.dispatchEvent(pev('pointerdown', 50, 790));
    block.dispatchEvent(pev('pointermove', 50, 100));
    block.dispatchEvent(pev('pointerup', 50, 100));
    fixture.detectChanges();

    expect(resized).toHaveLength(2);
    expect(resized[1].end.getHours()).toBe(18);
    expect(resized[1].end.getMinutes()).toBe(15);
  });

  it('Escape aborts a pointer drag: pill snaps back, nothing is emitted', () => {
    const { fixture, cmp, block } = setup('week');
    const moved: MkCalendarEventEdit[] = [];
    const resized: MkCalendarEventEdit[] = [];
    cmp.eventMove.subscribe((e) => moved.push(e));
    cmp.eventResize.subscribe((e) => resized.push(e));

    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointermove', 450, 640));
    fixture.detectChanges();
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(true);

    document.dispatchEvent(kev('Escape'));
    fixture.detectChanges();
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(false);
    expect(block.style.transform).toBe('');

    block.dispatchEvent(pev('pointerup', 450, 640));
    fixture.detectChanges();
    expect(moved).toHaveLength(0);
    expect(resized).toHaveLength(0);
  });

  it('pointercancel aborts without emitting', () => {
    const { fixture, cmp, block } = setup('week');
    const moved: MkCalendarEventEdit[] = [];
    cmp.eventMove.subscribe((e) => moved.push(e));

    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointermove', 450, 640));
    block.dispatchEvent(pev('pointercancel', 450, 640));
    fixture.detectChanges();

    expect(moved).toHaveLength(0);
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(false);
  });

  it('eventClick still fires on a plain click when editable, but not after a drag', () => {
    const { fixture, cmp, block } = setup('week');
    const clicks: MkCalendarEvent[] = [];
    cmp.eventClick.subscribe((e) => clicks.push(e));

    // Plain click (press + release, no movement) → still an activation.
    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointerup', 450, 700));
    block.dispatchEvent(click());
    expect(clicks).toHaveLength(1);

    // A real drag → the browser's trailing synthetic click is swallowed.
    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointermove', 450, 640));
    block.dispatchEvent(pev('pointerup', 450, 640));
    block.dispatchEvent(click());
    expect(clicks).toHaveLength(1);

    // Aborted drag: its synthetic click is swallowed too…
    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointermove', 450, 640));
    document.dispatchEvent(kev('Escape'));
    block.dispatchEvent(pev('pointerup', 450, 640));
    block.dispatchEvent(click());
    expect(clicks).toHaveLength(1);

    // …while the NEXT plain click works again.
    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointerup', 450, 700));
    block.dispatchEvent(click());
    expect(clicks).toHaveLength(2);
    fixture.detectChanges();
  });

  it('keyboard: Enter arms move mode, arrows move by snap/day, Enter commits', () => {
    const { fixture, cmp, block } = setup('week');
    const announcer = TestBed.inject(MkLiveAnnouncer);
    const announce = vi.spyOn(announcer, 'announce');
    const moved: MkCalendarEventEdit[] = [];
    cmp.eventMove.subscribe((e) => moved.push(e));

    block.dispatchEvent(kev('Enter'));
    fixture.detectChanges();
    expect(announce).toHaveBeenCalledWith(
      expect.stringContaining('Rezerwacja grabbed'),
      'assertive',
    );
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(true);

    block.dispatchEvent(kev('ArrowUp'));
    block.dispatchEvent(kev('ArrowUp'));
    block.dispatchEvent(kev('ArrowRight'));
    fixture.detectChanges();
    // Steps announce the would-be position in plain English.
    expect(announce).toHaveBeenLastCalledWith(
      expect.stringContaining('July 24, 2026, 17:30 – 19:00'),
      'assertive',
    );
    expect(block.textContent).toContain('17:30 – 19:00');

    block.dispatchEvent(kev('Enter'));
    fixture.detectChanges();
    expect(moved).toHaveLength(1);
    expect(moved[0].start.getDate()).toBe(24); // Fri Jul 24
    expect(moved[0].start.getHours()).toBe(17);
    expect(moved[0].start.getMinutes()).toBe(30);
    expect(moved[0].end.getHours()).toBe(19);
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(false);
  });

  it('keyboard: Shift+Arrow resizes the end (min duration enforced) and commits as eventResize', () => {
    const { fixture, cmp, block } = setup('day');
    const moved: MkCalendarEventEdit[] = [];
    const resized: MkCalendarEventEdit[] = [];
    cmp.eventMove.subscribe((e) => moved.push(e));
    cmp.eventResize.subscribe((e) => resized.push(e));

    block.dispatchEvent(kev('Enter'));
    block.dispatchEvent(kev('ArrowDown', { shiftKey: true }));
    block.dispatchEvent(kev('Enter'));
    fixture.detectChanges();

    expect(moved).toHaveLength(0);
    expect(resized).toHaveLength(1);
    expect(resized[0].start.getHours()).toBe(18);
    expect(resized[0].end.getHours()).toBe(19);
    expect(resized[0].end.getMinutes()).toBe(45);

    // Shrinking never crosses start + snapMinutes (90 min → 15 min floor).
    block.dispatchEvent(kev('Enter'));
    for (let i = 0; i < 20; i++) {
      block.dispatchEvent(kev('ArrowUp', { shiftKey: true }));
    }
    block.dispatchEvent(kev('Enter'));
    fixture.detectChanges();

    expect(resized).toHaveLength(2);
    expect(resized[1].end.getHours()).toBe(18);
    expect(resized[1].end.getMinutes()).toBe(15);
  });

  it('keyboard: Escape cancels without emitting and announces it', () => {
    const { fixture, cmp, block } = setup('week');
    const announcer = TestBed.inject(MkLiveAnnouncer);
    const announce = vi.spyOn(announcer, 'announce');
    const moved: MkCalendarEventEdit[] = [];
    cmp.eventMove.subscribe((e) => moved.push(e));

    block.dispatchEvent(kev('Enter'));
    block.dispatchEvent(kev('ArrowDown'));
    block.dispatchEvent(kev('Escape'));
    fixture.detectChanges();

    expect(moved).toHaveLength(0);
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(false);
    expect(announce).toHaveBeenLastCalledWith(
      expect.stringContaining('cancelled'),
      'assertive',
    );

    // Committing without any step emits nothing either.
    block.dispatchEvent(kev('Enter'));
    block.dispatchEvent(kev('Enter'));
    fixture.detectChanges();
    expect(moved).toHaveLength(0);
  });

  it('editable pills expose an aria-label with times, composed with the tooltip', () => {
    const { block } = setup('week');
    expect(block.getAttribute('aria-label')).toBe('Rezerwacja, 18:00 – 19:30');
    expect(block.getAttribute('aria-roledescription')).toBe('Movable event');
    // Compose, don't clobber: the visible title/tooltip stay intact.
    expect(block.textContent).toContain('Rezerwacja');
    expect(block.getAttribute('title')).toBe('18:00 Rezerwacja');
  });

  it('touch: long-press arms the drag; an early swipe reads as a scroll', () => {
    vi.useFakeTimers();
    try {
      const { fixture, cmp, block } = setup('week');
      const moved: MkCalendarEventEdit[] = [];
      cmp.eventMove.subscribe((e) => moved.push(e));

      // Swipe before the long press → abandoned, the browser keeps the scroll.
      block.dispatchEvent(pev('pointerdown', 450, 700, { pointerType: 'touch' }));
      block.dispatchEvent(pev('pointermove', 450, 724, { pointerType: 'touch' }));
      vi.advanceTimersByTime(400);
      block.dispatchEvent(pev('pointermove', 450, 760, { pointerType: 'touch' }));
      block.dispatchEvent(pev('pointerup', 450, 760, { pointerType: 'touch' }));
      expect(moved).toHaveLength(0);

      // Held still through the delay → armed (touch-action locked), drag works.
      block.dispatchEvent(pev('pointerdown', 450, 700, { pointerType: 'touch' }));
      vi.advanceTimersByTime(300);
      expect(block.style.touchAction).toBe('none');
      block.dispatchEvent(pev('pointermove', 450, 670, { pointerType: 'touch' }));
      block.dispatchEvent(pev('pointerup', 450, 670, { pointerType: 'touch' }));
      fixture.detectChanges();

      expect(moved).toHaveLength(1);
      expect(moved[0].start.getHours()).toBe(17);
      expect(moved[0].start.getMinutes()).toBe(30);
      expect(block.style.touchAction).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('non-editable grid is unchanged: no handles, no ARIA additions, no drag behavior', () => {
    const { fixture, cmp, block } = setup('week', { editable: false });
    const announcer = TestBed.inject(MkLiveAnnouncer);
    const announce = vi.spyOn(announcer, 'announce');
    const moved: MkCalendarEventEdit[] = [];
    const clicks: MkCalendarEvent[] = [];
    cmp.eventMove.subscribe((e) => moved.push(e));
    cmp.eventClick.subscribe((e) => clicks.push(e));

    expect(
      fixture.nativeElement.querySelector('.mk-event-calendar__resize-handle'),
    ).toBeFalsy();
    expect(block.getAttribute('aria-label')).toBeNull();
    expect(block.getAttribute('aria-roledescription')).toBeNull();
    expect(block.classList.contains('mk-event-calendar__block--editable')).toBe(false);

    // Pointer gestures start nothing.
    block.dispatchEvent(pev('pointerdown', 450, 700));
    block.dispatchEvent(pev('pointermove', 450, 600));
    block.dispatchEvent(pev('pointerup', 450, 600));
    fixture.detectChanges();
    expect(moved).toHaveLength(0);
    expect(block.classList.contains('mk-event-calendar__block--dragging')).toBe(false);

    // Enter does not arm anything, and plain clicks keep working.
    block.dispatchEvent(kev('Enter'));
    fixture.detectChanges();
    expect(announce).not.toHaveBeenCalled();
    block.dispatchEvent(click());
    expect(clicks).toHaveLength(1);
  });
});
