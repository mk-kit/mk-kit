import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MK_DEFAULT_I18N,
  MK_I18N,
  type MkI18nStrings,
  provideMkI18n,
} from '@mk-kit/ui/core';
import {
  MK_FR_DATE_NAMES,
  MK_FR_I18N,
  MK_FR_VALIDATION,
  mkPluralFr,
  provideMkI18nFr,
} from './fr';

/**
 * Strings whose French form is the same as the English one — proper nouns,
 * key names and shared vocabulary. Everything else must differ from the
 * default.
 */
const SAME_AS_ENGLISH = new Set([
  'ok',
  'iban',
  'jsonLabel',
  'zoom',
  'minimum',
  'maximum',
  'countdownMinutes',
  'paginationLabel',
  'signature',
  'chatLabel',
  'chatComposerLabel',
  'chatSuggestions',
  'chatAssistant',
  'notificationsTitle',
  'fabLabel',
  'chartConversion',
  'blockEditor.blockCode',
  'blockEditor.blockImage',
  'blockEditor.toneDanger',
  'blockEditor.toneInfo',
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
        country: 'FR', expectedLength: 27, example: '75001', label: 'SIREN',
        name: 'a.pdf', maxLabel: '1 MB', accept: '.png',
      },
    ];
  }
  if (path === 'sortedBy') return ['Nom', 'asc'];
  if (path === 'passwordStrength') return [3];
  return Array.from({ length: fn.length }, (_, i) => (i === 0 ? 'X' : i + 1));
}

describe('@mk-kit/ui/locales/fr', () => {
  const english = new Map(leaves(MK_DEFAULT_I18N).map((l) => [l.path, l.value]));
  const french = new Map(leaves(MK_FR_I18N).map((l) => [l.path, l.value]));

  it('covers every key of the English defaults, and no others', () => {
    const missing = [...english.keys()].filter((k) => !french.has(k));
    const extra = [...french.keys()].filter(
      (k) => !english.has(k) && k !== 'locale' && k !== 'currency',
    );
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  it('keeps the shape of every key — same kind, arity and table length', () => {
    for (const [path, en] of english) {
      const fr = french.get(path);
      expect(typeof fr, path).toBe(typeof en);
      if (typeof en === 'function') {
        expect((fr as () => void).length, path).toBe((en as () => void).length);
      }
      if (Array.isArray(en)) {
        expect((fr as unknown[]).length, path).toBe(en.length);
      }
    }
  });

  it('translates every string — nothing left in English except the listed shared words', () => {
    const untranslated: string[] = [];
    for (const [path, en] of english) {
      if (SAME_AS_ENGLISH.has(path)) continue;
      const fr = french.get(path);
      if (typeof en === 'string' && fr === en) untranslated.push(path);
      if (Array.isArray(en) && (fr as unknown[]).every((v, i) => v === en[i])) {
        untranslated.push(path);
      }
    }
    expect(untranslated).toEqual([]);
  });

  it('renders every interpolated string without throwing or leaking "undefined"', () => {
    for (const [path, fr] of french) {
      if (typeof fr !== 'function') continue;
      const out = (fr as (...a: unknown[]) => unknown)(...sampleArgs(fr as never, path));
      expect(typeof out, path).toBe('string');
      expect(out as string, path).not.toContain('undefined');
      expect((out as string).length, path).toBeGreaterThan(0);
    }
  });

  it('sets the locale and currency for the formatting pipes', () => {
    expect(MK_FR_I18N.locale).toBe('fr-FR');
    expect(MK_FR_I18N.currency).toBe('EUR');
  });

  it('picks CLDR French plural forms (0 and 1 are singular)', () => {
    const w = (n: number) => mkPluralFr(n, 'résultat', 'résultats');
    expect(w(0)).toBe('résultat');
    expect(w(1)).toBe('résultat');
    expect(w(2)).toBe('résultats');
    expect(w(21)).toBe('résultats');
    expect(MK_FR_I18N.resultsCount(1)).toBe('1 résultat');
    expect(MK_FR_I18N.resultsCount(3)).toBe('3 résultats');
  });

  it('formats validation messages and date names in French', () => {
    expect(MK_FR_VALIDATION.required).toBe('Ce champ est obligatoire');
    expect(MK_FR_VALIDATION.minlength({ requiredLength: 8, actualLength: 2 })).toBe(
      'Saisissez au moins 8 caractères',
    );
    expect(MK_FR_VALIDATION.mkMinDate({ min: new Date(2026, 0, 5), actual: new Date() })).toBe(
      'La date ne peut pas être antérieure au 05/01/2026',
    );
    expect(MK_FR_DATE_NAMES.months[0]).toBe('janvier');
    expect(MK_FR_DATE_NAMES.weekdays[0]).toBe('dimanche');
    expect(MK_FR_I18N.sortedBy('Nom', 'desc')).toBe('Trié par Nom décroissant');
  });

  it('provideMkI18nFr provides the pack and merges overrides over it', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18nFr({
          noData: 'Rien à afficher ici',
          validation: { required: 'Obligatoire' },
        }),
      ],
    });
    const i18n = TestBed.inject(MK_I18N);
    expect(i18n.noData).toBe('Rien à afficher ici');
    expect(i18n.close).toBe('Fermer');
    // The rest of the deep-merged validation group stays French, not English.
    expect(i18n.validation.required).toBe('Obligatoire');
    expect(i18n.validation.email).toBe('Saisissez une adresse e-mail valide');
    expect(i18n.dateNames.months[11]).toBe('décembre');
    expect(i18n.blockEditor.addBlock).toBe('Ajouter un bloc');
  });

  it('is usable as the explicit base of provideMkI18n', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18n({ close: 'Fermer la fenêtre' }, MK_FR_I18N),
      ],
    });
    const i18n: MkI18nStrings = TestBed.inject(MK_I18N);
    expect(i18n.close).toBe('Fermer la fenêtre');
    expect(i18n.noResults).toBe('Aucun résultat');
  });
});
