import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MK_DEFAULT_I18N,
  MK_I18N,
  type MkI18nStrings,
  provideMkI18n,
} from '@mk-kit/ui/core';
import {
  MK_PL_DATE_NAMES,
  MK_PL_I18N,
  MK_PL_VALIDATION,
  mkPluralPl,
  provideMkI18nPl,
} from './pl';

/**
 * Strings whose Polish form is the same as the English one — proper nouns,
 * key names and abbreviations. Everything else must differ from the default.
 */
const SAME_AS_ENGLISH = new Set([
  'ok',
  'iban',
  'jsonLabel',
  'keypadBackspace',
  'keyboardShift',
  'keyboardEnter',
  'minimum',
  'filterMin',
  'countdownMinutes',
  'queryOperator',
  'blockEditor.link',
  'blockEditor.groupMedia',
  'blockEditor.buttonLink',
]);

type Leaf = { path: string; value: unknown };

/** Flattens a string map into `path → value` leaves (arrays are leaves). */
function leaves(obj: object, prefix = ''): Leaf[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? leaves(value, path)
      : [{ path, value }];
  });
}

/** Sample arguments per function arity — enough to render every template. */
function sampleArgs(fn: (...args: never[]) => unknown, path: string): unknown[] {
  if (path === 'validation.mkMinDate' || path === 'validation.mkMaxDate') {
    return [{ min: new Date(2026, 0, 5), max: new Date(2026, 11, 31), actual: new Date() }];
  }
  if (path.startsWith('validation.')) {
    return [
      {
        min: 1, max: 9, actual: 5, requiredLength: 3, actualLength: 1,
        country: 'PL', expectedLength: 28, example: '00-001', label: 'NIP',
        name: 'a.pdf', maxLabel: '1 MB', accept: '.png',
      },
    ];
  }
  if (path === 'sortedBy') return ['Nazwa', 'asc'];
  if (path === 'passwordStrength') return [3];
  return Array.from({ length: fn.length }, (_, i) => (i === 0 ? 'X' : i + 1));
}

describe('@mk-kit/ui/locales/pl', () => {
  const english = new Map(leaves(MK_DEFAULT_I18N).map((l) => [l.path, l.value]));
  const polish = new Map(leaves(MK_PL_I18N).map((l) => [l.path, l.value]));

  it('covers every key of the English defaults, and no others', () => {
    const missing = [...english.keys()].filter((k) => !polish.has(k));
    const extra = [...polish.keys()].filter(
      (k) => !english.has(k) && k !== 'locale' && k !== 'currency',
    );
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  it('keeps the shape of every key — same kind, arity and table length', () => {
    for (const [path, en] of english) {
      const pl = polish.get(path);
      expect(typeof pl, path).toBe(typeof en);
      if (typeof en === 'function') {
        expect((pl as () => void).length, path).toBe((en as () => void).length);
      }
      if (Array.isArray(en)) {
        expect((pl as unknown[]).length, path).toBe(en.length);
      }
    }
  });

  it('translates every string — nothing left in English except the listed proper nouns', () => {
    const untranslated: string[] = [];
    for (const [path, en] of english) {
      if (SAME_AS_ENGLISH.has(path)) continue;
      const pl = polish.get(path);
      if (typeof en === 'string' && pl === en) untranslated.push(path);
      if (Array.isArray(en) && (pl as unknown[]).every((v, i) => v === en[i])) {
        untranslated.push(path);
      }
    }
    expect(untranslated).toEqual([]);
  });

  it('renders every interpolated string without throwing or leaking "undefined"', () => {
    for (const [path, pl] of polish) {
      if (typeof pl !== 'function') continue;
      const out = (pl as (...a: unknown[]) => unknown)(...sampleArgs(pl as never, path));
      expect(typeof out, path).toBe('string');
      expect(out as string, path).not.toContain('undefined');
      expect((out as string).length, path).toBeGreaterThan(0);
    }
  });

  it('sets the locale and currency for the formatting pipes', () => {
    expect(MK_PL_I18N.locale).toBe('pl-PL');
    expect(MK_PL_I18N.currency).toBe('PLN');
  });

  it('picks CLDR Polish plural forms', () => {
    const w = (n: number) => mkPluralPl(n, 'wynik', 'wyniki', 'wyników');
    expect(w(1)).toBe('wynik');
    expect(w(2)).toBe('wyniki');
    expect(w(4)).toBe('wyniki');
    expect(w(5)).toBe('wyników');
    expect(w(12)).toBe('wyników');
    expect(w(14)).toBe('wyników');
    expect(w(22)).toBe('wyniki');
    expect(w(112)).toBe('wyników');
    expect(w(0)).toBe('wyników');
    expect(w(-3)).toBe('wyniki');
    expect(MK_PL_I18N.resultsCount(1)).toBe('1 wynik');
    expect(MK_PL_I18N.resultsCount(3)).toBe('3 wyniki');
    expect(MK_PL_I18N.resultsCount(25)).toBe('25 wyników');
  });

  it('formats validation messages and date names in Polish', () => {
    expect(MK_PL_VALIDATION.required).toBe('To pole jest wymagane');
    expect(MK_PL_VALIDATION.minlength({ requiredLength: 8, actualLength: 2 })).toBe(
      'Wpisz co najmniej 8 znaków',
    );
    expect(MK_PL_VALIDATION.mkMinDate({ min: new Date(2026, 0, 5), actual: new Date() })).toBe(
      'Data nie może być wcześniejsza niż 5.01.2026',
    );
    expect(MK_PL_DATE_NAMES.months[0]).toBe('styczeń');
    expect(MK_PL_DATE_NAMES.weekdays[0]).toBe('niedziela');
    expect(MK_PL_I18N.sortedBy('Nazwa', 'desc')).toBe('Posortowano według Nazwa malejąco');
  });

  it('provideMkI18nPl provides the pack and merges overrides over it', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18nPl({
          noData: 'Nic tu nie ma',
          validation: { required: 'Wymagane' },
        }),
      ],
    });
    const i18n = TestBed.inject(MK_I18N);
    expect(i18n.noData).toBe('Nic tu nie ma');
    expect(i18n.close).toBe('Zamknij');
    // The rest of the deep-merged validation group stays Polish, not English.
    expect(i18n.validation.required).toBe('Wymagane');
    expect(i18n.validation.email).toBe('Podaj prawidłowy adres e-mail');
    expect(i18n.dateNames.months[11]).toBe('grudzień');
    expect(i18n.blockEditor.addBlock).toBe('Dodaj blok');
  });

  it('is usable as the explicit base of provideMkI18n', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18n({ close: 'Zamknij okno' }, MK_PL_I18N),
      ],
    });
    const i18n: MkI18nStrings = TestBed.inject(MK_I18N);
    expect(i18n.close).toBe('Zamknij okno');
    expect(i18n.noResults).toBe('Brak wyników');
  });
});
