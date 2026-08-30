import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MK_DEFAULT_I18N,
  MK_I18N,
  type MkI18nStrings,
  provideMkI18n,
} from '@mk-kit/ui/core';
import {
  MK_UK_DATE_NAMES,
  MK_UK_I18N,
  MK_UK_VALIDATION,
  mkPluralUk,
  provideMkI18nUk,
} from './uk';

/**
 * Strings whose Ukrainian form is the same as the English one — proper nouns,
 * key names and abbreviations. Everything else must differ from the default.
 */
const SAME_AS_ENGLISH = new Set([
  'ok',
  'iban',
  'jsonLabel',
  'keypadBackspace',
  'keyboardShift',
  'keyboardEnter',
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
        country: 'UA', expectedLength: 29, example: '01001', label: 'РНОКПП',
        name: 'a.pdf', maxLabel: '1 MB', accept: '.png',
      },
    ];
  }
  if (path === 'sortedBy') return ['Назва', 'asc'];
  if (path === 'passwordStrength') return [3];
  return Array.from({ length: fn.length }, (_, i) => (i === 0 ? 'X' : i + 1));
}

describe('@mk-kit/ui/locales/uk', () => {
  const english = new Map(leaves(MK_DEFAULT_I18N).map((l) => [l.path, l.value]));
  const ukrainian = new Map(leaves(MK_UK_I18N).map((l) => [l.path, l.value]));

  it('covers every key of the English defaults, and no others', () => {
    const missing = [...english.keys()].filter((k) => !ukrainian.has(k));
    const extra = [...ukrainian.keys()].filter(
      (k) => !english.has(k) && k !== 'locale' && k !== 'currency',
    );
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  it('keeps the shape of every key — same kind, arity and table length', () => {
    for (const [path, en] of english) {
      const uk = ukrainian.get(path);
      expect(typeof uk, path).toBe(typeof en);
      if (typeof en === 'function') {
        expect((uk as () => void).length, path).toBe((en as () => void).length);
      }
      if (Array.isArray(en)) {
        expect((uk as unknown[]).length, path).toBe(en.length);
      }
    }
  });

  it('translates every string — nothing left in English except the listed proper nouns', () => {
    const untranslated: string[] = [];
    for (const [path, en] of english) {
      if (SAME_AS_ENGLISH.has(path)) continue;
      const uk = ukrainian.get(path);
      if (typeof en === 'string' && uk === en) untranslated.push(path);
      if (Array.isArray(en) && (uk as unknown[]).every((v, i) => v === en[i])) {
        untranslated.push(path);
      }
    }
    expect(untranslated).toEqual([]);
  });

  it('renders every interpolated string without throwing or leaking "undefined"', () => {
    for (const [path, uk] of ukrainian) {
      if (typeof uk !== 'function') continue;
      const out = (uk as (...a: unknown[]) => unknown)(...sampleArgs(uk as never, path));
      expect(typeof out, path).toBe('string');
      expect(out as string, path).not.toContain('undefined');
      expect((out as string).length, path).toBeGreaterThan(0);
    }
  });

  it('sets the locale and currency for the formatting pipes', () => {
    expect(MK_UK_I18N.locale).toBe('uk-UA');
    expect(MK_UK_I18N.currency).toBe('UAH');
  });

  it('picks CLDR Ukrainian plural forms', () => {
    const w = (n: number) => mkPluralUk(n, 'результат', 'результати', 'результатів');
    expect(w(1)).toBe('результат');
    expect(w(21)).toBe('результат');
    expect(w(2)).toBe('результати');
    expect(w(4)).toBe('результати');
    expect(w(5)).toBe('результатів');
    expect(w(11)).toBe('результатів');
    expect(w(12)).toBe('результатів');
    expect(w(14)).toBe('результатів');
    expect(w(22)).toBe('результати');
    expect(w(111)).toBe('результатів');
    expect(w(0)).toBe('результатів');
    expect(w(-3)).toBe('результати');
    expect(MK_UK_I18N.resultsCount(1)).toBe('1 результат');
    expect(MK_UK_I18N.resultsCount(3)).toBe('3 результати');
    expect(MK_UK_I18N.resultsCount(25)).toBe('25 результатів');
  });

  it('formats validation messages and date names in Ukrainian', () => {
    expect(MK_UK_VALIDATION.required).toBe('Це поле є обовʼязковим');
    expect(MK_UK_VALIDATION.minlength({ requiredLength: 8, actualLength: 2 })).toBe(
      'Введіть щонайменше 8 символів',
    );
    expect(MK_UK_VALIDATION.mkMinDate({ min: new Date(2026, 0, 5), actual: new Date() })).toBe(
      'Дата не може бути ранішою за 05.01.2026',
    );
    expect(MK_UK_DATE_NAMES.months[0]).toBe('січень');
    expect(MK_UK_DATE_NAMES.weekdays[0]).toBe('неділя');
    expect(MK_UK_I18N.sortedBy('Назва', 'desc')).toBe('Відсортовано за Назва за спаданням');
  });

  it('provideMkI18nUk provides the pack and merges overrides over it', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18nUk({
          noData: 'Тут нічого немає',
          validation: { required: 'Обовʼязково' },
        }),
      ],
    });
    const i18n = TestBed.inject(MK_I18N);
    expect(i18n.noData).toBe('Тут нічого немає');
    expect(i18n.close).toBe('Закрити');
    // The rest of the deep-merged validation group stays Ukrainian, not English.
    expect(i18n.validation.required).toBe('Обовʼязково');
    expect(i18n.validation.email).toBe('Введіть дійсну адресу електронної пошти');
    expect(i18n.dateNames.months[11]).toBe('грудень');
    expect(i18n.blockEditor.addBlock).toBe('Додати блок');
  });

  it('is usable as the explicit base of provideMkI18n', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18n({ close: 'Закрити вікно' }, MK_UK_I18N),
      ],
    });
    const i18n: MkI18nStrings = TestBed.inject(MK_I18N);
    expect(i18n.close).toBe('Закрити вікно');
    expect(i18n.noResults).toBe('Немає результатів');
  });
});
