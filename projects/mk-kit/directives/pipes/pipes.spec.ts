import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMkI18n } from '@mk-kit/ui/core';
import { MkCurrencyPipe } from './currency.pipe';
import { MkFileSizePipe } from './file-size.pipe';
import { MkInitialsPipe } from './initials.pipe';
import { MkPluralizePipe } from './pluralize.pipe';
import { MkRelativeTimePipe } from './relative-time.pipe';
import { MkTruncatePipe } from './truncate.pipe';
import { MkIntlCache, mkToNumber, mkToTimestamp } from './intl-utils';

/**
 * Build a pipe inside a fresh TestBed injector with the given providers. The
 * returned `transform` normalises `Intl`'s non-breaking / narrow spaces to
 * plain spaces so expectations stay readable.
 */
function make<T extends { transform: (...args: never[]) => string }>(
  ctor: new () => T,
  ...providers: unknown[]
): T {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), ...(providers as never[])],
  });
  const pipe = TestBed.runInInjectionContext(() => new ctor());
  const raw = pipe.transform.bind(pipe);
  pipe.transform = ((...args: never[]) => raw(...args).replace(/[  ]/g, ' ')) as T['transform'];
  return pipe;
}

const NOW = new Date('2026-08-28T12:00:00Z');
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('MkCurrencyPipe', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('formats with the explicit currency and en-US locale', () => {
    const pipe = make(MkCurrencyPipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(1234.5, 'EUR')).toBe('€1,234.50');
    expect(pipe.transform('1234.5', 'USD')).toBe('$1,234.50');
    expect(pipe.transform(-5, 'USD')).toBe('-$5.00');
  });

  it('defaults currency to USD and to the i18n currency when provided', () => {
    expect(make(MkCurrencyPipe, provideMkI18n({ locale: 'en-US' })).transform(10)).toBe('$10.00');
    TestBed.resetTestingModule();
    const pipe = make(MkCurrencyPipe, provideMkI18n({ locale: 'en-US', currency: 'gbp' }));
    expect(pipe.transform(10)).toBe('£10.00');
  });

  it('honours the provideMkI18n locale and a per-call locale override', () => {
    const pipe = make(MkCurrencyPipe, provideMkI18n({ locale: 'de-DE' }));
    expect(pipe.transform(1234.5, 'EUR')).toBe('1.234,50 €');
    expect(pipe.transform(1234.5, 'PLN', { locale: 'pl-PL' })).toBe('1234,50 zł');
  });

  it('passes Intl options through', () => {
    const pipe = make(MkCurrencyPipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(1234567, 'USD', { notation: 'compact' })).toBe('$1.2M');
    expect(pipe.transform(10, 'USD', { display: 'code' })).toMatch(/USD\s?10\.00/);
    expect(pipe.transform(10, 'USD', { signDisplay: 'always' })).toBe('+$10.00');
    expect(pipe.transform(10, 'USD', { maximumFractionDigits: 0, minimumFractionDigits: 0 })).toBe('$10');
    expect(pipe.transform(0, 'JPY')).toBe('¥0');
  });

  it('renders empty for null / undefined / blank / NaN', () => {
    const pipe = make(MkCurrencyPipe);
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('abc')).toBe('');
    expect(pipe.transform(Number.NaN)).toBe('');
  });
});

