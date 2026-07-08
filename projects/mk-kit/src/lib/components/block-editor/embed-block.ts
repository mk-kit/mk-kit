import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import type { MkBlock } from './block-model';
import { MkBlockEditorContext } from './block-context';
import { mkIsSafeUrl } from './block-serializer';

/**
 * Embed block — paste a URL; matching allow-listed providers (YouTube, Vimeo,
 * plus any supplied via `embedProviders`) render a SANDBOXED iframe. The only
 * value passed to `DomSanitizer.bypassSecurityTrustResourceUrl` is the
 * provider-transformed embed URL (never the raw pasted string). Non-matching
 * URLs fall back to a safe link card — raw HTML is never injected.
 */
@Component({
  selector: 'mk-embed-block',
  templateUrl: './embed-block.html',
  styleUrl: './embed-block.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MkEmbedBlock {
  private readonly ctx = inject(MkBlockEditorContext);
  private readonly sanitizer = inject(DomSanitizer);

  readonly block = input.required<MkBlock>();
  readonly readonly = input(false);
  readonly blockChange = output<MkBlock>();

  protected readonly embedUrl = computed<string>(() => this.block().data['embedUrl'] ?? '');
  protected readonly url = computed<string>(() => this.block().data['url'] ?? '');
  protected readonly aspectRatio = computed(() => Number(this.block().data['aspectRatio']) || 16 / 9);
  protected readonly providerName = computed<string>(() => this.block().data['provider'] ?? '');
  protected readonly paddingTop = computed(() => `${100 / this.aspectRatio()}%`);

  /** Only ever wraps a provider-transformed URL — see the class doc. */
  protected readonly safeSrc = computed<SafeResourceUrl | null>(() => {
    const src = this.embedUrl();
    if (!src || !mkIsSafeUrl(src) || !/^https:\/\//i.test(src)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(src);
  });

  protected readonly hasFallback = computed(
    () => !this.embedUrl() && !!this.url() && mkIsSafeUrl(this.url()),
  );

  protected onUrl(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    this.resolve(raw);
  }

  private resolve(raw: string): void {
    const b = this.block();
    if (!raw) {
      this.blockChange.emit({ ...b, data: { ...b.data, url: '', embedUrl: '', provider: '' } });
      return;
    }
    for (const provider of this.ctx.embedProviders()) {
      if (provider.test.test(raw)) {
        const embedUrl = provider.toEmbedUrl(raw);
        if (embedUrl) {
          this.blockChange.emit({
            ...b,
            data: {
              ...b.data,
              url: raw,
              embedUrl,
              provider: provider.name,
              aspectRatio: provider.aspectRatio ?? 16 / 9,
            },
          });
          this.ctx.announce(`${provider.name} embed added`);
          return;
        }
      }
    }
    // No provider matched — keep the URL for the safe link-card fallback.
    this.blockChange.emit({ ...b, data: { ...b.data, url: raw, embedUrl: '', provider: '' } });
  }
}
