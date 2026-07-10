import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type MkAriaLivePoliteness = 'polite' | 'assertive';

/**
 * Announces messages to assistive technology via a visually-hidden
 * `aria-live` region. Used by toasts, form validation, sort changes, etc.
 * so state changes are perceivable without sight. WCAG 4.1.3 (Status Messages).
 */
@Injectable({ providedIn: 'root' })
export class MkLiveAnnouncer {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private region?: HTMLElement;
  private clearTimer?: ReturnType<typeof setTimeout>;

  /** Announce `message`. `politeness` controls interruption behavior. */
  announce(message: string, politeness: MkAriaLivePoliteness = 'polite'): void {
    if (!this.isBrowser) return;
    const region = this.ensureRegion();
    region.setAttribute('aria-live', politeness);

    // Clear then set on the next frame so identical consecutive messages
    // are still re-announced by screen readers.
    region.textContent = '';
    if (this.clearTimer) clearTimeout(this.clearTimer);
    this.document.defaultView?.requestAnimationFrame(() => {
      region.textContent = message;
    });

    // Tidy up after a while to keep the DOM clean.
    this.clearTimer = setTimeout(() => {
      if (this.region) this.region.textContent = '';
    }, 1000);
  }

  private ensureRegion(): HTMLElement {
    if (this.region) return this.region;
    const el = this.document.createElement('div');
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('aria-live', 'polite');
    el.className = 'mk-visually-hidden';
    el.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    this.document.body.appendChild(el);
    this.region = el;
    return el;
  }
}
