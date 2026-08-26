import { expect, test, type Page } from '@playwright/test';

/**
 * Visual-regression sweep over representative docs pages.
 *
 * Every route is captured full-page in light AND dark mode. Determinism:
 * - Theme is forced via the docs' own persistence: `mk-kit-theme` in
 *   localStorage (read by MkThemeService before first paint, which then sets
 *   `data-mk-theme` on <html>). Set in an init script so the very first
 *   frame is already themed — no toggle clicking, no flash.
 * - The clock is frozen with Playwright's clock API (setFixedTime), so pages
 *   that render `new Date()` — calendars, date pickers, chart axes — always
 *   show 2026-01-20. Timers still run normally, so Angular renders as usual.
 * - Animations/transitions are killed twice over: `reducedMotion: 'reduce'`
 *   (config) plus a hard CSS override injected before screenshotting.
 * - Screenshots wait for document.fonts.ready and two rAFs to settle layout.
 */

/** Fixed wall-clock for every page: Tuesday 2026-01-20, midday UTC. */
const FIXED_TIME = new Date('2026-01-20T12:00:00Z');

const THEME_STORAGE_KEY = 'mk-kit-theme'; // keep in sync with MkThemeService
const DENSITY_STORAGE_KEY = 'mk-kit-density';

/**
 * Curated representative routes (see projects/docs/src/app/app.routes.ts).
 * Note: there is no dedicated "touch" route in the docs — the signature pad
 * (the touch-input component page) stands in for that slot.
 */
const ROUTES: ReadonlyArray<{
  path: string;
  slug: string;
  /** CSS selector that must exist before capturing (async-loaded content). */
  waitFor?: string;
  /**
   * Capture the viewport only. The changelog renders the whole release
   * history through mk-markdown — its full-page height never stabilizes for
   * Playwright (content pops in after the async fetch) and a tens-of-
   *-thousands-of-pixels baseline would bloat the repo for no extra signal.
   */
  viewportOnly?: boolean;
}> = [
  { path: '/', slug: 'home' },
  { path: '/getting-started', slug: 'getting-started' },
  { path: '/components/buttons', slug: 'buttons' },
  { path: '/components/forms', slug: 'forms' },
  { path: '/components/table', slug: 'table' },
  { path: '/components/charts', slug: 'charts' },
  { path: '/components/date-time', slug: 'date-time' },
  { path: '/components/feedback', slug: 'feedback' },
  { path: '/components/navigation', slug: 'navigation' },
  { path: '/components/structure', slug: 'structure' },
  { path: '/components/layout', slug: 'layout' },
  { path: '/components/chat', slug: 'chat' },
  { path: '/components/query-builder', slug: 'query-builder' },
  { path: '/theming', slug: 'theming' },
  { path: '/components/rich-text', slug: 'rich-text' },
  { path: '/components/markdown', slug: 'markdown' },
  { path: '/touch', slug: 'touch' },
  { path: '/components/touch-keys', slug: 'touch-keys' },
  { path: '/components/kanban', slug: 'kanban' },
  { path: '/components-index', slug: 'components-index' },
  {
    path: '/changelog',
    slug: 'changelog',
    waitFor: '.mk-markdown h2',
    viewportOnly: true,
  },
  { path: '/components/signature', slug: 'signature' },
];

const FREEZE_CSS = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    caret-color: transparent !important;
  }
  /* Keep the scrollbar gutter permanently reserved. Full-page capture grows
   * the viewport, which would otherwise drop the scrollbar, widen the content
   * by ~15px and flip width-driven layouts (mk-table's stacked mode is
   * ResizeObserver-based) — making consecutive captures oscillate. */
  html { scroll-behavior: auto !important; overflow-y: scroll !important; }
`;

async function preparePage(page: Page, theme: 'light' | 'dark'): Promise<void> {
  // Fix Date.now()/new Date() before any app code runs (timers keep running).
  await page.clock.setFixedTime(FIXED_TIME);
  // Seed the theme the same way the docs persist it, before first paint.
  await page.addInitScript(
    ([key, value, densityKey]) => {
      localStorage.setItem(key, value);
      localStorage.setItem(densityKey, 'comfortable');
    },
    [THEME_STORAGE_KEY, theme, DENSITY_STORAGE_KEY] as const,
  );
}

async function settle(page: Page, viewportOnly = false): Promise<void> {
  await page.addStyleTag({ content: FREEZE_CSS });
  // Warm-up capture: rasterizing the full page for the first time makes
  // Chromium load lazy fallback fonts for below-the-fold glyphs, which
  // reflows text across the whole page ONCE (observed ~90px height change on
  // the table page). Take a throwaway full-page shot so the comparison only
  // ever sees the post-reflow, stable layout. Viewport-only routes (the
  // changelog) skip the full-page pass — their rendered height exceeds what
  // Chromium will rasterize in one texture and the capture never returns.
  await page.screenshot({ fullPage: !viewportOnly });
  await page.evaluate(async () => {
    // Below-the-fold images are `loading="lazy"`; the warm-up shot starts
    // them but the comparison shot can land before they decode (the creator
    // photo on the homepage). Force every image eager and wait for it.
    await Promise.all(
      Array.from(document.images).map(async (img) => {
        img.loading = 'eager';
        if (!img.complete) await new Promise((r) => { img.onload = img.onerror = () => r(null); });
        try { await img.decode(); } catch { /* broken image — still stable */ }
      }),
    );
    await document.fonts.ready;
    // Two frames so the reflow + any resize observers settle.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`docs pages — ${theme}`, () => {
    for (const { path, slug, waitFor, viewportOnly } of ROUTES) {
      test(`${slug} (${theme})`, async ({ page }) => {
        await preparePage(page, theme);
        // Third-party widgets (consent bar, contact forms) would make the
        // sweep network-dependent and non-deterministic — keep them out.
        await page.route(/azwidgets\.pl/, (route) => route.abort());
        await page.goto(path, { waitUntil: 'networkidle' });
        if (waitFor) await page.waitForSelector(waitFor);
        await settle(page, viewportOnly);
        await expect(page).toHaveScreenshot(`${slug}-${theme}.png`, {
          fullPage: !viewportOnly,
          // The header's version badge changes on every release; masking it
          // keeps a version bump from invalidating every baseline.
          mask: [page.locator('.docs-brand__ver')],
        });
      });
    }
  });
}
