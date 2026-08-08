import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'components/badges-avatars',
    title: 'Badges & labels — mk-kit',
    loadComponent: () =>
      import('./pages/badges-avatars/badges-avatars-page').then(
        (m) => m.BadgesAvatarsPage,
      ),
  },
  {
    path: 'components/cards-lists',
    title: 'Cards & lists — mk-kit',
    loadComponent: () =>
      import('./pages/cards-lists/cards-lists-page').then((m) => m.CardsListsPage),
  },
  {
    path: 'components/table',
    title: 'Table & data grid — mk-kit',
    loadComponent: () =>
      import('./pages/table/table-page').then((m) => m.TablePage),
  },
  {
    path: 'components/loading',
    title: 'Loading & progress — mk-kit',
    loadComponent: () =>
      import('./pages/loading/loading-page').then((m) => m.LoadingPage),
  },
  {
    path: 'components/text-inputs',
    title: 'Text inputs — mk-kit',
    loadComponent: () =>
      import('./pages/text-inputs/text-inputs-page').then((m) => m.TextInputsPage),
  },
  {
    path: 'components/phone-postal',
    title: 'Phone & postal code — mk-kit',
    loadComponent: () =>
      import('./pages/phone-postal/phone-postal-page').then(
        (m) => m.PhonePostalPage,
      ),
  },
  {
    path: 'components/payment',
    title: 'Money & payment — mk-kit',
    loadComponent: () =>
      import('./pages/payment/payment-page').then((m) => m.PaymentPage),
  },
  {
    path: 'components/signature',
    title: 'Signature pad — mk-kit',
    loadComponent: () =>
      import('./pages/signature/signature-page').then((m) => m.SignaturePage),
  },
  {
    path: 'migration',
    title: 'Material migration — mk-kit',
    loadComponent: () =>
      import('./pages/migration/migration-page').then((m) => m.MigrationPage),
  },
  {
    path: 'components/images',
    title: 'Images & lightbox — mk-kit',
    loadComponent: () =>
      import('./pages/images/images-page').then((m) => m.ImagesPage),
  },
  {
    path: 'components/media-manager',
    title: 'Media manager — mk-kit',
    loadComponent: () =>
      import('./pages/media-manager/media-manager-page').then(
        (m) => m.MediaManagerPage,
      ),
  },
  {
    path: 'components/toggles',
    title: 'Toggles & switches — mk-kit',
    loadComponent: () =>
      import('./pages/toggles/toggles-page').then((m) => m.TogglesPage),
  },
  {
    path: 'components/sliders',
    title: 'Sliders & rating — mk-kit',
    loadComponent: () =>
      import('./pages/sliders/sliders-page').then((m) => m.SlidersPage),
  },
  {
    path: 'components/popovers',
    title: 'Tooltips & popovers — mk-kit',
    loadComponent: () =>
      import('./pages/popovers/popovers-page').then((m) => m.PopoversPage),
  },
  {
    path: 'components/dialogs',
    title: 'Dialogs — mk-kit',
    loadComponent: () =>
      import('./pages/dialogs/dialogs-page').then((m) => m.DialogsPage),
  },
  {
    path: 'components/status',
    title: 'Status & notifications — mk-kit',
    loadComponent: () =>
      import('./pages/status/status-page').then((m) => m.StatusPage),
  },
  {
    path: 'components/proportion-charts',
    title: 'Proportion & KPI charts — mk-kit',
    loadComponent: () =>
      import('./pages/proportion-charts/proportion-charts-page').then(
        (m) => m.ProportionChartsPage,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'introduction' },
  {
    path: 'introduction',
    title: 'mk-kit — Introduction',
    loadComponent: () =>
      import('./pages/introduction/introduction-page').then(
        (m) => m.IntroductionPage,
      ),
  },
  {
    path: 'getting-started',
    title: 'Getting started — mk-kit',
    loadComponent: () =>
      import('./pages/getting-started/getting-started-page').then(
        (m) => m.GettingStartedPage,
      ),
  },
  {
    path: 'theming',
    title: 'Theming — mk-kit',
    loadComponent: () =>
      import('./pages/theming/theming-page').then((m) => m.ThemingPage),
  },
  {
    path: 'core-services',
    title: 'Core & services — mk-kit',
    loadComponent: () =>
      import('./pages/core-services/core-services-page').then(
        (m) => m.CoreServicesPage,
      ),
  },
  {
    path: 'theme-builder',
    title: 'Theme builder — mk-kit',
    loadComponent: () =>
      import('./pages/theme-builder/theme-builder-page').then(
        (m) => m.ThemeBuilderPage,
      ),
  },
  {
    path: 'examples/dashboard',
    title: 'Dashboard example — mk-kit',
    loadComponent: () =>
      import('./pages/dashboard/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'examples/data-table',
    title: 'Data table example — mk-kit',
    loadComponent: () =>
      import('./pages/data-table/data-table-page').then((m) => m.DataTablePage),
  },
  {
    path: 'components/content-editor',
    title: 'Content editor — mk-kit',
    loadComponent: () =>
      import('./pages/block-editor/block-editor-page').then(
        (m) => m.BlockEditorPage,
      ),
  },
  {
    path: 'components/date-time',
    title: 'Date & time — mk-kit',
    loadComponent: () =>
      import('./pages/date-time/date-time-page').then((m) => m.DateTimePage),
  },
  {
    path: 'components/drag-drop',
    title: 'Drag & drop — mk-kit',
    loadComponent: () =>
      import('./pages/drag-drop/drag-drop-page').then((m) => m.DragDropPage),
  },
  {
    path: 'components/context-menu',
    title: 'Context menu — mk-kit',
    loadComponent: () =>
      import('./pages/context-menu/context-menu-page').then(
        (m) => m.ContextMenuPage,
      ),
  },
  {
    path: 'components/buttons',
    title: 'Buttons — mk-kit',
    loadComponent: () =>
      import('./pages/buttons/buttons-page').then((m) => m.ButtonsPage),
  },
  {
    path: 'components/forms',
    title: 'Forms — mk-kit',
    loadComponent: () =>
      import('./pages/forms/forms-page').then((m) => m.FormsPage),
  },
  {
    path: 'components/selection',
    title: 'Selection — mk-kit',
    loadComponent: () =>
      import('./pages/selection/selection-page').then((m) => m.SelectionPage),
  },
  {
    path: 'components/rich-text',
    title: 'Rich text — mk-kit',
    loadComponent: () =>
      import('./pages/rich-text/rich-text-page').then((m) => m.RichTextPage),
  },
  {
    path: 'components/stepper',
    title: 'Stepper — mk-kit',
    loadComponent: () =>
      import('./pages/stepper/stepper-page').then((m) => m.StepperPage),
  },
  {
    path: 'components/tree',
    title: 'Tree — mk-kit',
    loadComponent: () =>
      import('./pages/tree/tree-page').then((m) => m.TreePage),
  },
  {
    path: 'components/icon',
    title: 'Icon — mk-kit',
    loadComponent: () =>
      import('./pages/icon/icon-page').then((m) => m.IconPage),
  },
  {
    path: 'components/snackbar',
    title: 'Snackbar — mk-kit',
    loadComponent: () =>
      import('./pages/snackbar/snackbar-page').then((m) => m.SnackbarPage),
  },
  {
    path: 'components/bottom-sheet',
    title: 'Bottom sheet — mk-kit',
    loadComponent: () =>
      import('./pages/bottom-sheet/bottom-sheet-page').then(
        (m) => m.BottomSheetPage,
      ),
  },
  {
    path: 'components/sort',
    title: 'Sort — mk-kit',
    loadComponent: () =>
      import('./pages/sort/sort-page').then((m) => m.SortPage),
  },
  {
    path: 'components/charts',
    title: 'Trend charts — mk-kit',
    loadComponent: () =>
      import('./pages/charts/charts-page').then((m) => m.ChartsPage),
  },
  {
    path: 'components/empty-timeline',
    title: 'Empty state & timeline — mk-kit',
    loadComponent: () =>
      import('./pages/empty-timeline/empty-timeline-page').then(
        (m) => m.EmptyTimelinePage,
      ),
  },
  {
    path: 'components/structure',
    title: 'Structure — mk-kit',
    loadComponent: () =>
      import('./pages/structure/structure-page').then((m) => m.StructurePage),
  },
  {
    path: 'components/command-nav',
    title: 'Command palette & nav — mk-kit',
    loadComponent: () =>
      import('./pages/command-nav/command-nav-page').then(
        (m) => m.CommandNavPage,
      ),
  },
  {
    path: 'components/data',
    title: 'Data display — mk-kit',
    loadComponent: () =>
      import('./pages/data/data-page').then((m) => m.DataPage),
  },
  {
    path: 'components/feedback',
    title: 'Feedback — mk-kit',
    loadComponent: () =>
      import('./pages/feedback/feedback-page').then((m) => m.FeedbackPage),
  },
  {
    path: 'components/navigation',
    title: 'Navigation — mk-kit',
    loadComponent: () =>
      import('./pages/navigation/navigation-page').then(
        (m) => m.NavigationPage,
      ),
  },
  {
    path: 'components/utilities',
    title: 'Utilities — mk-kit',
    loadComponent: () =>
      import('./pages/utilities/utilities-page').then((m) => m.UtilitiesPage),
  },
  { path: '**', redirectTo: 'introduction' },
];