describe('MkRelativeTimePipe', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('picks the right unit and direction (en)', () => {
    const pipe = make(MkRelativeTimePipe, provideMkI18n({ locale: 'en-US' }));
    const at = (ms: number) => pipe.transform(new Date(NOW.getTime() + ms), NOW);
    expect(at(-3 * MIN)).toBe('3 minutes ago');
    expect(at(-45_000)).toBe('45 seconds ago');
    expect(at(2 * DAY)).toBe('in 2 days');
    expect(at(-5 * HOUR)).toBe('5 hours ago');
    expect(at(-8 * DAY)).toBe('last week');
    expect(at(-40 * DAY)).toBe('last month');
    expect(at(3 * 366 * DAY)).toBe('in 3 years');
  });

  it('uses natural phrases with numeric auto and plain numbers with always', () => {
    const pipe = make(MkRelativeTimePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(NOW, NOW)).toBe('now');
    expect(pipe.transform(new Date(NOW.getTime() - DAY), NOW)).toBe('yesterday');
    expect(pipe.transform(new Date(NOW.getTime() + DAY), NOW, { numeric: 'always' })).toBe('in 1 day');
    expect(pipe.transform(new Date(NOW.getTime() - 3 * MIN), NOW, { style: 'short' })).toBe('3 min. ago');
  });

  it('accepts timestamps and ISO strings for both value and now', () => {
    const pipe = make(MkRelativeTimePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(NOW.getTime() - 2 * HOUR, NOW.getTime())).toBe('2 hours ago');
    expect(pipe.transform('2026-08-26T12:00:00Z', '2026-08-28T12:00:00Z')).toBe('2 days ago');
  });

  it('accepts the options object as the second argument (no now placeholder)', () => {
    const pipe = make(MkRelativeTimePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(new Date(Date.now() - 3 * MIN), { style: 'short' })).toBe('3 min. ago');
    // A minute of headroom: the pipe reads Date.now() a beat after the spec
    // does, and exactly +DAY minus that beat falls below the day unit.
    expect(pipe.transform(new Date(Date.now() + DAY + MIN), { numeric: 'always' })).toBe('in 1 day');
    expect(pipe.transform(new Date(Date.now() - 45 * DAY), { maxUnit: 'day' })).toBe('45 days ago');
    // The legacy `null` placeholder and the three-argument form keep working.
    expect(pipe.transform(new Date(Date.now() - 3 * MIN), null, { style: 'short' })).toBe('3 min. ago');
    expect(pipe.transform(new Date(NOW.getTime() - 3 * MIN), NOW, { style: 'narrow' })).toBe('3m ago');
  });

  it('caps the unit with maxUnit', () => {
    const pipe = make(MkRelativeTimePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(new Date(NOW.getTime() - 45 * DAY), NOW, { maxUnit: 'day' })).toBe('45 days ago');
  });

  it('honours the i18n locale and a per-call override', () => {
    const pipe = make(MkRelativeTimePipe, provideMkI18n({ locale: 'pl' }));
    expect(pipe.transform(new Date(NOW.getTime() - 3 * MIN), NOW)).toBe('3 minuty temu');
    expect(pipe.transform(new Date(NOW.getTime() + 2 * DAY), NOW, { locale: 'de' })).toBe('übermorgen');
  });

  it('defaults now to the current time', () => {
    const pipe = make(MkRelativeTimePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(new Date(Date.now() - 10 * MIN))).toBe('10 minutes ago');
  });

  it('renders empty for null / undefined / invalid dates', () => {
    const pipe = make(MkRelativeTimePipe);
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('not a date')).toBe('');
    expect(pipe.transform(new Date('x'))).toBe('');
  });
});

describe('MkFileSizePipe', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('formats decimal (SI) units by default', () => {
    const pipe = make(MkFileSizePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(0)).toBe('0 B');
    expect(pipe.transform(512)).toBe('512 B');
    expect(pipe.transform(1000)).toBe('1 kB');
    expect(pipe.transform(1536)).toBe('1.5 kB');
    expect(pipe.transform(1_234_567)).toBe('1.2 MB');
    expect(pipe.transform(5e9)).toBe('5 GB');
    expect(pipe.transform(1e21)).toBe('1,000 EB');
  });

  it('formats binary units on request', () => {
    const pipe = make(MkFileSizePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(1024, { base: 'binary' })).toBe('1 KiB');
    expect(pipe.transform(1_234_567, { base: 'binary' })).toBe('1.2 MiB');
    expect(pipe.transform(1023, { base: 'binary' })).toBe('1,023 B');
  });

  it('respects digits, negative values and the locale', () => {
    const pipe = make(MkFileSizePipe, provideMkI18n({ locale: 'de-DE' }));
    expect(pipe.transform(1_234_567, { digits: 2 })).toBe('1,23 MB');
    expect(pipe.transform(1_234_567, { digits: 0 })).toBe('1 MB');
    expect(pipe.transform(-1500)).toBe('-1,5 kB');
    expect(pipe.transform(1_234_567, { locale: 'en' })).toBe('1.2 MB');
  });

  it('promotes to the next unit instead of rounding to 1000', () => {
    const pipe = make(MkFileSizePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(999_960)).toBe('1 MB');
    expect(pipe.transform(999_949)).toBe('999.9 kB');
  });

  it('renders empty for null / undefined / non-numbers', () => {
    const pipe = make(MkFileSizePipe);
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('big')).toBe('');
    expect(pipe.transform(Number.POSITIVE_INFINITY)).toBe('');
  });
});

