import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MK_I18N, MkAnchoredPanel, mkUniqueId } from '@mk-kit/ui/core';

/** One app in the switcher. */
export interface MkAppLink {
  /** Stable id; `current` matches on it (or on `url`). */
  id: string;
  name: string;
  url: string;
  /** One line under the name. */
  description?: string;
  /** A short glyph for the tile — an emoji or one or two letters. Defaults to the name's initial. */
  icon?: string;
  /** Tile colour; any CSS colour. Defaults to the primary tone. */
  color?: string;
}

/**
 * The "apps grid" of a family of applications: a header button that opens a
 * grid of links to the other apps, the current one marked. Give it the list
 * (`apps`) or a registry to fetch it from (`src` — JSON, either an array or
 * `{ apps: [...] }`), so every app of a suite shows the same switcher from one
 * shared file.
 *
 * ```html
 * <mk-app-shell>
 *   <ng-container mkAppHeader>
 *     <mk-app-switcher src="https://home.example.com/apps.json" current="sales" />
 *   </ng-container>
 * </mk-app-shell>
 * ```
 *
 * The registry is fetched lazily, the first time the panel opens, and once
 * per page. The panel is a disclosure (a labelled group of links, not a menu):
 * Tab moves through the tiles, arrows too, Escape closes and returns focus.
 */
@Component({
  selector: 'mk-app-switcher',
  exportAs: 'mkAppSwitcher',
  templateUrl: './app-switcher.html',
  styleUrl: './app-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-app-switcher',
    '[class.mk-app-switcher--open]': 'open()',
  },
})
export class MkAppSwitcher {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly i18n = inject(MK_I18N);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** The apps, when the host has the list. */
  readonly apps = input<MkAppLink[]>([]);
  /** A registry URL to fetch the apps from (JSON: an array or `{ apps }`). Used when `apps` is empty. */
  readonly src = input<string>('');
  /** The app this switcher is shown in — its `id` or `url`; marked as current and listed first. */
  readonly current = input<string>('');
  /** Accessible name of the trigger. Defaults to the i18n `appSwitcherLabel`. */
  readonly label = input<string>('');
  /** Tiles per row. */
  readonly columns = input(3);
  /** Open links in a new tab. */
  readonly newTab = input(false);
  /** Emits when the panel opens or closes. */
  readonly openChange = output<boolean>();

  protected readonly panelId = mkUniqueId('mk-app-switcher');
  protected readonly open = signal(false);
  private readonly fetched = signal<MkAppLink[] | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  private fetchedFrom = '';

  protected readonly triggerEl = computed(() => this.trigger()?.nativeElement);
  protected readonly ariaLabel = computed(() => this.label() || this.i18n.appSwitcherLabel);

  /** The list to show: given apps, else the fetched registry; the current app first. */
  protected readonly items = computed<MkAppLink[]>(() => {
    const list = this.apps().length ? this.apps() : (this.fetched() ?? []);
    const cur = this.current();
    if (!cur) return list;
    return [...list].sort((a, b) => Number(this.isCurrent(b, cur)) - Number(this.isCurrent(a, cur)));
  });

  protected isCurrent(app: MkAppLink, cur = this.current()): boolean {
    return !!cur && (app.id === cur || app.url.replace(/\/$/, '') === cur.replace(/\/$/, ''));
  }

  protected initial(app: MkAppLink): string {
    return app.icon || app.name.trim().charAt(0).toUpperCase();
  }

  toggle(): void {
    this.open() ? this.close() : this.show();
  }

  show(): void {
    if (this.open()) return;
    this.open.set(true);
    this.openChange.emit(true);
    void this.load();
    // Focus the first tile once the panel is in the DOM.
    queueMicrotask(() => this.panel()?.nativeElement.querySelector<HTMLElement>('a')?.focus());
  }

  close(restoreFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.openChange.emit(false);
    if (restoreFocus) this.trigger()?.nativeElement.focus();
  }

  /** Fetch the registry once per `src`; a failure shows a note and keeps the trigger usable. */
  private async load(): Promise<void> {
    const src = this.src();
    if (!src || this.apps().length || !this.isBrowser || this.fetchedFrom === src) return;
    this.fetchedFrom = src;
    this.loading.set(true);
    this.failed.set(false);
    try {
      const res = await fetch(src, { credentials: 'omit' });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as MkAppLink[] | { apps: MkAppLink[] };
      const apps = Array.isArray(body) ? body : body.apps;
      this.fetched.set(Array.isArray(apps) ? apps.filter((a) => a && a.name && a.url) : []);
    } catch {
      this.fetchedFrom = '';
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    const tiles = Array.from(this.panel()?.nativeElement.querySelectorAll<HTMLElement>('a') ?? []);
    if (!tiles.length) return;
    const i = tiles.indexOf(document.activeElement as HTMLElement);
    const cols = Math.max(1, this.columns());
    let next = -1;
    switch (event.key) {
      case 'ArrowRight':
        next = Math.min(i + 1, tiles.length - 1);
        break;
      case 'ArrowLeft':
        next = Math.max(i - 1, 0);
        break;
      case 'ArrowDown':
        next = Math.min(i + cols, tiles.length - 1);
        break;
      case 'ArrowUp':
        next = Math.max(i - cols, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tiles.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    tiles[next]?.focus();
  }

  protected onPanelFocusout(event: FocusEvent): void {
    const to = event.relatedTarget as Node | null;
    if (to && (this.panel()?.nativeElement.contains(to) || this.trigger()?.nativeElement.contains(to))) return;
    if (to) this.close(false);
  }
}
