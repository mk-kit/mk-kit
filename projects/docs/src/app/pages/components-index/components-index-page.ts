import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MkInput } from '@mk-kit/ui';

interface IndexItem {
  /** Selector / class name as consumers know it (mk-xxx, mkXxx, MkXxxService). */
  name: string;
  /** One-line "what is it". */
  desc: string;
  /** Docs page route. */
  path: string;
  /** Optional section fragment — only for pages with explicit h2 ids. */
  fragment?: string;
}

interface IndexGroup {
  group: string;
  items: IndexItem[];
}

/**
 * Every public component, directive and service of `@mk-kit/ui`, grouped the
 * same way as the sidebar nav, each card linking to the docs page where it is
 * demonstrated. Built from the library's entry-point barrels
 * (`projects/mk-kit/<entry>/index.ts`) cross-referenced with the docs pages.
 *
 * Fragments are used only where the target page declares explicit `h2 id`s in
 * its template (`/components/forms#repeater`, `/components/selection#mention`,
 * `/components/table#data-source`); all other headings get their ids assigned
 * at runtime by the TOC, too late for router anchor scrolling, so those cards
 * link the plain page path.
 */
const INDEX: ReadonlyArray<IndexGroup> = [
  {
    group: 'Overview',
    items: [
      { name: 'MkThemeService', desc: 'Signal-based light/dark/system theme and density switching.', path: '/core-services' },
      { name: 'MkBreakpointService', desc: 'Viewport breakpoints as signals: current(), up(), down(), resolve() for responsive values.', path: '/core-services' },
      { name: 'MkLiveAnnouncer', desc: 'Polite/assertive screen-reader announcements via a shared live region.', path: '/core-services' },
      { name: 'MkFocusTrap', desc: 'Keeps Tab cycles inside overlays; used by dialogs, drawers and sheets.', path: '/core-services' },
      { name: 'MkOverlayService', desc: 'Imperative top-layer overlay creation with MkOverlayRef handles.', path: '/core-services' },
      { name: 'MkAnchoredPanel', desc: 'Clip-proof anchored panel in the native top layer — the base of every dropdown.', path: '/core-services' },
      { name: 'MkHistoryService', desc: 'Generic undo/redo command stack with batching, scopes and hotkey wiring.', path: '/core-services' },
      { name: 'provideMkI18n', desc: 'Translate every built-in string of the library from one provider.', path: '/core-services' },
    ],
  },
  {
    group: 'Forms & inputs',
    items: [
      { name: 'mkButton', desc: 'Button/anchor directive: tones, variants, sizes, loading state.', path: '/components/buttons' },
      { name: 'mk-split-button', desc: 'Primary action plus a chevron that opens an mk-menu of alternatives.', path: '/components/buttons' },
      { name: 'mk-form-field', desc: 'Label, hint, error and prefix/suffix wrapper for any control.', path: '/components/forms' },
      { name: 'mk-select', desc: 'Single-select dropdown with keyboard type-ahead.', path: '/components/forms' },
      { name: 'mk-file-upload', desc: 'Dropzone with validation, previews and upload progress.', path: '/components/forms' },
      { name: 'mk-code-editor', desc: 'Highlighted code textarea with JSON validation.', path: '/components/forms' },
      { name: 'mk-submit-input', desc: 'Submit button that reflects form validity and pending state.', path: '/components/forms' },
      { name: 'mk-form-error-summary', desc: 'Focusable list of every error in a form, for long-form a11y.', path: '/components/forms' },
      { name: 'mk-repeater', desc: 'Add/remove/reorder rows of a projected row template (CVA over arrays).', path: '/components/forms', fragment: 'repeater' },
      { name: 'mkRepeaterRow / mkRepeaterEmpty', desc: 'Row template and empty-state slots for mk-repeater.', path: '/components/forms', fragment: 'repeater' },
      { name: 'mkInput', desc: 'Themed native input/textarea directive.', path: '/components/text-inputs' },
      { name: 'mk-input-group', desc: 'Joins inputs with addons and buttons into one control.', path: '/components/text-inputs' },
      { name: 'mk-number-input', desc: 'Numeric input with steppers, min/max and formatting.', path: '/components/text-inputs' },
      { name: 'mk-password-input', desc: 'Password field with visibility toggle and strength meter.', path: '/components/text-inputs' },
      { name: 'mk-otp', desc: 'One-time-passcode segmented input.', path: '/components/text-inputs' },
      { name: 'mk-i18n-input', desc: 'One value per locale behind a language switcher.', path: '/components/text-inputs' },
      { name: 'mkAutosize', desc: 'Textarea that grows and shrinks with its content.', path: '/components/text-inputs' },
      { name: 'mkField', desc: 'Wire a native field to label/hint/error without mk-form-field.', path: '/components/text-inputs' },
      { name: 'mk-phone-input', desc: 'International phone input with country picker and validation.', path: '/components/phone-postal' },
      { name: 'mk-postal-code-input', desc: 'Country-aware postal code input with per-country masks.', path: '/components/phone-postal' },
      { name: 'mk-currency-input', desc: 'Money input with currency formatting and minor-unit handling.', path: '/components/payment' },
      { name: 'mk-card-number-input', desc: 'Card number input with brand detection and Luhn check.', path: '/components/payment' },
      { name: 'mk-iban-input', desc: 'IBAN input with grouping and checksum validation.', path: '/components/payment' },
      { name: 'mk-tax-id-input', desc: 'Tax/VAT id input validated per country.', path: '/components/payment' },
      { name: 'mk-signature-pad', desc: 'Draw-to-sign canvas exporting SVG/PNG, a CVA form control.', path: '/components/signature' },
      { name: 'mk-numeric-keypad', desc: 'On-screen number pad for kiosk and POS flows.', path: '/components/touch-keys' },
      { name: 'mk-on-screen-keyboard', desc: 'Full on-screen keyboard with layouts.', path: '/components/touch-keys' },
      { name: 'mkOnScreenKeyboardFor', desc: 'Attach the on-screen keyboard to any input/textarea.', path: '/components/touch-keys' },
      { name: 'mk-checkbox', desc: 'Checkbox with indeterminate state.', path: '/components/toggles' },
      { name: 'mk-radio-group / mk-radio', desc: 'Radio group with roving-tabindex keyboard nav.', path: '/components/toggles' },
      { name: 'mk-switch', desc: 'On/off toggle switch.', path: '/components/toggles' },
      { name: 'mk-slider', desc: 'Single-value slider with ticks and keyboard steps.', path: '/components/sliders' },
      { name: 'mk-range-slider', desc: 'Two-thumb min/max range slider.', path: '/components/sliders' },
      { name: 'mk-rating', desc: 'Star rating input with half steps.', path: '/components/sliders' },
      { name: 'mk-color-picker', desc: 'Color swatch + picker popover, a CVA control.', path: '/components/sliders' },
      { name: 'mk-autocomplete', desc: 'Free-text input with suggestion dropdown (sync or async).', path: '/components/selection' },
      { name: 'mk-multi-select', desc: 'Multi-select with removable chips and async options.', path: '/components/selection' },
      { name: 'mk-tag-input', desc: 'Type-and-enter tag entry with suggestions.', path: '/components/selection' },
      { name: 'mk-transfer-list', desc: 'Two-pane picker moving items between lists.', path: '/components/selection' },
      { name: 'mk-tree-select', desc: 'Hierarchical dropdown selecting tree nodes.', path: '/components/selection' },
      { name: 'mk-button-toggle-group', desc: 'Segmented single/multi choice of buttons.', path: '/components/selection' },
      { name: 'mkMention', desc: '@mention/#tag autocomplete for native textareas and inputs.', path: '/components/selection', fragment: 'mention' },
      { name: 'mk-calendar', desc: 'Standalone month grid with events and selection.', path: '/components/date-time' },
      { name: 'mk-date-picker', desc: 'Date input with calendar popover.', path: '/components/date-time' },
      { name: 'mk-date-range-picker', desc: 'Start/end date pair with one calendar.', path: '/components/date-time' },
      { name: 'mk-time-picker', desc: 'Time input with dropdown steps.', path: '/components/date-time' },
      { name: 'mk-datetime-picker', desc: 'Date and time in one field: calendar + time list, single Date value.', path: '/components/date-time' },
      { name: 'mk-month-picker', desc: 'Month + year picker.', path: '/components/date-time' },
      { name: 'mk-week-picker', desc: 'ISO week picker.', path: '/components/date-time' },
      { name: 'mk-mini-date', desc: 'Compact date badge for lists and tables.', path: '/components/date-time' },
      { name: 'mk-event-calendar', desc: 'Month/week/day event calendar with editable drag-to-move grid.', path: '/components/date-time' },
    ],
  },
  {
    group: 'Media',
    items: [
      { name: 'mk-image', desc: 'Lazy image with aspect ratio, fallback and caption.', path: '/components/images' },
      { name: 'mk-image-gallery', desc: 'Thumbnail grid that opens into the lightbox.', path: '/components/images' },
      { name: 'mk-lightbox / MkLightboxService', desc: 'Full-screen zoomable image viewer, openable imperatively.', path: '/components/images' },
      { name: 'mk-media-gallery', desc: 'Managed media grid: select, upload, arrange.', path: '/components/media-manager' },
      { name: 'mkMediaActions', desc: 'Custom per-item action slot for the media gallery.', path: '/components/media-manager' },
      { name: 'mk-image-cropper', desc: 'Crop/zoom/rotate tool exporting a blob.', path: '/components/media-manager' },
    ],
  },
  {
    group: 'Data display',
    items: [
      { name: 'mk-badge', desc: 'Status pill with tones and variants.', path: '/components/badges-avatars' },
      { name: 'mk-tag', desc: 'Compact removable label.', path: '/components/badges-avatars' },
      { name: 'mk-chip', desc: 'Interactive chip: selectable, removable, with avatar slot.', path: '/components/badges-avatars' },
      { name: 'mk-avatar', desc: 'Image/initials avatar with status dot.', path: '/components/badges-avatars' },
      { name: 'mk-avatar-group', desc: 'Overlapping avatar stack with overflow count.', path: '/components/badges-avatars' },
      { name: 'mk-card', desc: 'Surface container with variants and header/footer parts.', path: '/components/cards-lists' },
      { name: 'mk-card-header / -title / -footer', desc: 'Structural parts of mk-card.', path: '/components/cards-lists' },
      { name: 'mk-list / mk-list-item', desc: 'Interactive list rows with leading/trailing slots.', path: '/components/cards-lists' },
      { name: 'mk-profile-card', desc: 'Person card with meta and actions slots.', path: '/components/cards-lists' },
      { name: 'mk-stat-card', desc: 'KPI number card with delta and sparkline slot.', path: '/components/cards-lists' },
      { name: 'mk-description-list', desc: 'Key/value pairs in dl/dt/dd semantics.', path: '/components/cards-lists' },
      { name: 'mk-divider', desc: 'Horizontal/vertical rule with optional label.', path: '/components/cards-lists' },
      { name: 'mk-carousel', desc: 'Swipeable slide deck with dots and arrows.', path: '/components/data' },
      { name: 'mk-countdown', desc: 'Live countdown to a target date.', path: '/components/data' },
      { name: 'mk-diff', desc: 'Side-by-side or inline text diff view.', path: '/components/data' },
      { name: 'mk-json-viewer', desc: 'Collapsible, highlighted JSON tree.', path: '/components/data' },
      { name: 'mk-kanban', desc: 'Drag-and-drop card board with columns.', path: '/components/data' },
      { name: 'mk-qr-code', desc: 'Dependency-free QR code renderer.', path: '/components/data' },
      { name: 'mk-code', desc: 'Highlighted code block with copy button.', path: '/components/data' },
      { name: 'mk-virtual-scroll', desc: 'Windowed rendering for very long lists.', path: '/components/data' },
      { name: 'mk-icon', desc: '420+ built-in stroke icons (hand-made core + Lucide-derived set), sizes, labels, custom SVG.', path: '/components/icon' },
      { name: 'MkIconRegistry', desc: 'Register custom SVG icon sets by name.', path: '/components/icon' },
      { name: 'mk-tree', desc: 'Expandable tree view with selection and keyboard nav.', path: '/components/tree' },
      { name: 'mk-empty-state', desc: 'Friendly empty/none-yet placeholder with action slot.', path: '/components/empty-timeline' },
      { name: 'mk-timeline / mk-timeline-item', desc: 'Vertical event history with markers.', path: '/components/empty-timeline' },
    ],
  },
  {
    group: 'Tables & grids',
    items: [
      { name: 'mk-table', desc: 'Data table: sticky headers, selection, row detail, stacked mobile layout, tree rows (childrenKey).', path: '/components/table' },
      { name: 'mkTableCell', desc: 'Custom cell template per column.', path: '/components/table' },
      { name: 'mkTableRowDetail', desc: 'Expandable per-row detail template.', path: '/components/table' },
      { name: 'MkTableDataSource', desc: 'Server-side data adapter: paging, sorting, debounced filter, race-safe.', path: '/components/table', fragment: 'data-source' },
      { name: 'mk-inline-edit', desc: 'Click-to-edit value, built for table cells.', path: '/components/table' },
      { name: 'mkSort / mkSortHeader', desc: 'Column sort state directives for any table markup.', path: '/components/sort' },
    ],
  },
  {
    group: 'Charts',
    items: [
      { name: 'mk-sparkline', desc: 'Tiny inline trend line.', path: '/components/charts' },
      { name: 'mk-line-chart', desc: 'Multi-series line/area chart with tooltips.', path: '/components/charts' },
      { name: 'mk-bar-chart', desc: 'Grouped/stacked bar chart.', path: '/components/charts' },
      { name: 'mk-scatter-chart', desc: 'X/Y point chart with series.', path: '/components/charts' },
      { name: 'mk-heatmap', desc: 'Matrix heatmap with color scale.', path: '/components/charts' },
      { name: 'mk-calendar-heatmap', desc: 'GitHub-style contribution calendar.', path: '/components/charts' },
      { name: 'mk-donut-chart', desc: 'Donut/pie proportions with legend.', path: '/components/proportion-charts' },
      { name: 'mk-gauge', desc: 'Radial gauge for a single value in a range.', path: '/components/proportion-charts' },
      { name: 'mk-funnel-chart', desc: 'Stage-by-stage conversion funnel.', path: '/components/proportion-charts' },
      { name: 'mk-radar-chart', desc: 'Multi-axis radar/spider chart.', path: '/components/proportion-charts' },
      { name: 'mk-treemap', desc: 'Nested proportional rectangles.', path: '/components/proportion-charts' },
      { name: 'mk-progress-ring', desc: 'Circular progress indicator.', path: '/components/proportion-charts' },
    ],
  },
  {
    group: 'Navigation & layout',
    items: [
      { name: 'mk-app-shell', desc: 'Header + collapsible sidebar application frame.', path: '/components/navigation' },
      { name: 'mk-stack', desc: 'Children in a row or column with a token gap; responsive direction.', path: '/components/layout' },
      { name: 'mk-flex', desc: 'Flexbox container with align / justify / wrap inputs; mkFlexItem for children.', path: '/components/layout' },
      { name: 'mk-grid', desc: 'CSS grid by column count, track list or minimum column width; mkGridItem spans.', path: '/components/layout' },
      { name: 'mk-tabs / mk-tab', desc: 'Tab set with lazy panels and keyboard nav.', path: '/components/navigation' },
      { name: 'mk-accordion / mk-accordion-item', desc: 'Expandable sections, single or multi open.', path: '/components/navigation' },
      { name: 'mk-breadcrumb / mk-breadcrumb-item', desc: 'Hierarchical location trail.', path: '/components/navigation' },
      { name: 'mk-menu / mk-menu-item', desc: 'Dropdown menu panel with submenu support.', path: '/components/navigation' },
      { name: 'mkMenuTriggerFor', desc: 'Open an mk-menu from any element.', path: '/components/navigation' },
      { name: 'mk-pagination', desc: 'Page navigation with sizes and jump controls.', path: '/components/navigation' },
      { name: 'mk-back-to-top', desc: 'Floating scroll-to-top button.', path: '/components/navigation' },
      { name: 'mk-fab / mkFabAction', desc: 'Floating action button with expandable speed-dial actions.', path: '/components/navigation' },
      { name: 'mk-toolbar', desc: 'Horizontal action bar with sections.', path: '/components/structure' },
      { name: 'mk-page-header', desc: 'Title, breadcrumb and action row for a page.', path: '/components/structure' },
      { name: 'mk-scroll-area', desc: 'Styled scroll container with shadow hints.', path: '/components/structure' },
      { name: 'mk-splitter', desc: 'Draggable split panes.', path: '/components/structure' },
      { name: 'mk-drawer', desc: 'Side panel: overlay, push or inline modes.', path: '/components/drawer' },
      { name: 'mk-command-palette', desc: '⌘K command launcher with fuzzy search and groups.', path: '/components/command-nav' },
      { name: 'mk-nav-list / mk-nav-item / mk-nav-group', desc: 'Sidebar navigation list with groups and badges.', path: '/components/command-nav' },
      { name: 'mk-stepper / mk-step', desc: 'Multi-step wizard, linear or free navigation.', path: '/components/stepper' },
      { name: 'mkContextMenuTriggerFor', desc: 'Right-click (and long-press) menu trigger reusing mk-menu.', path: '/components/context-menu' },
    ],
  },
  {
    group: 'Feedback & overlays',
    items: [
      { name: 'mk-alert', desc: 'Inline callout with tones and dismissal.', path: '/components/feedback' },
      { name: 'mk-banner', desc: 'Full-width page-level announcement.', path: '/components/feedback' },
      { name: 'mk-loading-bar / MkLoadingBarService', desc: 'Top-of-page progress bar driven by a service.', path: '/components/feedback' },
      { name: 'mk-dialog / mk-dialog-title', desc: 'Modal dialog on the native dialog element.', path: '/components/dialogs' },
      { name: 'MkDialogService', desc: 'Open template or component dialogs imperatively.', path: '/components/dialogs' },
      { name: 'mk-confirm-dialog', desc: 'Ready-made confirm/cancel dialog.', path: '/components/dialogs' },
      { name: 'mk-prompt-dialog', desc: 'Ready-made single-input prompt dialog.', path: '/components/dialogs' },
      { name: 'mkTooltip', desc: 'Hover/focus tooltip directive in the top layer.', path: '/components/popovers' },
      { name: 'mk-popover / mkPopoverTriggerFor', desc: 'Rich anchored popover with arbitrary content.', path: '/components/popovers' },
      { name: 'mk-popconfirm / mkPopconfirmFor', desc: 'Inline confirm bubble before a destructive action.', path: '/components/popovers' },
      { name: 'mk-hovercard / mkHovercardFor', desc: 'Preview card shown on hover with safe delays.', path: '/components/popovers' },
      { name: 'mk-result', desc: 'Full-page success/error/info outcome screen.', path: '/components/status' },
      { name: 'mk-notification-center', desc: 'Bell + panel of grouped in-app notifications.', path: '/components/status' },
      { name: 'MkTourService', desc: 'Step-by-step product tour with anchored popups.', path: '/components/status' },
      { name: 'mk-skeleton / mk-skeleton-preset', desc: 'Loading placeholders, freeform or preset shapes.', path: '/components/loading' },
      { name: 'mk-spinner', desc: 'Indeterminate loading spinner.', path: '/components/loading' },
      { name: 'mk-progress-bar', desc: 'Determinate/indeterminate linear progress.', path: '/components/loading' },
      { name: 'MkSnackbarService', desc: 'Queued transient messages with actions.', path: '/components/snackbar' },
      { name: 'MkToastService', desc: 'Stacked toast notifications by tone.', path: '/components/snackbar' },
      { name: 'mk-bottom-sheet / MkBottomSheetService', desc: 'Mobile bottom panel with drag-to-dismiss.', path: '/components/bottom-sheet' },
    ],
  },
  {
    group: 'Editors & interactions',
    items: [
      { name: 'mk-chat', desc: 'Conversation log with streaming bubbles, tool cards, typing indicator and composer.', path: '/components/chat' },
      { name: 'mk-prompt-box', desc: 'Auto-growing composer with attachments, suggestions and stop/send.', path: '/components/chat' },
      { name: 'mk-chat-message', desc: 'One chat bubble: Markdown, attachments, tool calls, copy / retry.', path: '/components/chat' },
      { name: 'mk-block-editor', desc: 'Gutenberg-style block content editor, a CVA control.', path: '/components/content-editor' },
      { name: 'mk-block-renderer', desc: 'Read-only renderer for block documents.', path: '/components/content-editor' },
      { name: 'MK_BLOCK_DEFINITIONS', desc: 'Registry tokens for custom blocks, uploads and embed providers.', path: '/components/content-editor' },
      { name: 'mkBlocksToHtml / mkHtmlToBlocks', desc: 'Serialize block documents to sanitized HTML and back.', path: '/components/content-editor' },
      { name: 'mk-rich-text', desc: 'Sanitized-HTML rich text field with toolbar, for single fields.', path: '/components/rich-text' },
      { name: 'mk-rich-text-engine', desc: 'The underlying contenteditable engine, embeddable on its own.', path: '/components/rich-text' },
      { name: 'mk-markdown', desc: 'Dependency-free CommonMark-subset renderer, safe by construction.', path: '/components/markdown' },
      { name: 'mk-log-viewer', desc: 'Virtualized tail-follow log pane with ANSI colors and search.', path: '/components/markdown' },
      { name: 'mkDrag / mkDropList', desc: 'Drag-and-drop between lists with keyboard mode.', path: '/components/drag-drop' },
      { name: 'mkDragHandle', desc: 'Restrict dragging to a handle element.', path: '/components/drag-drop' },
      { name: 'mk-sortable-list', desc: 'Ready-made reorderable list on top of dnd.', path: '/components/drag-drop' },
      { name: 'mkAutofocus', desc: 'Focus an element on render.', path: '/components/utilities' },
      { name: 'mkClickOutside', desc: 'Emit when a click lands outside the host.', path: '/components/utilities' },
      { name: 'mkCopyToClipboard', desc: 'One-click copy with announced feedback.', path: '/components/utilities' },
      { name: 'mkHotkey / MkHotkeysService', desc: 'Declarative keyboard shortcuts with scopes.', path: '/components/utilities' },
      { name: 'mkInfiniteScroll', desc: 'Emit when the sentinel scrolls into view — load more.', path: '/components/utilities' },
      { name: 'mkIntersect', desc: 'IntersectionObserver as a directive.', path: '/components/utilities' },
      { name: 'mkMask', desc: 'Pattern-mask any input while typing.', path: '/components/utilities' },
      { name: 'mkRipple', desc: 'Material-style pointer ripple.', path: '/components/utilities' },
      { name: 'mkScrollspy', desc: 'Track which section heading is active while scrolling.', path: '/components/utilities' },
      { name: '*mkCan / *mkCannot / mkCanDisable', desc: 'Permission-gated UI structural directives.', path: '/components/utilities' },
      { name: 'MkPermissionPolicy', desc: 'Provide the can(permission) policy the directives consult.', path: '/components/utilities' },
    ],
  },
];

