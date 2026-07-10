import { InjectionToken, type Provider } from '@angular/core';

/** Direction passed to the sort announcer. */
export type MkSortAnnounceDirection = 'asc' | 'desc';

/**
 * Localised date-name tables consumed by the calendar, the date/month/week
 * pickers and `formatDate`. All arrays are full-length (12 months, 7 weekdays
 * starting with Sunday) — override the whole set for a locale.
 */
export interface MkDateNames {
  /** Full month names, January-first (12). */
  months: readonly string[];
  /** Abbreviated month names (12). */
  monthsShort: readonly string[];
  /** Full weekday names, Sunday-first (7). */
  weekdays: readonly string[];
  /** Abbreviated weekday names (7). */
  weekdaysShort: readonly string[];
  /** One/two-letter weekday names for calendar headers (7). */
  weekdaysNarrow: readonly string[];
}

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
 * All user-facing strings the library renders itself (aria-labels, empty-state
 * text, control captions and screen-reader announcements). Consumers localise
 * the library by overriding any subset via {@link provideMkI18n}. Interpolated
 * strings are functions so translators control word order.
 */
export interface MkI18nStrings {
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
  /** Announced when the drag is cancelled. */
  dndCancelled: string;

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

  // --- Block editor -------------------------------------------------------------
  /** Block editor chrome (deep-merged by provideMkI18n). */
  blockEditor: MkBlockEditorStrings;
}

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
  close: 'Close',
  dismiss: 'Dismiss',
  clear: 'Clear',
  confirm: 'Confirm',
  cancel: 'Cancel',
  ok: 'OK',
  save: 'Save',
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

  previousPage: 'Go to previous page',
  nextPage: 'Go to next page',
  goToPage: (page) => `Go to page ${page}`,
  paginationLabel: 'Pagination',
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  goToSlide: (slide) => `Go to slide ${slide}`,
  carouselLabel: 'Carousel',

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
  ratingLabel: 'Rating',
  ratingValueText: (value, max) => `${value} of ${max} stars`,
  minimum: 'Minimum',
  maximum: 'Maximum',
  chooseColor: 'Choose color',
  hexValue: 'Hex value',
  presetColors: 'Preset colors',
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
  dndCancelled: 'Movement cancelled. Item returned to its starting position.',

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
 * Provide localised strings (merged over the English defaults) — pass any
 * subset. The nested `dateNames` and `blockEditor` groups are merged deeply,
 * so partial overrides of those work too.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMkI18n({ noResults: 'Brak wyników', close: 'Zamknij' })],
 * });
 * ```
 */
export function provideMkI18n(
  overrides: Partial<Omit<MkI18nStrings, 'dateNames' | 'blockEditor'>> & {
    dateNames?: Partial<MkDateNames>;
    blockEditor?: Partial<MkBlockEditorStrings>;
  },
): Provider {
  const value: MkI18nStrings = {
    ...MK_DEFAULT_I18N,
    ...overrides,
    dateNames: { ...MK_DEFAULT_DATE_NAMES, ...overrides.dateNames },
    blockEditor: { ...MK_DEFAULT_I18N.blockEditor, ...overrides.blockEditor },
  };
  return { provide: MK_I18N, useValue: value };
}