describe('MkInitialsPipe', () => {
  const pipe = new MkInitialsPipe();

  it('takes the first letter of the first and last word', () => {
    expect(pipe.transform('Ada Lovelace')).toBe('AL');
    expect(pipe.transform('  grace   brewster murray hopper ')).toBe('GH');
    expect(pipe.transform('ada')).toBe('AD');
    expect(pipe.transform('A')).toBe('A');
  });

  it('honours max', () => {
    expect(pipe.transform('Jean Luc Picard', 3)).toBe('JLP');
    expect(pipe.transform('Jean Luc Picard', 1)).toBe('J');
    expect(pipe.transform('Ada King Lovelace', 2)).toBe('AL');
    expect(pipe.transform('Jean Luc Picard', 10)).toBe('JLP');
    expect(pipe.transform('Ada', 1)).toBe('A');
    expect(pipe.transform('Ada Lovelace', 0)).toBe('A');
  });

  it('keeps accents and emoji whole', () => {
    expect(pipe.transform('Éric Ørsted')).toBe('ÉØ');
    expect(pipe.transform('🦄 Unicorn')).toBe('🦄U');
    expect(pipe.transform('Łukasz')).toBe('ŁU');
  });

  it('renders empty for null / undefined / blank', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('   ')).toBe('');
  });
});

describe('MkTruncatePipe', () => {
  const pipe = new MkTruncatePipe();
  const text = 'The quick brown fox jumps over the lazy dog';

  it('returns short text untouched and hard-cuts long text within the limit', () => {
    expect(pipe.transform('short', 10)).toBe('short');
    expect(pipe.transform('exactly10!', 10)).toBe('exactly10!');
    expect(pipe.transform(text, 10)).toBe('The quick…');
    expect(pipe.transform(text, 10).length).toBe(10);
    expect(pipe.transform(text)).toBe(text); // default 50 > length
    expect(pipe.transform(text.repeat(2)).length).toBe(50);
  });

  it('supports a custom ellipsis and counts it toward the limit', () => {
    expect(pipe.transform(text, 10, { ellipsis: '...' })).toBe('The qui...');
    expect(pipe.transform(text, 10, { ellipsis: '' })).toBe('The quick');
    expect(pipe.transform(text, 2, { ellipsis: '...' })).toBe('...');
  });

  it('cuts at a word boundary when asked', () => {
    expect(pipe.transform(text, 13, { wordBoundary: true })).toBe('The quick…');
    expect(pipe.transform(text, 16, { wordBoundary: true })).toBe('The quick brown…');
    // The cut already lands on a boundary → nothing to back up.
    expect(pipe.transform(text, 10, { wordBoundary: true })).toBe('The quick…');
    // First word longer than the budget → hard cut.
    expect(pipe.transform('Supercalifragilistic', 8, { wordBoundary: true })).toBe('Superca…');
  });

  it('is grapheme-aware', () => {
    expect(pipe.transform('🦄🦄🦄🦄🦄', 3)).toBe('🦄🦄…');
    expect(pipe.transform('Zażółć gęślą jaźń', 8)).toBe('Zażółć…');
  });

  it('renders empty for null / undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('', 5)).toBe('');
  });
});

