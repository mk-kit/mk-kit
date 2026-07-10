import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MkScrollspy } from '@mkornas/ui';

interface TocItem {
  id: string;
  text: string;
}

/**
 * "On this page" right-rail table of contents. After every navigation it scans
 * the routed page for `h2` headings inside `.docs-page`, assigns slug ids to
 * any that lack one, and renders anchor links — with the active section
 * highlighted live by the library's own `mkScrollspy` directive.
 */
@Component({
  selector: 'docs-toc',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkScrollspy],
  template: `
    @if (items().length > 1) {
      <nav
        class="toc"
        aria-label="On this page"
        mkScrollspy=".docs-page h2[id]"
        [offset]="120"
        #spy="mkScrollspy"
      >
        <p class="toc__title">On this page</p>
        <ul class="toc__list">
          @for (item of items(); track item.id) {
            <li>
              <a
                class="toc__link"
                [class.toc__link--active]="spy.activeId() === item.id"
                [href]="'#' + item.id"
                (click)="scrollTo($event, item.id)"
                >{{ item.text }}</a
              >
            </li>
          }
        </ul>
      </nav>
    }
  `,
  styles: [
    `
      :host {
        display: none;
      }
      @media (min-width: 1440px) {
        :host {
          display: block;
          position: fixed;
          top: calc(var(--mk-app-shell-header-height, 56px) + 24px);
          right: var(--mk-space-5);
          width: 13rem;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          overscroll-behavior: contain;
        }
      }
      .toc__title {
        margin: 0 0 var(--mk-space-2);
        font-size: var(--mk-font-size-xs);
        font-weight: var(--mk-font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mk-text-muted);
      }
      .toc__list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
      }
      .toc__link {
        display: block;
        padding: var(--mk-space-1) var(--mk-space-3);
        border-left: 2px solid var(--mk-border-subtle);
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-sm);
        text-decoration: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .toc__link:hover {
        color: var(--mk-text);
      }
      .toc__link--active {
        border-left-color: var(--mk-primary);
        color: var(--mk-primary);
        font-weight: var(--mk-font-weight-medium);
      }
    `,
  ],
})
export class DocsToc {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly spy = viewChild(MkScrollspy);

  protected readonly items = signal<TocItem[]>([]);

  constructor() {
    // Initial page: scan once rendered.
    afterNextRender(() => this.scan());
    // Subsequent navigations: wait a tick for the routed component to render.
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => setTimeout(() => this.scan()));
  }

  private scan(): void {
    const headings = Array.from(
      this.document.querySelectorAll<HTMLElement>('.docs-page h2'),
    );
    const seen = new Set<string>();
    const items: TocItem[] = [];
    for (const h of headings) {
      const text = (h.textContent ?? '').trim();
      if (!text) continue;
      let id = h.id || slugify(text);
      while (seen.has(id)) id = `${id}-x`;
      seen.add(id);
      h.id = id;
      // Anchor targets shouldn't hide under the sticky header.
      h.style.scrollMarginTop = '96px';
      items.push({ id, text });
    }
    this.items.set(items);
    this.spy()?.refresh();
  }

  protected scrollTo(event: Event, id: string): void {
    const target = this.document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.document.defaultView?.history.replaceState(null, '', `#${id}`);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
