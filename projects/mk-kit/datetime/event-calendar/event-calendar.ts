import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MK_I18N, MkLiveAnnouncer } from '@mk-kit/ui/core';
import {
  addDays,
  addMonths,
  buildMonthMatrix,
  formatDate,
  getWeekdayFullName,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from '../datetime/date-utils';
import { MkTimedPlacement, layoutTimedEvents } from './event-calendar-layout';

/** The calendar's presentation: month grid, or a timed week/day grid. */
export type MkCalendarView = 'month' | 'week' | 'day';

/** A single event plotted onto the {@link MkEventCalendar}. */
export interface MkCalendarEvent {
  /**
   * The day the event falls on. Month view places by this alone; in week/day
   * view an event with no `start` renders in the all-day strip.
   */
  date: Date;
  /** Start instant — positions the event on the week/day time grid. */
  start?: Date;
  /** End instant; defaults to 30 minutes after `start`. */
  end?: Date;
  /** Short label shown inside the event pill. */
  title: string;
  /** Optional pill background colour; falls back to `--mk-primary`. */
  color?: string;
  /** Optional caller-supplied identifier, echoed back on `eventClick`. */
  id?: unknown;
}

/**
 * Payload of `eventMove` / `eventResize`: the untouched source event plus the
 * would-be new time range. The calendar itself never mutates `events` — the
 * consumer owns the data and applies (or rejects) the change.
 */
export interface MkCalendarEventEdit {
  /** The event that was dragged — the exact object from the `events` input. */
  event: MkCalendarEvent;
  /** New start instant (snapped to `snapMinutes`). */
  start: Date;
  /** New end instant (snapped; never closer than `snapMinutes` to `start`). */
  end: Date;
}

/** Weekday column header (short label + full name for the `abbr[title]`). */
interface MkWeekdayHeader {
  short: string;
  full: string;
}

/** Pixels the pointer must travel before a press turns into an edit drag. */
const DRAG_THRESHOLD = 5;
/**
 * Pixels a *touch* pointer may wander during the long-press delay before the
 * press is treated as a scroll and the pending drag is abandoned.
 */
const TOUCH_SLOP = 10;
/** Long-press delay (ms) before a touch pointer arms an edit drag. */
const TOUCH_DELAY_MS = 300;
/** Safety window (ms) for swallowing the synthetic click after a real drag. */
const CLICK_SWALLOW_MS = 400;

/** Minutes since local midnight. */
function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** `minutes` since midnight as a zero-padded `HH:mm` label. */
function minutesLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function clampNumber(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), Math.max(lo, hi));
}

/**
 * `[startMin, endMin]` of a timed event, mirroring the layout's defaults: a
 * missing end reads as 30 minutes, an end on the same day never less than 15.
 */
function eventMinutes(event: MkCalendarEvent): [number, number] {
  const start = event.start ? minutesOfDay(event.start) : 0;
  const end =
    event.end && event.start && isSameDay(event.end, event.start)
      ? Math.max(minutesOfDay(event.end), start + 15)
      : start + 30;
  return [start, end];
}

/**
 * One in-flight edit gesture (pointer drag or keyboard move mode). Geometry is
 * snapshotted once when the edit lifts — every subsequent move works off the
 * cached rects, so a drag never forces layout.
 */
interface EditSession {
  kind: 'move' | 'resize';
  event: MkCalendarEvent;
  /** The pill element the gesture started on. */
  el: HTMLElement;
  /** Pointer id (`null` for the keyboard session). */
  pointerId: number | null;
  /** True once the pointer crossed {@link DRAG_THRESHOLD} (a real drag). */
  started: boolean;
  /** Gate for moves: mouse/pen arm on pointerdown, touch after the long press. */
  armed: boolean;
  startX: number;
  startY: number;
  touchTimer: number | null;
  savedTouchAction: string | null;
  /** Per-column bounds snapshotted at lift. */
  colRects: DOMRect[];
  pxPerMin: number;
  origDay: number;
  origStartMin: number;
  origEndMin: number;
  /** Current (snapped) target — mutated by moves / arrow steps. */
  day: number;
  startMin: number;
  endMin: number;
}

