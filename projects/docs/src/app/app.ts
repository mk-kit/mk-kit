import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import {
  MkAppShell,
  MkButton,
  MkCommandPalette,
  type MkCommand,
  MkThemeService,
} from '@mkornas/ui';
import { DocsToc } from './shared/docs-toc';
import { version as uiVersion } from '../../../mk-kit/package.json';

interface NavLink {
  label: string;
  path: string;
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
})
export class App {
  protected readonly uiVersion = uiVersion;
  private readonly router = inject(Router);
  protected readonly theme = inject(MkThemeService);

  protected readonly sections: NavSection[] = [
    {
      title: 'Overview',
      links: [
        { label: 'Introduction', path: '/introduction' },
        { label: 'Getting started', path: '/getting-started' },
        { label: 'Theming', path: '/theming' },
        { label: 'Theme builder', path: '/theme-builder' },
        { label: 'Core & services', path: '/core-services' },
      ],
    },
    {
      title: 'Examples',
      links: [
        { label: 'Dashboard', path: '/examples/dashboard' },
        { label: 'Data table', path: '/examples/data-table' },
      ],
    },
    {
      title: 'Forms & inputs',
      links: [
        { label: 'Buttons', path: '/components/buttons' },
        { label: 'Form fields', path: '/components/forms' },
        { label: 'Text inputs', path: '/components/text-inputs' },
        { label: 'Phone & postal code', path: '/components/phone-postal' },
        { label: 'Money & payment', path: '/components/payment' },
        { label: 'Signature pad', path: '/components/signature' },
        { label: 'Toggles', path: '/components/toggles' },
        { label: 'Sliders & rating', path: '/components/sliders' },
        { label: 'Selection', path: '/components/selection' },
        { label: 'Date & time', path: '/components/date-time' },
      ],
    },
    {
      title: 'Data display',
      links: [
        { label: 'Badges & labels', path: '/components/badges-avatars' },
        { label: 'Cards & lists', path: '/components/cards-lists' },
        { label: 'Data display', path: '/components/data' },
        { label: 'Icon', path: '/components/icon' },
        { label: 'Tree', path: '/components/tree' },
        { label: 'Empty & timeline', path: '/components/empty-timeline' },
      ],
    },
    {
      title: 'Tables & grids',
      links: [
        { label: 'Table & data grid', path: '/components/table' },
        { label: 'Sort', path: '/components/sort' },
      ],
    },
    {
      title: 'Charts',
      links: [
        { label: 'Trend charts', path: '/components/charts' },
        { label: 'Proportion & KPI', path: '/components/proportion-charts' },
      ],
    },
    {
      title: 'Navigation & layout',
      links: [
        { label: 'Navigation', path: '/components/navigation' },
        { label: 'Structure', path: '/components/structure' },
        { label: 'Command & nav', path: '/components/command-nav' },
        { label: 'Stepper', path: '/components/stepper' },
        { label: 'Context menu', path: '/components/context-menu' },
      ],
    },
    {
      title: 'Feedback & overlays',
      links: [
        { label: 'Feedback', path: '/components/feedback' },
        { label: 'Dialogs', path: '/components/dialogs' },
        { label: 'Tooltips & popovers', path: '/components/popovers' },
        { label: 'Status & notifications', path: '/components/status' },
        { label: 'Loading & progress', path: '/components/loading' },
        { label: 'Snackbar', path: '/components/snackbar' },
        { label: 'Bottom sheet', path: '/components/bottom-sheet' },
      ],
    },
    {
      title: 'Editors & interactions',
      links: [
        { label: 'Content editor', path: '/components/content-editor' },
        { label: 'Drag & drop', path: '/components/drag-drop' },
        { label: 'Utilities', path: '/components/utilities' },
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
        keywords: section.title,
        run: () => this.router.navigateByUrl(link.path),
      })),
  );

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
