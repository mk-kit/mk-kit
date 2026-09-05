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
 * Picks the French plural form for a count — CLDR's `fr` rules for integers:
 * `one` for 0 and 1, `other` for everything else.
 *
 * ```ts
 * mkPluralFr(1, 'résultat', 'résultats'); // 'résultat'
 * mkPluralFr(0, 'résultat', 'résultats'); // 'résultat'
 * mkPluralFr(3, 'résultat', 'résultats'); // 'résultats'
 * ```
 */
export function mkPluralFr(count: number, one: string, other: string): string {
  return Math.abs(Math.trunc(count)) <= 1 ? one : other;
}

const plural = mkPluralFr;

/** French month and weekday names (Sunday-first, lowercase as in `Intl`). */
export const MK_FR_DATE_NAMES: MkDateNames = {
  months: [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ],
  monthsShort: [
    'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
  ],
  weekdays: [
    'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
  ],
  weekdaysShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  weekdaysNarrow: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
};

/** French validation messages rendered by `mk-form-field`. */
export const MK_FR_VALIDATION: MkValidationStrings = {
  required: 'Ce champ est obligatoire',
  email: 'Saisissez une adresse e-mail valide',
  min: ({ min }) => `La valeur ne peut pas être inférieure à ${min}`,
  max: ({ max }) => `La valeur ne peut pas être supérieure à ${max}`,
  minlength: ({ requiredLength }) =>
    `Saisissez au moins ${requiredLength} ${plural(requiredLength, 'caractère', 'caractères')}`,
  maxlength: ({ requiredLength }) =>
    `Saisissez au plus ${requiredLength} ${plural(requiredLength, 'caractère', 'caractères')}`,
  pattern: 'Saisissez une valeur au format attendu',
  mkMinDate: ({ min }) =>
    `La date ne peut pas être antérieure au ${min.toLocaleDateString('fr-FR')}`,
  mkMaxDate: ({ max }) =>
    `La date ne peut pas être postérieure au ${max.toLocaleDateString('fr-FR')}`,
  mkDateFilter: 'Cette date n’est pas disponible',
  mkDateRangeIncomplete: 'Sélectionnez une date de début et une date de fin',
  mkMinTime: ({ min }) => `L’heure ne peut pas être antérieure à ${min}`,
  mkMaxTime: ({ max }) => `L’heure ne peut pas être postérieure à ${max}`,
  mkMaxItems: ({ max }) =>
    `Sélectionnez au plus ${max} ${plural(max, 'élément', 'éléments')}`,
  mkFileSize: ({ name, maxLabel }) => `Le fichier ${name} dépasse ${maxLabel}`,
  mkFileType: ({ name }) => `Le fichier ${name} a un type non autorisé`,
  cardNumber: 'Saisissez un numéro de carte valide',
  iban: ({ expectedLength }) =>
    expectedLength
      ? `Saisissez un IBAN valide (${expectedLength} caractères)`
      : 'Saisissez un IBAN valide',
  postalCode: ({ example }) => `Saisissez un code postal valide, p. ex. ${example}`,
  taxId: ({ label, example }) => `Saisissez un ${label} valide, p. ex. ${example}`,
  unknown: 'Valeur non valide',
};

