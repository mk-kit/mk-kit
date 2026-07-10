import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import {
  MkAppShell,
  MkButton,
  MkCommandPalette,
  type MkCommand,
  MkNavGroup,
  MkNavItem,
  MkNavList,
  MkThemeService,
} from '@mkornas/ui';
import { DocsToc } from './shared/docs-toc';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}
interface NavSection {
  title: string;
  links: NavLink[];
  /** Render as a collapsible group (component categories) vs a plain heading. */
  collapsible?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MkAppShell,
    MkNavList,
    MkNavGroup,
    MkNavItem,
    MkButton,
    MkCommandPalette,
    DocsToc,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  protected readonly theme = inject(MkThemeService);

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly sections: NavSection[] = [
    {
      title: 'Overview',
      links: [
        { label: 'Introduction', path: '/introduction', icon: '◆' },
        { label: 'Getting started', path: '/getting-started', icon: '▶' },
        { label: 'Theming', path: '/theming', icon: '◑' },
        { label: 'Theme builder', path: '/theme-builder', icon: '⛭' },
      ],
    },
    {
      title: 'Examples',
      links: [
        { label: 'Dashboard', path: '/examples/dashboard', icon: '▤' },
        { label: 'Data table', path: '/examples/data-table', icon: '▦' },
      ],
    },
    {
      title: 'Forms & inputs',
      collapsible: true,
      links: [
        { label: 'Buttons', path: '/components/buttons', icon: '⬡' },
        { label: 'Forms', path: '/components/forms', icon: '☑' },
        { label: 'Selection', path: '/components/selection', icon: '⊟' },
        { label: 'Date & time', path: '/components/date-time', icon: '◷' },
      ],
    },
    {
      title: 'Data display',
      collapsible: true,
      links: [
        { label: 'Data display', path: '/components/data', icon: '▦' },
        { label: 'Charts', path: '/components/charts', icon: '▚' },
        { label: 'Sort', path: '/components/sort', icon: '⇅' },
        { label: 'Tree', path: '/components/tree', icon: '⑃' },
        { label: 'Icon', path: '/components/icon', icon: '❖' },
        { label: 'Empty & timeline', path: '/components/empty-timeline', icon: '☰' },
      ],
    },
    {
      title: 'Navigation & layout',
      collapsible: true,
      links: [
        { label: 'Navigation', path: '/components/navigation', icon: '⛶' },
        { label: 'Structure', path: '/components/structure', icon: '▤' },
        { label: 'Command & nav', path: '/components/command-nav', icon: '⌘' },
        { label: 'Stepper', path: '/components/stepper', icon: '☷' },
        { label: 'Context menu', path: '/components/context-menu', icon: '☰' },
      ],
    },
    {
      title: 'Feedback & overlays',
      collapsible: true,
      links: [
        { label: 'Feedback', path: '/components/feedback', icon: '✦' },
        { label: 'Snackbar', path: '/components/snackbar', icon: '▭' },
        { label: 'Bottom sheet', path: '/components/bottom-sheet', icon: '▟' },
      ],
    },
    {
      title: 'Editors & interactions',
      collapsible: true,
      links: [
        { label: 'Content editor', path: '/components/content-editor', icon: '✎' },
        { label: 'Drag & drop', path: '/components/drag-drop', icon: '⤨' },
        { label: 'Utilities', path: '/components/utilities', icon: '⚙' },
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

  protected isActive(path: string): boolean {
    return this.currentUrl().startsWith(path);
  }

  protected go(shell: MkAppShell, path: string): void {
    this.router.navigateByUrl(path);
    shell.closeSidebar();
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
