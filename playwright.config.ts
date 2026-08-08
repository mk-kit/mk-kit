import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright visual-regression config for the mk-kit docs site.
 *
 * The webServer builds the docs app for PRODUCTION and serves the static
 * output (dist/docs/browser) with a tiny SPA-fallback server
 * (visual-tests/serve.mjs) — screenshots are taken against exactly what
 * would ship, not the dev server.
 *
 * Baselines are generated on Linux (same as CI). See visual-tests/README.md
 * for the OS caveat before regenerating them elsewhere.
 */

const PORT = 4311;

export default defineConfig({
  testDir: 'visual-tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,

  /* Drop the default platform suffix: baselines are Linux-only by policy
   * (generated on Linux, compared on Linux CI), so names stay exactly
   * `<route>-<theme>.png`. */
  snapshotPathTemplate:
    '{testDir}/{testFileName}-snapshots/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    /* Determinism: fixed timezone/locale so date rendering matches CI, and
     * reduced motion so the library's own media queries kill transitions. */
    timezoneId: 'UTC',
    locale: 'en-US',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {}, // single project; options inherited from `use` above
    },
  ],

  webServer: {
    /* The docs import `@mkornas/ui` from dist/mk-kit (tsconfig paths), so the
     * library must be built first — same order as verify.yml. Schematics are
     * not needed for rendering, so only theme + ng build mk-kit run here. */
    command:
      'npm run build:theme && ng build mk-kit && npm run build && node visual-tests/serve.mjs',
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 600_000,
  },
});
