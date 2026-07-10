import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { MkCopyToClipboard } from '@mkornas/ui/directives';
import { mkHighlight } from '@mkornas/ui/forms';
import type { MkCodeLanguage } from '@mkornas/ui/forms';

/**
 * Code — a read-only, themed code block with syntax highlighting, an optional
 * filename header, line numbers and a copy button. Highlighting reuses the same
 * dependency-free tokenizer as {@link MkCodeEditor}. For an editable field use
 * `mk-code-editor` instead.
 *
 * ```html
 * <mk-code language="json" filename="config.json" [code]="json" />
 * ```
 */
@Component({
  selector: 'mk-code',
  templateUrl: './code.html',
  styleUrl: './code.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkCopyToClipboard],
  host: {
    class: 'mk-code',
    '[class.mk-code--wrap]': 'wrap()',
  },
})
export class MkCode {
  /** The source to display. */
  readonly code = input('');
  /** Language for highlighting. */
  readonly language = input<MkCodeLanguage>('plaintext');
  /** Optional filename shown in a header bar. */
  readonly filename = input<string>('');
  /** Show a line-number gutter. */
  readonly lineNumbers = input(false, { transform: booleanAttribute });
  /** Show the copy button. */
  readonly copyable = input(true, { transform: booleanAttribute });
  /** Soft-wrap long lines instead of scrolling horizontally. */
  readonly wrap = input(false, { transform: booleanAttribute });

  protected readonly highlighted = computed(() =>
    mkHighlight(this.code(), this.language()),
  );

  protected readonly lines = computed(() => {
    const count = this.code() ? this.code().split('\n').length : 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  /** Whether to render the header bar (filename and/or copy button). */
  protected readonly hasHeader = computed(
    () => !!this.filename() || this.copyable(),
  );
}
