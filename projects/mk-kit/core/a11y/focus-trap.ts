const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/** Returns the tabbable elements inside `root`, in DOM order. */
export function mkGetFocusable(root: HTMLElement): HTMLElement[] {
  const win = root.ownerDocument.defaultView;
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    if (el === root.ownerDocument.activeElement) return true;
    if (el.offsetWidth <= 0 && el.offsetHeight <= 0) return false;
    // `visibility:hidden` elements keep their box, so the size check above
    // passes — yet they are NOT tabbable, and counting one as a Tab-wrap
    // boundary makes the wrap focus a dead element. `getComputedStyle`
    // degrades safely in jsdom, where visibility resolves 'visible' by
    // default, so test environments without layout keep working.
    const visibility = win?.getComputedStyle(el).visibility;
    return visibility !== 'hidden' && visibility !== 'collapse';
  });
}

/**
 * Traps keyboard focus within `root` (wrapping Tab / Shift+Tab), moves focus
 * inside on activation, and restores focus to the previously-focused element
 * on release. Essential for accessible modals/menus (WCAG 2.4.3, 2.1.2).
 */
export class MkFocusTrap {
  private previouslyFocused: HTMLElement | null = null;
  private active = false;
  private readonly keydownHandler = (e: KeyboardEvent) => this.onKeydown(e);

  constructor(private readonly root: HTMLElement) {}

  /** Activate the trap and move focus to the first focusable element (or root). */
  activate(initialFocus?: HTMLElement): void {
    this.previouslyFocused = this.root.ownerDocument
      .activeElement as HTMLElement | null;
    this.active = true;
    this.root.addEventListener('keydown', this.keydownHandler, true);

    const target =
      initialFocus ??
      mkGetFocusable(this.root)[0] ??
      this.root;
    // Ensure programmatic focus works even on a non-tabbable container.
    if (target === this.root && !this.root.hasAttribute('tabindex')) {
      this.root.setAttribute('tabindex', '-1');
    }
    // Skip if the trap was released within the same tick, so the deferred
    // focus can't steal focus back after release() restored it.
    queueMicrotask(() => {
      if (this.active) target.focus();
    });
  }

  /** Deactivate and restore focus to the trigger element. */
  release(): void {
    this.active = false;
    this.root.removeEventListener('keydown', this.keydownHandler, true);
    const previous = this.previouslyFocused;
    this.previouslyFocused = null;
    if (!previous) return;
    if (previous.isConnected) {
      previous.focus?.();
    } else {
      // The trigger left the DOM while the trap was active (a deleted row, a
      // route change). Focusing a detached node is a silent no-op at best —
      // land on the body instead so focus has a real, connected home.
      this.root.ownerDocument.body?.focus?.();
    }
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const focusable = mkGetFocusable(this.root);
    if (focusable.length === 0) {
      e.preventDefault();
      this.root.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.root.ownerDocument.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
