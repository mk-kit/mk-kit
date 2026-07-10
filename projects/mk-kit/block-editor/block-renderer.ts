import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import type { MkBlock, MkBlockDocument } from './block-model';
import { mkIsSafeUrl, sanitizeInlineHtml } from './block-serializer';

/**
 * Block renderer — read-only, themed display of a {@link MkBlockDocument} for
 * published content pages and blog posts. Reuses the same layout CSS as the
 * editor so authored columns look identical when published.
 *
 * SECURITY MODEL: rich-text HTML is passed through {@link sanitizeInlineHtml}
 * and then bound with `[innerHTML]`, so Angular's `DomSanitizer` sanitises it
 * again at render time (never bypassed for author HTML). The ONLY bypass is for
 * a stored embed's `embedUrl`, which came from an allow-listed provider.
 */
@Component({
  selector: 'mk-block-renderer',
  templateUrl: './block-renderer.html',
  styleUrl: './block-renderer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-block-renderer' },
})
export class MkBlockRenderer {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly safeSrcCache = new Map<string, SafeResourceUrl>();

  /** The document to render. */
  readonly value = input<MkBlockDocument | null>(null);
  /** Internal: a block subtree (used when recursing into columns). */
  readonly blocks = input<MkBlock[] | null>(null);

  protected readonly items = computed<MkBlock[]>(
    () => this.blocks() ?? this.value()?.blocks ?? [],
  );

  /** Sanitised rich-text HTML for `[innerHTML]` binding. */
  protected safeHtml(html: unknown): string {
    return sanitizeInlineHtml(String(html ?? ''));
  }

  protected listItems(block: MkBlock): string[] {
    const items = block.data['items'];
    return Array.isArray(items) ? items : [];
  }

  protected headingLevel(block: MkBlock): number {
    const l = block.data['level'];
    return [1, 2, 3, 4].includes(l) ? l : 2;
  }

  protected isImageSafe(block: MkBlock): boolean {
    const src = String(block.data['src'] ?? '');
    return !!src && mkIsSafeUrl(src);
  }

  protected buttonHref(block: MkBlock): string {
    const href = String(block.data['href'] ?? '');
    return mkIsSafeUrl(href) && href ? href : '#';
  }

  protected paddingTop(block: MkBlock): string {
    const ratio = Number(block.data['aspectRatio']) || 16 / 9;
    return `${100 / ratio}%`;
  }

  /** Trusts only a provider-transformed https embed URL — see class doc. */
  protected embedSrc(block: MkBlock): SafeResourceUrl | null {
    const src = String(block.data['embedUrl'] ?? '');
    if (!src || !/^https:\/\//i.test(src) || !mkIsSafeUrl(src)) return null;
    let trusted = this.safeSrcCache.get(src);
    if (!trusted) {
      trusted = this.sanitizer.bypassSecurityTrustResourceUrl(src);
      this.safeSrcCache.set(src, trusted);
    }
    return trusted;
  }

  protected fallbackUrl(block: MkBlock): string | null {
    const url = String(block.data['url'] ?? '');
    return mkIsSafeUrl(url) && url ? url : null;
  }

  protected gridColumns(block: MkBlock): string {
    const ratio = String(block.data['ratio'] ?? '');
    const parts = ratio.split('-').map((n) => parseFloat(n)).filter((n) => n > 0);
    if (parts.length >= 2) return parts.map((n) => `${n}fr`).join(' ');
    return `repeat(${block.children?.length ?? 2}, 1fr)`;
  }
  protected gridGap(block: MkBlock): string {
    const g = Math.max(0, Math.min(8, Number(block.data['gap']) || 4));
    return `var(--mk-space-${g})`;
  }
  protected justifyValue(block: MkBlock): string {
    const map: Record<string, string> = {
      start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between',
    };
    return map[String(block.data['justify'] ?? 'start')] ?? 'flex-start';
  }
}
