import { InjectionToken, type Provider } from '@angular/core';

/** Direction passed to the sort announcer. */
export type MkSortAnnounceDirection = 'asc' | 'desc';

/**
 * Localised date-name tables consumed by the calendar, the date/month/week
 * pickers and `formatDate`. All arrays are full-length (12 months, 7 weekdays
 * starting with Sunday) — override the whole set for a locale.
 */
export type { MkDateNames } from '@mk-kit/core';
import type { MkDateNames } from '@mk-kit/core';

/** Strings used by the block editor's chrome. */
export interface MkBlockEditorStrings {
  addBlock: string;
  addFirstBlock: string;
  insertBlockHere: string;
  blockInserter: string;
  searchBlocks: string;
  blocks: string;
  moveBlockUp: string;
  moveBlockDown: string;
  blockOptions: string;
  duplicate: string;
  remove: string;
  textFormatting: string;
  altText: string;
  caption: string;
  alignment: string;
  replaceImage: string;
  imageUrl: string;
  externalContent: string;
  embedUrl: string;
  columnSettings: string;
  columns: string;
  ratio: string;
  gap: string;
  align: string;
  justify: string;
  headingLevel: (level: number) => string;
  /** Editor region label + empty-block placeholder defaults. */
  editorLabel: string;
  emptyBlockPlaceholder: string;
  /** Drag handle tooltip. */
  dragHandle: string;
  /** "Turn into …" transform menu item; receives the target block's label. */
  turnInto: (label: string) => string;
  /** Shown for a block whose type has no registered definition. */
  unknownBlock: (type: string) => string;
  /** Structural-change screen-reader announcements. */
  blockAdded: (label: string) => string;
  blockDuplicated: string;
  blockDeleted: (label: string) => string;
  blockMovedUp: string;
  blockMovedDown: string;
  turnedInto: (label: string) => string;
  /** Inserter empty state; receives the search query. */
  noBlocksMatch: (query: string) => string;
  /** Built-in palette group headings. */
  groupText: string;
  groupMedia: string;
  groupLayout: string;
  /** Built-in block labels + inserter descriptions. */
  blockParagraph: string;
  blockParagraphDesc: string;
  blockHeading: string;
  blockHeadingDesc: string;
  blockList: string;
  blockListDesc: string;
  blockQuote: string;
  blockQuoteDesc: string;
  blockCode: string;
  blockCodeDesc: string;
  blockImage: string;
  blockImageDesc: string;
  blockEmbed: string;
  blockEmbedDesc: string;
  blockButton: string;
  blockButtonDesc: string;
  blockDivider: string;
  blockDividerDesc: string;
  blockColumns: string;
  blockColumnsDesc: string;
  /** Rich-text inline toolbar. */
  bold: string;
  italic: string;
  underline: string;
  strikethrough: string;
  inlineCode: string;
  link: string;
  clearFormatting: string;
  /** Prompt asking for a link URL. */
  linkUrlPrompt: string;
  /** Default label of the editable rich-text region. */
  editableText: string;
  /** Heading block. */
  headingPlaceholder: (level: number) => string;
  headingLevelGroup: string;
  /** List block. */
  listStyle: string;
  bulleted: string;
  numbered: string;
  listItem: string;
  /** Quote block. */
  quoteText: string;
  citation: string;
  addCitation: string;
  /** Code block. */
  codeLanguage: string;
  codeLanguagePlaceholder: string;
  enterCode: string;
  /** Image block. */
  imageWidth: (percent: number) => string;
  uploading: string;
  dropImagePrompt: string;
  chooseFile: string;
  pasteImageUrl: string;
  notAnImage: string;
  uploadFailed: string;
  imageAdded: string;
  /** Embed block. */
  pasteEmbedUrl: string;
  embedFallbackNote: string;
  embedTitle: (provider: string) => string;
  embedAdded: (provider: string) => string;
  embeddedContent: string;
  /** Button block settings. */
  buttonLabel: string;
  buttonLink: string;
  buttonTone: string;
  buttonVariant: string;
  /** Label a freshly inserted Button block starts with. */
  buttonDefaultLabel: string;
  /** Alignment option captions (image + button blocks). */
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  /** Tone option captions (button block swatches). */
  tonePrimary: string;
  toneNeutral: string;
  toneSuccess: string;
  toneWarning: string;
  toneDanger: string;
  toneInfo: string;
  /** Variant option captions (button block). */
  variantSolid: string;
  variantSoft: string;
  variantOutline: string;
  /** Columns settings option captions. */
  ratioEqual: string;
  alignStretch: string;
  alignTop: string;
  alignMiddle: string;
  alignBottom: string;
  justifyStart: string;
  justifyCenter: string;
  justifyEnd: string;
  justifyBetween: string;
}

/**
 * Messages rendered by `mk-form-field` for the validation errors the library's
 * own controls produce, plus the standard Angular `Validators` keys, so a
 * field wrapping any control shows something sensible without per-form wiring.
 *
 * Keys match the `ValidationErrors` keys exactly and each entry receives that
 * key's error payload. Override any subset through
 * `provideMkI18n({ validation: … })`, or a whole map per field via
 * `mk-form-field`'s `errorMessages` input.
 */
