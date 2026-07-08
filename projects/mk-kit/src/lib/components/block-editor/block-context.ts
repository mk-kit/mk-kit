import { ElementRef, Injectable, signal } from '@angular/core';
import { MkLiveAnnouncer } from '../../core/a11y/live-announcer.service';
import type { MkBlockDefinition, MkBlockUploadHandler, MkEmbedProvider } from './block-registry';

/**
 * Shared, editor-scoped context threaded to every nested `mk-block-list` and
 * block-editor component. Provided by {@link MkBlockEditor}, so deeply nested
 * blocks (e.g. inside columns) read config and coordinate focus without every
 * level re-declaring inputs.
 */
@Injectable()
export class MkBlockEditorContext {
  /** Active block palette (defaults merged with app/editor definitions). */
  readonly definitions = signal<MkBlockDefinition[]>([]);
  /** Read-only mode: content visible, editing chrome hidden. */
  readonly readonly = signal(false);
  /** Disabled mode (form-level). */
  readonly disabled = signal(false);
  /** Placeholder for empty text blocks. */
  readonly placeholder = signal('Type / to choose a block, or start writing…');
  /** Effective upload handler (input beats token beats data-URL fallback). */
  readonly uploadHandler = signal<MkBlockUploadHandler | null>(null);
  /** Effective embed providers (defaults + token + input). */
  readonly embedProviders = signal<MkEmbedProvider[]>([]);

  /** Root editor host, used to locate editables for focus coordination. */
  hostRef: ElementRef<HTMLElement> | null = null;

  constructor(private readonly announcer: MkLiveAnnouncer) {}

  /** Returns the definition for a block type, if registered. */
  definitionFor(type: string): MkBlockDefinition | undefined {
    return this.definitions().find((d) => d.type === type);
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
