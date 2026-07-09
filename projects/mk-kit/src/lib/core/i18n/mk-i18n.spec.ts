import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MK_DEFAULT_I18N, MK_I18N, provideMkI18n } from './mk-i18n';

describe('mk i18n', () => {
  it('defaults to the built-in English strings', () => {
    expect(MK_DEFAULT_I18N.noResults).toBe('No results');
    expect(MK_DEFAULT_I18N.noOptions).toBe('No options');
    expect(MK_DEFAULT_I18N.close).toBe('Close');
    expect(MK_DEFAULT_I18N.sortedBy('Name', 'asc')).toBe(
      'Sorted by Name ascending',
    );
    expect(MK_DEFAULT_I18N.sortedBy('Name', 'desc')).toBe(
      'Sorted by Name descending',
    );
  });

  it('MK_I18N resolves to the defaults with no provider', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    expect(TestBed.inject(MK_I18N).close).toBe('Close');
  });

  it('provideMkI18n merges overrides over the defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18n({ noResults: 'Brak wyników', close: 'Zamknij' }),
      ],
    });
    const i18n = TestBed.inject(MK_I18N);
    expect(i18n.noResults).toBe('Brak wyników');
    expect(i18n.close).toBe('Zamknij');
    // Untouched keys keep the English default.
    expect(i18n.noOptions).toBe('No options');
  });

  it('localises interpolated announcements', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMkI18n({ sortedBy: (col, dir) => `${col} → ${dir}` }),
      ],
    });
    expect(TestBed.inject(MK_I18N).sortedBy('Age', 'desc')).toBe('Age → desc');
  });
});