export interface MkValidationStrings {
  /** `Validators.required` — also emitted by checkbox and radio-group. */
  required: string;
  /** `Validators.email`. */
  email: string;
  /** `Validators.min`, and the numeric controls' `[min]`. */
  min: (err: { min: number; actual: number }) => string;
  /** `Validators.max`, and the numeric controls' `[max]`. */
  max: (err: { max: number; actual: number }) => string;
  /** `Validators.minLength` — also emitted by password-input and OTP. */
  minlength: (err: { requiredLength: number; actualLength: number }) => string;
  /** `Validators.maxLength`. */
  maxlength: (err: { requiredLength: number; actualLength: number }) => string;
  /** `Validators.pattern`. */
  pattern: string;
  /** A date/month/week picker's `[min]`. */
  mkMinDate: (err: { min: Date; actual: Date }) => string;
  /** A date/month/week picker's `[max]`. */
  mkMaxDate: (err: { max: Date; actual: Date }) => string;
  /** A date rejected by a calendar's `[disabledDate]` predicate. */
  mkDateFilter: string;
  /** A range picker with only one end filled in. */
  mkDateRangeIncomplete: string;
  /** The time-picker's `[min]`. */
  mkMinTime: (err: { min: string; actual: string }) => string;
  /** The time-picker's `[max]`. */
  mkMaxTime: (err: { max: string; actual: string }) => string;
  /** More items than a multi-select's, tag-input's or upload's `[max*]` allows. */
  mkMaxItems: (err: { max: number; actual: number }) => string;
  /** A file larger than a file-upload's `[maxSize]`. */
  mkFileSize: (err: { max: number; maxLabel: string; name: string }) => string;
  /** A file not matching a file-upload's `[accept]` filter. */
  mkFileType: (err: { accept: string; name: string }) => string;
  /** A card number failing the Luhn checksum. */
  cardNumber: string;
  /** An IBAN failing the mod-97 checksum. */
  iban: (err: { country: string; expectedLength: number | null }) => string;
  /** A postal code not matching the country's format. */
  postalCode: (err: { country: string; example: string }) => string;
  /** A tax identifier not matching the country's format or checksum. */
  taxId: (err: { country: string; label: string; example: string }) => string;
  /** Fallback for an error key with no message of its own. */
  unknown: string;
}

/**
 * All user-facing strings the library renders itself (aria-labels, empty-state
 * text, control captions and screen-reader announcements). Consumers localise
 * the library by overriding any subset via {@link provideMkI18n}. Interpolated
 * strings are functions so translators control word order.
 */
export interface MkI18nStrings {
  // --- Locale ---------------------------------------------------------------
  /**
   * BCP 47 locale tag (`'pl-PL'`, `'de'`) used by the formatting pipes
   * (`mkCurrency`, `mkRelativeTime`, `mkFileSize`, `mkPluralize`) and any
   * other `Intl`-based formatting that has no explicit locale of its own.
   * Unset → the runtime (browser / Node) default locale.
   */
  locale?: string;
  /**
   * ISO 4217 currency code the `mkCurrency` pipe falls back to when the
   * template passes none. Unset → `'USD'`.
   */
  currency?: string;

  // --- Validation -----------------------------------------------------------
  /** Validation messages (deep-merged by provideMkI18n). */
  validation: MkValidationStrings;

  // --- Generic controls -----------------------------------------------------
  /** Generic "Close" control (dialog, drawer, bottom-sheet). */
  close: string;
  /** Generic "Dismiss" control (alert, banner, toast, snackbar). */
  dismiss: string;
  /** Clear-input control (autocomplete, pickers, tag inputs). */
  clear: string;
  /** Generic confirm action (confirm dialog, popconfirm). */
  confirm: string;
  /** Generic cancel action (dialogs, inline edit). */
  cancel: string;
  /** Generic acknowledge action (alert/prompt dialogs). */
  ok: string;
  /** Generic save action (inline edit). */
  save: string;
  /** Default action-button caption (submit input). */
  submit: string;
  /** Generic edit affordance (inline edit trigger). */
  edit: string;
  /** Generic remove control (chip). */
  remove: string;
  /** Remove a named item (tag input chips, file upload rows). */
  removeItem: (name: string) => string;
  /** Placeholder shown for an empty editable value (inline edit, mini date). */
  empty: string;
  /** "Optional" marker (stepper). */
  optional: string;
  /** Filter/search field placeholder (transfer list). */
  filter: string;
  /** Default confirmation question (popconfirm). */
  confirmMessage: string;
  /** Decrease control (number input). */
  decrease: string;
  /** Increase control (number input). */
  increase: string;

  // --- Async / empty states ---------------------------------------------------
  /** Async loading row (autocomplete, multi-select). */
  loading: string;
  /** Empty listbox with no options (select, time picker). */
  noOptions: string;
  /** Empty async/filtered results (autocomplete, multi-select, command palette). */
  noResults: string;
  /** Empty data table / list. */
  noData: string;
  /** Translation editor (`@mk-kit/ui/translate/editor`). */
  translationEditorSearch: string;
  translationEditorAll: string;
  translationEditorOverridden: string;
  translationEditorMissing: string;
  translationEditorKey: string;
  translationEditorReset: string;
  translationEditorExport: string;
  translationEditorKeys: string;
  /** Session-expiry dialog (`@mk-kit/ui/attention`). */
  sessionExpiryTitle: string;
  sessionExpiryExtend: string;
  sessionExpiryExtending: string;
  sessionExpiryLogout: string;
  sessionExpiryBody: (countdown: string) => string;
  /** Barcode scanner (`@mk-kit/ui/media/scanner`). */
  scannerTitle: string;
  scannerHint: string;
  scannerCameraError: string;
  /** Announced when a filterable list updates (autocomplete, multi-select, command palette). */
  resultsCount: (count: number) => string;

  // --- Pagination / carousel ---------------------------------------------------
  /** Pagination: previous page control. */
  previousPage: string;
  /** Pagination: next page control. */
  nextPage: string;
  /** Pagination: jump to a page. */
  goToPage: (page: number) => string;
  /** Pagination landmark label. */
  paginationLabel: string;
  /** Carousel: previous slide control. */
  previousSlide: string;
  /** Carousel: next slide control. */
  nextSlide: string;
  /** Carousel: jump to a slide. */
  goToSlide: (slide: number) => string;
  /** Carousel region label. */
  carouselLabel: string;
  /** Carousel: pause / resume automatic rotation. */
  pauseSlideshow: string;
  playSlideshow: string;
  /** Carousel: slide position (slide labels + live announcements). */
  slideOf: (slide: number, total: number) => string;

