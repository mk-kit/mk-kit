/** Delegates to `@mk-kit/core` — the exported names are unchanged. */
export {
  addDays,
  addMonths,
  buildMonthMatrix,
  clampDate,
  endOfMonth,
  endOfWeek,
  formatDate,
  formatISODate,
  getISOWeek,
  getMonthNames,
  getWeekdayFullName,
  getWeekdayNames,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISODate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  type MkWeekday,
} from '@mk-kit/core';

/**
 * Parse `text` by the numeric day/month/year order of a display `pattern` —
 * `dd.MM.yyyy` reads day first, `MM/dd/yyyy` month first. `Date.parse` must
 * never see such text: it reads '09.10.2026' as September 10 in every engine.
 *
 * Returns `null` when the pattern has no numeric `d`/`M`/`y` triple (e.g.
 * 'MMM d, yyyy'), when `text` is not three numbers, or when they do not form
 * a real date ('31.02.2026' is rejected, not rolled over). Two-digit years
 * are 20xx. The result is local midnight.
 */
export function parseDateByPattern(text: string, pattern: string): Date | null {
  const order = numericDateOrder(pattern);
  if (!order) return null;
  const m = /^(\d{1,4})\D+(\d{1,4})\D+(\d{1,4})$/.exec(text.trim());
  if (!m) return null;
  const parts: Record<string, number> = {};
  order.forEach((key, i) => (parts[key] = Number(m[i + 1])));
  let { y } = parts;
  const { M, d } = parts;
  if (y < 100) y += 2000;
  if (M < 1 || M > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, M - 1, d);
  date.setFullYear(y); // years 0–99 would otherwise map to 1900–1999
  return date.getMonth() === M - 1 && date.getDate() === d ? date : null;
}

/** True when `pattern` writes day, month and year as numbers ('dd.MM.yyyy',
 *  'MM/dd/yy HH:mm') — then it, not `Date.parse`, decides how numeric text
 *  reads. */
export function isNumericDatePattern(pattern: string): boolean {
  return numericDateOrder(pattern) !== null;
}

/** The order of the numeric date tokens in `pattern`, e.g. ['d','M','y'], or
 *  null unless day, month and year each appear exactly once as numbers. */
function numericDateOrder(pattern: string): ('d' | 'M' | 'y')[] | null {
  const order: ('d' | 'M' | 'y')[] = [];
  // Longest first — 'MMM'/'MMMM' are month names and 'ddd' a weekday name.
  const re = /yyyy|yy|MMMM|MMM|MM|M|ddd|dd|d/g;
  for (const [token] of pattern.matchAll(re)) {
    if (token === 'MMMM' || token === 'MMM') return null;
    if (token === 'ddd') continue;
    order.push(token[0] as 'd' | 'M' | 'y');
  }
  return order.length === 3 && new Set(order).size === 3 ? order : null;
}