/** French strings of the block editor's chrome. */
export const MK_FR_BLOCK_EDITOR: MkBlockEditorStrings = {
  addBlock: 'Ajouter un bloc',
  addFirstBlock: 'Ajouter le premier bloc',
  insertBlockHere: 'Insérer un bloc ici',
  blockInserter: 'Insertion de blocs',
  searchBlocks: 'Rechercher des blocs…',
  blocks: 'Blocs',
  moveBlockUp: 'Déplacer le bloc vers le haut',
  moveBlockDown: 'Déplacer le bloc vers le bas',
  blockOptions: 'Options du bloc',
  duplicate: 'Dupliquer',
  remove: 'Supprimer',
  textFormatting: 'Mise en forme du texte',
  altText: 'Texte alternatif',
  caption: 'Légende',
  alignment: 'Alignement',
  replaceImage: 'Remplacer l’image',
  imageUrl: 'URL de l’image',
  externalContent: 'Contenu externe',
  embedUrl: 'URL d’intégration',
  columnSettings: 'Réglages des colonnes',
  columns: 'Colonnes',
  ratio: 'Proportions',
  gap: 'Espacement',
  align: 'Aligner',
  justify: 'Répartir',
  headingLevel: (level) => `Titre de niveau ${level}`,
  editorLabel: 'Éditeur de contenu par blocs',
  emptyBlockPlaceholder: 'Tapez / pour choisir un bloc, ou commencez simplement à écrire…',
  dragHandle: 'Poignée de déplacement',
  turnInto: (label) => `Transformer en : ${label}`,
  unknownBlock: (type) => `Bloc inconnu : ${type}`,
  blockAdded: (label) => `Ajouté : ${label}`,
  blockDuplicated: 'Bloc dupliqué',
  blockDeleted: (label) => `Supprimé : ${label}`,
  blockMovedUp: 'Bloc déplacé vers le haut',
  blockMovedDown: 'Bloc déplacé vers le bas',
  turnedInto: (label) => `Transformé en : ${label}`,
  noBlocksMatch: (query) => `Aucun bloc ne correspond à « ${query} ».`,
  groupText: 'Texte',
  groupMedia: 'Médias',
  groupLayout: 'Mise en page',
  blockParagraph: 'Paragraphe',
  blockParagraphDesc: 'Texte avec mise en forme en ligne.',
  blockHeading: 'Titre',
  blockHeadingDesc: 'Titre de section (H1–H4).',
  blockList: 'Liste',
  blockListDesc: 'Liste à puces ou numérotée.',
  blockQuote: 'Citation',
  blockQuoteDesc: 'Citation avec source facultative.',
  blockCode: 'Code',
  blockCodeDesc: 'Code mis en forme à chasse fixe.',
  blockImage: 'Image',
  blockImageDesc: 'Téléversez une image ou ajoutez un lien.',
  blockEmbed: 'Intégration',
  blockEmbedDesc: 'YouTube, Vimeo ou n’importe quelle URL.',
  blockButton: 'Bouton',
  blockButtonDesc: 'Un bouton d’appel à l’action.',
  blockDivider: 'Séparateur',
  blockDividerDesc: 'Une ligne de séparation horizontale.',
  blockColumns: 'Colonnes',
  blockColumnsDesc: 'Mise en page adaptative multicolonne.',
  bold: 'Gras',
  italic: 'Italique',
  underline: 'Souligné',
  strikethrough: 'Barré',
  inlineCode: 'Code en ligne',
  link: 'Lien',
  clearFormatting: 'Effacer la mise en forme',
  linkUrlPrompt: 'URL du lien',
  editableText: 'Texte modifiable',
  headingPlaceholder: (level) => `Titre ${level}`,
  headingLevelGroup: 'Niveau de titre',
  listStyle: 'Style de liste',
  bulleted: 'À puces',
  numbered: 'Numérotée',
  listItem: 'Élément de liste',
  quoteText: 'Texte de la citation',
  citation: 'Source',
  addCitation: '— Ajouter une source',
  codeLanguage: 'Langage du code',
  codeLanguagePlaceholder: 'langage (facultatif)',
  enterCode: 'Saisissez le code…',
  imageWidth: (percent) => `Largeur : ${percent} %`,
  uploading: 'Téléversement…',
  dropImagePrompt: 'Glissez-déposez une image ou',
  chooseFile: 'Choisir un fichier',
  pasteImageUrl: '…ou collez l’URL d’une image',
  notAnImage: 'Choisissez un fichier image.',
  uploadFailed: 'Le téléversement a échoué. Réessayez ou collez une URL.',
  imageAdded: 'Image ajoutée',
  pasteEmbedUrl: 'Collez une URL de YouTube, Vimeo ou autre…',
  embedFallbackNote: 'Cette URL ne peut pas être intégrée ; elle sera affichée comme un lien.',
  embedTitle: (provider) => `Intégration ${provider}`,
  embedAdded: (provider) => `Intégration ${provider} ajoutée`,
  embeddedContent: 'Contenu intégré',
  buttonLabel: 'Libellé',
  buttonLink: 'Lien (href)',
  buttonTone: 'Ton',
  buttonVariant: 'Variante',
  buttonDefaultLabel: 'Cliquez ici',
  alignLeft: 'À gauche',
  alignCenter: 'Centré',
  alignRight: 'À droite',
  tonePrimary: 'Principal',
  toneNeutral: 'Neutre',
  toneSuccess: 'Succès',
  toneWarning: 'Avertissement',
  toneDanger: 'Danger',
  toneInfo: 'Info',
  variantSolid: 'Plein',
  variantSoft: 'Doux',
  variantOutline: 'Contour',
  ratioEqual: 'Égales',
  alignStretch: 'Étirer',
  alignTop: 'Haut',
  alignMiddle: 'Milieu',
  alignBottom: 'Bas',
  justifyStart: 'Début',
  justifyCenter: 'Centre',
  justifyEnd: 'Fin',
  justifyBetween: 'Uniforme',
};

