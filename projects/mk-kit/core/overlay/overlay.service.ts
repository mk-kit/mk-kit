import {
  ApplicationRef,
  DOCUMENT,
  EnvironmentInjector,
  Injectable,
  Injector,
  PLATFORM_ID,
  Type,
  createComponent,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MkFocusTrap } from '../a11y/focus-trap';
import { MK_OVERLAY_DATA, MkOverlayRef } from './overlay-ref';

export interface MkOverlayConfig<TData = unknown> {
  /** Arbitrary data injected via `MK_OVERLAY_DATA`. */
  data?: TData;
  /** Render a dimmed scrim behind the panel. Default `true`. */
  hasBackdrop?: boolean;
  /** Close when the backdrop is clicked. Default `true`. */
  closeOnBackdropClick?: boolean;
  /** Close when Escape is pressed. Default `true`. */
  closeOnEscape?: boolean;
  /** Trap focus within the panel and restore it on close. Default `true`. */
  trapFocus?: boolean;
  /**
   * Move focus to the panel's first focusable element on open. Default `true`.
   * Set `false` to focus the panel itself instead — for content-led surfaces
   * (a product sheet, a preview) where focusing the close button first reads
   * as "dismiss me". Tab containment and focus restore are unaffected; turn
   * `trapFocus` off only if you want neither.
   */
  autoFocus?: boolean;
  /** Extra class(es) applied to the panel host element. */
  panelClass?: string | string[];
  /** Accessible role for the panel. Default `dialog`. */
  role?: 'dialog' | 'alertdialog' | 'menu' | 'listbox';
  /** `aria-label` for the panel when no visible title is wired up. */
  ariaLabel?: string;
  /** A custom injector to use as the parent for the rendered component. */
  injector?: Injector;
}

let openOverlays = 0;
/**
 * Every overlay currently on screen, in open order. Kept so {@link
 * MkOverlayService.closeAll} can dismiss them — an app-level event (logging
 * out, a session expiring, a hard route change) has to clear whatever is
 * floating above the page, and the caller usually has no handle on it.
 * Entries remove themselves on dispose, so a closed overlay never lingers.
 */
const openRefs = new Set<MkOverlayRef<unknown>>();

/**
 * Lightweight, dependency-free overlay renderer. Instantiates a standalone
 * component into a body-level host, manages the backdrop, focus trapping,
 * Escape handling, and scroll locking. Powers Dialog, Menu, and others.
 */
@Injectable({ providedIn: 'root' })
export class MkOverlayService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** How many overlays are currently open. */
  get openCount(): number {
    return openRefs.size;
  }

  /**
   * Close every open overlay, newest first. Each is closed with no result, so
   * `afterClosed` resolves undefined exactly as a backdrop click or Escape
   * would. Safe to call when nothing is open.
   */
  closeAll(): void {
    // Iterate a COPY: close() disposes synchronously, which mutates the set.
    for (const ref of [...openRefs].reverse()) ref.close();
  }

  open<TComponent, TResult = unknown, TData = unknown>(
    component: Type<TComponent>,
    config: MkOverlayConfig<TData> = {},
  ): MkOverlayRef<TResult, TComponent> {
    const {
      hasBackdrop = true,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      trapFocus = true,
      autoFocus = true,
      role = 'dialog',
    } = config;

    const overlayRef = new MkOverlayRef<TResult, TComponent>();

    if (!this.isBrowser) {
      // Nothing to render on the server; return an inert ref.
      return overlayRef;
    }

    const container = this.document.createElement('div');
    container.className = 'mk-overlay-container';
    container.style.cssText =
      'position:fixed;inset:0;z-index:var(--mk-z-overlay,1000);display:flex;align-items:center;justify-content:center;';

    let backdrop: HTMLElement | undefined;
    if (hasBackdrop) {
      backdrop = this.document.createElement('div');
      backdrop.className = 'mk-overlay-backdrop';
      backdrop.style.cssText =
        'position:absolute;inset:0;background:var(--mk-overlay-scrim,rgba(0,0,0,0.45));animation:mk-overlay-fade var(--mk-duration-fast,140ms) var(--mk-ease-out,ease);';
      container.appendChild(backdrop);
      if (closeOnBackdropClick) {
        backdrop.addEventListener('click', () => overlayRef.close());
      }
    }

    const panel = this.document.createElement('div');
    panel.className = 'mk-overlay-panel';
    if (config.panelClass) {
      const classes = Array.isArray(config.panelClass)
        ? config.panelClass
        : [config.panelClass];
      panel.classList.add(...classes);
    }
    panel.style.cssText = 'position:relative;max-width:100%;max-height:100%;';
    panel.setAttribute('role', role);
    panel.setAttribute('aria-modal', role === 'menu' ? 'false' : 'true');
    if (config.ariaLabel) panel.setAttribute('aria-label', config.ariaLabel);
    container.appendChild(panel);

    // Create the component with an injector exposing the data + ref.
    const componentRef = createComponent(component, {
      environmentInjector: this.envInjector,
      hostElement: panel,
      elementInjector: Injector.create({
        parent: config.injector ?? this.envInjector,
        providers: [
          { provide: MK_OVERLAY_DATA, useValue: config.data ?? null },
          { provide: MkOverlayRef, useValue: overlayRef },
        ],
      }),
    });
    overlayRef.componentRef = componentRef;
    this.appRef.attachView(componentRef.hostView);

    this.document.body.appendChild(container);

    // Lock body scroll while any overlay is open.
    if (openOverlays++ === 0) {
      this.document.body.style.setProperty('overflow', 'hidden');
    }

    // Focus management.
    const focusTrap = trapFocus ? new MkFocusTrap(panel) : undefined;
    // `autoFocus: false` focuses the panel rather than its first control, so
    // the trap still contains Tab and restores focus on close.
    focusTrap?.activate(autoFocus ? undefined : panel);

    // Escape handling.
    const keyHandler = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        overlayRef.close();
      }
    };
    this.document.addEventListener('keydown', keyHandler, true);

    openRefs.add(overlayRef as MkOverlayRef<unknown>);

    overlayRef._dispose = () => {
      openRefs.delete(overlayRef as MkOverlayRef<unknown>);
      this.document.removeEventListener('keydown', keyHandler, true);
      focusTrap?.release();
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      container.remove();
      if (--openOverlays === 0) {
        this.document.body.style.removeProperty('overflow');
      }
    };

    return overlayRef;
  }
}
