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
 * Picks the Ukrainian plural form for a count — CLDR's `uk` rules for
 * integers: `one` when the number ends in 1 (but not 11), `few` when it ends
 * in 2–4 (but not 12–14), `many` otherwise.
 *
 * ```ts
 * mkPluralUk(1, 'результат', 'результати', 'результатів');  // 'результат'
 * mkPluralUk(3, 'результат', 'результати', 'результатів');  // 'результати'
 * mkPluralUk(11, 'результат', 'результати', 'результатів'); // 'результатів'
 * ```
 */
export function mkPluralUk(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const n = Math.abs(Math.trunc(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const plural = mkPluralUk;

/** Ukrainian month and weekday names (Sunday-first, lowercase as in `Intl`). */
export const MK_UK_DATE_NAMES: MkDateNames = {
  months: [
    'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
    'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень',
  ],
  monthsShort: [
    'січ', 'лют', 'бер', 'кві', 'тра', 'чер',
    'лип', 'сер', 'вер', 'жов', 'лис', 'гру',
  ],
  weekdays: [
    'неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота',
  ],
  weekdaysShort: ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  weekdaysNarrow: ['Н', 'П', 'В', 'С', 'Ч', 'П', 'С'],
};

/** Ukrainian validation messages rendered by `mk-form-field`. */
export const MK_UK_VALIDATION: MkValidationStrings = {
  required: 'Це поле є обовʼязковим',
  email: 'Введіть дійсну адресу електронної пошти',
  min: ({ min }) => `Значення не може бути меншим за ${min}`,
  max: ({ max }) => `Значення не може бути більшим за ${max}`,
  minlength: ({ requiredLength }) =>
    `Введіть щонайменше ${requiredLength} ${plural(requiredLength, 'символ', 'символи', 'символів')}`,
  maxlength: ({ requiredLength }) =>
    `Введіть не більше ${requiredLength} ${plural(requiredLength, 'символа', 'символів', 'символів')}`,
  pattern: 'Введіть значення в очікуваному форматі',
  mkMinDate: ({ min }) =>
    `Дата не може бути ранішою за ${min.toLocaleDateString('uk-UA')}`,
  mkMaxDate: ({ max }) =>
    `Дата не може бути пізнішою за ${max.toLocaleDateString('uk-UA')}`,
  mkDateFilter: 'Ця дата недоступна',
  mkDateRangeIncomplete: 'Виберіть початкову та кінцеву дати',
  mkMinTime: ({ min }) => `Час не може бути ранішим за ${min}`,
  mkMaxTime: ({ max }) => `Час не може бути пізнішим за ${max}`,
  mkMaxItems: ({ max }) =>
    `Виберіть не більше ${max} ${plural(max, 'елемента', 'елементів', 'елементів')}`,
  mkFileSize: ({ name, maxLabel }) => `Файл ${name} перевищує ${maxLabel}`,
  mkFileType: ({ name }) => `Файл ${name} має неприпустимий тип`,
  cardNumber: 'Введіть дійсний номер картки',
  iban: ({ expectedLength }) =>
    expectedLength
      ? `Введіть дійсний IBAN (${expectedLength} символів)`
      : 'Введіть дійсний IBAN',
  postalCode: ({ example }) => `Введіть дійсний поштовий індекс, напр. ${example}`,
  taxId: ({ label, example }) => `Введіть дійсний ${label}, напр. ${example}`,
  unknown: 'Недійсне значення',
};

/** Ukrainian strings of the block editor's chrome. */
export const MK_UK_BLOCK_EDITOR: MkBlockEditorStrings = {
  addBlock: 'Додати блок',
  addFirstBlock: 'Додати перший блок',
  insertBlockHere: 'Вставити блок тут',
  blockInserter: 'Вставлення блоків',
  searchBlocks: 'Пошук блоків…',
  blocks: 'Блоки',
  moveBlockUp: 'Перемістити блок вище',
  moveBlockDown: 'Перемістити блок нижче',
  blockOptions: 'Параметри блока',
  duplicate: 'Дублювати',
  remove: 'Видалити',
  textFormatting: 'Форматування тексту',
  altText: 'Альтернативний текст',
  caption: 'Підпис',
  alignment: 'Вирівнювання',
  replaceImage: 'Замінити зображення',
  imageUrl: 'URL-адреса зображення',
  externalContent: 'Зовнішній вміст',
  embedUrl: 'URL-адреса вбудовування',
  columnSettings: 'Налаштування колонок',
  columns: 'Колонки',
  ratio: 'Пропорції',
  gap: 'Проміжок',
  align: 'Вирівняти',
  justify: 'Розподілити',
  headingLevel: (level) => `Заголовок рівня ${level}`,
  editorLabel: 'Редактор блокового вмісту',
  emptyBlockPlaceholder: 'Введіть /, щоб вибрати блок, або просто почніть писати…',
  dragHandle: 'Ручка перетягування',
  turnInto: (label) => `Перетворити на: ${label}`,
  unknownBlock: (type) => `Невідомий блок: ${type}`,
  blockAdded: (label) => `Додано: ${label}`,
  blockDuplicated: 'Блок продубльовано',
  blockDeleted: (label) => `Видалено: ${label}`,
  blockMovedUp: 'Блок переміщено вище',
  blockMovedDown: 'Блок переміщено нижче',
  turnedInto: (label) => `Перетворено на: ${label}`,
  noBlocksMatch: (query) => `Немає блоків, що відповідають «${query}».`,
  groupText: 'Текст',
  groupMedia: 'Медіа',
  groupLayout: 'Макет',
  blockParagraph: 'Абзац',
  blockParagraphDesc: 'Текст із вбудованим форматуванням.',
  blockHeading: 'Заголовок',
  blockHeadingDesc: 'Назва розділу (H1–H4).',
  blockList: 'Список',
  blockListDesc: 'Маркований або нумерований список.',
  blockQuote: 'Цитата',
  blockQuoteDesc: 'Блокова цитата з необовʼязковим джерелом.',
  blockCode: 'Код',
  blockCodeDesc: 'Відформатований моноширинний код.',
  blockImage: 'Зображення',
  blockImageDesc: 'Завантажте зображення або додайте посилання.',
  blockEmbed: 'Вбудовування',
  blockEmbedDesc: 'YouTube, Vimeo або будь-яка URL-адреса.',
  blockButton: 'Кнопка',
  blockButtonDesc: 'Кнопка із закликом до дії.',
  blockDivider: 'Розділювач',
  blockDividerDesc: 'Горизонтальна розділювальна лінія.',
  blockColumns: 'Колонки',
  blockColumnsDesc: 'Адаптивний багатоколонковий макет.',
  bold: 'Жирний',
  italic: 'Курсив',
  underline: 'Підкреслений',
  strikethrough: 'Закреслений',
  inlineCode: 'Вбудований код',
  link: 'Посилання',
  clearFormatting: 'Очистити форматування',
  linkUrlPrompt: 'URL-адреса посилання',
  editableText: 'Текст для редагування',
  headingPlaceholder: (level) => `Заголовок ${level}`,
  headingLevelGroup: 'Рівень заголовка',
  listStyle: 'Стиль списку',
  bulleted: 'Маркований',
  numbered: 'Нумерований',
  listItem: 'Елемент списку',
  quoteText: 'Текст цитати',
  citation: 'Джерело',
  addCitation: '— Додати джерело',
  codeLanguage: 'Мова коду',
  codeLanguagePlaceholder: 'мова (необовʼязково)',
  enterCode: 'Введіть код…',
  imageWidth: (percent) => `Ширина: ${percent}%`,
  uploading: 'Завантаження…',
  dropImagePrompt: 'Перетягніть зображення сюди або',
  chooseFile: 'Виберіть файл',
  pasteImageUrl: '…або вставте URL-адресу зображення',
  notAnImage: 'Виберіть файл зображення.',
  uploadFailed: 'Не вдалося завантажити. Спробуйте ще раз або вставте URL-адресу.',
  imageAdded: 'Зображення додано',
  pasteEmbedUrl: 'Вставте URL-адресу з YouTube, Vimeo чи іншу…',
  embedFallbackNote: 'Цю адресу не можна вбудувати, але її буде показано як посилання.',
  embedTitle: (provider) => `Вбудовування ${provider}`,
  embedAdded: (provider) => `Додано вбудовування ${provider}`,
  embeddedContent: 'Вбудований вміст',
  buttonLabel: 'Напис',
  buttonLink: 'Посилання (href)',
  buttonTone: 'Тон',
  buttonVariant: 'Варіант',
  buttonDefaultLabel: 'Натисніть',
  alignLeft: 'Ліворуч',
  alignCenter: 'По центру',
  alignRight: 'Праворуч',
  tonePrimary: 'Основний',
  toneNeutral: 'Нейтральний',
  toneSuccess: 'Успіх',
  toneWarning: 'Попередження',
  toneDanger: 'Небезпека',
  toneInfo: 'Інформація',
  variantSolid: 'Заповнений',
  variantSoft: 'Мʼякий',
  variantOutline: 'Контурний',
  ratioEqual: 'Рівні',
  alignStretch: 'Розтягнути',
  alignTop: 'Угорі',
  alignMiddle: 'Посередині',
  alignBottom: 'Унизу',
  justifyStart: 'На початку',
  justifyCenter: 'По центру',
  justifyEnd: 'У кінці',
  justifyBetween: 'Рівномірно',
};

const PASSWORD_STRENGTH_LABELS = ['Слабкий', 'Слабкий', 'Посередній', 'Хороший', 'Надійний'];

/**
 * The complete Ukrainian string map — every key of {@link MkI18nStrings},
 * `locale: 'uk-UA'` and `currency: 'UAH'` for the formatting pipes.
 * Provide it whole with {@link provideMkI18nUk}, or pass it as the base of
 * `provideMkI18n(overrides, MK_UK_I18N)`.
 */
export const MK_UK_I18N: MkI18nStrings = {
  locale: 'uk-UA',
  currency: 'UAH',

  validation: MK_UK_VALIDATION,

  close: 'Закрити',
  dismiss: 'Відхилити',
  clear: 'Очистити',
  confirm: 'Підтвердити',
  cancel: 'Скасувати',
  ok: 'OK',
  save: 'Зберегти',
  submit: 'Надіслати',
  edit: 'Редагувати',
  remove: 'Видалити',
  removeItem: (name) => `Видалити ${name}`,
  empty: 'Порожньо',
  optional: 'Необовʼязково',
  filter: 'Фільтрувати…',
  confirmMessage: 'Ви впевнені?',
  decrease: 'Зменшити',
  increase: 'Збільшити',

  loading: 'Завантаження…',
  noOptions: 'Немає варіантів',
  noResults: 'Немає результатів',
  noData: 'Немає даних для відображення',
  resultsCount: (count) =>
    `${count} ${plural(count, 'результат', 'результати', 'результатів')}`,

  previousPage: 'Перейти до попередньої сторінки',
  nextPage: 'Перейти до наступної сторінки',
  goToPage: (page) => `Перейти до сторінки ${page}`,
  paginationLabel: 'Пагінація',
  previousSlide: 'Попередній слайд',
  nextSlide: 'Наступний слайд',
  goToSlide: (slide) => `Перейти до слайда ${slide}`,
  carouselLabel: 'Карусель',
  pauseSlideshow: 'Призупинити показ слайдів',
  playSlideshow: 'Продовжити показ слайдів',
  slideOf: (slide, total) => `Слайд ${slide} з ${total}`,

  dateNames: MK_UK_DATE_NAMES,
  previousMonth: 'Попередній місяць',
  nextMonth: 'Наступний місяць',
  previousYear: 'Попередній рік',
  nextYear: 'Наступний рік',
  previousYears: 'Попередні роки',
  nextYears: 'Наступні роки',
  selectDate: 'Виберіть дату…',
  selectRange: 'Виберіть діапазон…',
  selectTime: 'Виберіть час…',
  selectMonth: 'Виберіть місяць…',
  selectYear: 'Виберіть рік…',
  selectWeek: 'Виберіть тиждень…',
  selectPlaceholder: 'Виберіть…',
  chooseDate: 'Вибір дати',
  chooseDateRange: 'Вибір діапазону дат',
  chooseMonth: 'Вибір місяця',
  chooseYear: 'Вибір року',
  chooseWeek: 'Вибір тижня',
  openCalendar: 'Відкрити календар',
  openTimeList: 'Відкрити список часу',
  moreActions: 'Більше дій',
  selectDateTime: 'Виберіть дату й час…',
  chooseDateTime: 'Вибір дати й часу',
  chooseTime: 'Вибір часу',
  openDateTimePicker: 'Відкрити вибір дати й часу',
  daySegment: 'День',
  monthSegment: 'Місяць',
  yearSegment: 'Рік',
  countdownDays: 'дн.',
  countdownHours: 'год',
  countdownMinutes: 'хв',
  countdownSeconds: 'с',
  countdownFinished: 'Завершено',
  dayEvents: (count, titles) =>
    `${count} ${plural(count, 'подія', 'події', 'подій')}${titles ? `: ${titles}` : ''}`,
  moreEvents: (count) => `+${count} ще`,

  selectAllRows: 'Вибрати всі рядки',
  selectRow: (row) => (row ? `Вибрати рядок ${row}` : 'Вибрати рядок'),
  expandHeader: 'Розгорнути',
  expandRow: 'Розгорнути рядок',
  collapseRow: 'Згорнути рядок',
  expandTreeRow: 'Показати дочірні рядки',
  collapseTreeRow: 'Сховати дочірні рядки',
  expandGroup: 'Розгорнути групу',
  collapseGroup: 'Згорнути групу',
  groupCount: (count) =>
    `${count} ${plural(count, 'елемент', 'елементи', 'елементів')}`,
  resizeColumn: 'Змінити ширину колонки',
  columnWidth: (column, width) => `Ширина колонки ${column}: ${width} пкс`,
  columnMoved: (column, position, total) =>
    `Колонку ${column} переміщено на позицію ${position} з ${total}`,
  editCell: 'Натисніть Enter, щоб редагувати',
  cellSaved: (value) => `Збережено ${value}`,
  sortedBy: (column, direction) =>
    `Відсортовано за ${column} ${direction === 'asc' ? 'за зростанням' : 'за спаданням'}`,
  sortingCleared: (column) => `Сортування за ${column} скасовано`,

  showPassword: 'Показати пароль',
  hidePassword: 'Сховати пароль',
  passwordRuleMinLength: (length) =>
    `Щонайменше ${length} ${plural(length, 'символ', 'символи', 'символів')}`,
  passwordRuleUppercase: 'Велика літера',
  passwordRuleNumber: 'Цифра',
  passwordRuleSymbol: 'Спеціальний символ',
  passwordStrength: (score) =>
    PASSWORD_STRENGTH_LABELS[Math.max(0, Math.min(4, score))],
  passwordStrengthLabel: 'Надійність пароля:',
  ruleMet: 'Виконано:',
  ruleNotMet: 'Не виконано:',
  oneTimeCode: 'Одноразовий код',
  otpDigit: (position) => `Цифра ${position}`,
  numericKeypadLabel: 'Цифрова клавіатура',
  keypadClear: 'Очистити',
  keypadBackspace: 'Backspace',
  keypadDigitsEntered: (count, length) => `Введено ${count} з ${length} цифр`,
  onScreenKeyboardLabel: 'Екранна клавіатура',
  keyboardShift: 'Shift',
  keyboardSpace: 'Пробіл',
  keyboardEnter: 'Enter',
  keyboardAltLayer: 'Більше символів',
  keyboardBaseLayer: 'Літери',
  ratingLabel: 'Оцінка',
  ratingValueText: (value, max) =>
    `${value} з ${max} ${plural(max, 'зірки', 'зірок', 'зірок')}`,
  minimum: 'Мінімум',
  maximum: 'Максимум',
  chooseColor: 'Виберіть колір',
  hexValue: 'Шістнадцяткове значення',
  presetColors: 'Стандартні кольори',
  chooseCountry: 'Виберіть країну',
  searchCountries: 'Пошук країни…',
  phoneNumber: 'Номер телефону',
  postalCode: 'Поштовий індекс',
  amount: 'Сума',
  cardNumber: 'Номер картки',
  cardBrand: (brand) => `Тип картки: ${brand}`,
  iban: 'IBAN',
  taxId: 'Податковий номер',
  signature: 'Підпис',
  jsonLabel: 'JSON',

  logViewerLabel: 'Журнал подій',
  logFollow: 'Стежити',
  logCopyAll: 'Копіювати журнал',
  logWrapLines: 'Переносити рядки',

  orgChartLabel: 'Організаційна структура',
  orgChartExpand: 'Розгорнути {label}',
  orgChartCollapse: 'Згорнути {label}',

  chatLabel: 'Розмова',
  chatComposerLabel: 'Повідомлення',
  chatPlaceholder: 'Напишіть повідомлення…',
  chatSend: 'Надіслати',
  chatStop: 'Зупинити генерування',
  chatAttach: 'Додати файли',
  chatRemoveAttachment: 'Видалити вкладення',
  chatAttachments: 'Вкладення',
  chatSuggestions: 'Пропозиції',
  chatCopy: 'Копіювати повідомлення',
  chatRetry: 'Повторити',
  chatTyping: 'Пише…',
  chatStreaming: 'Генерування…',
  chatJumpToLatest: 'Перейти до найновіших',
  chatEmpty: 'Немає повідомлень',
  chatYou: 'Ви',
  chatAssistant: 'Асистент',
  chatToolRunning: 'Виконується',
  chatToolDone: 'Готово',
  chatToolError: 'Помилка',

  dynamicFormAdd: 'Додати',
  dynamicFormRemove: (index) => `Видалити елемент ${index}`,

  queryBuilderLabel: 'Умови фільтрування',
  queryAddRule: 'Додати правило',
  queryAddGroup: 'Додати групу',
  queryRemoveRule: 'Видалити правило',
  queryRemoveGroup: 'Видалити групу',
  queryAnd: 'Та',
  queryOr: 'Або',
  queryNot: 'Не',
  queryField: 'Поле',
  queryOperator: 'Оператор',
  queryValue: 'Значення',
  queryValueFrom: 'Від',
  queryValueTo: 'До',
  queryEmptyGroup: 'Немає умов',
  queryTrue: 'Істина',
  queryFalse: 'Хиба',
  queryOpEq: 'дорівнює',
  queryOpNeq: 'не дорівнює',
  queryOpContains: 'містить',
  queryOpNotContains: 'не містить',
  queryOpStartsWith: 'починається з',
  queryOpEndsWith: 'закінчується на',
  queryOpGt: 'більше ніж',
  queryOpGte: 'щонайменше',
  queryOpLt: 'менше ніж',
  queryOpLte: 'щонайбільше',
  queryOpBetween: 'між',
  queryOpIn: 'є одним із',
  queryOpNotIn: 'не є жодним із',
  queryOpBefore: 'до',
  queryOpAfter: 'після',
  queryOpEmpty: 'порожнє',
  queryOpNotEmpty: 'не порожнє',

  dialogMove: 'Перемістити вікно (стрілки; Home повертає)',
  dialogResize: 'Змінити розмір вікна (стрілки; Home повертає)',

  listboxFilter: 'Фільтрувати варіанти',
  listboxEmpty: 'Немає відповідних варіантів',

  eventCalendarGrabbed: (title, from, to) =>
    `Піднято ${title}, ${from} – ${to}. Стрілки переміщують, ` +
    'Shift зі стрілкою вгору або вниз змінює час завершення, ' +
    'Enter зберігає, Escape скасовує.',
  eventCalendarPosition: (title, day, from, to) =>
    `${title}, ${day}, ${from} – ${to}.`,
  eventCalendarMoved: (title, day, from, to) =>
    `${title} переміщено на ${day}, ${from} – ${to}.`,
  eventCalendarResized: (title, to) => `${title} тепер закінчується о ${to}.`,
  eventCalendarEditCancelled:
    'Переміщення скасовано. Подія зберігає початковий час.',
  eventCalendarMovableEvent: 'Подія, яку можна переміщувати',

  previousImage: 'Попереднє зображення',
  nextImage: 'Наступне зображення',
  imageOf: (index, total) => `Зображення ${index} з ${total}`,
  viewImage: (alt) => (alt ? `Переглянути ${alt}` : 'Переглянути зображення'),
  imageFailed: 'Не вдалося завантажити зображення',
  zoom: 'Масштаб',
  zoomIn: 'Збільшити',
  zoomOut: 'Зменшити',
  mediaLibrary: 'Медіатека',
  dropzoneLabel: 'Перетягніть файли сюди або натисніть, щоб вибрати',
  uploadFailed: 'Не вдалося завантажити',
  retryUpload: 'Повторити завантаження',
  errorSummaryTitle: 'Виникла проблема',

  available: 'Доступні',
  selected: 'Вибрані',
  transferSelected: (target) => `Перемістити вибрані до: ${target}`,
  transferAll: (target) => `Перемістити всі до: ${target}`,
  itemsMoved: (count, target) =>
    `Переміщено ${count} ${plural(count, 'елемент', 'елементи', 'елементів')} до: ${target}`,

  notificationsTitle: 'Сповіщення',
  allCaughtUp: 'Усе прочитано',
  markAllRead: 'Позначити всі як прочитані',
  notificationsUnread: (count) =>
    `Сповіщення, ${count} ${plural(count, 'непрочитане', 'непрочитані', 'непрочитаних')}`,
  unread: 'Непрочитані',
  tourStepOf: (step, total) => `Крок ${step} з ${total}`,
  tourSkip: 'Пропустити',
  tourPrevious: 'Назад',
  tourNext: 'Далі',
  tourDone: 'Готово',

  commandPalettePlaceholder: 'Введіть команду або шукайте…',
  commandPaletteLabel: 'Палітра команд',
  stepCompleted: 'Завершено',
  stepError: 'Містить помилки',
  diffAddedLine: 'Додано:',
  diffRemovedLine: 'Видалено:',
  itemAdded: (name) => `Додано ${name}`,
  itemRemoved: (name) => `Видалено ${name}`,
  resizePanes: 'Змінити розмір панелей',
  backToTop: 'Повернутися нагору',
  breadcrumbLabel: 'Навігаційний ланцюжок',
  fabLabel: 'Дії',
  diffBefore: 'До',
  diffAfter: 'Після',
  diffChanges: 'Зміни',
  skipToContent: 'Перейти до вмісту',
  primaryNav: 'Головна',

  dndPickedUp: (position, total) =>
    `Піднято. Елемент ${position} з ${total}. ` +
    'Стрілки переміщують, пробіл або Enter опускає, Escape скасовує.',
  dndMoved: (position, total) => `Переміщено на позицію ${position} з ${total}.`,
  dndMovedToList: (list, position, total) =>
    `Переміщено до: ${list}, позиція ${position} з ${total}.`,
  dndDropped: (position) => `Опущено на позиції ${position}.`,
  dndMovedToZone: (zone) => `Переміщено до: ${zone}. Пробіл або Enter опускає тут.`,
  dndDroppedInZone: (zone) => `Опущено в: ${zone}.`,
  dndCancelled: 'Переміщення скасовано. Елемент повернувся на початкове місце.',

  repeaterAddRow: 'Додати рядок',
  repeaterRemoveRow: (index) => `Видалити рядок ${index}`,
  repeaterReorderRow: (index) => `Змінити порядок рядка ${index}`,
  repeaterRowMoved: (from, to) =>
    `Рядок переміщено з позиції ${from} на позицію ${to}.`,

  fileRejectedType: (name) => `${name}: непідтримуваний тип`,
  fileRejectedSize: (name, limit) => `${name}: перевищує ${limit}`,
  fileRejectedCount: (name, max) =>
    `${name}: перевищено ліміт ${max} ${plural(max, 'файлу', 'файлів', 'файлів')}`,

  chartCategory: 'Категорія',
  chartValue: 'Значення',
  chartSeries: 'Серія',
  chartSlice: 'Сегмент',
  chartStage: 'Етап',
  chartConversion: 'Конверсія',
  chartAxis: 'Вісь',
  chartShare: 'Частка',
  chartLabel: 'Мітка',

  qrCodeLabel: (text) => `QR-код: ${text}`,

  sortableListLabel: 'Список із сортуванням',
  filterColumn: (column) => `Фільтрувати ${column}`,
  clearFilter: (column) => `Очистити фільтр колонки ${column}`,
  filterAny: 'Усі',
  filterMin: 'Мін',

  blockEditor: MK_UK_BLOCK_EDITOR,
};

/**
 * Provides the Ukrainian strings — {@link MK_UK_I18N} with any `overrides`
 * merged on top (deep for `dateNames`, `blockEditor` and `validation`, like
 * `provideMkI18n`).
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMkI18nUk({ noData: 'Тут нічого немає' })],
 * });
 * ```
 */
export function provideMkI18nUk(overrides: MkI18nOverrides = {}): Provider {
  return provideMkI18n(overrides, MK_UK_I18N);
}