const PASSWORD_STRENGTH_LABELS = ['Faible', 'Faible', 'Moyen', 'Bon', 'Fort'];

/**
 * The complete French string map — every key of {@link MkI18nStrings},
 * `locale: 'fr-FR'` and `currency: 'EUR'` for the formatting pipes.
 * Provide it whole with {@link provideMkI18nFr}, or pass it as the base of
 * `provideMkI18n(overrides, MK_FR_I18N)`.
 */
export const MK_FR_I18N: MkI18nStrings = {
  locale: 'fr-FR',
  currency: 'EUR',

  validation: MK_FR_VALIDATION,

  close: 'Fermer',
  dismiss: 'Ignorer',
  clear: 'Effacer',
  confirm: 'Confirmer',
  cancel: 'Annuler',
  ok: 'OK',
  save: 'Enregistrer',
  submit: 'Envoyer',
  edit: 'Modifier',
  remove: 'Supprimer',
  removeItem: (name) => `Supprimer ${name}`,
  empty: 'Vide',
  optional: 'Facultatif',
  filter: 'Filtrer…',
  confirmMessage: 'Êtes-vous sûr ?',
  decrease: 'Diminuer',
  increase: 'Augmenter',

  loading: 'Chargement…',
  noOptions: 'Aucune option',
  noResults: 'Aucun résultat',
  noData: 'Aucune donnée à afficher',
  translationEditorSearch: 'Rechercher des clés et du texte',
  translationEditorAll: 'Toutes',
  translationEditorOverridden: 'Modifiées',
  translationEditorMissing: 'Manquantes',
  translationEditorKey: 'Clé',
  translationEditorReset: 'Restaurer le texte d’origine',
  translationEditorExport: 'Exporter en CSV',
  translationEditorKeys: 'clés',
  resultsCount: (count) =>
    `${count} ${plural(count, 'résultat', 'résultats')}`,

  previousPage: 'Aller à la page précédente',
  nextPage: 'Aller à la page suivante',
  goToPage: (page) => `Aller à la page ${page}`,
  paginationLabel: 'Pagination',
  previousSlide: 'Diapositive précédente',
  nextSlide: 'Diapositive suivante',
  goToSlide: (slide) => `Aller à la diapositive ${slide}`,
  carouselLabel: 'Carrousel',
  pauseSlideshow: 'Mettre le diaporama en pause',
  playSlideshow: 'Reprendre le diaporama',
  slideOf: (slide, total) => `Diapositive ${slide} sur ${total}`,

  dateNames: MK_FR_DATE_NAMES,
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  previousYear: 'Année précédente',
  nextYear: 'Année suivante',
  previousYears: 'Années précédentes',
  nextYears: 'Années suivantes',
  selectDate: 'Sélectionnez une date…',
  selectRange: 'Sélectionnez une période…',
  selectTime: 'Sélectionnez une heure…',
  selectMonth: 'Sélectionnez un mois…',
  selectYear: 'Sélectionnez une année…',
  selectWeek: 'Sélectionnez une semaine…',
  selectPlaceholder: 'Sélectionner…',
  chooseDate: 'Sélection de la date',
  chooseDateRange: 'Sélection de la période',
  chooseMonth: 'Sélection du mois',
  chooseYear: 'Sélection de l’année',
  chooseWeek: 'Sélection de la semaine',
  openCalendar: 'Ouvrir le calendrier',
  openTimeList: 'Ouvrir la liste des heures',
  moreActions: 'Plus d’actions',
  selectDateTime: 'Sélectionnez la date et l’heure…',
  chooseDateTime: 'Sélection de la date et de l’heure',
  chooseTime: 'Sélection de l’heure',
  openDateTimePicker: 'Ouvrir le sélecteur de date et d’heure',
  daySegment: 'Jour',
  monthSegment: 'Mois',
  yearSegment: 'Année',
  countdownDays: 'j',
  countdownHours: 'h',
  countdownMinutes: 'min',
  countdownSeconds: 's',
  countdownFinished: 'Terminé',
  dayEvents: (count, titles) =>
    `${count} ${plural(count, 'événement', 'événements')}${titles ? ` : ${titles}` : ''}`,
  moreEvents: (count) => `+${count} de plus`,

  selectAllRows: 'Sélectionner toutes les lignes',
  selectRow: (row) => (row ? `Sélectionner la ligne ${row}` : 'Sélectionner la ligne'),
  expandHeader: 'Développer',
  expandRow: 'Développer la ligne',
  collapseRow: 'Réduire la ligne',
  expandTreeRow: 'Afficher les lignes enfants',
  collapseTreeRow: 'Masquer les lignes enfants',
  expandGroup: 'Développer le groupe',
  collapseGroup: 'Réduire le groupe',
  groupCount: (count) =>
    `${count} ${plural(count, 'élément', 'éléments')}`,
  resizeColumn: 'Redimensionner la colonne',
  columnWidth: (column, width) => `Largeur de la colonne ${column} : ${width} px`,
  columnMoved: (column, position, total) =>
    `Colonne ${column} déplacée en position ${position} sur ${total}`,
  editCell: 'Appuyez sur Entrée pour modifier',
  cellSaved: (value) => `${value} enregistré`,
  sortedBy: (column, direction) =>
    `Trié par ${column} ${direction === 'asc' ? 'croissant' : 'décroissant'}`,
  sortingCleared: (column) => `Tri par ${column} annulé`,

  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  passwordRuleMinLength: (length) =>
    `Au moins ${length} ${plural(length, 'caractère', 'caractères')}`,
  passwordRuleUppercase: 'Une majuscule',
  passwordRuleNumber: 'Un chiffre',
  passwordRuleSymbol: 'Un caractère spécial',
  passwordStrength: (score) =>
    PASSWORD_STRENGTH_LABELS[Math.max(0, Math.min(4, score))],
  passwordStrengthLabel: 'Robustesse du mot de passe :',
  ruleMet: 'Respecté :',
  ruleNotMet: 'Non respecté :',
  oneTimeCode: 'Code à usage unique',
  otpDigit: (position) => `Chiffre ${position}`,
  numericKeypadLabel: 'Pavé numérique',
  keypadClear: 'Effacer',
  keypadBackspace: 'Retour arrière',
  keypadDigitsEntered: (count, length) => `${count} chiffres saisis sur ${length}`,
  onScreenKeyboardLabel: 'Clavier à l’écran',
  keyboardShift: 'Maj',
  keyboardSpace: 'Espace',
  keyboardEnter: 'Entrée',
  keyboardAltLayer: 'Plus de caractères',
  keyboardBaseLayer: 'Lettres',
  ratingLabel: 'Note',
  ratingValueText: (value, max) =>
    `${value} ${plural(value, 'étoile', 'étoiles')} sur ${max}`,
  minimum: 'Minimum',
  maximum: 'Maximum',
  chooseColor: 'Choisir une couleur',
  hexValue: 'Valeur hexadécimale',
  presetColors: 'Couleurs prédéfinies',
  chooseCountry: 'Choisir un pays',
  searchCountries: 'Rechercher un pays…',
  phoneNumber: 'Numéro de téléphone',
  postalCode: 'Code postal',
  amount: 'Montant',
  cardNumber: 'Numéro de carte',
  cardBrand: (brand) => `Type de carte : ${brand}`,
  iban: 'IBAN',
  taxId: 'Numéro d’identification fiscale',
  signature: 'Signature',
  jsonLabel: 'JSON',

  logViewerLabel: 'Journal des événements',
  logFollow: 'Suivre',
  logCopyAll: 'Copier le journal',
  logWrapLines: 'Retour à la ligne automatique',

  orgChartLabel: 'Organigramme',
  orgChartExpand: 'Développer {label}',
  orgChartCollapse: 'Réduire {label}',

  chatLabel: 'Conversation',
  chatComposerLabel: 'Message',
  chatPlaceholder: 'Écrivez un message…',
  chatSend: 'Envoyer',
  chatStop: 'Arrêter la génération',
  chatAttach: 'Joindre des fichiers',
  chatRemoveAttachment: 'Retirer la pièce jointe',
  chatAttachments: 'Pièces jointes',
  chatSuggestions: 'Suggestions',
  chatCopy: 'Copier le message',
  chatRetry: 'Réessayer',
  chatTyping: 'En train d’écrire…',
  chatStreaming: 'Génération…',
  chatJumpToLatest: 'Aller aux plus récents',
  chatEmpty: 'Aucun message',
  chatYou: 'Vous',
  chatAssistant: 'Assistant',
  chatToolRunning: 'En cours',
  chatToolDone: 'Terminé',
  chatToolError: 'Échec',

  dynamicFormAdd: 'Ajouter',
  dynamicFormRemove: (index) => `Supprimer l’élément ${index}`,

  queryBuilderLabel: 'Conditions de filtrage',
  queryAddRule: 'Ajouter une règle',
  queryAddGroup: 'Ajouter un groupe',
  queryRemoveRule: 'Supprimer la règle',
  queryRemoveGroup: 'Supprimer le groupe',
  queryAnd: 'Et',
  queryOr: 'Ou',
  queryNot: 'Non',
  queryField: 'Champ',
  queryOperator: 'Opérateur',
  queryValue: 'Valeur',
  queryValueFrom: 'De',
  queryValueTo: 'À',
  queryEmptyGroup: 'Aucune condition',
  queryTrue: 'Vrai',
  queryFalse: 'Faux',
  queryOpEq: 'est égal à',
  queryOpNeq: 'est différent de',
  queryOpContains: 'contient',
  queryOpNotContains: 'ne contient pas',
  queryOpStartsWith: 'commence par',
  queryOpEndsWith: 'se termine par',
  queryOpGt: 'supérieur à',
  queryOpGte: 'au moins',
  queryOpLt: 'inférieur à',
  queryOpLte: 'au plus',
  queryOpBetween: 'entre',
  queryOpIn: 'est l’un de',
  queryOpNotIn: 'n’est aucun de',
  queryOpBefore: 'avant',
  queryOpAfter: 'après',
  queryOpEmpty: 'est vide',
  queryOpNotEmpty: 'n’est pas vide',

  dialogMove: 'Déplacer la fenêtre (flèches ; Début réinitialise)',
  dialogResize: 'Redimensionner la fenêtre (flèches ; Début réinitialise)',

  listboxFilter: 'Filtrer les options',
  listboxEmpty: 'Aucune option correspondante',

  eventCalendarGrabbed: (title, from, to) =>
    `${title} saisi, ${from} – ${to}. Les flèches déplacent, ` +
    'Maj avec flèche haut ou bas modifie l’heure de fin, ' +
    'Entrée enregistre, Échap annule.',
  eventCalendarPosition: (title, day, from, to) =>
    `${title}, ${day}, ${from} – ${to}.`,
  eventCalendarMoved: (title, day, from, to) =>
    `${title} déplacé au ${day}, ${from} – ${to}.`,
  eventCalendarResized: (title, to) => `${title} se termine maintenant à ${to}.`,
  eventCalendarEditCancelled:
    'Déplacement annulé. L’événement garde son horaire d’origine.',
  eventCalendarMovableEvent: 'Événement déplaçable',

  previousImage: 'Image précédente',
  nextImage: 'Image suivante',
  imageOf: (index, total) => `Image ${index} sur ${total}`,
  viewImage: (alt) => (alt ? `Voir ${alt}` : 'Voir l’image'),
  imageFailed: 'Impossible de charger l’image',
  zoom: 'Zoom',
  zoomIn: 'Agrandir',
  zoomOut: 'Réduire',
  mediaLibrary: 'Médiathèque',
  dropzoneLabel: 'Glissez des fichiers ici ou cliquez pour les choisir',
  uploadFailed: 'Le téléversement a échoué',
  retryUpload: 'Réessayer le téléversement',
  errorSummaryTitle: 'Il y a un problème',

  available: 'Disponibles',
  selected: 'Sélectionnés',
  transferSelected: (target) => `Déplacer la sélection vers : ${target}`,
  transferAll: (target) => `Tout déplacer vers : ${target}`,
  itemsMoved: (count, target) =>
    `${count} ${plural(count, 'élément déplacé', 'éléments déplacés')} vers : ${target}`,

  notificationsTitle: 'Notifications',
  allCaughtUp: 'Tout est lu',
  markAllRead: 'Tout marquer comme lu',
  notificationsUnread: (count) =>
    `Notifications, ${count} ${plural(count, 'non lue', 'non lues')}`,
  unread: 'Non lues',
  tourStepOf: (step, total) => `Étape ${step} sur ${total}`,
  tourSkip: 'Passer',
  tourPrevious: 'Précédent',
  tourNext: 'Suivant',
  tourDone: 'Terminé',

  commandPalettePlaceholder: 'Tapez une commande ou recherchez…',
  commandPaletteLabel: 'Palette de commandes',
  stepCompleted: 'Terminée',
  stepError: 'Contient des erreurs',
  diffAddedLine: 'Ajouté :',
  diffRemovedLine: 'Supprimé :',
  itemAdded: (name) => `${name} ajouté`,
  itemRemoved: (name) => `${name} supprimé`,
  resizePanes: 'Redimensionner les panneaux',
  backToTop: 'Retour en haut',
  breadcrumbLabel: 'Fil d’Ariane',
  fabLabel: 'Actions',
  diffBefore: 'Avant',
  diffAfter: 'Après',
  diffChanges: 'Modifications',
  skipToContent: 'Aller au contenu',
  primaryNav: 'Principale',

  dndPickedUp: (position, total) =>
    `Saisi. Élément ${position} sur ${total}. ` +
    'Les flèches déplacent, Espace ou Entrée dépose, Échap annule.',
  dndMoved: (position, total) => `Déplacé en position ${position} sur ${total}.`,
  dndMovedToList: (list, position, total) =>
    `Déplacé vers : ${list}, position ${position} sur ${total}.`,
  dndDropped: (position) => `Déposé en position ${position}.`,
  dndMovedToZone: (zone) => `Déplacé vers : ${zone}. Espace ou Entrée dépose ici.`,
  dndDroppedInZone: (zone) => `Déposé dans : ${zone}.`,
  dndCancelled: 'Déplacement annulé. L’élément est revenu à sa place d’origine.',

  repeaterAddRow: 'Ajouter une ligne',
  repeaterRemoveRow: (index) => `Supprimer la ligne ${index}`,
  repeaterReorderRow: (index) => `Réordonner la ligne ${index}`,
  repeaterRowMoved: (from, to) =>
    `Ligne déplacée de la position ${from} à la position ${to}.`,

  fileRejectedType: (name) => `${name} : type non pris en charge`,
  fileRejectedSize: (name, limit) => `${name} : dépasse ${limit}`,
  fileRejectedCount: (name, max) =>
    `${name} : limite de ${max} ${plural(max, 'fichier', 'fichiers')} dépassée`,

  chartCategory: 'Catégorie',
  chartValue: 'Valeur',
  chartSeries: 'Série',
  chartSlice: 'Secteur',
  chartStage: 'Étape',
  chartConversion: 'Conversion',
  chartAxis: 'Axe',
  chartShare: 'Part',
  chartLabel: 'Libellé',

  qrCodeLabel: (text) => `Code QR : ${text}`,

  sortableListLabel: 'Liste triable',
  filterColumn: (column) => `Filtrer ${column}`,
  clearFilter: (column) => `Effacer le filtre de la colonne ${column}`,
  filterAny: 'Tous',
  filterMin: 'Min.',

  blockEditor: MK_FR_BLOCK_EDITOR,
};

/**
 * Provides the French strings — {@link MK_FR_I18N} with any `overrides`
 * merged on top (deep for `dateNames`, `blockEditor` and `validation`, like
 * `provideMkI18n`).
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMkI18nFr({ noData: 'Rien à afficher ici' })],
 * });
 * ```
 */
export function provideMkI18nFr(overrides: MkI18nOverrides = {}): Provider {
  return provideMkI18n(overrides, MK_FR_I18N);
}
