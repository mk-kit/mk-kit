/**
 * Minimal static server for the built docs app with SPA fallback.
 *
 * Serves dist/docs/browser; any path that does not resolve to a file returns
 * index.html so Angular's client-side router handles deep links
 * (e.g. /components/buttons). Zero dependencies on purpose — it runs inside
 * Playwright's `webServer` both locally and in CI.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../dist/docs/browser', import.meta.url)));
const PORT = Number(process.env['PORT'] ?? 4311);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  let filePath = resolve(join(ROOT, pathname));
  // Never escape the docs output directory.
  if (!filePath.startsWith(ROOT + sep) && filePath !== ROOT) {
    filePath = join(ROOT, 'index.html');
  }

  let body;
  let ext = extname(filePath);
  try {
    body = await readFile(filePath);
    if (!ext) throw new Error('directory');
  } catch {
    // SPA fallback: unknown routes get the app shell.
    filePath = join(ROOT, 'index.html');
    ext = '.html';
    try {
      body = await readFile(filePath);
    } catch {
      res.writeHead(500).end('dist/docs/browser not found — run `npm run build` first');
      return;
    }
  }

  res.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(body);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`docs served from ${ROOT} at http://127.0.0.1:${PORT}`);
});
