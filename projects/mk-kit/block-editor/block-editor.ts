import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  MK_BLOCK_DOCUMENT_VERSION,
  type MkBlock,
  type MkBlockDocument,
  mkEmptyDocument,
} from './block-model';
import {
  MK_BLOCK_DEFINITIONS,
  MK_BLOCK_EMBED_PROVIDERS,
  MK_BLOCK_UPLOAD_HANDLER,
  MK_DEFAULT_BLOCKS,
  MK_DEFAULT_EMBED_PROVIDERS,
  type MkBlockDefinition,
  type MkBlockUploadHandler,
  type MkEmbedProvider,
  mkMergeBlockDefinitions,
} from './block-registry';
import { MkBlockEditorContext } from './block-context';
import { MkBlockList } from './block-list';
import { mkBlocksToHtml } from './block-serializer';
import { mkHtmlToBlocks } from './block-parser';

/** How the form/CVA value is exchanged: a document object or an HTML string. */
export type MkBlockValueFormat = 'document' | 'html';

/**
 * Block editor — a configurable, Gutenberg-style block content editor. Renders
 * an ordered document of blocks (paragraph, heading, image, columns, embed,
 * list, quote, button, divider, code) with a filterable inserter, per-block
 * chrome (move/duplicate/transform/delete) and inline rich-text formatting.
 *
 * The palette is fully customisable: pass definitions via the `blocks` input or
 * the {@link MK_BLOCK_DEFINITIONS} token (mirrors `registerBlockType`). Both are
 * merged over {@link MK_DEFAULT_BLOCKS}.
 *
 * Implements `ControlValueAccessor` AND a two-way `value` model, so it works
 * with `[(ngModel)]`, reactive forms and `[(value)]`.
 *
 * ```html
 * <mk-block-editor [(value)]="doc" [uploadHandler]="upload" />
 * ```
 */
@Component({
  selector: 'mk-block-editor',
  imports: [MkBlockList],
  templateUrl: './block-editor.html',
  styleUrl: './block-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-block-editor',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.mk-block-editor--readonly]': 'readonly()',
    '[class.mk-block-editor--disabled]': 'disabled() || cvaDisabled()',
  },
  providers: [
    MkBlockEditorContext,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkBlockEditor),
      multi: true,
    },
  ],
})
export class MkBlockEditor implements ControlValueAccessor {
  private readonly ctx = inject(MkBlockEditorContext);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tokenDefinitions = inject(MK_BLOCK_DEFINITIONS, { optional: true });
  private readonly tokenUpload = inject(MK_BLOCK_UPLOAD_HANDLER, { optional: true });
  private readonly tokenEmbeds = inject(MK_BLOCK_EMBED_PROVIDERS, { optional: true });

  /** Two-way document value (always an `MkBlockDocument`, regardless of format). */
  readonly value = model<MkBlockDocument>(mkEmptyDocument());
  /**
   * Form/CVA exchange format. `document` (default) reads/writes an
   * `MkBlockDocument`; `html` reads/writes an **HTML string** — so the editor
   * can back a string-typed richtext field (`[(ngModel)]="htmlString"`). The
   * two-way `value` model stays an `MkBlockDocument` either way.
   */
  readonly valueFormat = input<MkBlockValueFormat>('document');
  /** Custom / extended block definitions (merged over the defaults + token). */
  readonly blocks = input<MkBlockDefinition[] | null>(null);
  /** Placeholder for empty text blocks. */
  readonly placeholder = input<string>('Type / to choose a block, or start writing…');
  /** Accessible label for the editor region. */
  readonly ariaLabel = input<string>('Block content editor');
  /** Read-only: renders content without editing chrome. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Disabled (form-level). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Async upload handler (overrides the {@link MK_BLOCK_UPLOAD_HANDLER} token). */
  readonly uploadHandler = input<MkBlockUploadHandler | null>(null);
  /** Extra embed providers (merged with defaults + token). */
  readonly embedProviders = input<MkEmbedProvider[] | null>(null);

  /** Fires on any document change (in addition to the `value` model). */
  readonly change = output<MkBlockDocument>();
  /** Fires the serialised HTML on any change — convenient in `html` mode. */
  readonly htmlChange = output<string>();

  protected readonly cvaDisabled = signal(false);

  private onChange: (value: MkBlockDocument | string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Effective, merged block definitions. */
  private readonly definitions = computed<MkBlockDefinition[]>(() =>
    mkMergeBlockDefinitions(
      MK_DEFAULT_BLOCKS,
      ...(this.tokenDefinitions ?? []),
      this.blocks(),
    ),
  );

  protected readonly topBlocks = computed<MkBlock[]>(() => this.value()?.blocks ?? []);

  constructor() {
    this.ctx.hostRef = this.hostRef;

    // Keep the shared context in sync with inputs/tokens.
    effect(() => this.ctx.definitions.set(this.definitions()));
    effect(() => this.ctx.readonly.set(this.readonly()));
    effect(() => this.ctx.disabled.set(this.disabled() || this.cvaDisabled()));
    effect(() => this.ctx.placeholder.set(this.placeholder()));
    effect(() =>
      this.ctx.uploadHandler.set(this.uploadHandler() ?? this.tokenUpload ?? null),
    );
    effect(() =>
      this.ctx.embedProviders.set([
        ...MK_DEFAULT_EMBED_PROVIDERS,
        ...(this.tokenEmbeds?.flat() ?? []),
        ...(this.embedProviders() ?? []),
      ]),
    );
  }

  protected onBlocksChange(blocks: MkBlock[]): void {
    const next: MkBlockDocument = {
      version: this.value()?.version ?? MK_BLOCK_DOCUMENT_VERSION,
      blocks,
    };
    this.value.set(next);
    const html = mkBlocksToHtml(next);
    this.onChange(this.valueFormat() === 'html' ? html : next);
    this.onTouched();
    this.change.emit(next);
    this.htmlChange.emit(html);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: MkBlockDocument | string | null): void {
    if (this.valueFormat() === 'html') {
      this.value.set(
        typeof value === 'string'
          ? mkHtmlToBlocks(value)
          : ((value as MkBlockDocument | null) ?? mkEmptyDocument()),
      );
    } else {
      this.value.set((value as MkBlockDocument | null) ?? mkEmptyDocument());
    }
  }
  registerOnChange(fn: (value: MkBlockDocument | string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
