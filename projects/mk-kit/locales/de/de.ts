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
 * Picks the German plural form for a count — CLDR's `de` rules for integers:
 * `one` for 1, `other` for everything else.
 *
 * ```ts
 * mkPluralDe(1, 'Ergebnis', 'Ergebnisse'); // 'Ergebnis'
 * mkPluralDe(3, 'Ergebnis', 'Ergebnisse'); // 'Ergebnisse'
 * ```
 */
export function mkPluralDe(count: number, one: string, other: string): string {
  return Math.abs(Math.trunc(count)) === 1 ? one : other;
}

const plural = mkPluralDe;

/** German month and weekday names (Sunday-first, as in `Intl`). */
export const MK_DE_DATE_NAMES: MkDateNames = {
  months: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ],
  monthsShort: [
    'Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni',
    'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.',
  ],
  weekdays: [
    'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag',
  ],
  weekdaysShort: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
  weekdaysNarrow: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
};

/** German validation messages rendered by `mk-form-field`. */
export const MK_DE_VALIDATION: MkValidationStrings = {
  required: 'Dieses Feld ist erforderlich',
  email: 'Geben Sie eine gültige E-Mail-Adresse ein',
  min: ({ min }) => `Der Wert darf nicht kleiner als ${min} sein`,
  max: ({ max }) => `Der Wert darf nicht größer als ${max} sein`,
  minlength: ({ requiredLength }) =>
    `Geben Sie mindestens ${requiredLength} ${plural(requiredLength, 'Zeichen', 'Zeichen')} ein`,
  maxlength: ({ requiredLength }) =>
    `Geben Sie höchstens ${requiredLength} ${plural(requiredLength, 'Zeichen', 'Zeichen')} ein`,
  pattern: 'Geben Sie einen Wert im erwarteten Format ein',
  mkMinDate: ({ min }) =>
    `Das Datum darf nicht vor dem ${min.toLocaleDateString('de-DE')} liegen`,
  mkMaxDate: ({ max }) =>
    `Das Datum darf nicht nach dem ${max.toLocaleDateString('de-DE')} liegen`,
  mkDateFilter: 'Dieses Datum ist nicht verfügbar',
  mkDateRangeIncomplete: 'Wählen Sie ein Start- und ein Enddatum',
  mkMinTime: ({ min }) => `Die Uhrzeit darf nicht vor ${min} liegen`,
  mkMaxTime: ({ max }) => `Die Uhrzeit darf nicht nach ${max} liegen`,
  mkMaxItems: ({ max }) =>
    `Wählen Sie höchstens ${max} ${plural(max, 'Eintrag', 'Einträge')}`,
  mkFileSize: ({ name, maxLabel }) => `Die Datei ${name} überschreitet ${maxLabel}`,
  mkFileType: ({ name }) => `Die Datei ${name} hat einen unzulässigen Typ`,
  cardNumber: 'Geben Sie eine gültige Kartennummer ein',
  iban: ({ expectedLength }) =>
    expectedLength
      ? `Geben Sie eine gültige IBAN ein (${expectedLength} Zeichen)`
      : 'Geben Sie eine gültige IBAN ein',
  postalCode: ({ example }) => `Geben Sie eine gültige Postleitzahl ein, z. B. ${example}`,
  taxId: ({ label, example }) => `Geben Sie eine gültige ${label} ein, z. B. ${example}`,
  unknown: 'Ungültiger Wert',
};

