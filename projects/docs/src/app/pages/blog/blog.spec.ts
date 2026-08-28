import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BLOG_POSTS, findPost, formatPostDate, readingMinutes } from './blog';
import { BlogIndexPage } from './blog-index-page';
import { BlogPostPage } from './blog-post-page';

describe('blog registry', () => {
  it('lists posts newest first with unique slugs', () => {
    expect(BLOG_POSTS.length).toBeGreaterThan(0);
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (let i = 1; i < BLOG_POSTS.length; i++) {
      expect(BLOG_POSTS[i - 1].date >= BLOG_POSTS[i].date).toBe(true);
    }
  });

  it('finds posts by slug and formats dates', () => {
    expect(findPost('switching-from-primeng')?.title).toContain('PrimeNG');
    expect(findPost('nope')).toBeUndefined();
    expect(formatPostDate('2026-08-28')).toBe('28 Aug 2026');
    expect(readingMinutes('one two three')).toBe(1);
    expect(readingMinutes(Array(650).fill('word').join(' '))).toBe(3);
  });
});

describe('BlogIndexPage', () => {
  it('renders one entry per post linking to its route', async () => {
    await TestBed.configureTestingModule({
      imports: [BlogIndexPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(BlogIndexPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll<HTMLAnchorElement>('.blog-item__title a');
    expect(links.length).toBe(BLOG_POSTS.length);
    expect(links[0].getAttribute('href')).toBe(`/blog/${BLOG_POSTS[0].slug}`);
  });
});

describe('BlogPostPage', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function mount(slug: string) {
    const paramMap = { get: (k: string) => (k === 'slug' ? slug : null) };
    await TestBed.configureTestingModule({
      imports: [BlogPostPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'blog', children: [] }]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(paramMap), snapshot: { paramMap } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BlogPostPage);
    await fixture.whenStable();
    return fixture;
  }

  it('fetches the markdown file for the slug and renders it', async () => {
    globalThis.fetch = (async () =>
      new Response('## Heading\n\nBody **bold**.', { status: 200 })) as typeof fetch;
    const fixture = await mount('switching-from-primeng');
    // The fetch resolves after afterNextRender; settle the microtasks.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('PrimeNG');
    expect(el.querySelector('mk-markdown h2')?.textContent).toBe('Heading');
    expect(document.title).toContain('PrimeNG');
    expect(document.title).toContain('mk-kit');
  });

  it('shows the error state when the file is missing', async () => {
    globalThis.fetch = (async () => new Response('', { status: 404 })) as typeof fetch;
    const fixture = await mount('switching-from-primeng');
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('mk-alert')).toBeTruthy();
  });
});
