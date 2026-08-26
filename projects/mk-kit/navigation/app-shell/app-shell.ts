import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MkFocusTrap } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';

/** Viewport width (px) at/below which the sidebar becomes an off-canvas drawer. */
const MOBILE_BREAKPOINT = 1024;

/**
 * Admin dashboard layout with a fixed header, a collapsible/responsive sidebar
 * and a main content area. On small screens the sidebar becomes a focus-trapped
 * off-canvas drawer with a scrim (Escape to close). Includes a skip-to-content
 * link for keyboard users.
 *
 * ```html
 * <mk-app-shell [(sidebarOpen)]="open" [(sidebarCollapsed)]="collapsed">
 *   <div mkAppHeader>
 *     <button mkButton iconOnly (click)="shell.toggleSidebar()">☰</button>
 *   </div>
 *   <mk-nav-list mkAppSidebar [collapsed]="collapsed()">…</mk-nav-list>
 *   <router-outlet />
 * </mk-app-shell>
 * ```
 */
@Component({
  selector: 'mk-app-shell',
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-app-shell',
    '[class.mk-app-shell--collapsed]': 'sidebarCollapsed() && !isMobile()',
    '[class.mk-app-shell--mobile]': 'isMobile()',
    '[class.mk-app-shell--drawer-open]': 'isMobile() && sidebarOpen()',
  },
})
export class MkAppShell {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly i18n = inject(MK_I18N);

  private readonly sidebarRef =
    viewChild<ElementRef<HTMLElement>>('sidebar');

  /** Whether the mobile drawer is open (two-way). */
  readonly sidebarOpen = model(false);
  /** Whether the desktop sidebar is collapsed to icons (two-way). */
  readonly sidebarCollapsed = model(false);

  /** True when the viewport is at/below the mobile breakpoint. */
  readonly isMobile = signal(false);

  private focusTrap?: MkFocusTrap;

  constructor() {
    if (this.isBrowser) {
      const mql = this.document.defaultView?.matchMedia(
        `(max-width: ${MOBILE_BREAKPOINT}px)`,
      );
      if (mql) {
        this.isMobile.set(mql.matches);
        this.mql = mql;
        mql.addEventListener('change', this.onMediaChange);
      }
    }

    // Trap focus inside the drawer while it is open on mobile.
    effect(() => {
      const el = this.sidebarRef()?.nativeElement;
      const active = this.isMobile() && this.sidebarOpen();
      this.focusTrap?.release();
      this.focusTrap = undefined;
      if (active && el) {
        this.focusTrap = new MkFocusTrap(el);
        this.focusTrap.activate();
      }
    });
  }

  private mql?: MediaQueryList;
  private readonly onMediaChange = (e: MediaQueryListEvent): void => {
    this.isMobile.set(e.matches);
    if (!e.matches) this.sidebarOpen.set(false);
  };

  ngOnDestroy(): void {
    this.mql?.removeEventListener('change', this.onMediaChange);
    this.focusTrap?.release();
    this.focusTrap = undefined;
  }

  /** Toggle the mobile drawer open/closed. Handy for a hamburger button. */
  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  /** Open the mobile drawer. */
  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  /** Close the mobile drawer. */
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  /** Toggle the desktop collapsed (icon-only) state. */
  toggleCollapsed(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  protected onSidebarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isMobile() && this.sidebarOpen()) {
      event.preventDefault();
      this.closeSidebar();
    }
  }
}