describe('MkPluralizePipe', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('uses the English shorthand', () => {
    const pipe = make(MkPluralizePipe, provideMkI18n({ locale: 'en-US' }));
    expect(pipe.transform(1, 'item')).toBe('1 item');
    expect(pipe.transform(3, 'item')).toBe('3 items');
    expect(pipe.transform(0, 'item')).toBe('0 items');
    expect(pipe.transform(1, 'entry', 'entries')).toBe('1 entry');
    expect(pipe.transform(2, 'entry', 'entries')).toBe('2 entries');
    expect(pipe.transform(1200, 'row')).toBe('1,200 rows');
    expect(pipe.transform('2', 'file', null, { withCount: false })).toBe('files');
  });

  it('selects CLDR categories with a forms map and the i18n locale', () => {
    const forms = { one: 'plik', few: 'pliki', many: 'plików', other: 'pliku' };
    const pipe = make(MkPluralizePipe, provideMkI18n({ locale: 'pl' }));
    expect(pipe.transform(1, forms)).toBe('1 plik');
    expect(pipe.transform(3, forms)).toBe('3 pliki');
    expect(pipe.transform(5, forms)).toBe('5 plików');
    expect(pipe.transform(22, forms)).toBe('22 pliki');
    expect(pipe.transform(1.5, forms)).toBe('1,5 pliku');
    expect(pipe.transform(5, { other: 'x' })).toBe('5 x'); // falls back to other
    expect(pipe.transform(5, forms, null, { locale: 'en' })).toBe('5 pliku');
  });

  it('renders empty for null / undefined / non-numbers', () => {
    const pipe = make(MkPluralizePipe);
    expect(pipe.transform(null, 'item')).toBe('');
    expect(pipe.transform(undefined, 'item')).toBe('');
    expect(pipe.transform('n/a', 'item')).toBe('');
  });
});

describe('pipes in a zoneless template', () => {
  @Component({
    imports: [MkCurrencyPipe, MkRelativeTimePipe, MkFileSizePipe, MkInitialsPipe, MkTruncatePipe, MkPluralizePipe],
    template: `
      <span id="cur">{{ amount() | mkCurrency:'EUR' }}</span>
      <span id="rel">{{ when | mkRelativeTime:now }}</span>
      <span id="size">{{ bytes() | mkFileSize }}</span>
      <span id="ini">{{ name | mkInitials }}</span>
      <span id="tr">{{ name | mkTruncate:6 }}</span>
      <span id="pl">{{ count() | mkPluralize:'file' }}</span>
    `,
  })
  class Host {
    readonly amount = signal<number | null>(12.5);
    readonly when = new Date(NOW.getTime() - 3 * MIN);
    readonly now = NOW;
    readonly bytes = signal(2048);
    readonly name = 'Ada Lovelace';
    readonly count = signal(1);
  }

  it('renders and re-renders when signal inputs change', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideMkI18n({ locale: 'en-US' })],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const text = (id: string) => (fixture.nativeElement.querySelector(`#${id}`) as HTMLElement).textContent;
    expect(text('cur')).toBe('€12.50');
    expect(text('rel')).toBe('3 minutes ago');
    expect(text('size')).toBe('2 kB');
    expect(text('ini')).toBe('AL');
    expect(text('tr')).toBe('Ada L…');
    expect(text('pl')).toBe('1 file');

    fixture.componentInstance.amount.set(null);
    fixture.componentInstance.bytes.set(3_500_000);
    fixture.componentInstance.count.set(4);
    await fixture.whenStable();
    expect(text('cur')).toBe('');
    expect(text('size')).toBe('3.5 MB');
    expect(text('pl')).toBe('4 files');
  });
});

describe('intl-utils', () => {
  it('coerces numbers and timestamps', () => {
    expect(mkToNumber('12')).toBe(12);
    expect(mkToNumber(' ')).toBeNull();
    expect(mkToNumber({})).toBeNull();
    expect(mkToTimestamp(new Date(5))).toBe(5);
    expect(mkToTimestamp(5)).toBe(5);
    expect(mkToTimestamp('2026-01-01T00:00:00Z')).toBe(Date.UTC(2026, 0, 1));
    expect(mkToTimestamp({})).toBeNull();
  });

  it('memoises formatters per locale + options and evicts the oldest', () => {
    let created = 0;
    const cache = new MkIntlCache<{ id: number }>(() => ({ id: ++created }), 2);
    const a = cache.get('en', { a: 1 });
    expect(cache.get('en', { a: 1 })).toBe(a);
    cache.get('de', {});
    cache.get('fr', {}); // evicts 'en'
    expect(cache.get('en', { a: 1 })).not.toBe(a);
    expect(created).toBe(4);
  });
});