  // --- Dates & pickers ---------------------------------------------------------
  /** Localised month/weekday name tables (deep-merged by provideMkI18n). */
  dateNames: MkDateNames;
  /** Calendar: previous month control. */
  previousMonth: string;
  /** Calendar: next month control. */
  nextMonth: string;
  /** Month picker: previous/next year (month mode). */
  previousYear: string;
  nextYear: string;
  /** Month picker: previous/next decade page (year mode). */
  previousYears: string;
  nextYears: string;
  /** Field placeholders. */
  selectDate: string;
  selectRange: string;
  selectTime: string;
  selectMonth: string;
  selectYear: string;
  selectWeek: string;
  selectPlaceholder: string;
  /** Popover dialog labels. */
  chooseDate: string;
  chooseDateRange: string;
  chooseMonth: string;
  chooseYear: string;
  chooseWeek: string;
  openCalendar: string;
  openTimeList: string;
  /** Accessible name of the chevron segment of `mk-split-button`. */
  moreActions: string;
  /** Placeholder of `mk-datetime-picker`. */
  selectDateTime: string;
  /** Dialog label of the `mk-datetime-picker` panel. */
  chooseDateTime: string;
  /** Listbox label of the time list inside `mk-datetime-picker`. */
  chooseTime: string;
  /** Toggle-button label of `mk-datetime-picker`. */
  openDateTimePicker: string;
  /** Mini-date segment names. */
  daySegment: string;
  monthSegment: string;
  yearSegment: string;
  /** Countdown unit captions. */
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  /** Announced when a countdown reaches zero. */
  countdownFinished: string;
  /** Event-calendar day label suffix, e.g. `2 events: Standup, Demo`. */
  dayEvents: (count: number, titles: string) => string;
  /** Event-calendar overflow pill for events beyond `maxPerDay`, e.g. `+2 more`. */
  moreEvents: (count: number) => string;

  // --- Table / data grid ---------------------------------------------------------
  /** Select-all header checkbox. */
  selectAllRows: string;
  /** Per-row checkbox; receives the row's leading cell text. */
  selectRow: (row: string) => string;
  /** Hidden expander column header. */
  expandHeader: string;
  /** Row expander toggle labels. */
  expandRow: string;
  collapseRow: string;
  /** Tree-row toggle labels (`childrenKey`). */
  expandTreeRow: string;
  collapseTreeRow: string;
  /** aria-label of a group header's toggle when the group is collapsed. */
  expandGroup: string;
  /** aria-label of a group header's toggle when the group is expanded. */
  collapseGroup: string;
  /** Row count shown on a group header, e.g. "4 items". */
  groupCount: (count: number) => string;
  /** Column resize separator label. */
  resizeColumn: string;
  /** Announced while a column is resized by keyboard. */
  columnWidth: (column: string, width: number) => string;
  /** Announced when a column is reordered. */
  columnMoved: (column: string, position: number, total: number) => string;
  /** Hint suffix + announcement for editable cells. */
  editCell: string;
  cellSaved: (value: string) => string;
  /** Announced when a column is sorted. */
  sortedBy: (column: string, direction: MkSortAnnounceDirection) => string;
  /** Announced when sorting is removed from a column. */
  sortingCleared: (column: string) => string;

  // --- Forms -----------------------------------------------------------------
  /** Password reveal toggle. */
  showPassword: string;
  hidePassword: string;
  /** Password rule captions. */
  passwordRuleMinLength: (length: number) => string;
  passwordRuleUppercase: string;
  passwordRuleNumber: string;
  passwordRuleSymbol: string;
  /** Password strength label for a 0–4 score. */
  passwordStrength: (score: number) => string;
  /** Visible prefix before the strength label. */
  passwordStrengthLabel: string;
  /** Rule-state prefixes announced to screen readers. */
  ruleMet: string;
  ruleNotMet: string;
  /** OTP field labels. */
  oneTimeCode: string;
  otpDigit: (position: number) => string;
  /** Numeric keypad labels + masked-PIN progress announcement. */
  numericKeypadLabel: string;
  keypadClear: string;
  keypadBackspace: string;
  keypadDigitsEntered: (count: number, length: number) => string;
  /** On-screen keyboard label + action-key labels. */
  onScreenKeyboardLabel: string;
  keyboardShift: string;
  keyboardSpace: string;
  keyboardEnter: string;
  keyboardAltLayer: string;
  keyboardBaseLayer: string;
  /** Rating slider label + value text. */
  ratingLabel: string;
  ratingValueText: (value: number, max: number) => string;
  /** Range slider thumb labels. */
  minimum: string;
  maximum: string;
  /** Color picker labels. */
  chooseColor: string;
  hexValue: string;
  presetColors: string;
  /** Phone input: country-prefix trigger label. */
  chooseCountry: string;
  /** Phone input: search field placeholder inside the country list. */
  searchCountries: string;
  /** Phone input: default accessible label of the national-number field. */
  phoneNumber: string;
  /** Postal-code input: default accessible label. */
  postalCode: string;
  /** Currency input: default accessible label. */
  amount: string;
  /** Card-number input: default accessible label. */
  cardNumber: string;
  /** Card-number input: announced/badge text for a detected brand. */
  cardBrand: (brand: string) => string;
  /** IBAN input: default accessible label. */
  iban: string;
  /** Tax-ID input: default accessible label. */
  taxId: string;
  /** Signature pad: default accessible label of the drawing surface. */
  signature: string;
  /** JSON viewer: default accessible label of the tree. */
  jsonLabel: string;

  // --- Log viewer -------------------------------------------------------------
  /** Log viewer: default accessible label of the log region. */
  logViewerLabel: string;
  /** Log viewer: re-attach-to-tail button. */
  logFollow: string;
  /** Log viewer: copy-the-whole-buffer toolbar button. */
  logCopyAll: string;
  /** Log viewer: soft-wrap toolbar toggle. */
  logWrapLines: string;

  // --- Org chart --------------------------------------------------------------
  /** Org chart: default accessible label of the tree. */
  orgChartLabel: string;
  /** Org chart: aria-label of a collapsed node's toggle (`{label}` = node label). */
  orgChartExpand: string;
  /** Org chart: aria-label of an expanded node's toggle (`{label}` = node label). */
  orgChartCollapse: string;

