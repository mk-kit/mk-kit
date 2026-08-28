import posts from './posts.json';

/** One blog entry. The body lives in `public/blog/<slug>.md` (fetched at runtime). */
export interface BlogPost {
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  summary: string;
  tags: string[];
}

/** All posts, newest first. `posts.json` is also read by `scripts/gen-blog.mjs`. */
export const BLOG_POSTS: readonly BlogPost[] = [...(posts as BlogPost[])].sort((a, b) =>
  b.date.localeCompare(a.date),
);

export function findPost(slug: string | null | undefined): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Human date without pulling in a locale bundle: "28 Aug 2026". */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}

/** ~200 words per minute, never below one minute. */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
