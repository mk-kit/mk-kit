import type { MkTranslateLoaderFactory, MkTranslationTree } from '@mk-kit/ui/translate';

const FS = 'node:fs/promises';
const PATH = 'node:path';
interface NodeFs {
  readFile(path: string, encoding: 'utf8'): Promise<string>;
}
interface NodePath {
  join(...parts: string[]): string;
}

/** Options for {@link mkFsTranslateLoader}. */
export interface MkFsTranslateLoaderOptions {
  /**
   * Directories searched in order for `<lang><suffix>`; the first readable
   * file wins. Typical: the built browser assets next to the server bundle,
   * then the source tree for `ng serve`.
   */
  dirs: string[];
  /** File suffix after the language code. Default `.json`. */
  suffix?: string;
  /**
   * When no directory has the file: return `{}` (default) so the app boots
   * with keys as text, or throw so the failure surfaces at once.
   */
  onNotFound?: 'empty' | 'throw';
}

/**
 * Server-side loader that reads the translation JSON from disk instead of
 * fetching the app's own HTTP endpoint during SSR — no self-request, no
 * proxy hop, no interceptor ordering to get right. Register it in the
 * server config only (`app.config.server.ts`); the browser keeps
 * `mkHttpTranslateLoader`. Files are parsed once per process.
 *
 * ```ts
 * // app.config.server.ts
 * provideMkTranslate({
 *   ...browserTranslateConfig,
 *   loader: mkFsTranslateLoader({
 *     dirs: [join(import.meta.dirname, '../browser/assets/i18n'), join(process.cwd(), 'src/assets/i18n')],
 *   }),
 * })
 * ```
 */
export function mkFsTranslateLoader(options: MkFsTranslateLoaderOptions): MkTranslateLoaderFactory {
  const { dirs, suffix = '.json', onNotFound = 'empty' } = options;
  const cache = new Map<string, MkTranslationTree>();
  return () => ({
    load: async (lang: string): Promise<MkTranslationTree> => {
      const cached = cache.get(lang);
      if (cached) return cached;
      // Dynamic imports through variables keep Node built-ins out of the
      // library's type-check and out of any browser bundle that happens to
      // see this entry; the server bundle resolves them natively.
      const [fs, path] = (await Promise.all([import(FS), import(PATH)])) as [NodeFs, NodePath];
      for (const dir of dirs) {
        try {
          const parsed = JSON.parse(await fs.readFile(path.join(dir, `${lang}${suffix}`), 'utf8')) as MkTranslationTree;
          cache.set(lang, parsed);
          return parsed;
        } catch {
          /* next directory */
        }
      }
      if (onNotFound === 'throw') {
        throw new Error(`[mk-translate] no "${lang}${suffix}" in: ${dirs.join(', ')}`);
      }
      return {};
    },
  });
}