/** Template-facing state of the in-flight edit, driving the pill + outline. */
interface EditPreviewState {
  event: MkCalendarEvent;
  /** Target column index — the drop outline renders in this column. */
  day: number;
  /** Compositor-friendly lift transform for the dragged pill. */
  transform: string;
  /** Height override (%) while the duration differs, else `null`. */
  heightPct: number | null;
  /** Would-be range shown on the pill, e.g. `09:30 – 10:45`. */
  label: string;
  /** Drop-outline top, percent of the visible hour range. */
  top: number;
  /** Drop-outline height, percent of the visible hour range. */
  outlineHeight: number;
}

/** A rendered day cell: its date, classification, and the events on it. */
interface MkDayCell {
  date: Date;
  outside: boolean;
  today: boolean;
  /** Up to `maxPerDay` events shown as pills. */
  visible: readonly MkCalendarEvent[];
  /** Count beyond `maxPerDay` (0 when nothing is hidden). */
  overflow: number;
  /**
   * Precomputed screen-reader label (see {@link MkEventCalendar#dayLabel}) —
   * formatting it once here keeps `formatDate` out of the per-CD template path
   * for all 42 cells.
   */
  label: string;
}

/**
 * Event calendar — a month-grid scheduler view. Renders a 6×7 grid of day
 * cells built from {@link buildMonthMatrix}; each cell lists the events whose
 * `date` falls on that day as coloured pills, capped at `maxPerDay` with a
 * "+N more" line for the remainder.
 *
 * Shares the month-grid rendering, header navigation, and weekday header of
 * `mk-calendar` but is display-only (no date selection). Exposes the viewed
 * month as a two-way `viewDate` model plus `dayClick` / `eventClick` outputs.
 *
 * With `editable`, the week/day time grids additionally support drag-to-move
 * and drag-to-resize (pointer *and* keyboard — WCAG 2.5.7): times snap to
 * `snapMinutes` and the would-be range is emitted via `eventMove` /
 * `eventResize` — the calendar never mutates `events` itself.
 *
 * ```html
 * <mk-event-calendar [events]="events" [(viewDate)]="month"
 *   (eventClick)="open($event)" />
 * ```
 */
@Component({
  selector: 'mk-event-calendar',
  templateUrl: './event-calendar.html',
  styleUrl: './event-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-event-calendar',
  },
})
export class MkEventCalendar implements OnDestroy {
  protected readonly i18n = inject(MK_I18N);
  private readonly doc = inject(DOCUMENT);
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly announcer = inject(MkLiveAnnouncer);

  /** Events to plot onto the grid. */
  readonly events = input<readonly MkCalendarEvent[]>([]);
  /** Two-way month being viewed (any day within it). Defaults to today. */
  readonly viewDate = model<Date>(new Date());
  /** First column of the week: 0 = Sunday … 6 = Saturday. */
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  /** Max event pills per day before collapsing the rest into "+N more". */
  readonly maxPerDay = input(3, { transform: numberAttribute });
  /** Presentation: the classic month grid, or a timed `week`/`day` grid. */
  readonly view = model<MkCalendarView>('month');
  /** First hour shown on the week/day time grid. */
  readonly dayStartHour = input(8, { transform: numberAttribute });
  /** Hour the time grid ends at (exclusive). */
  readonly dayEndHour = input(22, { transform: numberAttribute });
  /**
   * Week/day views: allow rescheduling events by dragging a pill (move) or its
   * bottom edge (resize end time), by pointer or keyboard. Off by default —
   * without it the grid renders exactly as before (no handles, no ARIA
   * additions, no drag behavior).
   */
  readonly editable = input(false, { transform: booleanAttribute });
  /** Snap grid (minutes) for drag/keyboard edits; also the minimum duration. */
  readonly snapMinutes = input(15, { transform: numberAttribute });