/** German strings of the block editor's chrome. */
export const MK_DE_BLOCK_EDITOR: MkBlockEditorStrings = {
  addBlock: 'Block hinzufügen',
  addFirstBlock: 'Ersten Block hinzufügen',
  insertBlockHere: 'Block hier einfügen',
  blockInserter: 'Blockauswahl',
  searchBlocks: 'Blöcke suchen…',
  blocks: 'Blöcke',
  moveBlockUp: 'Block nach oben verschieben',
  moveBlockDown: 'Block nach unten verschieben',
  blockOptions: 'Blockoptionen',
  duplicate: 'Duplizieren',
  remove: 'Entfernen',
  textFormatting: 'Textformatierung',
  altText: 'Alternativtext',
  caption: 'Bildunterschrift',
  alignment: 'Ausrichtung',
  replaceImage: 'Bild ersetzen',
  imageUrl: 'Bild-URL',
  externalContent: 'Externer Inhalt',
  embedUrl: 'Einbettungs-URL',
  columnSettings: 'Spalteneinstellungen',
  columns: 'Spalten',
  ratio: 'Verhältnis',
  gap: 'Abstand',
  align: 'Ausrichten',
  justify: 'Verteilen',
  headingLevel: (level) => `Überschrift Ebene ${level}`,
  editorLabel: 'Blockeditor für Inhalte',
  emptyBlockPlaceholder: 'Mit / einen Block wählen oder einfach lostippen…',
  dragHandle: 'Ziehgriff',
  turnInto: (label) => `Umwandeln in: ${label}`,
  unknownBlock: (type) => `Unbekannter Block: ${type}`,
  blockAdded: (label) => `Hinzugefügt: ${label}`,
  blockDuplicated: 'Block dupliziert',
  blockDeleted: (label) => `Entfernt: ${label}`,
  blockMovedUp: 'Block nach oben verschoben',
  blockMovedDown: 'Block nach unten verschoben',
  turnedInto: (label) => `Umgewandelt in: ${label}`,
  noBlocksMatch: (query) => `Keine Blöcke passen zu „${query}“.`,
  groupText: 'Text',
  groupMedia: 'Medien',
  groupLayout: 'Layout',
  blockParagraph: 'Absatz',
  blockParagraphDesc: 'Text mit Inline-Formatierung.',
  blockHeading: 'Überschrift',
  blockHeadingDesc: 'Abschnittstitel (H1–H4).',
  blockList: 'Liste',
  blockListDesc: 'Aufzählung oder nummerierte Liste.',
  blockQuote: 'Zitat',
  blockQuoteDesc: 'Blockzitat mit optionaler Quelle.',
  blockCode: 'Code',
  blockCodeDesc: 'Formatierter Code in Festbreitenschrift.',
  blockImage: 'Bild',
  blockImageDesc: 'Bild hochladen oder verlinken.',
  blockEmbed: 'Einbettung',
  blockEmbedDesc: 'YouTube, Vimeo oder eine beliebige URL.',
  blockButton: 'Button',
  blockButtonDesc: 'Ein Call-to-Action-Button.',
  blockDivider: 'Trennlinie',
  blockDividerDesc: 'Eine horizontale Trennlinie.',
  blockColumns: 'Spalten',
  blockColumnsDesc: 'Responsives Mehrspaltenlayout.',
  bold: 'Fett',
  italic: 'Kursiv',
  underline: 'Unterstrichen',
  strikethrough: 'Durchgestrichen',
  inlineCode: 'Inline-Code',
  link: 'Link',
  clearFormatting: 'Formatierung entfernen',
  linkUrlPrompt: 'Link-URL',
  editableText: 'Bearbeitbarer Text',
  headingPlaceholder: (level) => `Überschrift ${level}`,
  headingLevelGroup: 'Überschriftenebene',
  listStyle: 'Listenstil',
  bulleted: 'Aufzählung',
  numbered: 'Nummeriert',
  listItem: 'Listeneintrag',
  quoteText: 'Zitattext',
  citation: 'Quelle',
  addCitation: '— Quelle hinzufügen',
  codeLanguage: 'Codesprache',
  codeLanguagePlaceholder: 'Sprache (optional)',
  enterCode: 'Code eingeben…',
  imageWidth: (percent) => `Breite: ${percent} %`,
  uploading: 'Wird hochgeladen…',
  dropImagePrompt: 'Bild hierher ziehen oder',
  chooseFile: 'Datei wählen',
  pasteImageUrl: '…oder eine Bild-URL einfügen',
  notAnImage: 'Wählen Sie eine Bilddatei.',
  uploadFailed: 'Hochladen fehlgeschlagen. Versuchen Sie es erneut oder fügen Sie eine URL ein.',
  imageAdded: 'Bild hinzugefügt',
  pasteEmbedUrl: 'URL von YouTube, Vimeo oder anderswo einfügen…',
  embedFallbackNote: 'Diese URL lässt sich nicht einbetten; sie wird als Link angezeigt.',
  embedTitle: (provider) => `${provider}-Einbettung`,
  embedAdded: (provider) => `${provider}-Einbettung hinzugefügt`,
  embeddedContent: 'Eingebetteter Inhalt',
  buttonLabel: 'Beschriftung',
  buttonLink: 'Link (href)',
  buttonTone: 'Farbton',
  buttonVariant: 'Variante',
  buttonDefaultLabel: 'Klick mich',
  alignLeft: 'Linksbündig',
  alignCenter: 'Zentriert',
  alignRight: 'Rechtsbündig',
  tonePrimary: 'Primär',
  toneNeutral: 'Neutral',
  toneSuccess: 'Erfolg',
  toneWarning: 'Warnung',
  toneDanger: 'Gefahr',
  toneInfo: 'Info',
  variantSolid: 'Gefüllt',
  variantSoft: 'Dezent',
  variantOutline: 'Umrandet',
  ratioEqual: 'Gleich',
  alignStretch: 'Strecken',
  alignTop: 'Oben',
  alignMiddle: 'Mitte',
  alignBottom: 'Unten',
  justifyStart: 'Anfang',
  justifyCenter: 'Mitte',
  justifyEnd: 'Ende',
  justifyBetween: 'Gleichmäßig',
};