/**
 * "Which page is X on?" — a filterable gallery of the whole library. One
 * card per public component/directive/service, grouped like the sidebar,
 * linking to the docs page (and section, where the page has stable ids)
 * that demonstrates it.
 */
@Component({
  selector: 'docs-components-index-page',
  imports: [RouterLink, MkInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Component index</h1>
      <p class="docs-lead">
        Every component, directive and service in
        <strong>&#64;mk-kit/ui</strong> — {{ total }} entries — and the docs
        page where each one lives. Type to filter.
      </p>

      <div class="cix-filter">
        <input
          mkInput
          type="search"
          placeholder="Filter by name or description — e.g. table, upload, tooltip…"
          aria-label="Filter components"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        <span class="cix-filter__count" role="status">
          {{ shownCount() }} of {{ total }}
        </span>
      </div>

      @for (group of filtered(); track group.group) {
        <section class="cix-group">
          <h2>{{ group.group }}</h2>
          <div class="cix-grid">
            @for (item of group.items; track item.name) {
              <a
                class="cix-card"
                [routerLink]="item.path"
                [fragment]="item.fragment"
              >
                <span class="cix-card__name">{{ item.name }}</span>
                <span class="cix-card__desc">{{ item.desc }}</span>
                <span class="cix-card__where">{{ item.path }}</span>
              </a>
            }
          </div>
        </section>
      } @empty {
        <p class="cix-empty">
          Nothing matches “{{ query() }}”. Try a shorter term — component
          selectors (mk-…), directive names (mkXxx) and descriptions are all
          searched.
        </p>
      }
    </div>
  `,
  styles: [
    `
      .cix-filter {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        margin: var(--mk-space-4) 0 var(--mk-space-2);
      }
      .cix-filter input {
        flex: 1;
        max-width: 32rem;
      }
      .cix-filter__count {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
        white-space: nowrap;
      }
      .cix-group h2 {
        margin-top: var(--mk-space-8);
      }
      .cix-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: var(--mk-space-3);
        margin-top: var(--mk-space-3);
      }
      .cix-card {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-1);
        padding: var(--mk-space-3) var(--mk-space-4);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
        text-decoration: none;
        color: inherit;
        transition:
          transform 120ms ease,
          border-color 120ms ease,
          box-shadow 120ms ease;
      }
      .cix-card:hover {
        transform: translateY(-2px);
        border-color: var(--mk-primary);
        box-shadow: var(--mk-shadow-md);
      }
      .cix-card:focus-visible {
        outline: 2px solid var(--mk-primary);
        outline-offset: 2px;
      }
      .cix-card__name {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-semibold);
        color: var(--mk-primary);
        overflow-wrap: anywhere;
      }
      .cix-card__desc {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text);
        line-height: var(--mk-line-height-normal);
      }
      .cix-card__where {
        margin-top: auto;
        padding-top: var(--mk-space-1);
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
      }
      .cix-empty {
        margin-top: var(--mk-space-6);
        color: var(--mk-text-muted);
      }
      @media (prefers-reduced-motion: reduce) {
        .cix-card {
          transition: none;
        }
        .cix-card:hover {
          transform: none;
        }
      }
    `,
  ],
})
export class ComponentsIndexPage {
  protected readonly total = INDEX.reduce((n, g) => n + g.items.length, 0);

  protected readonly query = signal('');

  protected readonly filtered = computed<ReadonlyArray<IndexGroup>>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return INDEX;
    return INDEX.map((group) => ({
      group: group.group,
      items: group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  });

  protected readonly shownCount = computed(() =>
    this.filtered().reduce((n, g) => n + g.items.length, 0),
  );
}