  /** Emitted when a day cell is activated (click / Enter). */
  readonly dayClick = output<Date>();
  /**
   * Emitted when an event pill is clicked (does not also fire `dayClick`).
   * Mouse-only convenience: the pills are presentational (`aria-hidden`), so
   * keyboard / screen-reader users reach events via the day button — its label
   * announces the day's events and activating it fires `dayClick`.
   */
  readonly eventClick = output<MkCalendarEvent>();
  /** Emitted when the viewed range changes via the prev/next buttons. */
  readonly monthChange = output<Date>();
  /** Week/day view: an empty hour slot was clicked — the slot's start instant. */
  readonly slotClick = output<Date>();
  /**
   * Editable week/day grid: an event pill was dragged (or keyboard-moved) to a
   * new start time and/or day. Carries the would-be `start`/`end` — the
   * calendar does **not** mutate `events`; the consumer owns the data and
   * applies the change, typically:
   *
   * ```ts
   * onMove = ({ event, start, end }: MkCalendarEventEdit) =>
   *   (this.events = this.events.map((e) =>
   *     e === event ? { ...e, date: start, start, end } : e,
   *   ));
   * ```
   */
  readonly eventMove = output<MkCalendarEventEdit>();
  /**
   * Editable week/day grid: the pill's bottom edge was dragged (or
   * Shift+Arrow-resized) — only `end` differs, never below `snapMinutes` of
   * duration. Same consumer-owns-the-data contract as `eventMove`.
   */
  readonly eventResize = output<MkCalendarEventEdit>();

  /** id of the visible month/year label — wired as the grid's label. */
  readonly labelId = mkUniqueId('mk-event-calendar-label');

  /** First day of the visible month. */
  protected readonly viewMonth = computed(() => startOfMonth(this.viewDate()));
  /** Header label — month, day, or week range, matching the active view. */
  protected readonly monthLabel = computed(() => {
    const d = this.viewDate();
    const names = this.i18n.dateNames;
    switch (this.view()) {
      case 'day':
        return formatDate(d, 'MMMM d, yyyy', names);
      case 'week': {
        const from = startOfWeek(d, this.firstDayOfWeek());
        const to = addDays(from, 6);
        return `${formatDate(from, 'MMM d', names)} – ${formatDate(to, 'MMM d, yyyy', names)}`;
      }
      default:
        return formatDate(d, 'MMMM yyyy', names);
    }
  });

  /** Days of the active time grid: one for `day`, seven for `week`. */
  protected readonly gridDays = computed<Date[]>(() => {
    const d = startOfDay(this.viewDate());
    if (this.view() === 'day') return [d];
    const from = startOfWeek(d, this.firstDayOfWeek());
    return Array.from({ length: 7 }, (_, i) => addDays(from, i));
  });

  /** Hour rows of the time grid. */
  protected readonly hours = computed<number[]>(() => {
    const from = this.dayStartHour();
    const to = this.dayEndHour();
    return Array.from({ length: Math.max(to - from, 0) }, (_, i) => from + i);
  });

  /**
   * Timed events bucketed by their start's calendar day — a single pass over
   * the events, shared by every column of the week/day grid instead of
   * re-filtering (and re-sorting) the whole array once per day.
   */
  private readonly timedByDay = computed(() => {
    const map = new Map<number, MkCalendarEvent[]>();
    for (const event of this.events()) {
      if (!event.start) continue;
      const key = startOfDay(event.start).getTime();
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    }
    return map;
  });

  /** Untimed events (all-day strip) bucketed by `date`'s calendar day. */
  private readonly allDayByDay = computed(() => {
    const map = new Map<number, MkCalendarEvent[]>();
    for (const event of this.events()) {
      if (event.start) continue;
      const key = startOfDay(event.date).getTime();
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    }
    return map;
  });

  /**
   * Per-day positioned events + all-day strip for the time grid. The column
   * head (`Mon 21`) is precomputed here so the template never calls
   * `formatDate` during change detection.
   */
  protected readonly timedColumns = computed(() => {
    const timedByDay = this.timedByDay();
    const allDayByDay = this.allDayByDay();
    const startHour = this.dayStartHour();
    const endHour = this.dayEndHour();
    const names = this.i18n.dateNames;
    const today = new Date();
    // gridDays() are `startOfDay` instants, so `getTime()` matches the keys.
    return this.gridDays().map((day) => ({
      day,
      today: isSameDay(day, today),
      head: formatDate(day, 'ddd d', names),
      placements: layoutTimedEvents(
        timedByDay.get(day.getTime()) ?? [],
        day,
        startHour,
        endHour,
      ),
      allDay: allDayByDay.get(day.getTime()) ?? [],
    }));
  });

