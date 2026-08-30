import {
  ApplicationRef,
  DOCUMENT,
  EnvironmentInjector,
  Injectable,
  Injector,
  type OnDestroy,
  PLATFORM_ID,
  Type,
  createComponent,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MkFocusTrap } from '../a11y/focus-trap';
import { MK_OVERLAY_DATA, MkOverlayRef } from './overlay-ref';
import { MK_OVERLAY_ROOT, mkBodyLevelAncestor } from './overlay-root';

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

/**
 * State saved while body scroll is locked. iOS Safari ignores
 * `overflow: hidden` for touch scrolling, so the lock also fixes the body in
 * place at the current scroll offset (`position: fixed; top: -scrollY`) and
 * jumps back to that offset when the last overlay closes.
 */
interface BodyScrollLock {
  scrollY: number;
  /** The body's own inline styles before the lock, restored verbatim. */
  prev: Record<
    'position' | 'top' | 'left' | 'right' | 'width' | 'overflow',
    string
  >;
}

/**
 * Body-level elements a modal must NOT inert:
 * - `[popover]` — anchored panels / tooltips teleport to `document.body` and
 *   may open ABOVE the dialog after it (a select inside a dialog); inerting
 *   them would kill the very widget the dialog just opened.
 * - toast / snackbar containers — transient status surfaces that must stay
 *   reachable and announceable while a dialog is up.
 * - `[aria-live]` — the live announcer region; an inert live region stops
 *   announcing entirely.
 */
const INERT_EXEMPT_SELECTOR =
  '[popover], [aria-live], mk-toast-container, mk-snackbar-container';

/**
 * Lightweight, dependency-free overlay renderer. Instantiates a standalone
 * component into a body-level host, manages the backdrop, focus trapping,
 * Escape handling, and scroll locking. Powers Dialog, Menu, and others.
 */
@Injectable({ providedIn: 'root' })
export class MkOverlayService implements OnDestroy {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly overlayRoot = inject(MK_OVERLAY_ROOT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // All coordination state lives on the INSTANCE, not the module: the service
  // is a root singleton, so one app still shares one stack — but each test
  // injector gets a fresh world instead of leaking overlays/locks/listeners
  // across spec files that share a worker.

  /** Reference count for the body scroll lock (first open locks, last close unlocks). */
  private openOverlays = 0;
  private bodyScrollLock: BodyScrollLock | null = null;

  /**
   * Every overlay currently on screen, in open order (Map preserves insertion
   * order, so the last entry is the topmost). Kept so {@link closeAll} can
   * dismiss them and so the shared Escape listener can find the topmost
   * dismissible overlay. Entries remove themselves on dispose.
   */
  private readonly openRefs = new Map<
    MkOverlayRef<unknown>,
    { closeOnEscape: boolean }
  >();

  /** The document currently carrying the shared Escape listener, if any. */
  private escapeListenerDoc: Document | null = null;

  /**
   * The one document-level Escape listener, shared by every open overlay.
   *
   * Registered on the BUBBLE phase on purpose: widgets living inside an
   * overlay (a menu, an anchored panel, a picker) handle Escape on their own
   * elements during bubbling and call `preventDefault()`, so a consumed
   * Escape arrives here already `defaultPrevented` and closes nothing. A
   * per-overlay capture listener with `stopPropagation()` cannot do this:
   * stopPropagation does not stop OTHER listeners on the same target, so one
   * Escape used to close every stacked overlay at once.
   */
  private readonly onDocumentEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    // Close ONLY the topmost open overlay that opted into Escape dismissal.
    const entries = [...this.openRefs.entries()];
    for (let i = entries.length - 1; i >= 0; i--) {
      const [ref, { closeOnEscape }] = entries[i];
      if (closeOnEscape) {
        ref.close();
        event.preventDefault();
        return;
      }
    }
  };

  /** (Un)register the shared Escape listener to match the open-overlay set. */
  private syncEscapeListener(doc: Document): void {
    const needed = [...this.openRefs.values()].some((e) => e.closeOnEscape);
    if (needed && this.escapeListenerDoc === null) {
      doc.addEventListener('keydown', this.onDocumentEscape);
      this.escapeListenerDoc = doc;
    } else if (!needed && this.escapeListenerDoc !== null) {
      this.escapeListenerDoc.removeEventListener(
        'keydown',
        this.onDocumentEscape,
      );
      this.escapeListenerDoc = null;
    }
  }

