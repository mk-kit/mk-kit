import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { mkParseMarkdown, mkRenderMarkdown } from './markdown-parse';

/**
 * Markdown — renders a CommonMark subset (see {@link mkParseMarkdown} for the
 * exact syntax list) with zero runtime dependencies. Built for admin-app
 * content: changelogs, AI output, user notes.
 *
 * SECURITY MODEL: raw HTML in the source is never passed through — it is
 * always escaped and shown as text, and link/image URLs are restricted to
 * http/https/mailto/relative, so the rendered string contains only markup the
 * renderer itself generates. It is bound via `[innerHTML]` and additionally
 * passes through Angular's `DomSanitizer` (no `bypassSecurityTrustHtml`),
 * which keeps every element and attribute the renderer emits.
 *
 * ```html
 * <mk-markdown [source]="changelog" linkTarget="_blank" />
 * ```
 */
@Component({
  selector: 'mk-markdown',
  templateUrl: './markdown.html',
  styleUrl: './markdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Unencapsulated: the markup arrives via [innerHTML], which emulated
  // encapsulation attributes never reach. Every rule in markdown.scss is
  // namespaced under `.mk-markdown` so nothing leaks.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'mk-markdown' },
})
export class MkMarkdown {
  /** Markdown source text. */
  readonly source = input('');
  /** Turn bare `http(s)://…` URLs into links. Off by default. */
  readonly autolink = input(false, { transform: booleanAttribute });
  /** Link target; `'_blank'` also adds `rel="noopener noreferrer"`. */
  readonly linkTarget = input<'' | '_blank'>('');

  /** The rendered (safe-by-construction) HTML string. */
  protected readonly html = computed(() =>
    mkRenderMarkdown(mkParseMarkdown(this.source(), { autolink: this.autolink() }), {
      linkTarget: this.linkTarget(),
    }),
  );
}
