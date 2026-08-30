import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MK_DEFAULT_I18N,
  MK_I18N,
  type MkI18nStrings,
  provideMkI18n,
} from '@mk-kit/ui/core';
import {
  MK_ES_DATE_NAMES,
  MK_ES_I18N,
  MK_ES_VALIDATION,
  mkPluralEs,
  provideMkI18nEs,
} from './es';

/**
 * Strings whose Spanish form is the same as the English one — proper nouns,
 * key names and loanwords. Everything else must differ from the default.
 */
const SAME_AS_ENGLISH = new Set([
  'iban',
  'jsonLabel',
  'zoom',
  'countdownMinutes',
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
        country: 'ES', expectedLength: 24, example: '28001', label: 'NIF',
        name: 'a.pdf', maxLabel: '1 MB', accept: '.png',
      },
    ];
  }
  if (path === 'sortedBy') return ['Nombre', 'asc'];
  if (path === 'passwordStrength') return [3];
  return Array.from({ length: fn.length }, (_, i) => (i === 0 ? 'X' : i + 1));
}

describe('@mk-kit/ui/locales/es', () => {
  const english = new Map(leaves(MK_DEFAULT_I18N).map((l) => [l.path, l.value]));
  const spanish = new Map(leaves(MK_ES_I18N).map((l) => [l.path, l.value]));

  it('covers every key of the English defaults, and no others', () => {
    const missing = [...english.keys()].filter((k) => !spanish.has(k));
    const extra = [...spanish.keys()].filter(
      (k) => !english.has(k) && k !== 'locale' && k !== 'currency',
    );
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  it('keeps the shape of every key — same kind, arity and table length', () => {
    for (const [path, en] of english) {
      const es = spanish.get(path);
      expect(typeof es, path).toBe(typeof en);
      if (typeof en === 'function') {
        expect((es as () => void).length, path).toBe((en as () => void).length);
      }
      if (Array.isArray(en)) {
        expect((es as unknown[]).length, path).toBe(en.length);
      }
    }
  });

  it('translates every string — nothing left in English except the listed loanwords', () => {
    const untranslated: string[] = [];
    for (const [path, en] of english) {
      if (SAME_AS_ENGLISH.has(path)) continue;
      const es = spanish.get(path);
      if (typeof en === 'string' && es === en) untranslated.push(path);
      if (Array.isArray(en) && (es as unknown[]).every((v, i) => v === en[i])) {
        untranslated.push(path);
      }
    }
    expect(untranslated).toEqual([]);
  });

  it('renders every interpolated string without throwing or leaking "undefined"', () => {
    for (const [path, es] of spanish) {
      if (typeof es !== 'function') continue;
      const out = (es as (...a: unknown[]) => unknown)(...sampleArgs(es as never, path));
      expect(typeof out, path).toBe('string');
      expect(out as string, path).not.toContain('undefined');
      expect((out as string).length, path).toBeGreaterThan(0);
    }
  });

  it('sets the locale and currency for the formatting pipes', () => {
    expect(MK_ES_I18N.locale).toBe('es-ES');
    expect(MK_ES_I18N.currency).toBe('EUR');
  });

  it('picks CLDR Spanish plural forms', () => {
    const w = (n: number) => mkPluralEs(n, 'resultado', 'resultados');
    expect(w(1)).toBe('resultado');
    expect(w(0)).toBe('resultados');
    expect(w(2)).toBe('resultados');
    expect(w(21)).toBe('resultados');
    expect(MK_ES_I18N.resultsCount(1)).toBe('1 resultado');
    expect(MK_ES_I18N.resultsCount(3)).toBe('3 resultados');
  });

  it('formats validation messages and date names in Spanish', () => {
    expect(MK_ES_VALIDATION.required).toBe('Este campo es obligatorio');
    expect(MK_ES_VALIDATION.minlength({ requiredLength: 8, actualLength: 2 })).toBe(
      'Introduce al menos 8 caracteres',
    );
    expect(MK_ES_VALIDATION.mkMinDate({ min: new Date(2026, 0, 5), actual: new Date() })).toBe(
      'La fecha no puede ser anterior al 5/1/2026',
    );
    expect(MK_ES_DATE_NAMES.months[0]).toBe('enero');
    expect(MK_ES_DATE_NAMES.weekdays[0]).toBe('domingo');
    expect(MK_ES_I18N.sortedBy('Nombre', 'desc')).toBe('Ordenado por Nombre descendente');
  });

  it('provideMkI18nEs provides the pack and merges overrides over it', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18nEs({
          noData: 'No hay nada aquí',
          validation: { required: 'Obligatorio' },
        }),
      ],
    });
    const i18n = TestBed.inject(MK_I18N);
    expect(i18n.noData).toBe('No hay nada aquí');
    expect(i18n.close).toBe('Cerrar');
    // The rest of the deep-merged validation group stays Spanish, not English.
    expect(i18n.validation.required).toBe('Obligatorio');
    expect(i18n.validation.email).toBe('Introduce una dirección de correo válida');
    expect(i18n.dateNames.months[11]).toBe('diciembre');
    expect(i18n.blockEditor.addBlock).toBe('Añadir bloque');
  });

  it('is usable as the explicit base of provideMkI18n', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18n({ close: 'Cerrar la ventana' }, MK_ES_I18N),
      ],
    });
    const i18n: MkI18nStrings = TestBed.inject(MK_I18N);
    expect(i18n.close).toBe('Cerrar la ventana');
    expect(i18n.noResults).toBe('Sin resultados');
  });
});
