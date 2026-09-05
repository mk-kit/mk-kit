import type { Provider } from '@angular/core';
import {
  type MkBlockEditorStrings,
  type MkDateNames,
  type MkI18nOverrides,
  type MkI18nStrings,
  type MkValidationStrings,
  provideMkI18n,
} from '@mk-kit/ui/core';

/**
 * Picks the Polish plural form for a count: `one` for 1, `few` for 2–4
 * (except 12–14), `many` otherwise — CLDR's `pl` rules for integers, which is
 * all the library's counts ever are.
 *
 * ```ts
 * mkPluralPl(1, 'wynik', 'wyniki', 'wyników');  // 'wynik'
 * mkPluralPl(3, 'wynik', 'wyniki', 'wyników');  // 'wyniki'
 * mkPluralPl(12, 'wynik', 'wyniki', 'wyników'); // 'wyników'
 * ```
 */
export function mkPluralPl(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const plural = mkPluralPl;

/** Polish month and weekday names (Sunday-first, lowercase as in `Intl`). */
export const MK_PL_DATE_NAMES: MkDateNames = {
  months: [
    'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
  ],
  monthsShort: [
    'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
    'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
  ],
  weekdays: [
    'niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota',
  ],
  weekdaysShort: ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'],
  weekdaysNarrow: ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'],
};

/** Polish validation messages rendered by `mk-form-field`. */
export const MK_PL_VALIDATION: MkValidationStrings = {
  required: 'To pole jest wymagane',
  email: 'Podaj prawidłowy adres e-mail',
  min: ({ min }) => `Wartość nie może być mniejsza niż ${min}`,
  max: ({ max }) => `Wartość nie może być większa niż ${max}`,
  minlength: ({ requiredLength }) =>
    `Wpisz co najmniej ${requiredLength} ${plural(requiredLength, 'znak', 'znaki', 'znaków')}`,
  maxlength: ({ requiredLength }) =>
    `Wpisz najwyżej ${requiredLength} ${plural(requiredLength, 'znak', 'znaki', 'znaków')}`,
  pattern: 'Wpisz wartość w oczekiwanym formacie',
  mkMinDate: ({ min }) =>
    `Data nie może być wcześniejsza niż ${min.toLocaleDateString('pl-PL')}`,
  mkMaxDate: ({ max }) =>
    `Data nie może być późniejsza niż ${max.toLocaleDateString('pl-PL')}`,
  mkDateFilter: 'Ta data jest niedostępna',
  mkDateRangeIncomplete: 'Wybierz datę początkową i końcową',
  mkMinTime: ({ min }) => `Godzina nie może być wcześniejsza niż ${min}`,
  mkMaxTime: ({ max }) => `Godzina nie może być późniejsza niż ${max}`,
  mkMaxItems: ({ max }) =>
    `Wybierz najwyżej ${max} ${plural(max, 'element', 'elementy', 'elementów')}`,
  mkFileSize: ({ name, maxLabel }) => `Plik ${name} przekracza ${maxLabel}`,
  mkFileType: ({ name }) => `Plik ${name} ma niedozwolony typ`,
  cardNumber: 'Podaj prawidłowy numer karty',
  iban: ({ expectedLength }) =>
    expectedLength
      ? `Podaj prawidłowy IBAN (${expectedLength} znaków)`
      : 'Podaj prawidłowy IBAN',
  postalCode: ({ example }) => `Podaj prawidłowy kod pocztowy, np. ${example}`,
  taxId: ({ label, example }) => `Podaj prawidłowy ${label}, np. ${example}`,
  unknown: 'Nieprawidłowa wartość',
};

/** Polish strings of the block editor's chrome. */
export const MK_PL_BLOCK_EDITOR: MkBlockEditorStrings = {
  addBlock: 'Dodaj blok',
  addFirstBlock: 'Dodaj pierwszy blok',
  insertBlockHere: 'Wstaw blok tutaj',
  blockInserter: 'Wstawianie bloków',
  searchBlocks: 'Szukaj bloków…',
  blocks: 'Bloki',
  moveBlockUp: 'Przenieś blok w górę',
  moveBlockDown: 'Przenieś blok w dół',
  blockOptions: 'Opcje bloku',
  duplicate: 'Duplikuj',
  remove: 'Usuń',
  textFormatting: 'Formatowanie tekstu',
  altText: 'Tekst alternatywny',
  caption: 'Podpis',
  alignment: 'Wyrównanie',
  replaceImage: 'Zamień obraz',
  imageUrl: 'Adres URL obrazu',
  externalContent: 'Treść zewnętrzna',
  embedUrl: 'Adres URL osadzenia',
  columnSettings: 'Ustawienia kolumn',
  columns: 'Kolumny',
  ratio: 'Proporcje',
  gap: 'Odstęp',
  align: 'Wyrównaj',
  justify: 'Rozmieść',
  headingLevel: (level) => `Nagłówek poziomu ${level}`,
  editorLabel: 'Edytor treści blokowej',
  emptyBlockPlaceholder: 'Wpisz /, aby wybrać blok, lub zacznij pisać…',
  dragHandle: 'Uchwyt przeciągania',
  turnInto: (label) => `Zamień na: ${label}`,
  unknownBlock: (type) => `Nieznany blok: ${type}`,
  blockAdded: (label) => `Dodano: ${label}`,
  blockDuplicated: 'Blok zduplikowany',
  blockDeleted: (label) => `Usunięto: ${label}`,
  blockMovedUp: 'Blok przeniesiony w górę',
  blockMovedDown: 'Blok przeniesiony w dół',
  turnedInto: (label) => `Zamieniono na: ${label}`,
  noBlocksMatch: (query) => `Brak bloków pasujących do „${query}”.`,
  groupText: 'Tekst',
  groupMedia: 'Media',
  groupLayout: 'Układ',
  blockParagraph: 'Akapit',
  blockParagraphDesc: 'Tekst z formatowaniem w wierszu.',
  blockHeading: 'Nagłówek',
  blockHeadingDesc: 'Tytuł sekcji (H1–H4).',
  blockList: 'Lista',
  blockListDesc: 'Lista punktowana lub numerowana.',
  blockQuote: 'Cytat',
  blockQuoteDesc: 'Cytat blokowy z opcjonalnym źródłem.',
  blockCode: 'Kod',
  blockCodeDesc: 'Sformatowany kod o stałej szerokości znaków.',
  blockImage: 'Obraz',
  blockImageDesc: 'Prześlij obraz lub podaj link.',
  blockEmbed: 'Osadzenie',
  blockEmbedDesc: 'YouTube, Vimeo lub dowolny adres URL.',
  blockButton: 'Przycisk',
  blockButtonDesc: 'Przycisk z wezwaniem do działania.',
  blockDivider: 'Separator',
  blockDividerDesc: 'Pozioma linia oddzielająca.',
  blockColumns: 'Kolumny',
  blockColumnsDesc: 'Responsywny układ wielokolumnowy.',
  bold: 'Pogrubienie',
  italic: 'Kursywa',
  underline: 'Podkreślenie',
  strikethrough: 'Przekreślenie',
  inlineCode: 'Kod w wierszu',
  link: 'Link',
  clearFormatting: 'Wyczyść formatowanie',
  linkUrlPrompt: 'Adres URL linku',
  editableText: 'Tekst do edycji',
  headingPlaceholder: (level) => `Nagłówek ${level}`,
  headingLevelGroup: 'Poziom nagłówka',
  listStyle: 'Styl listy',
  bulleted: 'Punktowana',
  numbered: 'Numerowana',
  listItem: 'Element listy',
  quoteText: 'Treść cytatu',
  citation: 'Źródło',
  addCitation: '— Dodaj źródło',
  codeLanguage: 'Język kodu',
  codeLanguagePlaceholder: 'język (opcjonalnie)',
  enterCode: 'Wpisz kod…',
  imageWidth: (percent) => `Szerokość: ${percent}%`,
  uploading: 'Przesyłanie…',
  dropImagePrompt: 'Przeciągnij i upuść obraz lub',
  chooseFile: 'Wybierz plik',
  pasteImageUrl: '…albo wklej adres URL obrazu',
  notAnImage: 'Wybierz plik graficzny.',
  uploadFailed: 'Przesyłanie nie powiodło się. Spróbuj ponownie lub wklej adres URL.',
  imageAdded: 'Dodano obraz',
  pasteEmbedUrl: 'Wklej adres URL z YouTube, Vimeo lub inny…',
  embedFallbackNote: 'Tego adresu nie da się osadzić, ale zostanie wyświetlony jako link.',
  embedTitle: (provider) => `Osadzenie ${provider}`,
  embedAdded: (provider) => `Dodano osadzenie ${provider}`,
  embeddedContent: 'Osadzona treść',
  buttonLabel: 'Etykieta',
  buttonLink: 'Link (href)',
  buttonTone: 'Ton',
  buttonVariant: 'Wariant',
  buttonDefaultLabel: 'Kliknij',
  alignLeft: 'Do lewej',
  alignCenter: 'Do środka',
  alignRight: 'Do prawej',
  tonePrimary: 'Główny',
  toneNeutral: 'Neutralny',
  toneSuccess: 'Sukces',
  toneWarning: 'Ostrzeżenie',
  toneDanger: 'Niebezpieczeństwo',
  toneInfo: 'Informacja',
  variantSolid: 'Wypełniony',
  variantSoft: 'Delikatny',
  variantOutline: 'Obrys',
  ratioEqual: 'Równe',
  alignStretch: 'Rozciągnij',
  alignTop: 'Góra',
  alignMiddle: 'Środek',
  alignBottom: 'Dół',
  justifyStart: 'Początek',
  justifyCenter: 'Środek',
  justifyEnd: 'Koniec',
  justifyBetween: 'Równomiernie',
};

const PASSWORD_STRENGTH_LABELS = ['Słabe', 'Słabe', 'Przeciętne', 'Dobre', 'Silne'];

/**
 * The complete Polish string map — every key of {@link MkI18nStrings},
 * `locale: 'pl-PL'` and `currency: 'PLN'` for the formatting pipes.
 * Provide it whole with {@link provideMkI18nPl}, or pass it as the base of
 * `provideMkI18n(overrides, MK_PL_I18N)`.
 */
export const MK_PL_I18N: MkI18nStrings = {
  locale: 'pl-PL',
  currency: 'PLN',

  validation: MK_PL_VALIDATION,

  close: 'Zamknij',
  dismiss: 'Odrzuć',
  clear: 'Wyczyść',
  confirm: 'Potwierdź',
  cancel: 'Anuluj',
  ok: 'OK',
  save: 'Zapisz',
  submit: 'Wyślij',
  edit: 'Edytuj',
  remove: 'Usuń',
  removeItem: (name) => `Usuń ${name}`,
  empty: 'Puste',
  optional: 'Opcjonalne',
  filter: 'Filtruj…',
  confirmMessage: 'Czy na pewno?',
  decrease: 'Zmniejsz',
  increase: 'Zwiększ',

  loading: 'Ładowanie…',
  noOptions: 'Brak opcji',
  noResults: 'Brak wyników',
  noData: 'Brak danych do wyświetlenia',
  translationEditorSearch: 'Szukaj kluczy i tekstu',
  translationEditorAll: 'Wszystkie',
  translationEditorOverridden: 'Zmienione',
  translationEditorMissing: 'Brakujące',
  translationEditorKey: 'Klucz',
  translationEditorReset: 'Przywróć oryginalny tekst',
  translationEditorExport: 'Eksportuj CSV',
  translationEditorKeys: 'kluczy',
  sessionExpiryTitle: 'Sesja zaraz wygaśnie',
  sessionExpiryExtend: 'Zostaję — przedłuż sesję',
  sessionExpiryExtending: 'Przedłużam…',
  sessionExpiryLogout: 'Wyloguj teraz',
  sessionExpiryBody: (countdown) => `Ze względów bezpieczeństwa zostaniesz wylogowany za ${countdown}. Niezapisane zmiany zostaną utracone.`,
  resultsCount: (count) =>
    `${count} ${plural(count, 'wynik', 'wyniki', 'wyników')}`,

  previousPage: 'Przejdź do poprzedniej strony',
  nextPage: 'Przejdź do następnej strony',
  goToPage: (page) => `Przejdź do strony ${page}`,
  paginationLabel: 'Paginacja',
  previousSlide: 'Poprzedni slajd',
  nextSlide: 'Następny slajd',
  goToSlide: (slide) => `Przejdź do slajdu ${slide}`,
  carouselLabel: 'Karuzela',
  pauseSlideshow: 'Wstrzymaj pokaz slajdów',
  playSlideshow: 'Wznów pokaz slajdów',
  slideOf: (slide, total) => `Slajd ${slide} z ${total}`,

  dateNames: MK_PL_DATE_NAMES,
  previousMonth: 'Poprzedni miesiąc',
  nextMonth: 'Następny miesiąc',
  previousYear: 'Poprzedni rok',
  nextYear: 'Następny rok',
  previousYears: 'Poprzednie lata',
  nextYears: 'Następne lata',
  selectDate: 'Wybierz datę…',
  selectRange: 'Wybierz zakres…',
  selectTime: 'Wybierz godzinę…',
  selectMonth: 'Wybierz miesiąc…',
  selectYear: 'Wybierz rok…',
  selectWeek: 'Wybierz tydzień…',
  selectPlaceholder: 'Wybierz…',
  chooseDate: 'Wybór daty',
  chooseDateRange: 'Wybór zakresu dat',
  chooseMonth: 'Wybór miesiąca',
  chooseYear: 'Wybór roku',
  chooseWeek: 'Wybór tygodnia',
  openCalendar: 'Otwórz kalendarz',
  openTimeList: 'Otwórz listę godzin',
  moreActions: 'Więcej akcji',
  selectDateTime: 'Wybierz datę i godzinę…',
  chooseDateTime: 'Wybór daty i godziny',
  chooseTime: 'Wybór godziny',
  openDateTimePicker: 'Otwórz wybór daty i godziny',
  daySegment: 'Dzień',
  monthSegment: 'Miesiąc',
  yearSegment: 'Rok',
  countdownDays: 'dni',
  countdownHours: 'godz.',
  countdownMinutes: 'min',
  countdownSeconds: 'sek.',
  countdownFinished: 'Zakończono',
  dayEvents: (count, titles) =>
    `${count} ${plural(count, 'wydarzenie', 'wydarzenia', 'wydarzeń')}${titles ? `: ${titles}` : ''}`,
  moreEvents: (count) => `+${count} więcej`,

  selectAllRows: 'Zaznacz wszystkie wiersze',
  selectRow: (row) => (row ? `Zaznacz wiersz ${row}` : 'Zaznacz wiersz'),
  expandHeader: 'Rozwiń',
  expandRow: 'Rozwiń wiersz',
  collapseRow: 'Zwiń wiersz',
  expandTreeRow: 'Pokaż wiersze podrzędne',
  collapseTreeRow: 'Ukryj wiersze podrzędne',
  expandGroup: 'Rozwiń grupę',
  collapseGroup: 'Zwiń grupę',
  groupCount: (count) =>
    `${count} ${plural(count, 'element', 'elementy', 'elementów')}`,
  resizeColumn: 'Zmień szerokość kolumny',
  columnWidth: (column, width) => `Szerokość kolumny ${column}: ${width} px`,
  columnMoved: (column, position, total) =>
    `Kolumna ${column} przeniesiona na pozycję ${position} z ${total}`,
  editCell: 'Naciśnij Enter, aby edytować',
  cellSaved: (value) => `Zapisano ${value}`,
  sortedBy: (column, direction) =>
    `Posortowano według ${column} ${direction === 'asc' ? 'rosnąco' : 'malejąco'}`,
  sortingCleared: (column) => `Usunięto sortowanie według ${column}`,

  showPassword: 'Pokaż hasło',
  hidePassword: 'Ukryj hasło',
  passwordRuleMinLength: (length) =>
    `Co najmniej ${length} ${plural(length, 'znak', 'znaki', 'znaków')}`,
  passwordRuleUppercase: 'Wielka litera',
  passwordRuleNumber: 'Cyfra',
  passwordRuleSymbol: 'Znak specjalny',
  passwordStrength: (score) =>
    PASSWORD_STRENGTH_LABELS[Math.max(0, Math.min(4, score))],
  passwordStrengthLabel: 'Siła hasła:',
  ruleMet: 'Spełnione:',
  ruleNotMet: 'Niespełnione:',
  oneTimeCode: 'Kod jednorazowy',
  otpDigit: (position) => `Cyfra ${position}`,
  numericKeypadLabel: 'Klawiatura numeryczna',
  keypadClear: 'Wyczyść',
  keypadBackspace: 'Backspace',
  keypadDigitsEntered: (count, length) => `Wpisano ${count} z ${length} cyfr`,
  onScreenKeyboardLabel: 'Klawiatura ekranowa',
  keyboardShift: 'Shift',
  keyboardSpace: 'Spacja',
  keyboardEnter: 'Enter',
  keyboardAltLayer: 'Więcej znaków',
  keyboardBaseLayer: 'Litery',
  ratingLabel: 'Ocena',
  ratingValueText: (value, max) =>
    `${value} z ${max} ${plural(max, 'gwiazdki', 'gwiazdek', 'gwiazdek')}`,
  minimum: 'Minimum',
  maximum: 'Maksimum',
  chooseColor: 'Wybierz kolor',
  hexValue: 'Wartość szesnastkowa',
  presetColors: 'Predefiniowane kolory',
  chooseCountry: 'Wybierz kraj',
  searchCountries: 'Szukaj kraju…',
  phoneNumber: 'Numer telefonu',
  postalCode: 'Kod pocztowy',
  amount: 'Kwota',
  cardNumber: 'Numer karty',
  cardBrand: (brand) => `Typ karty: ${brand}`,
  iban: 'IBAN',
  taxId: 'Numer identyfikacji podatkowej',
  signature: 'Podpis',
  jsonLabel: 'JSON',

  logViewerLabel: 'Dziennik zdarzeń',
  logFollow: 'Śledź',
  logCopyAll: 'Kopiuj dziennik',
  logWrapLines: 'Zawijaj wiersze',

  orgChartLabel: 'Schemat organizacyjny',
  orgChartExpand: 'Rozwiń {label}',
  orgChartCollapse: 'Zwiń {label}',

  chatLabel: 'Rozmowa',
  chatComposerLabel: 'Wiadomość',
  chatPlaceholder: 'Napisz wiadomość…',
  chatSend: 'Wyślij',
  chatStop: 'Zatrzymaj generowanie',
  chatAttach: 'Dołącz pliki',
  chatRemoveAttachment: 'Usuń załącznik',
  chatAttachments: 'Załączniki',
  chatSuggestions: 'Sugestie',
  chatCopy: 'Kopiuj wiadomość',
  chatRetry: 'Ponów',
  chatTyping: 'Pisze…',
  chatStreaming: 'Generowanie…',
  chatJumpToLatest: 'Przejdź do najnowszych',
  chatEmpty: 'Brak wiadomości',
  chatYou: 'Ty',
  chatAssistant: 'Asystent',
  chatToolRunning: 'W toku',
  chatToolDone: 'Gotowe',
  chatToolError: 'Niepowodzenie',

  dynamicFormAdd: 'Dodaj',
  dynamicFormRemove: (index) => `Usuń element ${index}`,

  queryBuilderLabel: 'Warunki filtrowania',
  queryAddRule: 'Dodaj regułę',
  queryAddGroup: 'Dodaj grupę',
  queryRemoveRule: 'Usuń regułę',
  queryRemoveGroup: 'Usuń grupę',
  queryAnd: 'Oraz',
  queryOr: 'Lub',
  queryNot: 'Nie',
  queryField: 'Pole',
  queryOperator: 'Operator',
  queryValue: 'Wartość',
  queryValueFrom: 'Od',
  queryValueTo: 'Do',
  queryEmptyGroup: 'Brak warunków',
  queryTrue: 'Prawda',
  queryFalse: 'Fałsz',
  queryOpEq: 'równa się',
  queryOpNeq: 'różni się od',
  queryOpContains: 'zawiera',
  queryOpNotContains: 'nie zawiera',
  queryOpStartsWith: 'zaczyna się od',
  queryOpEndsWith: 'kończy się na',
  queryOpGt: 'większe niż',
  queryOpGte: 'co najmniej',
  queryOpLt: 'mniejsze niż',
  queryOpLte: 'co najwyżej',
  queryOpBetween: 'pomiędzy',
  queryOpIn: 'jest jednym z',
  queryOpNotIn: 'nie jest żadnym z',
  queryOpBefore: 'przed',
  queryOpAfter: 'po',
  queryOpEmpty: 'jest puste',
  queryOpNotEmpty: 'nie jest puste',

  dialogMove: 'Przesuń okno (strzałki; Home przywraca)',
  dialogResize: 'Zmień rozmiar okna (strzałki; Home przywraca)',

  listboxFilter: 'Filtruj opcje',
  listboxEmpty: 'Brak pasujących opcji',

  eventCalendarGrabbed: (title, from, to) =>
    `Podniesiono ${title}, ${from} – ${to}. Strzałki przesuwają, ` +
    'Shift ze strzałką w górę lub w dół zmienia godzinę zakończenia, ' +
    'Enter zapisuje, Escape anuluje.',
  eventCalendarPosition: (title, day, from, to) =>
    `${title}, ${day}, ${from} – ${to}.`,
  eventCalendarMoved: (title, day, from, to) =>
    `${title} przeniesiono na ${day}, ${from} – ${to}.`,
  eventCalendarResized: (title, to) => `${title} kończy się teraz o ${to}.`,
  eventCalendarEditCancelled:
    'Przenoszenie anulowane. Wydarzenie zachowuje pierwotny termin.',
  eventCalendarMovableEvent: 'Wydarzenie przesuwalne',

  previousImage: 'Poprzedni obraz',
  nextImage: 'Następny obraz',
  imageOf: (index, total) => `Obraz ${index} z ${total}`,
  viewImage: (alt) => (alt ? `Zobacz ${alt}` : 'Zobacz obraz'),
  imageFailed: 'Nie udało się wczytać obrazu',
  zoom: 'Powiększenie',
  zoomIn: 'Powiększ',
  zoomOut: 'Pomniejsz',
  mediaLibrary: 'Biblioteka mediów',
  dropzoneLabel: 'Przeciągnij pliki tutaj lub kliknij, aby wybrać',
  uploadFailed: 'Przesyłanie nie powiodło się',
  retryUpload: 'Ponów przesyłanie',
  errorSummaryTitle: 'Wystąpił problem',

  available: 'Dostępne',
  selected: 'Wybrane',
  transferSelected: (target) => `Przenieś zaznaczone do: ${target}`,
  transferAll: (target) => `Przenieś wszystkie do: ${target}`,
  itemsMoved: (count, target) =>
    `Przeniesiono ${count} ${plural(count, 'element', 'elementy', 'elementów')} do: ${target}`,

  notificationsTitle: 'Powiadomienia',
  allCaughtUp: 'Wszystko przeczytane',
  markAllRead: 'Oznacz wszystkie jako przeczytane',
  notificationsUnread: (count) =>
    `Powiadomienia, ${count} ${plural(count, 'nieprzeczytane', 'nieprzeczytane', 'nieprzeczytanych')}`,
  unread: 'Nieprzeczytane',
  tourStepOf: (step, total) => `Krok ${step} z ${total}`,
  tourSkip: 'Pomiń',
  tourPrevious: 'Wstecz',
  tourNext: 'Dalej',
  tourDone: 'Gotowe',

  commandPalettePlaceholder: 'Wpisz polecenie lub szukaj…',
  commandPaletteLabel: 'Paleta poleceń',
  stepCompleted: 'Ukończono',
  stepError: 'Zawiera błędy',
  diffAddedLine: 'Dodano:',
  diffRemovedLine: 'Usunięto:',
  itemAdded: (name) => `Dodano ${name}`,
  itemRemoved: (name) => `Usunięto ${name}`,
  resizePanes: 'Zmień rozmiar paneli',
  backToTop: 'Wróć na górę',
  breadcrumbLabel: 'Ścieżka nawigacji',
  fabLabel: 'Akcje',
  diffBefore: 'Przed',
  diffAfter: 'Po',
  diffChanges: 'Zmiany',
  skipToContent: 'Przejdź do treści',
  primaryNav: 'Główna',

  dndPickedUp: (position, total) =>
    `Podniesiono. Element ${position} z ${total}. ` +
    'Strzałki przesuwają, spacja lub Enter upuszcza, Escape anuluje.',
  dndMoved: (position, total) => `Przeniesiono na pozycję ${position} z ${total}.`,
  dndMovedToList: (list, position, total) =>
    `Przeniesiono do: ${list}, pozycja ${position} z ${total}.`,
  dndDropped: (position) => `Upuszczono na pozycji ${position}.`,
  dndMovedToZone: (zone) => `Przeniesiono do: ${zone}. Spacja lub Enter upuszcza tutaj.`,
  dndDroppedInZone: (zone) => `Upuszczono w: ${zone}.`,
  dndCancelled: 'Przenoszenie anulowane. Element wrócił na pierwotne miejsce.',

  repeaterAddRow: 'Dodaj wiersz',
  repeaterRemoveRow: (index) => `Usuń wiersz ${index}`,
  repeaterReorderRow: (index) => `Zmień kolejność wiersza ${index}`,
  repeaterRowMoved: (from, to) =>
    `Wiersz przeniesiony z pozycji ${from} na pozycję ${to}.`,

  fileRejectedType: (name) => `${name}: nieobsługiwany typ`,
  fileRejectedSize: (name, limit) => `${name}: przekracza ${limit}`,
  fileRejectedCount: (name, max) =>
    `${name}: przekroczono limit ${max} ${plural(max, 'pliku', 'plików', 'plików')}`,

  chartCategory: 'Kategoria',
  chartValue: 'Wartość',
  chartSeries: 'Seria',
  chartSlice: 'Wycinek',
  chartStage: 'Etap',
  chartConversion: 'Konwersja',
  chartAxis: 'Oś',
  chartShare: 'Udział',
  chartLabel: 'Etykieta',

  qrCodeLabel: (text) => `Kod QR: ${text}`,

  sortableListLabel: 'Lista z możliwością sortowania',
  filterColumn: (column) => `Filtruj ${column}`,
  clearFilter: (column) => `Wyczyść filtr kolumny ${column}`,
  filterAny: 'Wszystkie',
  filterMin: 'Min',

  blockEditor: MK_PL_BLOCK_EDITOR,
};

/**
 * Provides the Polish strings — {@link MK_PL_I18N} with any `overrides`
 * merged on top (deep for `dateNames`, `blockEditor` and `validation`, like
 * `provideMkI18n`).
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMkI18nPl({ noData: 'Nic tu nie ma' })],
 * });
 * ```
 */
export function provideMkI18nPl(overrides: MkI18nOverrides = {}): Provider {
  return provideMkI18n(overrides, MK_PL_I18N);
}
