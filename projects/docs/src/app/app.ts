import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import {
  MkAppShell,
  MkButton,
  MkNavItem,
  MkNavList,
  MkThemeService,
} from '@mk-kit/ui';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}
interface NavSection {
  title: string;
  links: NavLink[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MkAppShell, MkNavList, MkNavItem, MkButton],
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
      title: 'Components',
      links: [
        { label: 'Buttons', path: '/components/buttons', icon: '⬡' },
        { label: 'Forms', path: '/components/forms', icon: '☑' },
        { label: 'Selection', path: '/components/selection', icon: '⊟' },
        { label: 'Stepper', path: '/components/stepper', icon: '☷' },
        { label: 'Tree', path: '/components/tree', icon: '⑃' },
        { label: 'Icon', path: '/components/icon', icon: '❖' },
        { label: 'Snackbar', path: '/components/snackbar', icon: '▭' },
        { label: 'Bottom sheet', path: '/components/bottom-sheet', icon: '▟' },
        { label: 'Sort', path: '/components/sort', icon: '⇅' },
        { label: 'Charts', path: '/components/charts', icon: '▚' },
        { label: 'Empty & timeline', path: '/components/empty-timeline', icon: '☰' },
        { label: 'Structure', path: '/components/structure', icon: '▤' },
        { label: 'Command & nav', path: '/components/command-nav', icon: '⌘' },
        { label: 'Data display', path: '/components/data', icon: '▦' },
        { label: 'Date & time', path: '/components/date-time', icon: '◷' },
        { label: 'Drag & drop', path: '/components/drag-drop', icon: '⤨' },
        { label: 'Context menu', path: '/components/context-menu', icon: '☰' },
        { label: 'Content editor', path: '/components/content-editor', icon: '✎' },
        { label: 'Feedback', path: '/components/feedback', icon: '✦' },
        { label: 'Navigation', path: '/components/navigation', icon: '⛶' },
      ],
    },
  ];

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
