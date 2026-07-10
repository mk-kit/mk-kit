/**
 * Dependency-free date helpers shared by the mk-kit DATE & TIME components.
 * All functions are pure and operate on native `Date`. Name-producing helpers
 * default to English but accept an optional {@link MkDateNames} table (from
 * `MK_I18N`) for localisation. Dates are treated in the local time zone.
 */
import type { MkDateNames } from '@mkornas/ui/core';

/** English full month names, January (index 0) → December (index 11). */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** English abbreviated month names (`MMM`). */
const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** English full weekday names, Sunday (index 0) → Saturday (index 6). */
const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** English abbreviated weekday names (`ddd`). */
const WEEKDAY_NAMES_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

/** English single-letter weekday names (narrow). */
const WEEKDAY_NAMES_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/** Day-of-week index 0 (Sunday) … 6 (Saturday). */
export type MkWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** True when both dates fall on the same calendar day (local time). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True when both dates fall in the same calendar month of the same year. */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Midnight (00:00:00.000) on the first day of `date`'s month. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Midnight on the last day of `date`'s month. */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** A new date `count` months after `date` (negative to subtract). Clamps the
 * day of month so e.g. Jan 31 + 1 month = Feb 28/29, not Mar 3. */
export function addMonths(date: Date, count: number): Date {
  const targetMonth = date.getMonth() + count;
  const result = new Date(
    date.getFullYear(),
    targetMonth,
    1,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
}

/** A new date `count` days after `date` (negative to subtract). */
export function addDays(date: Date, count: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

/** Midnight (00:00:00.000) on `date`'s calendar day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The first day of the week containing `date`, at midnight. `firstDayOfWeek`
 * is the week's starting weekday (0 = Sunday … 6 = Saturday).
 */
export function startOfWeek(date: Date, firstDayOfWeek = 0): Date {
  const start = startOfDay(date);
  const diff = (start.getDay() - firstDayOfWeek + 7) % 7;
  return addDays(start, -diff);
}

/** The last day of the week containing `date`, at midnight. */
export function endOfWeek(date: Date, firstDayOfWeek = 0): Date {
  return addDays(startOfWeek(date, firstDayOfWeek), 6);
}

/**
 * ISO-8601 week number (1–53) of `date`. Weeks start on Monday and week 1 is
 * the week containing the first Thursday of the year.
 */
export function getISOWeek(date: Date): number {
  // Shift to the Thursday of this ISO week, then count weeks from Jan 1.
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // Monday = 0 … Sunday = 6
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  return (
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000))
  );
}

/** True when `a` is strictly before `b` (full timestamp comparison). */
export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

/** True when `a` is strictly after `b` (full timestamp comparison). */
export function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}

/** Clamp `date` into the inclusive `[min, max]` range (either bound optional). */
export function clampDate(
  date: Date,
  min?: Date | null,
  max?: Date | null,
): Date {
  if (min && isBefore(date, min)) return new Date(min);
  if (max && isAfter(date, max)) return new Date(max);
  return date;
}

/** Format `date` as an ISO calendar date `YYYY-MM-DD` (local time). */
export function formatISODate(date: Date): string {
  return `${date.getFullYear().toString().padStart(4, '0')}-${pad2(
    date.getMonth() + 1,
  )}-${pad2(date.getDate())}`;
}

/** Parse a `YYYY-MM-DD` string into a local-time `Date`, or `null` if invalid. */
export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  // Reject rollovers like 2024-02-31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Format `date` using a small pattern set. Supported tokens:
 * `yyyy` (4-digit year), `MMMM` (full month), `MMM` (short month),
 * `MM` (2-digit month), `dd` (2-digit day), `d` (day), `ddd` (short weekday).
 * Longer tokens are matched first so `MMMM` wins over `MM`.
 * Month/weekday names come from `names` when given, else English.
 */
export function formatDate(
  date: Date,
  pattern: string,
  names?: MkDateNames,
): string {
  const tokens: [string, () => string][] = [
    ['yyyy', () => date.getFullYear().toString().padStart(4, '0')],
    ['MMMM', () => (names?.months ?? MONTH_NAMES)[date.getMonth()]],
    ['MMM', () => (names?.monthsShort ?? MONTH_NAMES_SHORT)[date.getMonth()]],
    ['MM', () => pad2(date.getMonth() + 1)],
    // Longest-first: 'ddd' (short weekday) must be matched before 'dd'/'d',
    // otherwise 'ddd' is consumed as 'dd' + 'd' and produces day numbers.
    ['ddd', () => (names?.weekdaysShort ?? WEEKDAY_NAMES_SHORT)[date.getDay()]],
    ['dd', () => pad2(date.getDate())],
    ['d', () => date.getDate().toString()],
  ];
  let result = '';
  let i = 0;
  outer: while (i < pattern.length) {
    for (const [token, resolve] of tokens) {
      if (pattern.startsWith(token, i)) {
        result += resolve();
        i += token.length;
        continue outer;
      }
    }
    result += pattern[i];
    i += 1;
  }
  return result;
}

/**
 * Build a fixed 6×7 matrix of `Date` cells for `viewDate`'s month, including
 * the leading days from the previous month and trailing days from the next so
 * every row is full. `firstDayOfWeek` is 0 (Sunday) … 6 (Saturday).
 */
export function buildMonthMatrix(
  viewDate: Date,
  firstDayOfWeek: number = 0,
): Date[][] {
  const first = startOfMonth(viewDate);
  const firstDow = first.getDay();
  const offset = (firstDow - firstDayOfWeek + 7) % 7;
  const gridStart = addDays(first, -offset);

  const weeks: Date[][] = [];
  let cursor = gridStart;
  for (let week = 0; week < 6; week++) {
    const row: Date[] = [];
    for (let day = 0; day < 7; day++) {
      row.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
  }
  return weeks;
}

/** Full month names, index 0 = January (from `names`, else English). */
export function getMonthNames(names?: MkDateNames): readonly string[] {
  return names?.months ?? MONTH_NAMES;
}

/**
 * Weekday header labels ordered to start at `firstDayOfWeek`.
 * `format` selects `'short'` (e.g. `Mon`) or `'narrow'` (e.g. `M`).
 * Labels come from `names` when given, else English.
 */
export function getWeekdayNames(
  firstDayOfWeek: number = 0,
  format: 'short' | 'narrow' = 'short',
  names?: MkDateNames,
): string[] {
  const source =
    format === 'narrow'
      ? (names?.weekdaysNarrow ?? WEEKDAY_NAMES_NARROW)
      : (names?.weekdaysShort ?? WEEKDAY_NAMES_SHORT);
  const start = ((firstDayOfWeek % 7) + 7) % 7;
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    labels.push(source[(start + i) % 7]);
  }
  return labels;
}

/** Full weekday name for `date` (for screen-reader labels). */
export function getWeekdayFullName(date: Date, names?: MkDateNames): string {
  return (names?.weekdays ?? WEEKDAY_NAMES)[date.getDay()];
}
