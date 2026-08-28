import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { MkAlert, MkButton, MkMarkdown, MkSpinner, MkTag } from '@mk-kit/ui';
import { BLOG_POSTS, findPost, formatPostDate, readingMinutes } from './blog';

const SITE_URL = 'https://mk-kit.dev';

/**
 * `/blog/:slug` — fetches `public/blog/<slug>.md` in the browser and renders
 * it with the library's own `<mk-markdown>`. Sets the document title, the
 * description / Open Graph tags and the canonical link for the post (the
 * static per-post HTML written by `scripts/gen-blog.mjs` carries the same
 * values for crawlers that do not run JavaScript). Unknown slugs redirect to
 * the index.
 */
@Component({
  selector: 'docs-blog-post-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MkAlert, MkButton, MkMarkdown, MkSpinner, MkTag],
  template: `
    @if (post(); as post) {
      <article class="docs-page docs-container blog-post">
        <p class="blog-post__crumb"><a routerLink="/blog">← All posts</a></p>
        <header class="blog-post__head">
          <h1>{{ post.title }}</h1>
          <p class="blog-post__meta">
            <time [attr.datetime]="post.date">{{ format(post.date) }}</time>
            <span aria-hidden="true">·</span>
            <span>Mateusz Kornaś</span>
            @if (minutes(); as m) {
              <span aria-hidden="true">·</span>
              <span>{{ m }} min read</span>
            }
          </p>
          <div class="blog-post__tags">
            @for (tag of post.tags; track tag) {
              <mk-tag tone="neutral" size="sm">{{ tag }}</mk-tag>
            }
          </div>
        </header>

        @switch (state()) {
          @case ('loading') {
            <div class="blog-post__loading" role="status">
              <mk-spinner />
              <span>Loading post…</span>
            </div>
          }
          @case ('error') {
            <mk-alert tone="warning" title="Couldn't load this post">
              The post file isn't reachable right now. Try again in a moment or
              read it
              <a
                [href]="'https://github.com/mk-kit/mk-kit/blob/main/projects/docs/public/blog/' + post.slug + '.md'"
                target="_blank"
                rel="noopener noreferrer"
                >on GitHub</a
              >.
            </mk-alert>
          }
          @case ('ready') {
            <mk-markdown [source]="source()" />
          }
        }

        <aside class="blog-post__cta" aria-label="Next steps">
          <p class="blog-post__cta-title">Ready to try it?</p>
          <p>
            <code class="docs-inline">ng add &#64;mk-kit/ui</code> — 180
            components, MIT, themed with CSS variables.
          </p>
          <div class="blog-post__cta-actions">
            <a mkButton tone="primary" routerLink="/getting-started">Get started</a>
            <a mkButton variant="outline" tone="neutral" routerLink="/migration">Migration guide</a>
          </div>
        </aside>

        <nav class="blog-post__nav" aria-label="More posts">
          @if (newer(); as n) {
            <a class="blog-post__nav-link" [routerLink]="['/blog', n.slug]">
              <span class="blog-post__nav-label">Newer</span>
              <span>{{ n.title }}</span>
            </a>
          } @else {
            <span></span>
          }
          @if (older(); as o) {
            <a class="blog-post__nav-link blog-post__nav-link--right" [routerLink]="['/blog', o.slug]">
              <span class="blog-post__nav-label">Older</span>
              <span>{{ o.title }}</span>
            </a>
          }
        </nav>
      </article>
    }
  `,
  styles: [
    `
      .blog-post__crumb {
        margin: 0 0 var(--mk-space-4);
        font-size: var(--mk-font-size-sm);
      }
      .blog-post__head {
        margin-bottom: var(--mk-space-6);
        padding-bottom: var(--mk-space-4);
        border-bottom: 1px solid var(--mk-border);
      }
      .blog-post__meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
        margin: 0 0 var(--mk-space-3);
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-sm);
      }
      .blog-post__tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
      }
      .blog-post__loading {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        color: var(--mk-text-muted);
        padding-block: var(--mk-space-8);
      }
      .blog-post__cta {
        margin-top: var(--mk-space-10);
        padding: var(--mk-space-5);
        border-radius: var(--mk-radius-lg);
        background: color-mix(in srgb, var(--mk-primary) 10%, transparent);
      }
      .blog-post__cta-title {
        margin: 0 0 var(--mk-space-1);
        font-weight: 600;
      }
      .blog-post__cta p {
        margin: 0 0 var(--mk-space-3);
      }
      .blog-post__cta-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
      }
      .blog-post__nav {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--mk-space-4);
        margin-top: var(--mk-space-8);
        padding-top: var(--mk-space-4);
        border-top: 1px solid var(--mk-border);
      }
      .blog-post__nav-link {
        display: grid;
        gap: var(--mk-space-1);
        text-decoration: none;
        color: inherit;
      }
      .blog-post__nav-link:hover {
        color: var(--mk-primary);
      }
      .blog-post__nav-link--right {
        text-align: end;
      }
      .blog-post__nav-label {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class BlogPostPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug'))), {
    initialValue: this.route.snapshot.paramMap.get('slug'),
  });
  protected readonly post = computed(() => findPost(this.slug()));
  protected readonly source = signal('');
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly minutes = computed(() => (this.state() === 'ready' ? readingMinutes(this.source()) : 0));
  protected readonly format = formatPostDate;

  protected readonly newer = computed(() => {
    const i = BLOG_POSTS.findIndex((p) => p.slug === this.slug());
    return i > 0 ? BLOG_POSTS[i - 1] : undefined;
  });
  protected readonly older = computed(() => {
    const i = BLOG_POSTS.findIndex((p) => p.slug === this.slug());
    return i >= 0 && i < BLOG_POSTS.length - 1 ? BLOG_POSTS[i + 1] : undefined;
  });

  private readonly inBrowser = signal(false);
  private readonly defaultTitle = this.title.getTitle();
  private readonly defaultDescription =
    this.meta.getTag('name="description"')?.getAttribute('content') ?? '';

  constructor() {
    // afterNextRender only runs in the browser, so the fetch never executes
    // during SSR / prerender (there is no `fetch` there and nothing to show).
    afterNextRender(() => this.inBrowser.set(true));

    effect(() => {
      const post = this.post();
      if (!post) {
        // Unknown slug — send the reader to the index rather than a blank page.
        untracked(() => void this.router.navigate(['/blog'], { replaceUrl: true }));
        return;
      }
      this.applyHead(post.title, post.summary, `${SITE_URL}/blog/${post.slug}`);
      if (!this.inBrowser()) return;
      untracked(() => void this.load(post.slug));
    });
  }

  ngOnDestroy(): void {
    this.applyHead(this.defaultTitle, this.defaultDescription, `${SITE_URL}/`, 'website');
  }

  private async load(slug: string): Promise<void> {
    this.state.set('loading');
    try {
      const res = await fetch(`/blog/${slug}.md`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // A stale slug (reader navigated on) must not overwrite the newer post.
      if (this.slug() !== slug) return;
      this.source.set(text);
      this.state.set('ready');
    } catch {
      if (this.slug() === slug) this.state.set('error');
    }
  }

  private applyHead(title: string, description: string, url: string, type = 'article'): void {
    const full = title.includes('mk-kit') ? title : `${title} — mk-kit blog`;
    this.title.setTitle(full);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: full });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: type });
    const canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;
  }
}
