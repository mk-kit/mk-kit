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
 * Picks the Spanish plural form for a count — CLDR's `es` rules for integers:
 * `one` for 1, `other` for everything else.
 *
 * ```ts
 * mkPluralEs(1, 'resultado', 'resultados'); // 'resultado'
 * mkPluralEs(3, 'resultado', 'resultados'); // 'resultados'
 * ```
 */
export function mkPluralEs(count: number, one: string, other: string): string {
  return Math.abs(Math.trunc(count)) === 1 ? one : other;
}

const plural = mkPluralEs;

/** Spanish month and weekday names (Sunday-first, lowercase as in `Intl`). */
export const MK_ES_DATE_NAMES: MkDateNames = {
  months: [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ],
  monthsShort: [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sept', 'oct', 'nov', 'dic',
  ],
  weekdays: [
    'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
  ],
  weekdaysShort: ['dom.', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.'],
  weekdaysNarrow: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
};

/** Spanish validation messages rendered by `mk-form-field`. */
export const MK_ES_VALIDATION: MkValidationStrings = {
  required: 'Este campo es obligatorio',
  email: 'Introduce una dirección de correo válida',
  min: ({ min }) => `El valor no puede ser inferior a ${min}`,
  max: ({ max }) => `El valor no puede ser superior a ${max}`,
  minlength: ({ requiredLength }) =>
    `Introduce al menos ${requiredLength} ${plural(requiredLength, 'carácter', 'caracteres')}`,
  maxlength: ({ requiredLength }) =>
    `Introduce como máximo ${requiredLength} ${plural(requiredLength, 'carácter', 'caracteres')}`,
  pattern: 'Introduce un valor con el formato esperado',
  mkMinDate: ({ min }) =>
    `La fecha no puede ser anterior al ${min.toLocaleDateString('es-ES')}`,
  mkMaxDate: ({ max }) =>
    `La fecha no puede ser posterior al ${max.toLocaleDateString('es-ES')}`,
  mkDateFilter: 'Esta fecha no está disponible',
  mkDateRangeIncomplete: 'Selecciona una fecha de inicio y una de fin',
  mkMinTime: ({ min }) => `La hora no puede ser anterior a las ${min}`,
  mkMaxTime: ({ max }) => `La hora no puede ser posterior a las ${max}`,
  mkMaxItems: ({ max }) =>
    `Selecciona como máximo ${max} ${plural(max, 'elemento', 'elementos')}`,
  mkFileSize: ({ name, maxLabel }) => `El archivo ${name} supera ${maxLabel}`,
  mkFileType: ({ name }) => `El archivo ${name} tiene un tipo no permitido`,
  cardNumber: 'Introduce un número de tarjeta válido',
  iban: ({ expectedLength }) =>
    expectedLength
      ? `Introduce un IBAN válido (${expectedLength} caracteres)`
      : 'Introduce un IBAN válido',
  postalCode: ({ example }) => `Introduce un código postal válido, p. ej. ${example}`,
  taxId: ({ label, example }) => `Introduce un ${label} válido, p. ej. ${example}`,
  unknown: 'Valor no válido',
};

/** Spanish strings of the block editor's chrome. */
export const MK_ES_BLOCK_EDITOR: MkBlockEditorStrings = {
  addBlock: 'Añadir bloque',
  addFirstBlock: 'Añadir el primer bloque',
  insertBlockHere: 'Insertar bloque aquí',
  blockInserter: 'Insertador de bloques',
  searchBlocks: 'Buscar bloques…',
  blocks: 'Bloques',
  moveBlockUp: 'Mover bloque hacia arriba',
  moveBlockDown: 'Mover bloque hacia abajo',
  blockOptions: 'Opciones del bloque',
  duplicate: 'Duplicar',
  remove: 'Eliminar',
  textFormatting: 'Formato de texto',
  altText: 'Texto alternativo',
  caption: 'Leyenda',
  alignment: 'Alineación',
  replaceImage: 'Reemplazar imagen',
  imageUrl: 'URL de la imagen',
  externalContent: 'Contenido externo',
  embedUrl: 'URL de inserción',
  columnSettings: 'Ajustes de columnas',
  columns: 'Columnas',
  ratio: 'Proporción',
  gap: 'Separación',
  align: 'Alinear',
  justify: 'Distribuir',
  headingLevel: (level) => `Encabezado de nivel ${level}`,
  editorLabel: 'Editor de contenido por bloques',
  emptyBlockPlaceholder: 'Escribe / para elegir un bloque, o simplemente empieza a escribir…',
  dragHandle: 'Asa de arrastre',
  turnInto: (label) => `Convertir en: ${label}`,
  unknownBlock: (type) => `Bloque desconocido: ${type}`,
  blockAdded: (label) => `Añadido: ${label}`,
  blockDuplicated: 'Bloque duplicado',
  blockDeleted: (label) => `Eliminado: ${label}`,
  blockMovedUp: 'Bloque movido hacia arriba',
  blockMovedDown: 'Bloque movido hacia abajo',
  turnedInto: (label) => `Convertido en: ${label}`,
  noBlocksMatch: (query) => `Ningún bloque coincide con «${query}».`,
  groupText: 'Texto',
  groupMedia: 'Multimedia',
  groupLayout: 'Diseño',
  blockParagraph: 'Párrafo',
  blockParagraphDesc: 'Texto con formato en línea.',
  blockHeading: 'Encabezado',
  blockHeadingDesc: 'Título de sección (H1–H4).',
  blockList: 'Lista',
  blockListDesc: 'Lista con viñetas o numerada.',
  blockQuote: 'Cita',
  blockQuoteDesc: 'Cita en bloque con fuente opcional.',
  blockCode: 'Código',
  blockCodeDesc: 'Código con formato de ancho fijo.',
  blockImage: 'Imagen',
  blockImageDesc: 'Sube una imagen o enlázala.',
  blockEmbed: 'Inserción',
  blockEmbedDesc: 'YouTube, Vimeo o cualquier URL.',
  blockButton: 'Botón',
  blockButtonDesc: 'Un botón de llamada a la acción.',
  blockDivider: 'Separador',
  blockDividerDesc: 'Una línea divisoria horizontal.',
  blockColumns: 'Columnas',
  blockColumnsDesc: 'Diseño adaptable en varias columnas.',
  bold: 'Negrita',
  italic: 'Cursiva',
  underline: 'Subrayado',
  strikethrough: 'Tachado',
  inlineCode: 'Código en línea',
  link: 'Enlace',
  clearFormatting: 'Quitar formato',
  linkUrlPrompt: 'URL del enlace',
  editableText: 'Texto editable',
  headingPlaceholder: (level) => `Encabezado ${level}`,
  headingLevelGroup: 'Nivel de encabezado',
  listStyle: 'Estilo de lista',
  bulleted: 'Con viñetas',
  numbered: 'Numerada',
  listItem: 'Elemento de lista',
  quoteText: 'Texto de la cita',
  citation: 'Fuente',
  addCitation: '— Añadir fuente',
  codeLanguage: 'Lenguaje del código',
  codeLanguagePlaceholder: 'lenguaje (opcional)',
  enterCode: 'Escribe el código…',
  imageWidth: (percent) => `Anchura: ${percent} %`,
  uploading: 'Subiendo…',
  dropImagePrompt: 'Arrastra y suelta una imagen o',
  chooseFile: 'Elegir archivo',
  pasteImageUrl: '…o pega la URL de una imagen',
  notAnImage: 'Elige un archivo de imagen.',
  uploadFailed: 'No se pudo subir. Inténtalo de nuevo o pega una URL.',
  imageAdded: 'Imagen añadida',
  pasteEmbedUrl: 'Pega una URL de YouTube, Vimeo u otra…',
  embedFallbackNote: 'Esta URL no se puede insertar; se mostrará como un enlace.',
  embedTitle: (provider) => `Inserción de ${provider}`,
  embedAdded: (provider) => `Inserción de ${provider} añadida`,
  embeddedContent: 'Contenido insertado',
  buttonLabel: 'Etiqueta',
  buttonLink: 'Enlace (href)',
  buttonTone: 'Tono',
  buttonVariant: 'Variante',
  buttonDefaultLabel: 'Haz clic',
  alignLeft: 'A la izquierda',
  alignCenter: 'Centrado',
  alignRight: 'A la derecha',
  tonePrimary: 'Principal',
  toneNeutral: 'Neutro',
  toneSuccess: 'Éxito',
  toneWarning: 'Advertencia',
  toneDanger: 'Peligro',
  toneInfo: 'Información',
  variantSolid: 'Relleno',
  variantSoft: 'Suave',
  variantOutline: 'Contorno',
  ratioEqual: 'Iguales',
  alignStretch: 'Estirar',
  alignTop: 'Arriba',
  alignMiddle: 'Centro',
  alignBottom: 'Abajo',
  justifyStart: 'Inicio',
  justifyCenter: 'Centro',
  justifyEnd: 'Fin',
  justifyBetween: 'Uniforme',
};

const PASSWORD_STRENGTH_LABELS = ['Débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

/**
 * The complete Spanish string map — every key of {@link MkI18nStrings},
 * `locale: 'es-ES'` and `currency: 'EUR'` for the formatting pipes.
 * Provide it whole with {@link provideMkI18nEs}, or pass it as the base of
 * `provideMkI18n(overrides, MK_ES_I18N)`.
 */
export const MK_ES_I18N: MkI18nStrings = {
  locale: 'es-ES',
  currency: 'EUR',

  validation: MK_ES_VALIDATION,

  close: 'Cerrar',
  dismiss: 'Descartar',
  clear: 'Borrar',
  confirm: 'Confirmar',
  cancel: 'Cancelar',
  ok: 'Aceptar',
  save: 'Guardar',
  submit: 'Enviar',
  edit: 'Editar',
  remove: 'Eliminar',
  removeItem: (name) => `Eliminar ${name}`,
  empty: 'Vacío',
  optional: 'Opcional',
  filter: 'Filtrar…',
  confirmMessage: '¿Estás seguro?',
  decrease: 'Reducir',
  increase: 'Aumentar',

  loading: 'Cargando…',
  noOptions: 'Sin opciones',
  noResults: 'Sin resultados',
  noData: 'No hay datos que mostrar',
  resultsCount: (count) =>
    `${count} ${plural(count, 'resultado', 'resultados')}`,

  previousPage: 'Ir a la página anterior',
  nextPage: 'Ir a la página siguiente',
  goToPage: (page) => `Ir a la página ${page}`,
  paginationLabel: 'Paginación',
  previousSlide: 'Diapositiva anterior',
  nextSlide: 'Diapositiva siguiente',
  goToSlide: (slide) => `Ir a la diapositiva ${slide}`,
  carouselLabel: 'Carrusel',
  pauseSlideshow: 'Pausar la presentación',
  playSlideshow: 'Reanudar la presentación',
  slideOf: (slide, total) => `Diapositiva ${slide} de ${total}`,

  dateNames: MK_ES_DATE_NAMES,
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  previousYear: 'Año anterior',
  nextYear: 'Año siguiente',
  previousYears: 'Años anteriores',
  nextYears: 'Años siguientes',
  selectDate: 'Selecciona una fecha…',
  selectRange: 'Selecciona un intervalo…',
  selectTime: 'Selecciona una hora…',
  selectMonth: 'Selecciona un mes…',
  selectYear: 'Selecciona un año…',
  selectWeek: 'Selecciona una semana…',
  selectPlaceholder: 'Seleccionar…',
  chooseDate: 'Selección de fecha',
  chooseDateRange: 'Selección de intervalo de fechas',
  chooseMonth: 'Selección de mes',
  chooseYear: 'Selección de año',
  chooseWeek: 'Selección de semana',
  openCalendar: 'Abrir el calendario',
  openTimeList: 'Abrir la lista de horas',
  moreActions: 'Más acciones',
  selectDateTime: 'Selecciona fecha y hora…',
  chooseDateTime: 'Selección de fecha y hora',
  chooseTime: 'Selección de hora',
  openDateTimePicker: 'Abrir el selector de fecha y hora',
  daySegment: 'Día',
  monthSegment: 'Mes',
  yearSegment: 'Año',
  countdownDays: 'días',
  countdownHours: 'h',
  countdownMinutes: 'min',
  countdownSeconds: 's',
  countdownFinished: 'Finalizado',
  dayEvents: (count, titles) =>
    `${count} ${plural(count, 'evento', 'eventos')}${titles ? `: ${titles}` : ''}`,
  moreEvents: (count) => `+${count} más`,

  selectAllRows: 'Seleccionar todas las filas',
  selectRow: (row) => (row ? `Seleccionar la fila ${row}` : 'Seleccionar la fila'),
  expandHeader: 'Expandir',
  expandRow: 'Expandir la fila',
  collapseRow: 'Contraer la fila',
  expandTreeRow: 'Mostrar las filas hijas',
  collapseTreeRow: 'Ocultar las filas hijas',
  expandGroup: 'Expandir el grupo',
  collapseGroup: 'Contraer el grupo',
  groupCount: (count) =>
    `${count} ${plural(count, 'elemento', 'elementos')}`,
  resizeColumn: 'Cambiar la anchura de la columna',
  columnWidth: (column, width) => `Anchura de la columna ${column}: ${width} px`,
  columnMoved: (column, position, total) =>
    `Columna ${column} movida a la posición ${position} de ${total}`,
  editCell: 'Pulsa Intro para editar',
  cellSaved: (value) => `Guardado ${value}`,
  sortedBy: (column, direction) =>
    `Ordenado por ${column} ${direction === 'asc' ? 'ascendente' : 'descendente'}`,
  sortingCleared: (column) => `Orden por ${column} eliminado`,

  showPassword: 'Mostrar la contraseña',
  hidePassword: 'Ocultar la contraseña',
  passwordRuleMinLength: (length) =>
    `Al menos ${length} ${plural(length, 'carácter', 'caracteres')}`,
  passwordRuleUppercase: 'Una mayúscula',
  passwordRuleNumber: 'Un número',
  passwordRuleSymbol: 'Un símbolo',
  passwordStrength: (score) =>
    PASSWORD_STRENGTH_LABELS[Math.max(0, Math.min(4, score))],
  passwordStrengthLabel: 'Seguridad de la contraseña:',
  ruleMet: 'Cumplido:',
  ruleNotMet: 'No cumplido:',
  oneTimeCode: 'Código de un solo uso',
  otpDigit: (position) => `Dígito ${position}`,
  numericKeypadLabel: 'Teclado numérico',
  keypadClear: 'Borrar',
  keypadBackspace: 'Retroceso',
  keypadDigitsEntered: (count, length) => `${count} de ${length} dígitos introducidos`,
  onScreenKeyboardLabel: 'Teclado en pantalla',
  keyboardShift: 'Mayús',
  keyboardSpace: 'Espacio',
  keyboardEnter: 'Intro',
  keyboardAltLayer: 'Más caracteres',
  keyboardBaseLayer: 'Letras',
  ratingLabel: 'Valoración',
  ratingValueText: (value, max) =>
    `${value} de ${max} ${plural(max, 'estrella', 'estrellas')}`,
  minimum: 'Mínimo',
  maximum: 'Máximo',
  chooseColor: 'Elegir un color',
  hexValue: 'Valor hexadecimal',
  presetColors: 'Colores predefinidos',
  chooseCountry: 'Elegir un país',
  searchCountries: 'Buscar un país…',
  phoneNumber: 'Número de teléfono',
  postalCode: 'Código postal',
  amount: 'Importe',
  cardNumber: 'Número de tarjeta',
  cardBrand: (brand) => `Tipo de tarjeta: ${brand}`,
  iban: 'IBAN',
  taxId: 'Número de identificación fiscal',
  signature: 'Firma',
  jsonLabel: 'JSON',

  logViewerLabel: 'Registro de eventos',
  logFollow: 'Seguir',
  logCopyAll: 'Copiar el registro',
  logWrapLines: 'Ajustar las líneas',

  orgChartLabel: 'Organigrama',
  orgChartExpand: 'Expandir {label}',
  orgChartCollapse: 'Contraer {label}',

  chatLabel: 'Conversación',
  chatComposerLabel: 'Mensaje',
  chatPlaceholder: 'Escribe un mensaje…',
  chatSend: 'Enviar',
  chatStop: 'Detener la generación',
  chatAttach: 'Adjuntar archivos',
  chatRemoveAttachment: 'Quitar el adjunto',
  chatAttachments: 'Adjuntos',
  chatSuggestions: 'Sugerencias',
  chatCopy: 'Copiar el mensaje',
  chatRetry: 'Reintentar',
  chatTyping: 'Escribiendo…',
  chatStreaming: 'Generando…',
  chatJumpToLatest: 'Ir a lo más reciente',
  chatEmpty: 'Sin mensajes',
  chatYou: 'Tú',
  chatAssistant: 'Asistente',
  chatToolRunning: 'En curso',
  chatToolDone: 'Hecho',
  chatToolError: 'Error',

  dynamicFormAdd: 'Añadir',
  dynamicFormRemove: (index) => `Eliminar el elemento ${index}`,

  queryBuilderLabel: 'Condiciones de filtrado',
  queryAddRule: 'Añadir una regla',
  queryAddGroup: 'Añadir un grupo',
  queryRemoveRule: 'Eliminar la regla',
  queryRemoveGroup: 'Eliminar el grupo',
  queryAnd: 'Y',
  queryOr: 'O',
  queryNot: 'No',
  queryField: 'Campo',
  queryOperator: 'Operador',
  queryValue: 'Valor',
  queryValueFrom: 'Desde',
  queryValueTo: 'Hasta',
  queryEmptyGroup: 'Sin condiciones',
  queryTrue: 'Verdadero',
  queryFalse: 'Falso',
  queryOpEq: 'es igual a',
  queryOpNeq: 'es distinto de',
  queryOpContains: 'contiene',
  queryOpNotContains: 'no contiene',
  queryOpStartsWith: 'empieza por',
  queryOpEndsWith: 'termina en',
  queryOpGt: 'mayor que',
  queryOpGte: 'como mínimo',
  queryOpLt: 'menor que',
  queryOpLte: 'como máximo',
  queryOpBetween: 'entre',
  queryOpIn: 'es uno de',
  queryOpNotIn: 'no es ninguno de',
  queryOpBefore: 'antes de',
  queryOpAfter: 'después de',
  queryOpEmpty: 'está vacío',
  queryOpNotEmpty: 'no está vacío',

  dialogMove: 'Mover la ventana (flechas; Inicio restablece)',
  dialogResize: 'Cambiar el tamaño de la ventana (flechas; Inicio restablece)',

  listboxFilter: 'Filtrar las opciones',
  listboxEmpty: 'Ninguna opción coincide',

  eventCalendarGrabbed: (title, from, to) =>
    `${title} seleccionado, ${from} – ${to}. Las flechas lo mueven, ` +
    'Mayús con flecha arriba o abajo cambia la hora de fin, ' +
    'Intro guarda, Escape cancela.',
  eventCalendarPosition: (title, day, from, to) =>
    `${title}, ${day}, ${from} – ${to}.`,
  eventCalendarMoved: (title, day, from, to) =>
    `${title} movido a ${day}, ${from} – ${to}.`,
  eventCalendarResized: (title, to) => `${title} ahora termina a las ${to}.`,
  eventCalendarEditCancelled:
    'Movimiento cancelado. El evento conserva su horario original.',
  eventCalendarMovableEvent: 'Evento desplazable',

  previousImage: 'Imagen anterior',
  nextImage: 'Imagen siguiente',
  imageOf: (index, total) => `Imagen ${index} de ${total}`,
  viewImage: (alt) => (alt ? `Ver ${alt}` : 'Ver la imagen'),
  imageFailed: 'No se pudo cargar la imagen',
  zoom: 'Zoom',
  zoomIn: 'Ampliar',
  zoomOut: 'Reducir',
  mediaLibrary: 'Biblioteca multimedia',
  dropzoneLabel: 'Arrastra archivos aquí o haz clic para elegirlos',
  uploadFailed: 'No se pudo subir',
  retryUpload: 'Reintentar la subida',
  errorSummaryTitle: 'Hay un problema',

  available: 'Disponibles',
  selected: 'Seleccionados',
  transferSelected: (target) => `Mover los seleccionados a: ${target}`,
  transferAll: (target) => `Mover todos a: ${target}`,
  itemsMoved: (count, target) =>
    `${count} ${plural(count, 'elemento movido', 'elementos movidos')} a: ${target}`,

  notificationsTitle: 'Notificaciones',
  allCaughtUp: 'Todo leído',
  markAllRead: 'Marcar todas como leídas',
  notificationsUnread: (count) =>
    `Notificaciones, ${count} sin leer`,
  unread: 'Sin leer',
  tourStepOf: (step, total) => `Paso ${step} de ${total}`,
  tourSkip: 'Omitir',
  tourPrevious: 'Atrás',
  tourNext: 'Siguiente',
  tourDone: 'Hecho',

  commandPalettePlaceholder: 'Escribe un comando o busca…',
  commandPaletteLabel: 'Paleta de comandos',
  stepCompleted: 'Completado',
  stepError: 'Contiene errores',
  diffAddedLine: 'Añadido:',
  diffRemovedLine: 'Eliminado:',
  itemAdded: (name) => `Añadido ${name}`,
  itemRemoved: (name) => `Eliminado ${name}`,
  resizePanes: 'Cambiar el tamaño de los paneles',
  backToTop: 'Volver arriba',
  breadcrumbLabel: 'Ruta de navegación',
  fabLabel: 'Acciones',
  diffBefore: 'Antes',
  diffAfter: 'Después',
  diffChanges: 'Cambios',
  skipToContent: 'Saltar al contenido',
  primaryNav: 'Principal',

  dndPickedUp: (position, total) =>
    `Seleccionado. Elemento ${position} de ${total}. ` +
    'Las flechas lo mueven, espacio o Intro lo suelta, Escape cancela.',
  dndMoved: (position, total) => `Movido a la posición ${position} de ${total}.`,
  dndMovedToList: (list, position, total) =>
    `Movido a: ${list}, posición ${position} de ${total}.`,
  dndDropped: (position) => `Soltado en la posición ${position}.`,
  dndCancelled: 'Movimiento cancelado. El elemento ha vuelto a su sitio original.',

  repeaterAddRow: 'Añadir una fila',
  repeaterRemoveRow: (index) => `Eliminar la fila ${index}`,
  repeaterReorderRow: (index) => `Reordenar la fila ${index}`,
  repeaterRowMoved: (from, to) =>
    `Fila movida de la posición ${from} a la posición ${to}.`,

  fileRejectedType: (name) => `${name}: tipo no admitido`,
  fileRejectedSize: (name, limit) => `${name}: supera ${limit}`,
  fileRejectedCount: (name, max) =>
    `${name}: límite de ${max} ${plural(max, 'archivo', 'archivos')} superado`,

  chartCategory: 'Categoría',
  chartValue: 'Valor',
  chartSeries: 'Serie',
  chartSlice: 'Sector',
  chartStage: 'Etapa',
  chartConversion: 'Conversión',
  chartAxis: 'Eje',
  chartShare: 'Proporción',
  chartLabel: 'Etiqueta',

  qrCodeLabel: (text) => `Código QR: ${text}`,

  sortableListLabel: 'Lista ordenable',
  filterColumn: (column) => `Filtrar ${column}`,
  clearFilter: (column) => `Borrar el filtro de la columna ${column}`,
  filterAny: 'Todos',
  filterMin: 'Mín.',

  blockEditor: MK_ES_BLOCK_EDITOR,
};

/**
 * Provides the Spanish strings — {@link MK_ES_I18N} with any `overrides`
 * merged on top (deep for `dateNames`, `blockEditor` and `validation`, like
 * `provideMkI18n`).
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMkI18nEs({ noData: 'No hay nada aquí' })],
 * });
 * ```
 */
export function provideMkI18nEs(overrides: MkI18nOverrides = {}): Provider {
  return provideMkI18n(overrides, MK_ES_I18N);
}
