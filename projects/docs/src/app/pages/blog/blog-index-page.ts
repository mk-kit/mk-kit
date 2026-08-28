import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MkTag } from '@mk-kit/ui';
import { BLOG_POSTS, formatPostDate } from './blog';

/** `/blog` — the list of posts, newest first. */
@Component({
  selector: 'docs-blog-index-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MkTag],
  template: `
    <div class="docs-page docs-container">
      <header class="blog-head">
        <h1>Blog</h1>
        <p class="docs-lead">
          Migration guides, licensing notes and release write-ups from the
          person who builds mk-kit. Subscribe via
          <a class="blog-feed" href="/blog/feed.xml">RSS</a>.
        </p>
      </header>

      <ol class="blog-list" aria-label="Posts">
        @for (post of posts; track post.slug) {
          <li class="blog-item">
            <time class="blog-item__date" [attr.datetime]="post.date">{{ format(post.date) }}</time>
            <h2 class="blog-item__title">
              <a [routerLink]="['/blog', post.slug]">{{ post.title }}</a>
            </h2>
            <p class="blog-item__summary">{{ post.summary }}</p>
            <div class="blog-item__tags">
              @for (tag of post.tags; track tag) {
                <mk-tag tone="neutral" size="sm">{{ tag }}</mk-tag>
              }
            </div>
          </li>
        }
      </ol>
    </div>
  `,
  styles: [
    `
      .blog-head {
        margin-bottom: var(--mk-space-6);
        padding-bottom: var(--mk-space-4);
        border-bottom: 1px solid var(--mk-border);
      }
      .blog-feed {
        color: var(--mk-primary);
      }
      .blog-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--mk-space-6);
      }
      .blog-item {
        display: grid;
        gap: var(--mk-space-2);
        padding: var(--mk-space-5);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
      }
      .blog-item__date {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .blog-item__title {
        margin: 0;
        font-size: var(--mk-font-size-xl);
        line-height: 1.3;
      }
      .blog-item__title a {
        color: inherit;
        text-decoration: none;
      }
      .blog-item__title a:hover {
        color: var(--mk-primary);
      }
      .blog-item__summary {
        margin: 0;
        color: var(--mk-text-muted);
      }
      .blog-item__tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
      }
    `,
  ],
})
export class BlogIndexPage {
  protected readonly posts = BLOG_POSTS;
  protected readonly format = formatPostDate;
}
