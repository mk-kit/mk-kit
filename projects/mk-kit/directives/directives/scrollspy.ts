import {
  DOCUMENT,
  Directive,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Scrollspy — tracks which section is currently in view and exposes its `id`,
 * so a table of contents / "on this page" nav can highlight the active link.
 *
 * Apply it to any element (typically the nav) and point `mkScrollspy` at a CSS
 * selector matching the section elements to watch (each needs an `id`). Read the
 * active id via the exported instance, or bind `(activeChange)`:
 *
 * ```html
 * <nav mkScrollspy="main :is(h2, h3)[id]" #spy="mkScrollspy">
 *   <a href="#intro" [class.is-active]="spy.activeId() === 'intro'">Intro</a>
 *   …
 * </nav>
 * ```
 *
 * A section activates once its top passes `offset` px below the top of the
 * scroll root (default the viewport). When scrolling through a gap between
 * sections the previous one stays active until the next crosses the line.
 */
@Directive({
  selector: '[mkScrollspy]',
  exportAs: 'mkScrollspy',
})
export class MkScrollspy {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** CSS selector for the section elements to track (queried within `root`). */
  readonly sections = input.required<string>({ alias: 'mkScrollspy' });
  /**
   * Scroll container. Sections are queried inside it and its top edge is the
   * activation reference. Defaults to the whole document / viewport.
   */
  readonly root = input<HTMLElement | null>(null);
  /**
   * Distance (px) below the scroll root's top at which a section becomes
   * active. Raise it to account for a sticky header.
   */
  readonly offset = input(96);

  /** The id of the currently active section (`null` before the first one). */
  readonly activeId = signal<string | null>(null);
  /** Emitted whenever the active section changes. */
  readonly activeChange = output<string | null>();

  private scrollSource?: EventTarget;

  constructor() {
    // afterNextRender runs once inputs are bound, so root()/sections() resolve
    // and the projected sections exist in the DOM.
    afterNextRender(() => {
      if (!this.isBrowser) return;
      const view = this.document.defaultView;
      this.scrollSource = this.root() ?? view ?? undefined;
      this.scrollSource?.addEventListener('scroll', this.onScroll, {
        passive: true,
      });
      view?.addEventListener('resize', this.onScroll);
      this.compute();
    });
  }

  /** Re-evaluate the active section (call after sections change). */
  refresh(): void {
    if (this.isBrowser) this.compute();
  }

  private querySections(): HTMLElement[] {
    const rootEl: ParentNode = this.root() ?? this.document;
    return Array.from(rootEl.querySelectorAll<HTMLElement>(this.sections()));
  }

  private computeRaf: number | null = null;
  /** rAF-coalesced — several scroll ticks per frame trigger one layout read. */
  private readonly onScroll = (): void => {
    if (this.computeRaf != null) return;
    this.computeRaf =
      this.document.defaultView?.requestAnimationFrame(() => {
        this.computeRaf = null;
        this.compute();
      }) ?? null;
  };

  private compute(): void {
    const sections = this.querySections();
    if (!sections.length) {
      this.setActive(null);
      return;
    }
    // At the very bottom the final section may be too short to reach the line —
    // activate it explicitly so the last nav item can still highlight.
    if (this.atBottom()) {
      this.setActive(sections[sections.length - 1].id || null);
      return;
    }
    const rootEl = this.root();
    const line = (rootEl ? rootEl.getBoundingClientRect().top : 0) + this.offset();

    // Active = the last section whose top has crossed the activation line.
    let active: HTMLElement | null = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top - line <= 1) active = section;
      else break;
    }
    // Nothing crossed yet (still above the first section) → highlight the first.
    this.setActive((active ?? sections[0]).id || null);
  }

  /** Whether the scroll root is scrolled to (or within 1px of) its bottom. */
  private atBottom(): boolean {
    const root = this.root();
    if (root) {
      return root.scrollTop + root.clientHeight >= root.scrollHeight - 1;
    }
    const view = this.document.defaultView;
    if (!view) return false;
    const doc = this.document.documentElement;
    return view.scrollY + view.innerHeight >= doc.scrollHeight - 1;
  }

  private setActive(id: string | null): void {
    if (this.activeId() === id) return;
    this.activeId.set(id);
    this.activeChange.emit(id);
  }

  ngOnDestroy(): void {
    if (this.computeRaf != null) {
      this.document.defaultView?.cancelAnimationFrame(this.computeRaf);
      this.computeRaf = null;
    }
    this.scrollSource?.removeEventListener('scroll', this.onScroll);
    this.document.defaultView?.removeEventListener('resize', this.onScroll);
  }
}
