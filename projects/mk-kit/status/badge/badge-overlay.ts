import {
  DOCUMENT,
  Directive,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId, type MkTone } from '@mk-kit/ui/core';

/** Corner of the host an {@link MkBadgeOverlay} is anchored to. */
export type MkBadgeOverlayPosition =
  | 'top-end'
  | 'top-start'
  | 'bottom-end'
  | 'bottom-start';

/**
 * Badge overlay — anchors a small badge (count, dot or short text) to a corner
 * of ANY element: an icon button, an avatar, a tab label. The host stays a
 * single tab stop; the badge is a decorative, non-focusable child.
 *
 * - Numbers above `mkBadgeOverlayMax` (default 99) collapse to `99+`.
 * - `mkBadgeOverlayDot` renders a textless dot ("something is new").
 * - `mkBadgeOverlayAriaLabel` is the screen-reader text ("3 unread"). It is
 *   rendered in a visually hidden span and wired to the host with
 *   `aria-describedby`, so it is announced after the host's own name even
 *   when the host has an `aria-label`. When it is given, the visible badge is
 *   `aria-hidden` so the count is not read twice.
 * - Positions use logical insets, so `top-end` sits at the top-right in LTR
 *   and the top-left in RTL.
 *
 * The badge is painted with the global `.mk-badge-overlay` styles from
 * `@mk-kit/ui/styles.css` and follows the `--mk-*` tone tokens.
 *
 * ```html
 * <button mkButton iconOnly aria-label="Notifications"
 *         [mkBadgeOverlay]="unread()" mkBadgeOverlayTone="danger"
 *         [mkBadgeOverlayAriaLabel]="unread() + ' unread'">
 *   <mk-icon name="bell" />
 * </button>
 *
 * <mk-avatar name="Ada Lovelace" mkBadgeOverlay mkBadgeOverlayDot
 *            mkBadgeOverlayTone="success" mkBadgeOverlayPosition="bottom-end" />
 * ```
 */
@Directive({
  selector: '[mkBadgeOverlay]',
})
export class MkBadgeOverlay {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Badge content — a count or a short label. `null` / empty hides the badge
   * unless `mkBadgeOverlayDot` is set. Numeric strings are treated as numbers
   * so `mkBadgeOverlay="120"` also collapses to `99+`.
   */
  readonly content = input<string | number | null | undefined>(null, {
    alias: 'mkBadgeOverlay',
  });
  /** Corner the badge is anchored to (logical: `end` flips in RTL). */
  readonly position = input<MkBadgeOverlayPosition>('top-end', {
    alias: 'mkBadgeOverlayPosition',
  });
  /** Semantic color tone (same scale as `mk-badge`). */
  readonly tone = input<MkTone>('primary', { alias: 'mkBadgeOverlayTone' });
  /** Render a textless dot instead of the content. */
  readonly dot = input(false, {
    alias: 'mkBadgeOverlayDot',
    transform: booleanAttribute,
  });
  /** Numbers above this render as `<max>+`. `0` disables the cap. */
  readonly max = input(99, {
    alias: 'mkBadgeOverlayMax',
    transform: numberAttribute,
  });
  /** Hide the badge while keeping the directive (and its aria wiring) in place. */
  readonly hidden = input(false, {
    alias: 'mkBadgeOverlayHidden',
    transform: booleanAttribute,
  });
  /**
   * Screen-reader text for the badge, e.g. `"3 unread"`. Announced as the
   * host's description; the visible badge becomes `aria-hidden`.
   */
  readonly ariaLabel = input<string>('', { alias: 'mkBadgeOverlayAriaLabel' });

  /** The text painted in the badge (`''` in dot mode). */
  readonly label = computed<string>(() => {
    if (this.dot()) return '';
    const raw = this.content();
    if (raw === null || raw === undefined || raw === '') return '';
    const max = this.max();
    const n =
      typeof raw === 'number' ? raw : /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (Number.isFinite(n) && max > 0 && n > max) return `${max}+`;
    return String(raw);
  });

  /** Whether the badge is currently rendered. */
  readonly visible = computed(
    () => !this.hidden() && (this.dot() || this.label() !== ''),
  );

  private readonly srId = mkUniqueId('mk-badge-overlay');
  private badge: HTMLElement | null = null;
  private sr: HTMLElement | null = null;
  /** Set when WE made the host positioned, so we can undo it on removal. */
  private positionedHost = false;

  constructor() {
    if (!this.isBrowser) return;

    effect(() => {
      const visible = this.visible();
      if (!visible) {
        this.detach();
        return;
      }
      const badge = this.attach();
      const dot = this.dot();
      const srText = this.ariaLabel().trim();

      this.renderer.setAttribute(badge, 'data-tone', this.tone());
      this.renderer.setAttribute(badge, 'data-position', this.position());
      if (dot) {
        this.renderer.addClass(badge, 'mk-badge-overlay--dot');
      } else {
        this.renderer.removeClass(badge, 'mk-badge-overlay--dot');
      }
      this.renderer.setProperty(badge, 'textContent', this.label());
      // A dot has nothing to read; a labelled badge is described via the
      // hidden span instead — either way the visual is hidden from AT.
      if (dot || srText) {
        this.renderer.setAttribute(badge, 'aria-hidden', 'true');
      } else {
        this.renderer.removeAttribute(badge, 'aria-hidden');
      }
      this.syncSr(srText);
    });
  }

  private attach(): HTMLElement {
    if (this.badge) return this.badge;
    const el = this.host.nativeElement;
    const view = this.document.defaultView;
    const position = view?.getComputedStyle(el).position;
    if (!position || position === 'static') {
      this.renderer.setStyle(el, 'position', 'relative');
      this.positionedHost = true;
    }
    const badge: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(badge, 'mk-badge-overlay');
    this.renderer.appendChild(el, badge);
    this.badge = badge;
    return badge;
  }

  private detach(): void {
    if (this.badge) {
      this.renderer.removeChild(this.host.nativeElement, this.badge);
      this.badge = null;
    }
    this.syncSr('');
    if (this.positionedHost) {
      this.renderer.removeStyle(this.host.nativeElement, 'position');
      this.positionedHost = false;
    }
  }

  /** Create / update / remove the hidden description and its aria-describedby link. */
  private syncSr(text: string): void {
    const el = this.host.nativeElement;
    if (text) {
      if (!this.sr) {
        const sr: HTMLElement = this.renderer.createElement('span');
        this.renderer.addClass(sr, 'mk-visually-hidden');
        this.renderer.setAttribute(sr, 'id', this.srId);
        this.renderer.appendChild(el, sr);
        this.sr = sr;
        const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
        if (!ids.includes(this.srId)) ids.push(this.srId);
        this.renderer.setAttribute(el, 'aria-describedby', ids.join(' '));
      }
      this.renderer.setProperty(this.sr, 'textContent', text);
    } else if (this.sr) {
      this.renderer.removeChild(el, this.sr);
      this.sr = null;
      const ids = (el.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((id) => id && id !== this.srId);
      if (ids.length) {
        this.renderer.setAttribute(el, 'aria-describedby', ids.join(' '));
      } else {
        this.renderer.removeAttribute(el, 'aria-describedby');
      }
    }
  }
}