  // --- Chat -------------------------------------------------------------------
  /** Chat: accessible name of the message log. */
  chatLabel: string;
  /** Chat: accessible name of the composer textarea. */
  chatComposerLabel: string;
  /** Chat: composer placeholder. */
  chatPlaceholder: string;
  /** Chat: send button. */
  chatSend: string;
  /** Chat: stop-generating button (replaces send while busy). */
  chatStop: string;
  /** Chat: attach-files button. */
  chatAttach: string;
  /** Chat: remove one pending attachment. */
  chatRemoveAttachment: string;
  /** Chat: group label of pending / shown attachments. */
  chatAttachments: string;
  /** Chat: group label of quick-reply suggestions. */
  chatSuggestions: string;
  /** Chat: copy-message button. */
  chatCopy: string;
  /** Chat: retry a failed message. */
  chatRetry: string;
  /** Chat: typing indicator. */
  chatTyping: string;
  /** Chat: screen-reader text while a reply streams in. */
  chatStreaming: string;
  /** Chat: scroll-to-newest button. */
  chatJumpToLatest: string;
  /** Chat: empty-state text. */
  chatEmpty: string;
  /** Chat: author fallback for the user's own messages. */
  chatYou: string;
  /** Chat: author fallback for assistant messages. */
  chatAssistant: string;
  /** Chat: tool call in progress. */
  chatToolRunning: string;
  /** Chat: tool call finished. */
  chatToolDone: string;
  /** Chat: tool call failed. */
  chatToolError: string;

  // --- Dynamic form -----------------------------------------------------------
  /** Dynamic form: add an item to an array field. */
  dynamicFormAdd: string;
  /** Dynamic form: remove one item of an array field (index is 1-based). */
  dynamicFormRemove: (index: number) => string;

  // --- Query builder ----------------------------------------------------------
  /** Query builder: accessible name of the whole builder. */
  queryBuilderLabel: string;
  queryAddRule: string;
  queryAddGroup: string;
  queryRemoveRule: string;
  queryRemoveGroup: string;
  /** Combinator labels — also used by `mkQueryToText`. */
  queryAnd: string;
  queryOr: string;
  queryNot: string;
  queryField: string;
  queryOperator: string;
  queryValue: string;
  queryValueFrom: string;
  queryValueTo: string;
  queryEmptyGroup: string;
  queryTrue: string;
  queryFalse: string;
  queryOpEq: string;
  queryOpNeq: string;
  queryOpContains: string;
  queryOpNotContains: string;
  queryOpStartsWith: string;
  queryOpEndsWith: string;
  queryOpGt: string;
  queryOpGte: string;
  queryOpLt: string;
  queryOpLte: string;
  queryOpBetween: string;
  queryOpIn: string;
  queryOpNotIn: string;
  queryOpBefore: string;
  queryOpAfter: string;
  queryOpEmpty: string;
  queryOpNotEmpty: string;

  // --- Dialog drag / resize ---------------------------------------------------
  /** Dialog: label of the move grip (arrow keys move, Home resets). */
  dialogMove: string;
  /** Dialog: label of the resize grip (arrow keys resize, Home resets). */
  dialogResize: string;

  // --- Listbox ----------------------------------------------------------------
  /** Listbox: filter box placeholder / label. */
  listboxFilter: string;
  /** Listbox: shown when the filter matches nothing. */
  listboxEmpty: string;

  // --- Event calendar editing --------------------------------------------------
  /** Announced when an event is picked up in keyboard move mode. */
  eventCalendarGrabbed: (title: string, from: string, to: string) => string;
  /** Announced after each keyboard step: current day + time range. */
  eventCalendarPosition: (
    title: string,
    day: string,
    from: string,
    to: string,
  ) => string;
  /** Announced when a move commits. */
  eventCalendarMoved: (
    title: string,
    day: string,
    from: string,
    to: string,
  ) => string;
  /** Announced when a resize commits. */
  eventCalendarResized: (title: string, to: string) => string;
  /** Announced when an edit is aborted. */
  eventCalendarEditCancelled: string;
  /** `aria-roledescription` of an editable event pill. */
  eventCalendarMovableEvent: string;

  // --- Media -----------------------------------------------------------------
  /** Lightbox / gallery: previous-image control. */
  previousImage: string;
  /** Lightbox / gallery: next-image control. */
  nextImage: string;
  /** Lightbox counter + per-image aria label, e.g. `Image 2 of 8`. */
  imageOf: (index: number, total: number) => string;
  /** Gallery tile label; receives the image's alt text. */
  viewImage: (alt: string) => string;
  /** Shown in an image block whose source failed to load. */
  imageFailed: string;
  /** Cropper zoom controls. */
  zoom: string;
  zoomIn: string;
  zoomOut: string;
  /** Media gallery region label. */
  mediaLibrary: string;
  /** File upload dropzone + states. */
  dropzoneLabel: string;
  uploadFailed: string;
  retryUpload: string;
  /** Form error summary heading. */
  errorSummaryTitle: string;

  // --- Transfer list -----------------------------------------------------------
  /** Default column titles. */
  available: string;
  selected: string;
  /** Move-button labels; receive the target list's title. */
  transferSelected: (target: string) => string;
  transferAll: (target: string) => string;
  /** Announced after a move. */
  itemsMoved: (count: number, target: string) => string;

  // --- Notifications / tour ------------------------------------------------------
  notificationsTitle: string;
  allCaughtUp: string;
  markAllRead: string;
  notificationsUnread: (count: number) => string;
  /** Unread state announced per row. */
  unread: string;
  tourStepOf: (step: number, total: number) => string;
  tourSkip: string;
  tourPrevious: string;
  tourNext: string;
  tourDone: string;

  // --- Misc components -------------------------------------------------------
  /** Command palette input placeholder. */
  commandPalettePlaceholder: string;
  /** Command palette dialog label. */
  commandPaletteLabel: string;
  /** Stepper: step state, appended to the step's accessible name. */
  stepCompleted: string;
  stepError: string;
  /** Diff: screen-reader prefix for changed lines. */
  diffAddedLine: string;
  diffRemovedLine: string;
  /** Chip collections (tag input, multi-select): announced on add/remove. */
  itemAdded: (name: string) => string;
  itemRemoved: (name: string) => string;
  /** Splitter separator label. */
  resizePanes: string;
  /** Back-to-top button label. */
  backToTop: string;
  /** Breadcrumb nav landmark label. */
  breadcrumbLabel: string;
  /** FAB default label. */
  fabLabel: string;
  /** Diff view labels. */
  diffBefore: string;
  diffAfter: string;
  diffChanges: string;
  /** App shell. */
  skipToContent: string;
  primaryNav: string;

