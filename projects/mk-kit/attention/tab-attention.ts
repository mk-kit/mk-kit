import { inject, Injectable, InjectionToken, NgZone, signal } from '@angular/core';

/** Options for {@link MkTabAttention}, set with {@link provideMkTabAttention}. */
export interface MkTabAttentionConfig {
  /** Badge fill colour (any CSS colour). Default `#e53935`. */
  badgeColor?: string;
  /** Title blink period in ms while the tab is hidden. Default `1200`. */
  blinkMs?: number;
}

export const MK_TAB_ATTENTION_CONFIG = new InjectionToken<MkTabAttentionConfig>('MK_TAB_ATTENTION_CONFIG');

/** Register options for {@link MkTabAttention}. Optional — the defaults work. */
export function provideMkTabAttention(config: MkTabAttentionConfig) {
  return { provide: MK_TAB_ATTENTION_CONFIG, useValue: config };
}

/**
 * Messenger-style tab attention: while unhandled work exists the favicon
 * carries a red counter badge, and — only while the tab is hidden — the
 * title alternates with "(N) label" so a pinned tab flashes in the tab strip.
 * Focusing the tab stops the blinking (someone is looking) but keeps the
 * badge until the count reaches zero. SSR-safe: every entry point bails
 * without a `document`; the blink timer runs outside the Angular zone.
 *
 * ```ts
 * private attention = inject(MkTabAttention);
 * effect(() => this.attention.set(this.pending().length, 'new orders'));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkTabAttention {
  private readonly zone = inject(NgZone);
  private readonly config = inject(MK_TAB_ATTENTION_CONFIG, { optional: true }) ?? {};
  private label = '';
  private originalTitle = '';
  private originalFavicon: string | null = null;
  private blinkTimer: ReturnType<typeof setInterval> | null = null;
  private showingAttention = false;
  private listening = false;
  private readonly visibilityHandler = () => this.sync();

  /** The count currently shown (0 = nothing pending). */
  readonly count = signal(0);

  /** Update the pending count and the label used in the blinking title. */
  set(count: number, label = ''): void {
    if (typeof document === 'undefined') return;
    this.count.set(Math.max(0, Math.floor(count)));
    this.label = label;
    if (!this.listening) {
      this.listening = true;
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
    this.sync();
  }

  /** Drop the badge and the blinking entirely and stop listening. */
  clear(): void {
    if (typeof document === 'undefined') return;
    this.count.set(0);
    this.stopBlink();
    this.restoreTitle();
    this.restoreFavicon();
    if (this.listening) {
      this.listening = false;
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private sync(): void {
    if (this.count() > 0) {
      this.setFavicon(this.badgeFavicon(this.count()));
      if (document.hidden) this.startBlink();
      else {
        this.stopBlink();
        this.restoreTitle();
      }
    } else {
      this.stopBlink();
      this.restoreTitle();
      this.restoreFavicon();
    }
  }

  private startBlink(): void {
    if (this.blinkTimer) return;
    if (!this.originalTitle) this.originalTitle = document.title;
    this.showingAttention = false;
    this.toggleTitle();
    this.zone.runOutsideAngular(() => {
      this.blinkTimer = setInterval(() => this.toggleTitle(), this.config.blinkMs ?? 1200);
    });
  }

  private stopBlink(): void {
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer);
      this.blinkTimer = null;
    }
  }

  private toggleTitle(): void {
    this.showingAttention = !this.showingAttention;
    document.title = this.showingAttention
      ? `(${this.count()}) ${this.label}`.trimEnd()
      : this.originalTitle;
  }

  private restoreTitle(): void {
    if (this.originalTitle) document.title = this.originalTitle;
    this.showingAttention = false;
  }

  private faviconLink(): HTMLLinkElement | null {
    return document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  }

  private setFavicon(href: string): void {
    const link = this.faviconLink();
    if (!link) return;
    if (this.originalFavicon === null) this.originalFavicon = link.href;
    link.href = href;
  }

  private restoreFavicon(): void {
    const link = this.faviconLink();
    if (link && this.originalFavicon !== null) {
      link.href = this.originalFavicon;
      this.originalFavicon = null;
    }
  }

  /** Coloured circle + white count, as an inline SVG data URI. */
  private badgeFavicon(count: number): string {
    const text = count > 9 ? '9+' : String(count);
    const fill = this.config.badgeColor ?? '#e53935';
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
      `<circle cx="16" cy="16" r="16" fill="${fill}"/>` +
      `<text x="16" y="22" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#fff" text-anchor="middle">${text}</text>` +
      `</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
}
