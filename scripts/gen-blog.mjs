#!/usr/bin/env node
/**
 * Post-build step for the docs site (runs after `ng build docs`):
 *
 * 1. `sitemap.xml` — every static route in `app.routes.ts` plus one entry per
 *    blog post (robots.txt already points at it).
 * 2. `blog/feed.xml` — RSS 2.0 of the posts.
 * 3. `blog/<slug>.html` — a copy of the built `index.html` with the title,
 *    description, Open Graph and canonical tags swapped for the post. The site
 *    is a SPA with no prerender; Cloudflare Pages serves `/blog/<slug>` from
 *    that file when it exists (before the SPA fallback), so crawlers and link
 *    previews that do not run JavaScript still see the right metadata. The
 *    app then boots normally and renders the post.
 *
 * Reads `projects/docs/src/app/pages/blog/posts.json` (the same registry the
 * app imports) and the post bodies from `projects/docs/public/blog/*.md`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = join(root, 'dist/docs/browser');
const SITE = 'https://mk-kit.dev';

if (!existsSync(join(dist, 'index.html'))) {
  console.error(`gen-blog: ${dist}/index.html not found — run \`ng build docs\` first.`);
  process.exit(1);
}

const posts = JSON.parse(readFileSync(join(root, 'projects/docs/src/app/pages/blog/posts.json'), 'utf8'))
  .sort((a, b) => b.date.localeCompare(a.date));

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- 1. sitemap ------------------------------------------------------------
const routesSrc = readFileSync(join(root, 'projects/docs/src/app/app.routes.ts'), 'utf8');
const staticPaths = [...routesSrc.matchAll(/path:\s*'([^']*)'/g)]
  .map((m) => m[1])
  .filter((p) => p !== '**' && !p.includes(':') && !p.startsWith('pro/'))
  .map((p) => `/${p}`.replace(/\/+/g, '/'));
const urls = [...new Set([...staticPaths, ...posts.map((p) => `/blog/${p.slug}`)])];
const today = posts[0]?.date ?? new Date().toISOString().slice(0, 10);
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map((u) => {
      const post = posts.find((p) => `/blog/${p.slug}` === u);
      const lastmod = post ? post.date : today;
      const priority = u === '/' ? '1.0' : post ? '0.8' : '0.6';
      return `  <url><loc>${SITE}${u}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
    })
    .join('\n') +
  `\n</urlset>\n`;
writeFileSync(join(dist, 'sitemap.xml'), sitemap);

// ---- 2. RSS feed -----------------------------------------------------------
const rfc822 = (iso) => new Date(`${iso}T09:00:00Z`).toUTCString();
const feed =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n` +
  `  <title>mk-kit blog</title>\n  <link>${SITE}/blog</link>\n` +
  `  <description>Migration guides, licensing notes and release write-ups for the mk-kit Angular component library.</description>\n` +
  `  <language>en</language>\n  <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>\n` +
  posts
    .map(
      (p) =>
        `  <item>\n    <title>${esc(p.title)}</title>\n    <link>${SITE}/blog/${p.slug}</link>\n` +
        `    <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>\n    <pubDate>${rfc822(p.date)}</pubDate>\n` +
        `    <description>${esc(p.summary)}</description>\n` +
        p.tags.map((t) => `    <category>${esc(t)}</category>`).join('\n') +
        `\n  </item>`,
    )
    .join('\n') +
  `\n</channel>\n</rss>\n`;
mkdirSync(join(dist, 'blog'), { recursive: true });
writeFileSync(join(dist, 'blog/feed.xml'), feed);

// ---- 3. per-post HTML with swapped head tags --------------------------------
const index = readFileSync(join(dist, 'index.html'), 'utf8');
const setMeta = (html, attr, name, value) =>
  html.replace(
    new RegExp(`(<meta\\s+${attr}="${name}"\\s+content=")[^"]*(")`, 's'),
    (_m, a, b) => `${a}${esc(value)}${b}`,
  );
const setMetaMultiline = (html, attr, name, value) =>
  html.replace(
    new RegExp(`(<meta\\s+${attr}="${name}"\\s+content=")[^"]*(")|(<meta\\s+${attr}="${name}"\\s+content=\\n?\\s*")[^"]*(")`, 's'),
    (_m, a, b, c, d) => (a ? `${a}${esc(value)}${b}` : `${c}${esc(value)}${d}`),
  );
for (const p of posts) {
  const title = `${p.title} — mk-kit blog`;
  const url = `${SITE}/blog/${p.slug}`;
  let html = index.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = setMetaMultiline(html, 'name', 'description', p.summary);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMetaMultiline(html, 'property', 'og:description', p.summary);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:type', 'article');
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`);
  writeFileSync(join(dist, `blog/${p.slug}.html`), html);
}

console.log(`gen-blog: sitemap (${urls.length} urls), feed and ${posts.length} post pages written to ${dist}`);