const PASSWORD_STRENGTH_LABELS = ['Schwach', 'Schwach', 'Mittel', 'Gut', 'Stark'];

/**
 * The complete German string map — every key of {@link MkI18nStrings},
 * `locale: 'de-DE'` and `currency: 'EUR'` for the formatting pipes.
 * Provide it whole with {@link provideMkI18nDe}, or pass it as the base of
 * `provideMkI18n(overrides, MK_DE_I18N)`.
 */
export const MK_DE_I18N: MkI18nStrings = {
  locale: 'de-DE',
  currency: 'EUR',

  validation: MK_DE_VALIDATION,

  close: 'Schließen',
  dismiss: 'Verwerfen',
  clear: 'Leeren',
  confirm: 'Bestätigen',
  cancel: 'Abbrechen',
  ok: 'OK',
  save: 'Speichern',
  submit: 'Absenden',
  edit: 'Bearbeiten',
  remove: 'Entfernen',
  removeItem: (name) => `${name} entfernen`,
  empty: 'Leer',
  optional: 'Optional',
  filter: 'Filtern…',
  confirmMessage: 'Sind Sie sicher?',
  decrease: 'Verringern',
  increase: 'Erhöhen',

  loading: 'Wird geladen…',
  noOptions: 'Keine Optionen',
  noResults: 'Keine Ergebnisse',
  noData: 'Keine Daten vorhanden',
  translationEditorSearch: 'Schlüssel und Text suchen',
  translationEditorAll: 'Alle',
  translationEditorOverridden: 'Bearbeitet',
  translationEditorMissing: 'Fehlend',
  translationEditorKey: 'Schlüssel',
  translationEditorReset: 'Originaltext wiederherstellen',
  translationEditorExport: 'CSV exportieren',
  translationEditorKeys: 'Schlüssel',
  sessionExpiryTitle: 'Ihre Sitzung läuft gleich ab',
  sessionExpiryExtend: 'Angemeldet bleiben',
  sessionExpiryExtending: 'Wird verlängert…',
  sessionExpiryLogout: 'Jetzt abmelden',
  sessionExpiryBody: (countdown) => `Aus Sicherheitsgründen werden Sie in ${countdown} abgemeldet. Nicht gespeicherte Änderungen gehen verloren.`,
  scannerTitle: 'Code scannen',
  scannerHint: 'Richten Sie die Kamera auf einen Barcode oder QR-Code. Er wird automatisch gelesen.',
  scannerCameraError: 'Die Kamera konnte nicht gestartet werden. Prüfen Sie die Browser-Berechtigungen.',
  resultsCount: (count) =>
    `${count} ${plural(count, 'Ergebnis', 'Ergebnisse')}`,

  previousPage: 'Zur vorherigen Seite',
  nextPage: 'Zur nächsten Seite',
  goToPage: (page) => `Zu Seite ${page}`,
  paginationLabel: 'Seitennummerierung',
  previousSlide: 'Vorherige Folie',
  nextSlide: 'Nächste Folie',
  goToSlide: (slide) => `Zu Folie ${slide}`,
  carouselLabel: 'Karussell',
  pauseSlideshow: 'Diashow anhalten',
  playSlideshow: 'Diashow fortsetzen',
  slideOf: (slide, total) => `Folie ${slide} von ${total}`,

  dateNames: MK_DE_DATE_NAMES,
  previousMonth: 'Vorheriger Monat',
  nextMonth: 'Nächster Monat',
  previousYear: 'Vorheriges Jahr',
  nextYear: 'Nächstes Jahr',
  previousYears: 'Vorherige Jahre',
  nextYears: 'Nächste Jahre',
  selectDate: 'Datum wählen…',
  selectRange: 'Zeitraum wählen…',
  selectTime: 'Uhrzeit wählen…',
  selectMonth: 'Monat wählen…',
  selectYear: 'Jahr wählen…',
  selectWeek: 'Woche wählen…',
  selectPlaceholder: 'Auswählen…',
  chooseDate: 'Datumsauswahl',
  chooseDateRange: 'Zeitraumauswahl',
  chooseMonth: 'Monatsauswahl',
  chooseYear: 'Jahresauswahl',
  chooseWeek: 'Wochenauswahl',
  openCalendar: 'Kalender öffnen',
  openTimeList: 'Uhrzeitliste öffnen',
  moreActions: 'Weitere Aktionen',
  selectDateTime: 'Datum und Uhrzeit wählen…',
  chooseDateTime: 'Datums- und Uhrzeitauswahl',
  chooseTime: 'Uhrzeitauswahl',
  openDateTimePicker: 'Datums- und Uhrzeitauswahl öffnen',
  daySegment: 'Tag',
  monthSegment: 'Monat',
  yearSegment: 'Jahr',
  countdownDays: 'Tage',
  countdownHours: 'Std.',
  countdownMinutes: 'Min.',
  countdownSeconds: 'Sek.',
  countdownFinished: 'Beendet',
  dayEvents: (count, titles) =>
    `${count} ${plural(count, 'Termin', 'Termine')}${titles ? `: ${titles}` : ''}`,
  moreEvents: (count) => `+${count} weitere`,

  selectAllRows: 'Alle Zeilen auswählen',
  selectRow: (row) => (row ? `Zeile ${row} auswählen` : 'Zeile auswählen'),
  expandHeader: 'Aufklappen',
  expandRow: 'Zeile aufklappen',
  collapseRow: 'Zeile zuklappen',
  expandTreeRow: 'Unterzeilen anzeigen',
  collapseTreeRow: 'Unterzeilen ausblenden',
  expandGroup: 'Gruppe aufklappen',
  collapseGroup: 'Gruppe zuklappen',
  groupCount: (count) =>
    `${count} ${plural(count, 'Eintrag', 'Einträge')}`,
  resizeColumn: 'Spaltenbreite ändern',
  columnWidth: (column, width) => `Breite der Spalte ${column}: ${width} px`,
  columnMoved: (column, position, total) =>
    `Spalte ${column} an Position ${position} von ${total} verschoben`,
  editCell: 'Zum Bearbeiten Enter drücken',
  cellSaved: (value) => `${value} gespeichert`,
  sortedBy: (column, direction) =>
    `Sortiert nach ${column}, ${direction === 'asc' ? 'aufsteigend' : 'absteigend'}`,
  sortingCleared: (column) => `Sortierung nach ${column} aufgehoben`,

  showPassword: 'Passwort anzeigen',
  hidePassword: 'Passwort verbergen',
  passwordRuleMinLength: (length) =>
    `Mindestens ${length} ${plural(length, 'Zeichen', 'Zeichen')}`,
  passwordRuleUppercase: 'Ein Großbuchstabe',
  passwordRuleNumber: 'Eine Ziffer',
  passwordRuleSymbol: 'Ein Sonderzeichen',
  passwordStrength: (score) =>
    PASSWORD_STRENGTH_LABELS[Math.max(0, Math.min(4, score))],
  passwordStrengthLabel: 'Passwortstärke:',
  ruleMet: 'Erfüllt:',
  ruleNotMet: 'Nicht erfüllt:',
  oneTimeCode: 'Einmalcode',
  otpDigit: (position) => `Ziffer ${position}`,
  numericKeypadLabel: 'Ziffernblock',
  keypadClear: 'Leeren',
  keypadBackspace: 'Rücktaste',
  keypadDigitsEntered: (count, length) => `${count} von ${length} Ziffern eingegeben`,
  onScreenKeyboardLabel: 'Bildschirmtastatur',
  keyboardShift: 'Umschalt',
  keyboardSpace: 'Leertaste',
  keyboardEnter: 'Eingabe',
  keyboardAltLayer: 'Weitere Zeichen',
  keyboardBaseLayer: 'Buchstaben',
  ratingLabel: 'Bewertung',
  ratingValueText: (value, max) =>
    `${value} von ${max} ${plural(max, 'Stern', 'Sternen')}`,
  minimum: 'Minimum',
  maximum: 'Maximum',
  chooseColor: 'Farbe wählen',
  hexValue: 'Hexadezimalwert',
  presetColors: 'Vordefinierte Farben',
  chooseCountry: 'Land wählen',
  searchCountries: 'Land suchen…',
  phoneNumber: 'Telefonnummer',
  postalCode: 'Postleitzahl',
  amount: 'Betrag',
  cardNumber: 'Kartennummer',
  cardBrand: (brand) => `Kartentyp: ${brand}`,
  iban: 'IBAN',
  taxId: 'Steuernummer',
  signature: 'Unterschrift',
  jsonLabel: 'JSON',

  logViewerLabel: 'Ereignisprotokoll',
  logFollow: 'Folgen',
  logCopyAll: 'Protokoll kopieren',
  logWrapLines: 'Zeilen umbrechen',

  orgChartLabel: 'Organigramm',
  orgChartExpand: '{label} aufklappen',
  orgChartCollapse: '{label} zuklappen',

  chatLabel: 'Unterhaltung',
  chatComposerLabel: 'Nachricht',
  chatPlaceholder: 'Nachricht schreiben…',
  chatSend: 'Senden',
  chatStop: 'Generierung stoppen',
  chatAttach: 'Dateien anhängen',
  chatRemoveAttachment: 'Anhang entfernen',
  chatAttachments: 'Anhänge',
  chatSuggestions: 'Vorschläge',
  chatCopy: 'Nachricht kopieren',
  chatRetry: 'Erneut versuchen',
  chatTyping: 'Schreibt…',
  chatStreaming: 'Wird generiert…',
  chatJumpToLatest: 'Zu den neuesten springen',
  chatEmpty: 'Keine Nachrichten',
  chatYou: 'Sie',
  chatAssistant: 'Assistent',
  chatToolRunning: 'Läuft',
  chatToolDone: 'Fertig',
  chatToolError: 'Fehlgeschlagen',

  dynamicFormAdd: 'Hinzufügen',
  dynamicFormRemove: (index) => `Eintrag ${index} entfernen`,

  queryBuilderLabel: 'Filterbedingungen',
  queryAddRule: 'Regel hinzufügen',
  queryAddGroup: 'Gruppe hinzufügen',
  queryRemoveRule: 'Regel entfernen',
  queryRemoveGroup: 'Gruppe entfernen',
  queryAnd: 'Und',
  queryOr: 'Oder',
  queryNot: 'Nicht',
  queryField: 'Feld',
  queryOperator: 'Operator',
  queryValue: 'Wert',
  queryValueFrom: 'Von',
  queryValueTo: 'Bis',
  queryEmptyGroup: 'Keine Bedingungen',
  queryTrue: 'Wahr',
  queryFalse: 'Falsch',
  queryOpEq: 'ist gleich',
  queryOpNeq: 'ist ungleich',
  queryOpContains: 'enthält',
  queryOpNotContains: 'enthält nicht',
  queryOpStartsWith: 'beginnt mit',
  queryOpEndsWith: 'endet mit',
  queryOpGt: 'größer als',
  queryOpGte: 'mindestens',
  queryOpLt: 'kleiner als',
  queryOpLte: 'höchstens',
  queryOpBetween: 'zwischen',
  queryOpIn: 'ist eines von',
  queryOpNotIn: 'ist keines von',
  queryOpBefore: 'vor',
  queryOpAfter: 'nach',
  queryOpEmpty: 'ist leer',
  queryOpNotEmpty: 'ist nicht leer',

  dialogMove: 'Fenster verschieben (Pfeiltasten; Pos1 setzt zurück)',
  dialogResize: 'Fenstergröße ändern (Pfeiltasten; Pos1 setzt zurück)',

  listboxFilter: 'Optionen filtern',
  listboxEmpty: 'Keine passenden Optionen',

  eventCalendarGrabbed: (title, from, to) =>
    `${title} aufgenommen, ${from} – ${to}. Pfeiltasten verschieben, ` +
    'Umschalt mit Pfeil nach oben oder unten ändert das Ende, ' +
    'Enter speichert, Escape bricht ab.',
  eventCalendarPosition: (title, day, from, to) =>
    `${title}, ${day}, ${from} – ${to}.`,
  eventCalendarMoved: (title, day, from, to) =>
    `${title} verschoben auf ${day}, ${from} – ${to}.`,
  eventCalendarResized: (title, to) => `${title} endet jetzt um ${to}.`,
  eventCalendarEditCancelled:
    'Verschieben abgebrochen. Der Termin behält seine ursprüngliche Zeit.',
  eventCalendarMovableEvent: 'Verschiebbarer Termin',

  previousImage: 'Vorheriges Bild',
  nextImage: 'Nächstes Bild',
  imageOf: (index, total) => `Bild ${index} von ${total}`,
  viewImage: (alt) => (alt ? `${alt} ansehen` : 'Bild ansehen'),
  imageFailed: 'Bild konnte nicht geladen werden',
  zoom: 'Zoom',
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
  mediaLibrary: 'Medienbibliothek',
  dropzoneLabel: 'Dateien hierher ziehen oder klicken, um sie auszuwählen',
  uploadFailed: 'Hochladen fehlgeschlagen',
  retryUpload: 'Hochladen wiederholen',
  errorSummaryTitle: 'Es gibt ein Problem',

  available: 'Verfügbar',
  selected: 'Ausgewählt',
  transferSelected: (target) => `Ausgewählte verschieben nach: ${target}`,
  transferAll: (target) => `Alle verschieben nach: ${target}`,
  itemsMoved: (count, target) =>
    `${count} ${plural(count, 'Eintrag', 'Einträge')} verschoben nach: ${target}`,

  notificationsTitle: 'Benachrichtigungen',
  allCaughtUp: 'Alles gelesen',
  markAllRead: 'Alle als gelesen markieren',
  notificationsUnread: (count) =>
    `Benachrichtigungen, ${count} ${plural(count, 'ungelesene', 'ungelesene')}`,
  unread: 'Ungelesen',
  tourStepOf: (step, total) => `Schritt ${step} von ${total}`,
  tourSkip: 'Überspringen',
  tourPrevious: 'Zurück',
  tourNext: 'Weiter',
  tourDone: 'Fertig',

  commandPalettePlaceholder: 'Befehl eingeben oder suchen…',
  commandPaletteLabel: 'Befehlspalette',
  stepCompleted: 'Abgeschlossen',
  stepError: 'Enthält Fehler',
  diffAddedLine: 'Hinzugefügt:',
  diffRemovedLine: 'Entfernt:',
  itemAdded: (name) => `${name} hinzugefügt`,
  itemRemoved: (name) => `${name} entfernt`,
  resizePanes: 'Bereichsgröße ändern',
  backToTop: 'Nach oben',
  breadcrumbLabel: 'Pfadnavigation',
  fabLabel: 'Aktionen',
  diffBefore: 'Vorher',
  diffAfter: 'Nachher',
  diffChanges: 'Änderungen',
  skipToContent: 'Zum Inhalt springen',
  primaryNav: 'Hauptnavigation',

  dndPickedUp: (position, total) =>
    `Aufgenommen. Eintrag ${position} von ${total}. ` +
    'Pfeiltasten verschieben, Leertaste oder Enter legt ab, Escape bricht ab.',
  dndMoved: (position, total) => `Auf Position ${position} von ${total} verschoben.`,
  dndMovedToList: (list, position, total) =>
    `Verschoben nach: ${list}, Position ${position} von ${total}.`,
  dndDropped: (position) => `Auf Position ${position} abgelegt.`,
  dndMovedToZone: (zone) => `Verschoben nach: ${zone}. Leertaste oder Enter legt hier ab.`,
  dndDroppedInZone: (zone) => `Abgelegt in: ${zone}.`,
  dndCancelled: 'Verschieben abgebrochen. Der Eintrag ist zurück an seinem Platz.',

  repeaterAddRow: 'Zeile hinzufügen',
  repeaterRemoveRow: (index) => `Zeile ${index} entfernen`,
  repeaterReorderRow: (index) => `Zeile ${index} umsortieren`,
  repeaterRowMoved: (from, to) =>
    `Zeile von Position ${from} auf Position ${to} verschoben.`,

  fileRejectedType: (name) => `${name}: nicht unterstützter Dateityp`,
  fileRejectedSize: (name, limit) => `${name}: überschreitet ${limit}`,
  fileRejectedCount: (name, max) =>
    `${name}: Limit von ${max} ${plural(max, 'Datei', 'Dateien')} überschritten`,

  chartCategory: 'Kategorie',
  chartValue: 'Wert',
  chartSeries: 'Serie',
  chartSlice: 'Segment',
  chartStage: 'Stufe',
  chartConversion: 'Konversion',
  chartAxis: 'Achse',
  chartShare: 'Anteil',
  chartLabel: 'Beschriftung',

  qrCodeLabel: (text) => `QR-Code: ${text}`,

  sortableListLabel: 'Sortierbare Liste',
  filterColumn: (column) => `${column} filtern`,
  clearFilter: (column) => `Filter der Spalte ${column} leeren`,
  filterAny: 'Alle',
  filterMin: 'Min.',

  blockEditor: MK_DE_BLOCK_EDITOR,
};

/**
 * Provides the German strings — {@link MK_DE_I18N} with any `overrides`
 * merged on top (deep for `dateNames`, `blockEditor` and `validation`, like
 * `provideMkI18n`).
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMkI18nDe({ noData: 'Nichts zu sehen' })],
 * });
 * ```
 */
export function provideMkI18nDe(overrides: MkI18nOverrides = {}): Provider {
  return provideMkI18n(overrides, MK_DE_I18N);
}