  private lockBodyScroll(doc: Document): void {
    const { style } = doc.body;
    this.bodyScrollLock = {
      scrollY: doc.defaultView?.scrollY ?? 0,
      prev: {
        position: style.position,
        top: style.top,
        left: style.left,
        right: style.right,
        width: style.width,
        overflow: style.overflow,
      },
    };
    // overflow:hidden still does the whole job on desktop (and avoids a
    // scroll jump there); the fixed-body treatment is what actually stops iOS
    // touch scrolling. `top: -scrollY` keeps the page visually where it was.
    style.overflow = 'hidden';
    style.position = 'fixed';
    style.top = `-${this.bodyScrollLock.scrollY}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';
  }

  private unlockBodyScroll(doc: Document): void {
    if (!this.bodyScrollLock) return;
    const { scrollY, prev } = this.bodyScrollLock;
    this.bodyScrollLock = null;
    const { style } = doc.body;
    style.position = prev.position;
    style.top = prev.top;
    style.left = prev.left;
    style.right = prev.right;
    style.width = prev.width;
    style.overflow = prev.overflow;
    // Fixing the body collapsed the document's scroll position to 0; jump
    // back instantly (never smooth — the restoration must be invisible).
    // Guarded for jsdom, where scrollTo is unimplemented.
    const view = doc.defaultView;
    if (scrollY !== 0 && typeof view?.scrollTo === 'function') {
      view.scrollTo({ top: scrollY, behavior: 'instant' });
    }
  }

  /** How many overlays are currently open. */
  get openCount(): number {
    return this.openRefs.size;
  }

  /**
   * Close every open overlay, newest first. Each is closed with no result, so
   * `afterClosed` resolves undefined exactly as a backdrop click or Escape
   * would. Safe to call when nothing is open.
   */
  closeAll(): void {
    // Iterate a COPY: close() disposes synchronously, which mutates the map.
    for (const ref of [...this.openRefs.keys()].reverse()) ref.close();
  }

  /**
   * Injector teardown closes everything still open. In an app this runs only
   * at shutdown; in tests it runs on every `TestBed.resetTestingModule()`,
   * so an overlay a spec forgot to close cannot leak its scroll lock, focus
   * trap, inert marks, or document listeners into later spec files sharing
   * the worker.
   */
  ngOnDestroy(): void {
    this.closeAll();
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
    if (!hasBackdrop) {
      // Without a scrim the fullscreen container must not swallow clicks
      // meant for the page; the panel re-enables pointer events for itself.
      container.style.pointerEvents = 'none';
    }

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
    if (!hasBackdrop) panel.style.pointerEvents = 'auto';
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

    this.overlayRoot().appendChild(container);

    // Lock body scroll while any overlay is open (see lockBodyScroll for the
    // iOS-proof fixed-body technique and the reference counting).
    if (this.openOverlays++ === 0) {
      this.lockBodyScroll(this.document);
    }

    // Make the rest of the page inert while a MODAL overlay is open —
    // `aria-modal="true"` alone does not stop Tab or a screen reader's
    // reading cursor from reaching background content (WCAG 2.4.3 / 1.3.2).
    // A backdropless overlay is deliberately non-blocking, so it inerts
    // nothing. Only the elements THIS overlay inerted are recorded, so
    // nested modals unwind correctly: the inner dialog skips (and therefore
    // never un-inerts) whatever the outer dialog already inerted.
    const isModal = hasBackdrop && role !== 'menu';
    const inerted: Element[] = [];
    if (isModal) {
      // With a custom MK_OVERLAY_ROOT the container is nested (possibly behind
      // a shadow boundary), so resolve which body child carries it — that one
      // must stay interactive.
      const containerHost = mkBodyLevelAncestor(container, this.document.body);
      for (const sibling of Array.from(this.document.body.children)) {
        if (
          sibling === containerHost ||
          sibling.hasAttribute('inert') ||
          sibling.matches(INERT_EXEMPT_SELECTOR)
        ) {
          continue;
        }
        sibling.setAttribute('inert', '');
        inerted.push(sibling);
      }
    }

    // Focus management.
    const focusTrap = trapFocus ? new MkFocusTrap(panel) : undefined;
    // `autoFocus: false` focuses the panel rather than its first control, so
    // the trap still contains Tab and restores focus on close.
    focusTrap?.activate(autoFocus ? undefined : panel);

    // Escape handling goes through ONE shared document listener (see
    // `onDocumentEscape`) so stacked overlays close one per keypress,
    // topmost first, and inner widgets can consume Escape before us.
    this.openRefs.set(overlayRef as MkOverlayRef<unknown>, { closeOnEscape });
    this.syncEscapeListener(this.document);

    overlayRef._dispose = () => {
      this.openRefs.delete(overlayRef as MkOverlayRef<unknown>);
      this.syncEscapeListener(this.document);
      for (const el of inerted) el.removeAttribute('inert');
      focusTrap?.release();
      // ApplicationRef destroys its views before root-injector destroy hooks
      // run — detaching then would throw (same guard as MkTourService).
      if (!this.appRef.destroyed) this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      container.remove();
      if (--this.openOverlays === 0) {
        this.unlockBodyScroll(this.document);
      }
    };

    return overlayRef;
  }
}
