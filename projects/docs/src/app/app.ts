import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import {
  MkAppShell,
  MkButton,
  MkCommandPalette,
  type MkCommand,
  MkThemeService,
} from '@mk-kit/ui';
import { DocsToc } from './shared/docs-toc';
import { version as uiVersion } from '../../../mk-kit/package.json';
import { SITE } from './site.config';

interface NavLink {
  label: string;
  path: string;
  /** Extra ⌘K search terms — the component/directive/service names the page covers. */
  keywords?: string;
}
interface NavSection {
  title: string;
  links: NavLink[];
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MkAppShell,
    MkButton,
    MkCommandPalette,
    DocsToc,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // <az-consent> is an AZ Widgets custom element.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[class.docs-home]': 'isHome()' },
})
export class App {
  protected readonly uiVersion = uiVersion;
  protected readonly site = SITE;
  private readonly router = inject(Router);
  /** True on the landing page, where the docs sidebar and TOC rail are hidden. */
  protected readonly isHome = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split(/[?#]/)[0] === '/'),
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] === '/' },
  );
  protected readonly theme = inject(MkThemeService);

  protected readonly sections: NavSection[] = [
    {
      title: 'Overview',
      links: [
        {
          label: 'Introduction',
          path: '/introduction',
          keywords: 'intro overview features wcag accessibility signals what is mk-kit',
        },
        {
          label: 'Getting started',
          path: '/getting-started',
          keywords: 'install installation setup npm quickstart provide styles import',
        },
        {
          label: 'All components',
          path: '/components-index',
          keywords: 'index catalog directory list every component browse a-z',
        },
        {
          label: 'API reference',
          path: '/api',
          keywords: 'api reference inputs outputs methods types signatures llms.txt json generated',
        },
        {
          label: 'Bundle cost',
          path: '/cost',
          keywords: 'bundle size cost brotli tree-shaking budget kb kib payload performance entry points',
        },
        {
          label: 'Testing',
          path: '/testing',
          keywords: 'testing harness harnesses testbed spec unit test vitest jest loader MkHarnessLoader',
        },
        {
          label: 'Pro',
          path: '/pro',
          keywords: 'pro commercial licence license dashboard grid scheduler gantt admin starter pricing buy',
        },
        {
          label: 'Theming',
          path: '/theming',
          keywords:
            'theme css variables tokens dark light mode colors density contrast high-contrast prefers-contrast forced-colors theme-service',
        },
        {
          label: 'Theme builder',
          path: '/theme-builder',
          keywords: 'theme builder palette generator brand colors tokens export preview',
        },
        {
          label: 'Touch & mobile',
          path: '/touch',
          keywords: 'touch mobile responsive gestures density coarse pointer phone tablet',
        },
        {
          label: 'Core & services',
          path: '/core-services',
          keywords:
            'overlay overlay-service focus-trap live-announcer hotkeys history undo redo i18n date-names theme-service overlay-ref',
        },
        {
          label: 'Blog',
          path: '/blog',
          keywords: 'blog posts articles news primeng migration licensing mit open-core',
        },
        {
          label: 'Material migration',
          path: '/migration',
          keywords: 'angular material migration mapping equivalents mat-dialog mat-snackbar switch',
        },
        {
          label: 'Changelog',
          path: '/changelog',
          keywords: 'changelog releases versions release notes history breaking changes',
        },
      ],
    },
    {
      title: 'Examples',
      links: [
        {
          label: 'Dashboard',
          path: '/examples/dashboard',
          keywords: 'dashboard example demo stat-card table tabs menu toast admin',
        },
        {
          label: 'Data table',
          path: '/examples/data-table',
          keywords: 'data table example demo pagination sort filter crud',
        },
      ],
    },
    {
      title: 'Forms & inputs',
      links: [
        {
          label: 'Buttons',
          path: '/components/buttons',
          keywords: 'button icon-button split-button dropdown-button variants tones sizes loading mkButton',
        },
        {
          label: 'Form fields',
          path: '/components/forms',
          keywords:
            'form-field input select number-input file-upload repeater code-editor form-error-summary validation errors submit-input',
        },
        {
          label: 'Dynamic form',
          path: '/components/dynamic-form',
          keywords: 'dynamic form schema json renderer formly generated fields conditions validators',
        },
        {
          label: 'Text inputs',
          path: '/components/text-inputs',
          keywords:
            'input textarea autosize input-group otp password-input number-input field prefix suffix',
        },
        {
          label: 'Phone & postal code',
          path: '/components/phone-postal',
          keywords: 'phone-input postal-code-input country dial-code zip international',
        },
        {
          label: 'Money & payment',
          path: '/components/payment',
          keywords: 'currency-input card-number-input iban-input tax-id-input money credit-card checkout',
        },
        {
          label: 'Signature pad',
          path: '/components/signature',
          keywords: 'signature-pad draw canvas sign handwriting',
        },
        {
          label: 'Keypad & keyboard',
          path: '/components/touch-keys',
          keywords: 'numeric-keypad on-screen-keyboard keyboard-layout pin touch keys kiosk',
        },
        {
          label: 'Toggles',
          path: '/components/toggles',
          keywords: 'checkbox radio radio-group switch toggle boolean',
        },
        {
          label: 'Sliders & rating',
          path: '/components/sliders',
          keywords: 'slider range-slider rating stars color-picker',
        },
        {
          label: 'Selection',
          path: '/components/selection',
          keywords:
            'autocomplete multi-select tag-input mention transfer-list tree-select cascader button-toggle listbox combobox typeahead chips',
        },
        {
          label: 'Date & time',
          path: '/components/date-time',
          keywords:
            'date-picker date-range-picker time-picker datetime-picker calendar event-calendar month-picker week-picker mini-date datetime scheduling',
        },
      ],
    },
    {
      title: 'Media',
      links: [
        {
          label: 'Images & lightbox',
          path: '/components/images',
          keywords: 'image image-gallery lightbox carousel slideshow zoom photos thumbnails',
        },
        {
          label: 'Media manager',
          path: '/components/media-manager',
          keywords: 'media-gallery image-cropper upload reorder crop attachments files',
        },
      ],
    },
    {
      title: 'Data display',
      links: [
        {
          label: 'Badges & labels',
          path: '/components/badges-avatars',
          keywords:
            'badge badge-overlay mkBadgeOverlay notification count dot unread chip tag avatar avatar-group presence label pill',
        },
        {
          label: 'Cards & lists',
          path: '/components/cards-lists',
          keywords:
            'card stat-card profile-card list list-item description-list divider kpi',
        },
        {
          label: 'Misc display',
          path: '/components/data',
          keywords: 'code countdown qr-code diff json-viewer virtual-scroll snippet timer',
        },
        {
          label: 'Code & content',
          path: '/components/markdown',
          keywords: 'markdown log-viewer ansi logs prose renderer content',
        },
        {
          label: 'Kanban',
          path: '/components/kanban',
          keywords: 'kanban board columns cards lanes tasks drag drop',
        },
        {
          label: 'Icon',
          path: '/components/icon',
          keywords: 'icon icon-registry material-icons svg glyph',
        },
        {
          label: 'Tree',
          path: '/components/tree',
          keywords: 'tree tree-node hierarchy nested expand collapse',
        },
        {
          label: 'Empty & timeline',
          path: '/components/empty-timeline',
          keywords: 'empty-state timeline placeholder no-data activity feed',
        },
      ],
    },
    {
      title: 'Tables & grids',
      links: [
        {
          label: 'Table & data grid',
          path: '/components/table',
          keywords:
            'table data-grid pagination inline-edit row-detail grouping data-source fetcher sticky columns cells',
        },
        {
          label: 'Query builder',
          path: '/components/query-builder',
          keywords: 'query-builder filter conditions rules groups and or predicate where',
        },
        {
          label: 'Sort',
          path: '/components/sort',
          keywords: 'sort sort-header sorting order ascending descending',
        },
      ],
    },
    {
      title: 'Charts',
      links: [
        {
          label: 'Trend charts',
          path: '/components/charts',
          keywords:
            'line-chart bar-chart sparkline scatter-chart heatmap calendar-heatmap series graph',
        },
        {
          label: 'Proportion & KPI',
          path: '/components/proportion-charts',
          keywords:
            'donut-chart pie gauge funnel-chart radar-chart treemap progress-ring kpi',
        },
      ],
    },
    {
      title: 'Navigation & layout',
      links: [
        {
          label: 'Navigation',
          path: '/components/navigation',
          keywords:
            'tabs accordion breadcrumb pagination menu fab back-to-top nav-list app-shell',
        },
        {
          label: 'Structure',
          path: '/components/structure',
          keywords: 'toolbar page-header scroll-area splitter layout panes',
        },
        {
          label: 'Layout',
          path: '/components/layout',
          keywords: 'layout stack flex grid gap responsive breakpoints columns spacing',
        },
        {
          label: 'Drawer',
          path: '/components/drawer',
          keywords: 'drawer side-panel slide-over off-canvas sidebar',
        },
        {
          label: 'Command & nav',
          path: '/components/command-nav',
          keywords: 'command-palette cmdk nav-list nav-item nav-group shortcuts quick search',
        },
        {
          label: 'Stepper',
          path: '/components/stepper',
          keywords: 'stepper wizard steps multi-step progress',
        },
        {
          label: 'Context menu',
          path: '/components/context-menu',
          keywords: 'context-menu right-click menu actions',
        },
      ],
    },
    {
      title: 'Feedback & overlays',
      links: [
        {
          label: 'Feedback',
          path: '/components/feedback',
          keywords: 'alert banner toast loading-bar inline message announcement',
        },
        {
          label: 'Dialogs',
          path: '/components/dialogs',
          keywords: 'dialog modal confirm alert prompt dialog-service overlay',
        },
        {
          label: 'Tooltips & popovers',
          path: '/components/popovers',
          keywords: 'tooltip popover hovercard popconfirm hint',
        },
        {
          label: 'Status & notifications',
          path: '/components/status',
          keywords: 'result notification-center tour onboarding inbox status',
        },
        {
          label: 'Loading & progress',
          path: '/components/loading',
          keywords: 'spinner progress-bar skeleton loading busy',
        },
        {
          label: 'Snackbar',
          path: '/components/snackbar',
          keywords: 'snackbar toast brief message undo action',
        },
        {
          label: 'Bottom sheet',
          path: '/components/bottom-sheet',
          keywords: 'bottom-sheet sheet mobile swipe drag-dismiss modal',
        },
      ],
    },
    {
      title: 'Editors',
      links: [
        {
          label: 'Content editor',
          path: '/components/content-editor',
          keywords: 'block-editor block-renderer blocks embed notion-style content',
        },
        {
          label: 'Chat',
          path: '/components/chat',
          keywords: 'chat conversation messages assistant ai llm streaming prompt composer prompt-box',
        },
        {
          label: 'Rich text',
          path: '/components/rich-text',
          keywords: 'rich-text wysiwyg editor html formatting bold italic',
        },
      ],
    },
    {
      title: 'Directives & utilities',
      links: [
        {
          label: 'Utilities',
          path: '/components/utilities',
          keywords:
            'autofocus click-outside copy-to-clipboard hotkey infinite-scroll intersect mask ripple scrollspy permissions can directive pipes pipe currency relative-time time-ago file-size bytes initials truncate ellipsis pluralize plural intl locale format',
        },
        {
          label: 'Drag & drop',
          path: '/components/drag-drop',
          keywords: 'drag drop-list sortable-list drag-handle reorder dnd',
        },
      ],
    },
  ];

  /** ⌘K docs search — every page becomes a palette command. */
  protected readonly searchOpen = signal(false);
  protected readonly searchCommands: MkCommand[] = this.sections.flatMap(
    (section) =>
      section.links.map((link) => ({
        id: link.path,
        label: link.label,
        group: section.title,
        hint: link.path,
        keywords: link.keywords
          ? `${section.title} ${link.keywords}`
          : section.title,
        run: () => this.router.navigateByUrl(link.path),
      })),
  );

  protected cycleDensity(): void {
    const order = ['comfortable', 'compact', 'touch'] as const;
    const next = order[(order.indexOf(this.theme.density()) + 1) % 3];
    this.theme.setDensity(next);
  }

  protected densityIcon(): string {
    const d = this.theme.density();
    return d === 'compact' ? '▤' : d === 'touch' ? '◉' : '☰';
  }

  protected contrastLabel(): string {
    const c = this.theme.contrast();
    return c === 'system' ? 'System' : c === 'high' ? 'High' : 'Normal';
  }

  protected cycleContrast(): void {
    const order = ['system', 'high', 'normal'] as const;
    const next = order[(order.indexOf(this.theme.contrast()) + 1) % 3];
    this.theme.setContrast(next);
  }

  protected cycleTheme(): void {
    const order = ['light', 'dark', 'system'] as const;
    const next = order[(order.indexOf(this.theme.preference()) + 1) % 3];
    this.theme.setTheme(next);
  }

  protected themeLabel(): string {
    const p = this.theme.preference();
    return p === 'system' ? 'System' : p === 'dark' ? 'Dark' : 'Light';
  }

  protected themeIcon(): string {
    const p = this.theme.preference();
    return p === 'system' ? '◐' : p === 'dark' ? '☾' : '☀';
  }
}
