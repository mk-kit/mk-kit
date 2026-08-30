import { describe, expect, it } from 'vitest';
import { mkParseAnsi, mkStripAnsi } from './ansi.js';
import {
  addDays,
  addMonths,
  buildMonthMatrix,
  clampDate,
  endOfWeek,
  formatDate,
  formatISODate,
  getISOWeek,
  getWeekdayNames,
  isSameDay,
  parseISODate,
  startOfWeek,
  type MkDateNames,
} from './dates.js';
import { mkEscapeHtml, mkHighlight, mkHighlightJson } from './highlight.js';
import { mkUniqueId } from './id.js';

describe('dates', () => {
  it('adds months with day-of-month clamping', () => {
    expect(formatISODate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(formatISODate(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
    expect(formatISODate(addMonths(new Date(2026, 2, 15), -1))).toBe('2026-02-15');
  });

  it('computes week boundaries for a configurable first day', () => {
    const wed = new Date(2026, 7, 26); // Wednesday
    expect(formatISODate(startOfWeek(wed))).toBe('2026-08-23'); // Sunday
    expect(formatISODate(startOfWeek(wed, 1))).toBe('2026-08-24'); // Monday
    expect(formatISODate(endOfWeek(wed, 1))).toBe('2026-08-30');
  });

  it('computes ISO week numbers across year boundaries', () => {
    expect(getISOWeek(new Date(2026, 0, 1))).toBe(1);
    expect(getISOWeek(new Date(2027, 0, 1))).toBe(53); // 2026-W53 spills into 2027
    expect(getISOWeek(new Date(2026, 11, 31))).toBe(53);
  });

  it('round-trips ISO dates and rejects rollovers', () => {
    expect(formatISODate(parseISODate('2026-02-28')!)).toBe('2026-02-28');
    expect(parseISODate('2026-02-31')).toBeNull();
    expect(parseISODate('not-a-date')).toBeNull();
    expect(parseISODate('')).toBeNull();
  });

  it('formats patterns with longest-token matching and localised names', () => {
    const d = new Date(2026, 0, 5, 14, 7); // Monday
    expect(formatDate(d, 'yyyy-MM-dd HH:mm')).toBe('2026-01-05 14:07');
    expect(formatDate(d, 'ddd, d MMMM')).toBe('Mon, 5 January');
    expect(formatDate(d, 'h:mm a')).toBe('2:07 PM');
    const names: MkDateNames = {
      months: Array(12).fill('M!'),
      monthsShort: Array(12).fill('m!'),
      weekdays: Array(7).fill('W!'),
      weekdaysShort: Array(7).fill('w!'),
      weekdaysNarrow: Array(7).fill('n'),
    };
    expect(formatDate(d, 'ddd MMMM', names)).toBe('w! M!');
  });

  it('builds a full 6×7 month matrix and clamps dates', () => {
    const weeks = buildMonthMatrix(new Date(2026, 1, 1), 1);
    expect(weeks.length).toBe(6);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0][0].getDay()).toBe(1);

    const min = new Date(2026, 0, 10);
    expect(isSameDay(clampDate(new Date(2026, 0, 1), min), min)).toBe(true);
    expect(getWeekdayNames(1, 'short').length).toBe(7);
    expect(isSameDay(addDays(new Date(2026, 0, 31), 1), new Date(2026, 1, 1))).toBe(true);
  });
});

describe('ansi', () => {
  it('splits SGR-coloured text into styled spans', () => {
    const spans = mkParseAnsi('a [31mred[0m b');
    expect(spans.map((s) => s.text).join('')).toBe('a red b');
    expect(spans.some((s) => s.text === 'red')).toBe(true);
  });

  it('strips every escape sequence', () => {
    expect(mkStripAnsi('[1;32mok[0m done')).toBe('ok done');
    expect(mkStripAnsi('plain')).toBe('plain');
  });
});

describe('highlight', () => {
  it('escapes HTML before tokenising', () => {
    expect(mkEscapeHtml('<a & b>')).toBe('&lt;a &amp; b&gt;');
    expect(mkHighlight('<script>', 'plaintext')).toBe('&lt;script&gt;');
  });

  it('tokenises JSON keys, strings, numbers, keywords and punctuation', () => {
    const out = mkHighlightJson('{"a": 1, "b": true}');
    expect(out).toContain('mk-tok-key');
    expect(out).toContain('mk-tok-num');
    expect(out).toContain('mk-tok-kw');
    expect(out).toContain('mk-tok-punc');
    expect(mkHighlight('{"a":1}', 'json')).toContain('mk-tok-key');
  });
});

describe('id', () => {
  it('generates unique, prefixed ids', () => {
    const a = mkUniqueId('t');
    const b = mkUniqueId('t');
    expect(a).not.toBe(b);
    expect(a.startsWith('t-')).toBe(true);
    expect(mkUniqueId().startsWith('mk-')).toBe(true);
  });
});
