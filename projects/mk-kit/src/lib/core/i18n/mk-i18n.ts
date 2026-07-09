import { InjectionToken, type Provider } from '@angular/core';

/** Direction passed to the sort announcer. */
export type MkSortAnnounceDirection = 'asc' | 'desc';

/**
 * All user-facing strings the library renders itself (aria-labels, empty-state
 * text and screen-reader announcements). Consumers localise the library by
 * overriding any subset via {@link provideMkI18n}. Interpolated strings are
 * functions so translators control word order.
 */
export interface MkI18nStrings {
  /** Generic "Close" control (dialog, drawer, bottom-sheet). */
  close: string;
  /** Generic "Dismiss" control (alert, banner). */
  dismiss: string;
  /** Clear-input control (autocomplete). */
  clear: string;
  /** Async loading row (autocomplete, multi-select). */
  loading: string;
  /** Empty listbox with no options (select). */
  noOptions: string;
  /** Empty async/filtered results (autocomplete, multi-select, command palette). */
  noResults: string;
  /** Empty data table. */
  noData: string;
  /** Pagination: previous page control. */
  previousPage: string;
  /** Pagination: next page control. */
  nextPage: string;
  /** Calendar: previous month control. */
  previousMonth: string;
  /** Calendar: next month control. */
  nextMonth: string;
  /** Carousel: previous slide control. */
  previousSlide: string;
  /** Carousel: next slide control. */
  nextSlide: string;
  /** Announced when a column is sorted. */
  sortedBy: (column: string, direction: MkSortAnnounceDirection) => string;
  /** Announced when sorting is removed from a column. */
  sortingCleared: (column: string) => string;
}

/** The built-in English strings. */
export const MK_DEFAULT_I18N: MkI18nStrings = {
  close: 'Close',
  dismiss: 'Dismiss',
  clear: 'Clear',
  loading: 'Loading…',
  noOptions: 'No options',
  noResults: 'No results',
  noData: 'No data to display',
  previousPage: 'Go to previous page',
  nextPage: 'Go to next page',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  sortedBy: (column, direction) =>
    `Sorted by ${column} ${direction === 'asc' ? 'ascending' : 'descending'}`,
  sortingCleared: (column) => `Sorting cleared on ${column}`,
};

/**
 * The active string map. Defaults to {@link MK_DEFAULT_I18N}; override with
 * {@link provideMkI18n}. Inject it (`inject(MK_I18N)`) wherever a built-in
 * string is rendered.
 */
export const MK_I18N = new InjectionToken<MkI18nStrings>('MK_I18N', {
  providedIn: 'root',
  factory: () => MK_DEFAULT_I18N,
});

/**
 * Provide localised strings (merged over the English defaults) — pass any subset.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMkI18n({ noResults: 'Brak wyników', close: 'Zamknij' })],
 * });
 * ```
 */
export function provideMkI18n(overrides: Partial<MkI18nStrings>): Provider {
  return { provide: MK_I18N, useValue: { ...MK_DEFAULT_I18N, ...overrides } };
}
