import { ElementRef, Injectable, type Signal, computed, inject, signal } from '@angular/core';
import { MK_I18N, MkLiveAnnouncer } from '@mk-kit/ui/core';
import type { MkBlockDefinition, MkBlockUploadHandler, MkEmbedProvider } from './block-registry';

/**
 * Shared, editor-scoped context threaded to every nested `mk-block-list` and
 * block-editor component. Provided by {@link MkBlockEditor}, so deeply nested
 * blocks (e.g. inside columns) read config and coordinate focus without every
 * level re-declaring inputs.
 *
 * The config fields are plain `Signal` references that {@link MkBlockEditor}
 * connects to its input-derived signals in its constructor — i.e. BEFORE any
 * child component can inject this context — so consumers always track the live
 * source with no mirroring effects. The initial values here only serve
 * contexts created without an editor (e.g. component tests).
 */
@Injectable()
export class MkBlockEditorContext {
  private readonly i18n = inject(MK_I18N);

  /** Active block palette (defaults merged with app/editor definitions). */
  definitions: Signal<MkBlockDefinition[]> = signal<MkBlockDefinition[]>([]);
  /** Read-only mode: content visible, editing chrome hidden. */
  readonly: Signal<boolean> = signal(false);
  /** Disabled mode (form-level). */
  disabled: Signal<boolean> = signal(false);
  /** Placeholder for empty text blocks. */
  placeholder: Signal<string> = signal(this.i18n.blockEditor.emptyBlockPlaceholder);
  /** Effective upload handler (input beats token beats data-URL fallback). */
  uploadHandler: Signal<MkBlockUploadHandler | null> = signal<MkBlockUploadHandler | null>(null);
  /** Effective embed providers (defaults + token + input). */
  embedProviders: Signal<MkEmbedProvider[]> = signal<MkEmbedProvider[]>([]);

  /** Root editor host, used to locate editables for focus coordination. */
  hostRef: ElementRef<HTMLElement> | null = null;

  /**
   * `type → definition` lookup, rebuilt only when the registry array changes.
   * `definitionFor` is called several times per block per change-detection
   * pass, so an `array.find` scan here was O(blocks × definitions) per CD.
   */
  private readonly definitionMap = computed(() => {
    const map = new Map<string, MkBlockDefinition>();
    for (const def of this.definitions()) map.set(def.type, def);
    return map;
  });

  constructor(private readonly announcer: MkLiveAnnouncer) {}

  /** Returns the definition for a block type, if registered. */
  definitionFor(type: string): MkBlockDefinition | undefined {
    return this.definitionMap().get(type);
  }

  /** Human label for a block type (falls back to the raw type). */
  labelFor(type: string): string {
    return this.definitionFor(type)?.label ?? type;
  }

  /** Announce a status change to assistive tech. */
  announce(message: string): void {
    this.announcer.announce(message, 'polite');
  }

  /**
   * Move focus to a block's primary editable after the next render. Queries the
   * live DOM by `data-block-id` so it works regardless of nesting depth.
   */
  focusBlock(id: string, position: 'start' | 'end' = 'end'): void {
    const root = this.hostRef?.nativeElement;
    if (!root || typeof window === 'undefined') return;
    setTimeout(() => {
      const wrapper = root.querySelector<HTMLElement>(`[data-block-id="${cssEscape(id)}"]`);
      const editable = wrapper?.querySelector<HTMLElement>('[data-mk-editable]');
      const target = editable ?? wrapper?.querySelector<HTMLElement>('[data-mk-focus]');
      if (!target) return;
      target.focus();
      if (editable) placeCaret(editable, position);
    });
  }
}

/** Escapes an id for use in a CSS attribute selector. */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

/** Places the caret at the start or end of a contenteditable element. */
export function placeCaret(el: HTMLElement, position: 'start' | 'end'): void {
  const win = el.ownerDocument.defaultView;
  const selection = win?.getSelection();
  if (!selection) return;
  const range = el.ownerDocument.createRange();
  range.selectNodeContents(el);
  range.collapse(position === 'start');
  selection.removeAllRanges();
  selection.addRange(range);
}
