#!/usr/bin/env node
/**
 * Renders scripts/og/og-cover.html to projects/docs/public/og.png (1200×630,
 * the standard Open Graph size — referenced from index.html's og:image).
 * Run after editing the template: `node scripts/og/render.mjs`
 */
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const root = resolve(new URL('../..', import.meta.url).pathname);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('file://' + root + '/scripts/og/og-cover.html');
await p.waitForTimeout(300);
await p.screenshot({ path: root + '/projects/docs/public/og.png' });
await b.close();
console.log('og: wrote projects/docs/public/og.png');