  // --- Drag & drop announcements --------------------------------------------------
  /** Announced when an item is lifted for keyboard dragging. */
  dndPickedUp: (position: number, total: number) => string;
  /** Announced as the item moves within its list. */
  dndMoved: (position: number, total: number) => string;
  /** Announced as the item moves into another list. */
  dndMovedToList: (list: string, position: number, total: number) => string;
  /** Announced when the item is dropped. */
  dndDropped: (position: number) => string;
  /** Announced as a lifted item reaches a drop zone (a target that is not a list). */
  dndMovedToZone: (zone: string) => string;
  /** Announced when the item is dropped on a zone. */
  dndDroppedInZone: (zone: string) => string;
  /** Announced when the drag is cancelled. */
  dndCancelled: string;

  // --- Repeater ---------------------------------------------------------------------
  /** Repeater add-row button caption (default when no `addLabel` is given). */
  repeaterAddRow: string;
  /** Repeater per-row remove button label (1-based row number). */
  repeaterRemoveRow: (index: number) => string;
  /** Repeater per-row drag-handle label (1-based row number). */
  repeaterReorderRow: (index: number) => string;
  /** Announced after a repeater row is reordered (1-based positions). */
  repeaterRowMoved: (from: number, to: number) => string;

  // --- File upload rejection reasons ------------------------------------------------
  fileRejectedType: (name: string) => string;
  fileRejectedSize: (name: string, limit: string) => string;
  fileRejectedCount: (name: string, max: number) => string;

  // --- Chart screen-reader table headers ---------------------------------------
  chartCategory: string;
  chartValue: string;
  chartSeries: string;
  chartSlice: string;
  chartStage: string;
  chartConversion: string;
  chartAxis: string;
  chartShare: string;
  chartLabel: string;

  // --- QR code -------------------------------------------------------------------
  /** Default accessible label of a QR code, carrying its encoded content. */
  qrCodeLabel: (text: string) => string;

  // --- Sortable list --------------------------------------------------------
  /** Default accessible name of `mk-sortable-list` when no `label` is given. */
  sortableListLabel: string;
  // --- Table filter row --------------------------------------------------------
  /** Table filter row: accessible name of a column's filter control. */
  filterColumn: (column: string) => string;
  /** Table filter row: the per-control clear (×) button. */
  clearFilter: (column: string) => string;
  /** Table filter row: the "no filter" option of a select filter. */
  filterAny: string;
  /** Table filter row: placeholder of a number / date filter (matches values ≥ the entry). */
  filterMin: string;

  // --- Block editor -------------------------------------------------------------
  /** Block editor chrome (deep-merged by provideMkI18n). */
  blockEditor: MkBlockEditorStrings;
}

/** The built-in English validation messages. */
export const MK_DEFAULT_VALIDATION: MkValidationStrings = {
  required: 'This field is required',
  email: 'Enter a valid email address',
  min: ({ min }) => `Must be ${min} or more`,
  max: ({ max }) => `Must be ${max} or less`,
  minlength: ({ requiredLength }) =>
    `Must be at least ${requiredLength} characters`,
  maxlength: ({ requiredLength }) =>
    `Must be at most ${requiredLength} characters`,
  pattern: 'Enter a value in the expected format',
  mkMinDate: ({ min }) => `Must be on or after ${min.toLocaleDateString()}`,
  mkMaxDate: ({ max }) => `Must be on or before ${max.toLocaleDateString()}`,
  mkDateFilter: 'This date is not available',
  mkDateRangeIncomplete: 'Select both a start and an end date',
  mkMinTime: ({ min }) => `Must be at or after ${min}`,
  mkMaxTime: ({ max }) => `Must be at or before ${max}`,
  mkMaxItems: ({ max }) =>
    `Select at most ${max} ${max === 1 ? 'item' : 'items'}`,
  mkFileSize: ({ name, maxLabel }) => `${name} is larger than ${maxLabel}`,
  mkFileType: ({ name }) => `${name} is not an accepted file type`,
  cardNumber: 'Enter a valid card number',
  iban: ({ expectedLength }) =>
    expectedLength
      ? `Enter a valid IBAN (${expectedLength} characters)`
      : 'Enter a valid IBAN',
  postalCode: ({ example }) => `Enter a valid postal code, e.g. ${example}`,
  taxId: ({ label, example }) => `Enter a valid ${label}, e.g. ${example}`,
  unknown: 'This value is not valid',
};

/** The built-in English date names. */
export const MK_DEFAULT_DATE_NAMES: MkDateNames = {
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  monthsShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ],
  weekdays: [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  weekdaysNarrow: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
};

const PASSWORD_STRENGTH_LABELS = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];

