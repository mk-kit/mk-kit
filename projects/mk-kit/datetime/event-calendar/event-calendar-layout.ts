import { isSameDay } from '../datetime/date-utils';
import type { MkCalendarEvent } from './event-calendar';

/** A timed event positioned inside a day column of the time grid. */
export interface MkTimedPlacement {
  event: MkCalendarEvent;
  /** Offset from the top of the grid, percent of the visible hour range. */
  top: number;
  /** Height, percent of the visible hour range (never below ~15 min). */
  height: number;
  /** Column inside the overlap cluster (0-based). */
  lane: number;
  /** Total columns in the overlap cluster — width is `100 / lanes`%. */
  lanes: number;
}

function minutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Position a day's timed events on an hour grid, packing overlaps side by
 * side instead of stacking them: within a cluster of transitively-overlapping
 * events each takes the lowest free lane, and every member of the cluster is
 * widened to the same lane count so columns line up (the layout every
 * scheduler UI uses).
 *
 * Pure — no Angular, no DOM — so the packing has direct unit tests.
 */
export function layoutTimedEvents(
  events: readonly MkCalendarEvent[],
  day: Date,
  startHour: number,
  endHour: number,
): MkTimedPlacement[] {
  const rangeMin = (endHour - startHour) * 60;
  if (rangeMin <= 0) return [];

  const timed = events
    .filter((e) => e.start && isSameDay(e.start, day))
    .sort(
      (a, b) =>
        a.start!.getTime() - b.start!.getTime() ||
        (b.end?.getTime() ?? 0) - (a.end?.getTime() ?? 0),
    );

  interface Working extends MkTimedPlacement {
    startMin: number;
    endMin: number;
  }

  const placed: Working[] = [];
  let cluster: Working[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    for (const p of cluster) p.lanes = lanes;
    cluster = [];
    clusterEnd = -1;
  };

  for (const event of timed) {
    const startMin = minutes(event.start!);
    // A missing end reads as 30 minutes — long enough to click.
    const endMin = event.end && isSameDay(event.end, day)
      ? Math.max(minutes(event.end), startMin + 15)
      : startMin + 30;

    if (cluster.length && startMin >= clusterEnd) closeCluster();

    // Lowest lane whose latest occupant has finished.
    const laneEnds: number[] = [];
    for (const p of cluster) {
      laneEnds[p.lane] = Math.max(laneEnds[p.lane] ?? 0, p.endMin);
    }
    let lane = 0;
    while ((laneEnds[lane] ?? 0) > startMin) lane++;

    const clampedStart = Math.max(startMin, startHour * 60);
    const clampedEnd = Math.min(endMin, endHour * 60);
    if (clampedEnd <= startHour * 60 || clampedStart >= endHour * 60) continue;

    const item: Working = {
      event,
      startMin,
      endMin,
      lane,
      lanes: 1,
      top: ((clampedStart - startHour * 60) / rangeMin) * 100,
      height: Math.max(((clampedEnd - clampedStart) / rangeMin) * 100, 2.5),
    };
    cluster.push(item);
    placed.push(item);
    clusterEnd = Math.max(clusterEnd, endMin);
  }
  if (cluster.length) closeCluster();

  return placed.map(({ startMin: _s, endMin: _e, ...p }) => p);
}

/** Events on `day` with no start time — rendered in the all-day strip. */
export function allDayEvents(
  events: readonly MkCalendarEvent[],
  day: Date,
): MkCalendarEvent[] {
  return events.filter((e) => !e.start && isSameDay(e.date, day));
}