  protected hourLabel(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  protected placementTitle(p: MkTimedPlacement): string {
    const from = p.event.start ? minutesLabel(minutesOfDay(p.event.start)) : '';
    return from ? `${from} ${p.event.title}` : p.event.title;
  }

  protected onSlotClick(day: Date, hour: number): void {
    const at = new Date(day);
    at.setHours(hour, 0, 0, 0);
    this.slotClick.emit(at);
  }

  // ===================================================================
  // Editable time grid — drag-to-move / drag-to-resize (pointer)
  // ===================================================================

  /** Template-facing state of the in-flight edit (`null` when idle). */
  protected readonly editPreview = signal<EditPreviewState | null>(null);

  /** The active pointer gesture, if any (only one at a time). */
  private pointerSession: EditSession | null = null;
  /** The active keyboard "move mode" session, if any. */
  private kbSession: EditSession | null = null;

  /** Pending rAF id for the coalesced pointer-move pass. */
  private editRaf: number | null = null;
  private pendingX = 0;
  private pendingY = 0;
  /** Set after a real drag so the trailing synthetic click never fires `eventClick`. */
  private swallowNextClick = false;

  private readonly pointerMoveHandler = (e: PointerEvent) => this.onEditPointerMove(e);
  private readonly pointerUpHandler = (e: PointerEvent) => this.onEditPointerUp(e);
  private readonly pointerCancelHandler = () => this.abortPointerEdit();
  /** Escape aborts an in-flight pointer drag (document-level while dragging). */
  private readonly escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.pointerSession?.started) {
      e.stopPropagation();
      this.abortPointerEdit();
    }
  };
  /**
   * `touch-action: pan-y` keeps native scrolling alive while the long-press is
   * pending, so once armed the drag must eat `touchmove` itself
   * (`passive: false` — same pattern as `MkDrag`).
   */
  private readonly touchMoveEater = (e: TouchEvent) => {
    if (this.pointerSession?.armed && e.cancelable) e.preventDefault();
  };
  /** Android fires `contextmenu` on long-press — keep it off the gesture. */
  private readonly contextMenuHandler = (e: Event) => e.preventDefault();

  protected onBlockPointerDown(event: Event, p: MkTimedPlacement, colIndex: number): void {
    const e = event as PointerEvent;
    if (!this.editable() || this.pointerSession || this.kbSession) return;
    if (e.button !== undefined && e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    const kind = (e.target as HTMLElement | null)?.closest?.(
      '.mk-event-calendar__resize-handle',
    )
      ? 'resize'
      : 'move';
    const [startMin, endMin] = eventMinutes(p.event);
    this.pointerSession = {
      kind,
      event: p.event,
      el,
      pointerId: e.pointerId,
      started: false,
      armed: false,
      startX: e.clientX,
      startY: e.clientY,
      touchTimer: null,
      savedTouchAction: null,
      colRects: [],
      pxPerMin: 1,
      origDay: colIndex,
      origStartMin: startMin,
      origEndMin: endMin,
      day: colIndex,
      startMin,
      endMin,
    };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already lifted (fast tap) — nothing left to capture.
    }
    el.addEventListener('pointermove', this.pointerMoveHandler);
    el.addEventListener('pointerup', this.pointerUpHandler);
    el.addEventListener('pointercancel', this.pointerCancelHandler);
    if (e.pointerType === 'touch') {
      // Touch long-press arming, as in MkDrag: until the timer fires this
      // press may just be the start of a scroll, so nothing is prevented yet.
      el.addEventListener('touchmove', this.touchMoveEater, { passive: false });
      el.addEventListener('contextmenu', this.contextMenuHandler);
      this.pointerSession.touchTimer =
        this.doc.defaultView?.setTimeout(() => this.armTouch(), TOUCH_DELAY_MS) ??
        null;
    } else {
      // Mouse / pen: armed immediately, the 5px threshold does the rest.
      this.pointerSession.armed = true;
    }
  }

  /** The long-press delay elapsed with the finger still down — arm the drag. */
  private armTouch(): void {
    const s = this.pointerSession;
    if (!s) return;
    s.touchTimer = null;
    s.armed = true;
    s.savedTouchAction = s.el.style.touchAction;
    s.el.style.touchAction = 'none';
  }

  private onEditPointerMove(e: PointerEvent): void {
    const s = this.pointerSession;
    if (!s || e.pointerId !== s.pointerId) return;
    if (!s.armed) {
      // Long-press still pending: real movement means the user is scrolling.
      if (Math.hypot(e.clientX - s.startX, e.clientY - s.startY) > TOUCH_SLOP) {
        this.teardownPointer(false);
      }
      return;
    }
    if (!s.started) {
      if (Math.hypot(e.clientX - s.startX, e.clientY - s.startY) < DRAG_THRESHOLD) {
        return;
      }
      this.beginEdit(s);
    }
    e.preventDefault();
    // Only record the coordinates — the math + signal write is rAF-coalesced
    // (one pass per frame, same pattern as the table's column resize).
    this.pendingX = e.clientX;
    this.pendingY = e.clientY;
    if (this.editRaf !== null) return;
    const raf = this.doc.defaultView?.requestAnimationFrame(() => {
      this.editRaf = null;
      this.applyPendingEdit();
    });
    if (raf === undefined) this.applyPendingEdit(); // no window — degrade to sync
    else this.editRaf = raf;
  }

  /**
   * The drag crossed the threshold — snapshot geometry once (column rects and
   * the px↔minute scale); every subsequent move works off this cache, so a
   * drag never forces layout.
   */
  private beginEdit(s: EditSession): void {
    s.started = true;
    const cols = this.hostEl.querySelectorAll<HTMLElement>('.mk-event-calendar__col');
    s.colRects = Array.from(cols, (c) => c.getBoundingClientRect());
    const rangeMin = Math.max((this.dayEndHour() - this.dayStartHour()) * 60, 1);
    s.pxPerMin = (s.colRects[s.origDay]?.height || rangeMin) / rangeMin;
    this.doc.addEventListener('keydown', this.escHandler, true);
    this.updatePreview(s);
  }

  /** Per-frame move pass: snap, clamp, and publish the preview signal. */
  private applyPendingEdit(): void {
    const s = this.pointerSession;
    if (!s || !s.started) return;
    const snap = Math.max(1, this.snapMinutes());
    const gridStart = this.dayStartHour() * 60;
    const gridEnd = this.dayEndHour() * 60;
    const deltaMin = (this.pendingY - s.startY) / s.pxPerMin;
    const snapped = Math.round(deltaMin / snap) * snap;
    if (s.kind === 'move') {
      const duration = s.origEndMin - s.origStartMin;
      s.startMin = clampNumber(
        s.origStartMin + snapped,
        gridStart,
        Math.max(gridStart, gridEnd - duration),
      );
      s.endMin = s.startMin + duration;
      s.day = this.columnAt(s, this.pendingX);
    } else {
      s.endMin = clampNumber(s.origEndMin + snapped, s.startMin + snap, gridEnd);
    }
    this.updatePreview(s);
  }

  /** Column index under `x`, from the rects snapshotted at lift. */
  private columnAt(s: EditSession, x: number): number {
    const rects = s.colRects;
    if (!rects.length || !rects[s.origDay]?.width) return s.day;
    for (let i = 0; i < rects.length; i++) {
      if (x >= rects[i].left && x < rects[i].right) return i;
    }
    return x < rects[0].left ? 0 : rects.length - 1;
  }

  private onEditPointerUp(e: PointerEvent): void {
    const s = this.pointerSession;
    if (!s || e.pointerId !== s.pointerId) return;
    // Flush (don't drop) the last coalesced move so the drop lands exactly
    // where the pointer ended, not on the last painted frame.
    if (this.editRaf !== null) {
      this.doc.defaultView?.cancelAnimationFrame(this.editRaf);
      this.editRaf = null;
      this.applyPendingEdit();
    }
    const started = s.started;
    this.teardownPointer(started);
    if (!started) return; // was a click, never a drag — eventClick may follow
    this.editPreview.set(null);
    this.commitEdit(s, 'pointer');
  }

  /** Escape / pointercancel: the pill snaps back, nothing is emitted. */
  private abortPointerEdit(): void {
    const s = this.pointerSession;
    if (!s) return;
    const started = s.started;
    this.teardownPointer(started);
    this.editPreview.set(null);
    if (started) this.announceCancelled('polite');
  }

  /** Undo everything `onBlockPointerDown`/`beginEdit` set up. */
  private teardownPointer(swallowClick: boolean): void {
    const s = this.pointerSession;
    if (!s) return;
    this.pointerSession = null;
    if (this.editRaf !== null) {
      this.doc.defaultView?.cancelAnimationFrame(this.editRaf);
      this.editRaf = null;
    }
    const el = s.el;
    if (s.pointerId !== null) {
      try {
        el.releasePointerCapture(s.pointerId);
      } catch {
        // Capture may already be gone.
      }
    }
    el.removeEventListener('pointermove', this.pointerMoveHandler);
    el.removeEventListener('pointerup', this.pointerUpHandler);
    el.removeEventListener('pointercancel', this.pointerCancelHandler);
    el.removeEventListener('touchmove', this.touchMoveEater);
    el.removeEventListener('contextmenu', this.contextMenuHandler);
    if (s.touchTimer !== null) this.doc.defaultView?.clearTimeout(s.touchTimer);
    if (s.savedTouchAction !== null) el.style.touchAction = s.savedTouchAction;
    this.doc.removeEventListener('keydown', this.escHandler, true);
    if (swallowClick) {
      // The browser fires a synthetic click right after pointerup, which would
      // re-fire `eventClick` from a drag (the carousel's click-swallower
      // pattern, kept as a flag because the Angular listener on the same
      // element registered first). The timeout covers gestures with no click.
      this.swallowNextClick = true;
      this.doc.defaultView?.setTimeout(
        () => (this.swallowNextClick = false),
        CLICK_SWALLOW_MS,
      );
    }
  }

  // ===================================================================
  // Editable time grid — keyboard move mode (WCAG 2.5.7)
  // ===================================================================

  protected onBlockKeydown(event: Event, p: MkTimedPlacement, colIndex: number): void {
    const e = event as KeyboardEvent;
    if (!this.editable()) return;
    const s = this.kbSession;
    if (!s || s.event !== p.event) {
      // Enter/Space arms "move mode" (and, via preventDefault, keeps the
      // button's synthetic click — and thus `eventClick` — from firing).
      if ((e.key === 'Enter' || e.key === ' ') && !this.pointerSession) {
        e.preventDefault();
        this.armKeyboard(e.currentTarget as HTMLElement, p, colIndex);
      }
      return;
    }
    const snap = Math.max(1, this.snapMinutes());
    const gridStart = this.dayStartHour() * 60;
    const gridEnd = this.dayEndHour() * 60;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.commitKeyboard();
        break;
      case 'Escape':
        e.preventDefault();
        this.cancelKeyboard();
        break;
      case 'ArrowUp':
      case 'ArrowDown': {
        e.preventDefault();
        const dir = e.key === 'ArrowUp' ? -1 : 1;
        if (e.shiftKey) {
          // Shift+Up/Down resizes the end, never below the snap duration.
          s.endMin = clampNumber(s.endMin + dir * snap, s.startMin + snap, gridEnd);
        } else {
          const duration = s.endMin - s.startMin;
          s.startMin = clampNumber(
            s.startMin + dir * snap,
            gridStart,
            Math.max(gridStart, gridEnd - duration),
          );
          s.endMin = s.startMin + duration;
        }
        this.updatePreview(s);
        this.announceStep(s);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault();
        const dir = e.key === 'ArrowLeft' ? -1 : 1;
        s.day = clampNumber(s.day + dir, 0, this.gridDays().length - 1);
        this.updatePreview(s);
        this.announceStep(s);
        break;
      }
      default:
        break;
    }
  }

  /** Losing focus mid-move cancels the keyboard edit (no stuck state). */
  protected onBlockBlur(): void {
    if (this.kbSession) this.cancelKeyboard();
  }

  private armKeyboard(el: HTMLElement, p: MkTimedPlacement, colIndex: number): void {
    const [startMin, endMin] = eventMinutes(p.event);
    const cols = this.hostEl.querySelectorAll<HTMLElement>('.mk-event-calendar__col');
    const colRects = Array.from(cols, (c) => c.getBoundingClientRect());
    const rangeMin = Math.max((this.dayEndHour() - this.dayStartHour()) * 60, 1);
    const s: EditSession = {
      kind: 'move',
      event: p.event,
      el,
      pointerId: null,
      started: true,
      armed: true,
      startX: 0,
      startY: 0,
      touchTimer: null,
      savedTouchAction: null,
      colRects,
      pxPerMin: (colRects[colIndex]?.height || rangeMin) / rangeMin,
      origDay: colIndex,
      origStartMin: startMin,
      origEndMin: endMin,
      day: colIndex,
      startMin,
      endMin,
    };
    this.kbSession = s;
    this.updatePreview(s);
    this.announcer.announce(
      this.i18n.eventCalendarGrabbed(
        p.event.title,
        minutesLabel(startMin),
        minutesLabel(endMin),
      ),
      'assertive',
    );
  }

  private commitKeyboard(): void {
    const s = this.kbSession;
    if (!s) return;
    this.kbSession = null;
    this.editPreview.set(null);
    this.commitEdit(s, 'keyboard');
  }

  private cancelKeyboard(): void {
    this.kbSession = null;
    this.editPreview.set(null);
    this.announceCancelled('assertive');
  }

  // ===================================================================
  // Editable time grid — shared commit / preview / template helpers
  // ===================================================================

  /**
   * Emit the edited range (if anything actually changed): `eventResize` when
   * only the end moved, `eventMove` otherwise. The `events` input is never
   * touched — applying the change is the consumer's job.
   */
  private commitEdit(s: EditSession, source: 'pointer' | 'keyboard'): void {
    const dayChanged = s.day !== s.origDay;
    const startChanged = s.startMin !== s.origStartMin;
    const endChanged = s.endMin !== s.origEndMin;
    if (!dayChanged && !startChanged && !endChanged) return;
    const day = this.gridDays()[s.day] ?? this.gridDays()[s.origDay];
    const start = new Date(day);
    start.setHours(0, s.startMin, 0, 0);
    const end = new Date(day);
    end.setHours(0, s.endMin, 0, 0);
    const detail: MkCalendarEventEdit = { event: s.event, start, end };
    const resize = !dayChanged && !startChanged;
    if (resize) this.eventResize.emit(detail);
    else this.eventMove.emit(detail);
    this.announcer.announce(
      resize
        ? this.i18n.eventCalendarResized(s.event.title, minutesLabel(s.endMin))
        : this.i18n.eventCalendarMoved(
            s.event.title,
            formatDate(day, 'MMMM d, yyyy', this.i18n.dateNames),
            minutesLabel(s.startMin),
            minutesLabel(s.endMin),
          ),
      source === 'keyboard' ? 'assertive' : 'polite',
    );
  }

  /** Publish the session's current target as template-facing preview state. */
  private updatePreview(s: EditSession): void {
    const gridStart = this.dayStartHour() * 60;
    const gridEnd = this.dayEndHour() * 60;
    const rangeMin = Math.max(gridEnd - gridStart, 1);
    const clampedStart = Math.max(s.startMin, gridStart);
    const clampedEnd = Math.min(s.endMin, gridEnd);
    const dx = (s.colRects[s.day]?.left ?? 0) - (s.colRects[s.origDay]?.left ?? 0);
    const dy = (s.startMin - s.origStartMin) * s.pxPerMin;
    const durationChanged =
      s.endMin - s.startMin !== s.origEndMin - s.origStartMin;
    this.editPreview.set({
      event: s.event,
      day: s.day,
      transform: `translate(${dx}px, ${dy}px)`,
      heightPct: durationChanged
        ? Math.max(((clampedEnd - clampedStart) / rangeMin) * 100, 2.5)
        : null,
      label: `${minutesLabel(s.startMin)} – ${minutesLabel(s.endMin)}`,
      top: ((clampedStart - gridStart) / rangeMin) * 100,
      outlineHeight: Math.max(((clampedEnd - clampedStart) / rangeMin) * 100, 1),
    });
  }

  private announceCancelled(politeness: 'polite' | 'assertive'): void {
    this.announcer.announce(this.i18n.eventCalendarEditCancelled, politeness);
  }

  /** Position update after each keyboard step. */
  private announceStep(s: EditSession): void {
    const day = this.gridDays()[s.day];
    this.announcer.announce(
      this.i18n.eventCalendarPosition(
        s.event.title,
        formatDate(day, 'MMMM d, yyyy', this.i18n.dateNames),
        minutesLabel(s.startMin),
        minutesLabel(s.endMin),
      ),
      'assertive',
    );
  }

  /** Is this placement the pill currently being edited? */
  protected isEditing(p: MkTimedPlacement): boolean {
    return this.editPreview()?.event === p.event;
  }

  /** Lift transform for the dragged pill (`null` when idle). */
  protected blockTransform(p: MkTimedPlacement): string | null {
    const d = this.editPreview();
    return d && d.event === p.event ? d.transform : null;
  }

  /** Height (%) — the resize preview overrides the layout's height. */
  protected blockHeight(p: MkTimedPlacement): number {
    const d = this.editPreview();
    return d && d.event === p.event && d.heightPct !== null ? d.heightPct : p.height;
  }

  /** Would-be time range shown on the pill while it is being edited. */
  protected dragLabelFor(p: MkTimedPlacement): string | null {
    const d = this.editPreview();
    return d && d.event === p.event ? d.label : null;
  }

  /** Drop-outline geometry when the edit currently targets column `i`. */
  protected dropOutlineFor(i: number): EditPreviewState | null {
    const d = this.editPreview();
    return d && d.day === i ? d : null;
  }

  /**
   * Accessible name for an editable pill — the title plus its time range
   * (composed with, not replacing, the visible title text and tooltip).
   */
  protected blockAriaLabel(p: MkTimedPlacement): string {
    const [startMin, endMin] = eventMinutes(p.event);
    return `${p.event.title}, ${minutesLabel(startMin)} – ${minutesLabel(endMin)}`;
  }

  /** `aria-roledescription` for editable pills. */
  protected readonly movableRoledescription = this.i18n.eventCalendarMovableEvent;

  ngOnDestroy(): void {
    if (this.pointerSession) this.teardownPointer(false);
    this.kbSession = null;
  }

  /** Raw 6×7 grid of dates for the visible month. */
  private readonly weeks = computed(() =>
    buildMonthMatrix(this.viewDate(), this.firstDayOfWeek()),
  );

  /** Weekday column headers ordered from `firstDayOfWeek`. */
  protected readonly weekdays = computed<MkWeekdayHeader[]>(() =>
    this.weeks()[0].map((d) => ({
      short: formatDate(d, 'ddd', this.i18n.dateNames),
      full: getWeekdayFullName(d, this.i18n.dateNames),
    })),
  );

  /** Events grouped by local calendar day, keyed by `startOfDay` timestamp. */
  private readonly eventsByDay = computed(() => {
    const map = new Map<number, MkCalendarEvent[]>();
    for (const event of this.events()) {
      const key = startOfDay(event.date).getTime();
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    }
    return map;
  });

  /** 6×7 grid of day cells with their (capped) events resolved. */
  protected readonly weekCells = computed<MkDayCell[][]>(() => {
    const month = this.viewMonth();
    const today = new Date();
    const max = this.maxPerDay();
    const byDay = this.eventsByDay();
    return this.weeks().map((week) =>
      week.map((date) => {
        const dayEvents = byDay.get(startOfDay(date).getTime()) ?? [];
        const cell = {
          date,
          outside: !isSameMonth(date, month),
          today: isSameDay(date, today),
          visible: dayEvents.slice(0, max),
          overflow: Math.max(0, dayEvents.length - max),
        };
        // Label formatted once per rebuild, not on every CD pass (42 cells).
        return { ...cell, label: this.dayLabel(cell) };
      }),
    );
  });

  /**
   * Screen-reader label for a day cell. The button's `aria-label` replaces its
   * visual content, so the label also announces the day's events — count plus
   * up to three titles — e.g. `July 9, 2026, 2 events: Standup, Demo`.
   * Precomputed into {@link MkDayCell#label} by `weekCells`.
   */
  protected dayLabel(cell: Omit<MkDayCell, 'label'>): string {
    const formatted = formatDate(cell.date, 'MMMM d, yyyy', this.i18n.dateNames);
    const count = cell.visible.length + cell.overflow;
    if (count === 0) return formatted;
    const titles = cell.visible
      .slice(0, 3)
      .map((e) => e.title)
      .join(', ');
    return `${formatted}, ${this.i18n.dayEvents(count, titles)}`;
  }

  protected prevMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  private shiftMonth(delta: number): void {
    const view = this.view();
    const next =
      view === 'month'
        ? addMonths(this.viewDate(), delta)
        : addDays(this.viewDate(), delta * (view === 'week' ? 7 : 1));
    this.viewDate.set(next);
    this.monthChange.emit(next);
  }

  protected onDayClick(d: Date): void {
    this.dayClick.emit(d);
  }

  protected onEventClick(event: Event, calendarEvent: MkCalendarEvent): void {
    event.stopPropagation();
    // A real drag just ended — the browser's trailing synthetic click must not
    // read as an event activation.
    if (this.swallowNextClick) {
      this.swallowNextClick = false;
      event.preventDefault();
      return;
    }
    this.eventClick.emit(calendarEvent);
  }
}