/** The built-in English strings. */
export const MK_DEFAULT_I18N: MkI18nStrings = {
  validation: MK_DEFAULT_VALIDATION,

  close: 'Close',
  dismiss: 'Dismiss',
  clear: 'Clear',
  confirm: 'Confirm',
  cancel: 'Cancel',
  ok: 'OK',
  save: 'Save',
  submit: 'Submit',
  edit: 'Edit',
  remove: 'Remove',
  removeItem: (name) => `Remove ${name}`,
  empty: 'Empty',
  optional: 'Optional',
  filter: 'Filter…',
  confirmMessage: 'Are you sure?',
  decrease: 'Decrease',
  increase: 'Increase',

  loading: 'Loading…',
  noOptions: 'No options',
  noResults: 'No results',
  noData: 'No data to display',
  translationEditorSearch: 'Search keys and text',
  translationEditorAll: 'All',
  translationEditorOverridden: 'Edited',
  translationEditorMissing: 'Missing',
  translationEditorKey: 'Key',
  translationEditorReset: 'Restore the original text',
  translationEditorExport: 'Export CSV',
  translationEditorKeys: 'keys',
  sessionExpiryTitle: 'Your session is about to end',
  sessionExpiryExtend: 'Stay signed in',
  sessionExpiryExtending: 'Extending…',
  sessionExpiryLogout: 'Sign out now',
  sessionExpiryBody: (countdown) => `For security you will be signed out in ${countdown}. Unsaved changes will be lost.`,
  scannerTitle: 'Scan a code',
  scannerHint: 'Point the camera at a barcode or QR code. It is read automatically.',
  scannerCameraError: 'The camera could not be started. Check the browser permissions.',
  resultsCount: (count) => (count === 1 ? '1 result' : `${count} results`),

  previousPage: 'Go to previous page',
  nextPage: 'Go to next page',
  goToPage: (page) => `Go to page ${page}`,
  paginationLabel: 'Pagination',
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  goToSlide: (slide) => `Go to slide ${slide}`,
  carouselLabel: 'Carousel',
  pauseSlideshow: 'Pause slideshow',
  playSlideshow: 'Play slideshow',
  slideOf: (slide, total) => `Slide ${slide} of ${total}`,

  dateNames: MK_DEFAULT_DATE_NAMES,
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousYears: 'Previous years',
  nextYears: 'Next years',
  selectDate: 'Select date…',
  selectRange: 'Select range…',
  selectTime: 'Select time…',
  selectMonth: 'Select month…',
  selectYear: 'Select year…',
  selectWeek: 'Select week…',
  selectPlaceholder: 'Select…',
  chooseDate: 'Choose date',
  chooseDateRange: 'Choose date range',
  chooseMonth: 'Choose month',
  chooseYear: 'Choose year',
  chooseWeek: 'Choose week',
  openCalendar: 'Open calendar',
  openTimeList: 'Open time list',
  moreActions: 'More actions',
  selectDateTime: 'Select date and time…',
  chooseDateTime: 'Choose date and time',
  chooseTime: 'Choose time',
  openDateTimePicker: 'Open date and time picker',
  daySegment: 'Day',
  monthSegment: 'Month',
  yearSegment: 'Year',
  countdownDays: 'days',
  countdownHours: 'hrs',
  countdownMinutes: 'min',
  countdownSeconds: 'sec',
  countdownFinished: 'Finished',
  dayEvents: (count, titles) =>
    `${count} ${count === 1 ? 'event' : 'events'}${titles ? `: ${titles}` : ''}`,
  moreEvents: (count) => `+${count} more`,

  selectAllRows: 'Select all rows',
  selectRow: (row) => (row ? `Select row ${row}` : 'Select row'),
  expandHeader: 'Expand',
  expandRow: 'Expand row',
  collapseRow: 'Collapse row',
  expandTreeRow: 'Show child rows',
  collapseTreeRow: 'Hide child rows',
  expandGroup: 'Expand group',
  collapseGroup: 'Collapse group',
  groupCount: (count) => `${count} item${count === 1 ? '' : 's'}`,
  resizeColumn: 'Resize column',
  columnWidth: (column, width) => `${column} column width ${width} pixels`,
  columnMoved: (column, position, total) =>
    `${column} moved to position ${position} of ${total}`,
  editCell: 'Press Enter to edit',
  cellSaved: (value) => `Saved ${value}`,
  sortedBy: (column, direction) =>
    `Sorted by ${column} ${direction === 'asc' ? 'ascending' : 'descending'}`,
  sortingCleared: (column) => `Sorting cleared on ${column}`,

  showPassword: 'Show password',
  hidePassword: 'Hide password',
  passwordRuleMinLength: (length) => `At least ${length} characters`,
  passwordRuleUppercase: 'An uppercase letter',
  passwordRuleNumber: 'A number',
  passwordRuleSymbol: 'A symbol',
  passwordStrength: (score) =>
    PASSWORD_STRENGTH_LABELS[Math.max(0, Math.min(4, score))],
  passwordStrengthLabel: 'Password strength:',
  ruleMet: 'Met:',
  ruleNotMet: 'Not met:',
  oneTimeCode: 'One-time code',
  otpDigit: (position) => `Digit ${position}`,
  numericKeypadLabel: 'Numeric keypad',
  keypadClear: 'Clear',
  keypadBackspace: 'Backspace',
  keypadDigitsEntered: (count, length) => `${count} of ${length} digits entered`,
  onScreenKeyboardLabel: 'On-screen keyboard',
  keyboardShift: 'Shift',
  keyboardSpace: 'Space',
  keyboardEnter: 'Enter',
  keyboardAltLayer: 'More characters',
  keyboardBaseLayer: 'Letters',
  ratingLabel: 'Rating',
  ratingValueText: (value, max) => `${value} of ${max} stars`,
  minimum: 'Minimum',
  maximum: 'Maximum',
  chooseColor: 'Choose color',
  hexValue: 'Hex value',
  presetColors: 'Preset colors',
  chooseCountry: 'Choose country',
  searchCountries: 'Search countries…',
  phoneNumber: 'Phone number',
  postalCode: 'Postal code',
  amount: 'Amount',
  cardNumber: 'Card number',
  cardBrand: (brand) => `Card brand: ${brand}`,
  iban: 'IBAN',
  taxId: 'Tax ID',
  signature: 'Signature',
  jsonLabel: 'JSON',

  logViewerLabel: 'Log output',
  logFollow: 'Follow',
  logCopyAll: 'Copy log',
  logWrapLines: 'Wrap lines',

  orgChartLabel: 'Organisation chart',
  orgChartExpand: 'Expand {label}',
  orgChartCollapse: 'Collapse {label}',

  chatLabel: 'Conversation',
  chatComposerLabel: 'Message',
  chatPlaceholder: 'Type a message…',
  chatSend: 'Send',
  chatStop: 'Stop generating',
  chatAttach: 'Attach files',
  chatRemoveAttachment: 'Remove attachment',
  chatAttachments: 'Attachments',
  chatSuggestions: 'Suggestions',
  chatCopy: 'Copy message',
  chatRetry: 'Retry',
  chatTyping: 'Typing…',
  chatStreaming: 'Generating…',
  chatJumpToLatest: 'Jump to latest',
  chatEmpty: 'No messages yet',
  chatYou: 'You',
  chatAssistant: 'Assistant',
  chatToolRunning: 'Running',
  chatToolDone: 'Done',
  chatToolError: 'Failed',

  dynamicFormAdd: 'Add',
  dynamicFormRemove: (index) => `Remove item ${index}`,

  queryBuilderLabel: 'Filter conditions',
  queryAddRule: 'Add rule',
  queryAddGroup: 'Add group',
  queryRemoveRule: 'Remove rule',
  queryRemoveGroup: 'Remove group',
  queryAnd: 'And',
  queryOr: 'Or',
  queryNot: 'Not',
  queryField: 'Field',
  queryOperator: 'Operator',
  queryValue: 'Value',
  queryValueFrom: 'From',
  queryValueTo: 'To',
  queryEmptyGroup: 'No conditions yet',
  queryTrue: 'True',
  queryFalse: 'False',
  queryOpEq: 'equals',
  queryOpNeq: 'does not equal',
  queryOpContains: 'contains',
  queryOpNotContains: 'does not contain',
  queryOpStartsWith: 'starts with',
  queryOpEndsWith: 'ends with',
  queryOpGt: 'greater than',
  queryOpGte: 'at least',
  queryOpLt: 'less than',
  queryOpLte: 'at most',
  queryOpBetween: 'between',
  queryOpIn: 'is any of',
  queryOpNotIn: 'is none of',
  queryOpBefore: 'before',
  queryOpAfter: 'after',
  queryOpEmpty: 'is empty',
  queryOpNotEmpty: 'is not empty',

  dialogMove: 'Move dialog (arrow keys; Home to reset)',
  dialogResize: 'Resize dialog (arrow keys; Home to reset)',

  listboxFilter: 'Filter options',
  listboxEmpty: 'No matching options',

  eventCalendarGrabbed: (title, from, to) =>
    `${title} grabbed, ${from} – ${to}. Use the arrow keys to move, ` +
    'Shift with Up or Down to change the end time, Enter to save, ' +
    'Escape to cancel.',
  eventCalendarPosition: (title, day, from, to) =>
    `${title}, ${day}, ${from} – ${to}.`,
  eventCalendarMoved: (title, day, from, to) =>
    `${title} moved to ${day}, ${from} – ${to}.`,
  eventCalendarResized: (title, to) => `${title} now ends at ${to}.`,
  eventCalendarEditCancelled: 'Move cancelled. The event keeps its original time.',
  eventCalendarMovableEvent: 'Movable event',

  previousImage: 'Previous image',
  nextImage: 'Next image',
  imageOf: (index, total) => `Image ${index} of ${total}`,
  viewImage: (alt) => (alt ? `View ${alt}` : 'View image'),
  imageFailed: 'Image failed to load',
  zoom: 'Zoom',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  mediaLibrary: 'Media library',
  dropzoneLabel: 'Drag files here or click to browse',
  uploadFailed: 'Upload failed',
  retryUpload: 'Retry upload',
  errorSummaryTitle: 'There is a problem',

  available: 'Available',
  selected: 'Selected',
  transferSelected: (target) => `Move selected to ${target}`,
  transferAll: (target) => `Move all to ${target}`,
  itemsMoved: (count, target) =>
    `Moved ${count} ${count === 1 ? 'item' : 'items'} to ${target}`,

  notificationsTitle: 'Notifications',
  allCaughtUp: "You're all caught up",
  markAllRead: 'Mark all read',
  notificationsUnread: (count) => `Notifications, ${count} unread`,
  unread: 'Unread',
  tourStepOf: (step, total) => `Step ${step} of ${total}`,
  tourSkip: 'Skip',
  tourPrevious: 'Previous',
  tourNext: 'Next',
  tourDone: 'Done',

  commandPalettePlaceholder: 'Type a command or search…',
  commandPaletteLabel: 'Command palette',
  stepCompleted: 'Completed',
  stepError: 'Has errors',
  diffAddedLine: 'Added:',
  diffRemovedLine: 'Removed:',
  itemAdded: (name) => `${name} added`,
  itemRemoved: (name) => `${name} removed`,
  resizePanes: 'Resize panes',
  backToTop: 'Back to top',
  breadcrumbLabel: 'Breadcrumb',
  fabLabel: 'Actions',
  diffBefore: 'Before',
  diffAfter: 'After',
  diffChanges: 'Changes',
  skipToContent: 'Skip to content',
  primaryNav: 'Primary',

  dndPickedUp: (position, total) =>
    `Picked up. Item ${position} of ${total}. ` +
    'Use the arrow keys to move, space or enter to drop, escape to cancel.',
  dndMoved: (position, total) => `Moved to position ${position} of ${total}.`,
  dndMovedToList: (list, position, total) =>
    `Moved to ${list}, position ${position} of ${total}.`,
  dndDropped: (position) => `Dropped at position ${position}.`,
  dndMovedToZone: (zone) => `Moved to ${zone}. Space or enter to drop here.`,
  dndDroppedInZone: (zone) => `Dropped in ${zone}.`,
  dndCancelled: 'Movement cancelled. Item returned to its starting position.',

  repeaterAddRow: 'Add row',
  repeaterRemoveRow: (index) => `Remove row ${index}`,
  repeaterReorderRow: (index) => `Reorder row ${index}`,
  repeaterRowMoved: (from, to) => `Row moved from position ${from} to position ${to}.`,

  fileRejectedType: (name) => `${name}: unsupported type`,
  fileRejectedSize: (name, limit) => `${name}: exceeds ${limit}`,
  fileRejectedCount: (name, max) => `${name}: over the ${max}-file limit`,

  chartCategory: 'Category',
  chartValue: 'Value',
  chartSeries: 'Series',
  chartSlice: 'Slice',
  chartStage: 'Stage',
  chartConversion: 'Conversion',
  chartAxis: 'Axis',
  chartShare: 'Share',
  chartLabel: 'Label',

  qrCodeLabel: (text) => `QR code: ${text}`,

  sortableListLabel: 'Sortable list',
  filterColumn: (column) => `Filter ${column}`,
  clearFilter: (column) => `Clear filter for ${column}`,
  filterAny: 'All',
  filterMin: 'Min',

  blockEditor: {
    addBlock: 'Add block',
    addFirstBlock: 'Add your first block',
    insertBlockHere: 'Insert a block here',
    blockInserter: 'Block inserter',
    searchBlocks: 'Search blocks…',
    blocks: 'Blocks',
    moveBlockUp: 'Move block up',
    moveBlockDown: 'Move block down',
    blockOptions: 'Block options',
    duplicate: 'Duplicate',
    remove: 'Remove',
    textFormatting: 'Text formatting',
    altText: 'Alt text',
    caption: 'Caption',
    alignment: 'Alignment',
    replaceImage: 'Replace image',
    imageUrl: 'Image URL',
    externalContent: 'External content',
    embedUrl: 'Embed URL',
    columnSettings: 'Column settings',
    columns: 'Columns',
    ratio: 'Ratio',
    gap: 'Gap',
    align: 'Align',
    justify: 'Justify',
    headingLevel: (level) => `Heading level ${level}`,
    editorLabel: 'Block content editor',
    emptyBlockPlaceholder: 'Type / to choose a block, or start writing…',
    dragHandle: 'Drag handle',
    turnInto: (label) => `Turn into ${label}`,
    unknownBlock: (type) => `Unknown block: ${type}`,
    blockAdded: (label) => `${label} added`,
    blockDuplicated: 'Block duplicated',
    blockDeleted: (label) => `${label} deleted`,
    blockMovedUp: 'Block moved up',
    blockMovedDown: 'Block moved down',
    turnedInto: (label) => `Turned into ${label}`,
    noBlocksMatch: (query) => `No blocks match “${query}”.`,
    groupText: 'Text',
    groupMedia: 'Media',
    groupLayout: 'Layout',
    blockParagraph: 'Paragraph',
    blockParagraphDesc: 'Rich text with inline formatting.',
    blockHeading: 'Heading',
    blockHeadingDesc: 'A section title (H1–H4).',
    blockList: 'List',
    blockListDesc: 'Bulleted or numbered list.',
    blockQuote: 'Quote',
    blockQuoteDesc: 'A blockquote with optional citation.',
    blockCode: 'Code',
    blockCodeDesc: 'Preformatted, monospace code.',
    blockImage: 'Image',
    blockImageDesc: 'Upload or link an image.',
    blockEmbed: 'Embed',
    blockEmbedDesc: 'YouTube, Vimeo or any URL.',
    blockButton: 'Button',
    blockButtonDesc: 'A call-to-action link button.',
    blockDivider: 'Divider',
    blockDividerDesc: 'A horizontal separator.',
    blockColumns: 'Columns',
    blockColumnsDesc: 'A responsive multi-column layout.',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    inlineCode: 'Inline code',
    link: 'Link',
    clearFormatting: 'Clear formatting',
    linkUrlPrompt: 'Link URL',
    editableText: 'Editable text',
    headingPlaceholder: (level) => `Heading ${level}`,
    headingLevelGroup: 'Heading level',
    listStyle: 'List style',
    bulleted: 'Bulleted',
    numbered: 'Numbered',
    listItem: 'List item',
    quoteText: 'Quote text',
    citation: 'Citation',
    addCitation: '— Add a citation',
    codeLanguage: 'Code language',
    codeLanguagePlaceholder: 'language (optional)',
    enterCode: 'Enter code…',
    imageWidth: (percent) => `Width: ${percent}%`,
    uploading: 'Uploading…',
    dropImagePrompt: 'Drag & drop an image, or',
    chooseFile: 'Choose file',
    pasteImageUrl: '…or paste an image URL',
    notAnImage: 'Please choose an image file.',
    uploadFailed: 'Upload failed. Try again or paste a URL.',
    imageAdded: 'Image added',
    pasteEmbedUrl: 'Paste a YouTube, Vimeo or other URL…',
    embedFallbackNote: 'That URL can’t be embedded, but it will render as a link.',
    embedTitle: (provider) => `${provider} embed`,
    embedAdded: (provider) => `${provider} embed added`,
    embeddedContent: 'Embedded content',
    buttonLabel: 'Label',
    buttonLink: 'Link (href)',
    buttonTone: 'Tone',
    buttonVariant: 'Variant',
    buttonDefaultLabel: 'Click me',
    alignLeft: 'Left',
    alignCenter: 'Center',
    alignRight: 'Right',
    tonePrimary: 'Primary',
    toneNeutral: 'Neutral',
    toneSuccess: 'Success',
    toneWarning: 'Warning',
    toneDanger: 'Danger',
    toneInfo: 'Info',
    variantSolid: 'Solid',
    variantSoft: 'Soft',
    variantOutline: 'Outline',
    ratioEqual: 'Equal',
    alignStretch: 'Stretch',
    alignTop: 'Top',
    alignMiddle: 'Middle',
    alignBottom: 'Bottom',
    justifyStart: 'Start',
    justifyCenter: 'Center',
    justifyEnd: 'End',
    justifyBetween: 'Space between',
  },
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
 * Any subset of {@link MkI18nStrings}; the nested `dateNames`, `blockEditor`
 * and `validation` groups may be partial too (they are merged deeply).
 */
export type MkI18nOverrides = Partial<
  Omit<MkI18nStrings, 'dateNames' | 'blockEditor' | 'validation'>
> & {
  dateNames?: Partial<MkDateNames>;
  blockEditor?: Partial<MkBlockEditorStrings>;
  validation?: Partial<MkValidationStrings>;
};

/**
 * Merges `overrides` over a complete string map — shallow for the top level,
 * deep for the `dateNames`, `blockEditor` and `validation` groups. Exported
 * so locale packs and tests can build a map without providing it.
 */
export function mkMergeI18n(
  base: MkI18nStrings,
  overrides: MkI18nOverrides,
): MkI18nStrings {
  return {
    ...base,
    ...overrides,
    dateNames: { ...base.dateNames, ...overrides.dateNames },
    blockEditor: { ...base.blockEditor, ...overrides.blockEditor },
    validation: { ...base.validation, ...overrides.validation },
  };
}

/**
 * Provide localised strings — pass any subset, merged over `base` (the
 * English defaults unless given). The nested `dateNames`, `blockEditor` and
 * `validation` groups are merged deeply, so partial overrides of those work
 * too.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMkI18n({ noResults: 'Brak wyników', close: 'Zamknij' })],
 * });
 * ```
 *
 * A locale pack is a complete map that serves as the base — either through
 * its own helper (`provideMkI18nPl(overrides)` from `@mk-kit/ui/locales/pl`)
 * or explicitly: `provideMkI18n(overrides, MK_PL_I18N)`.
 */
export function provideMkI18n(
  overrides: MkI18nOverrides,
  base: MkI18nStrings = MK_DEFAULT_I18N,
): Provider {
  return { provide: MK_I18N, useValue: mkMergeI18n(base, overrides) };
}
