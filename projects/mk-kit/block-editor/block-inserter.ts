import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injectable,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import type { MkBlockDefinition } from './block-registry';

/** A definition annotated with its index in the flat filtered list. */
interface IndexedDef {
  def: MkBlockDefinition;
  /** Global index within `filtered()` — drives active-option highlighting. */
  index: number;
}

/** A group of definitions for the inserter list. */
interface DefGroup {
  name: string;
  items: IndexedDef[];
}

/**
 * Shares ONE capture-phase document `pointerdown` listener between every
 * mounted {@link MkBlockInserter} (a block list renders an inserter per block,
 * so per-instance listeners made document dispatch O(blocks)). The listener is
 * attached lazily with the first registration and detached when the last
 * callback unregisters. No-ops on the server (SSR).
 */
@Injectable({ providedIn: 'root' })
export class MkDocumentPointerdownRegistry {
  private readonly document = inject(DOCUMENT);
  private readonly callbacks = new Set<(event: Event) => void>();
  private readonly listener = (event: Event): void => {
    // Copy so a callback closing (and unregistering) mid-dispatch is safe.
    for (const callback of [...this.callbacks]) callback(event);
  };

  /** Registers a callback; returns an unregister function. */
  register(callback: (event: Event) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    if (this.callbacks.size === 0) {
      this.document.addEventListener('pointerdown', this.listener, true);
    }
    this.callbacks.add(callback);
    return () => {
      if (!this.callbacks.delete(callback)) return;
      if (this.callbacks.size === 0) {
        this.document.removeEventListener('pointerdown', this.listener, true);
      }
    };
  }
}

/**
 * Block inserter — a "＋ Add block" control that opens a filterable, keyboard
 * accessible palette of the configured blocks, grouped by `group`. Renders
 * either as a full button or a slim between-blocks divider trigger.
 *
 * Keyboard: type to filter, ArrowUp/Down to move, Enter to insert, Esc to
 * close. Implements the combobox → listbox pattern.
 */
@Component({
  selector: 'mk-block-inserter',
  templateUrl: './block-inserter.html',
  styleUrl: './block-inserter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-block-inserter',
    '[class.mk-block-inserter--slim]': "variant() === 'slim'",
  },
})
export class MkBlockInserter implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('search');
  protected readonly i18n = inject(MK_I18N);
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // One shared document listener for all inserters (instead of N host
    // `(document:pointerdown)` bindings — one per rendered inserter).
    const unregister = inject(MkDocumentPointerdownRegistry).register((event) =>
      this.onDocumentPointerdown(event),
    );
    inject(DestroyRef).onDestroy(unregister);
  }

  ngOnDestroy(): void {
    if (this.focusTimer !== null) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }
  }

  /** The blocks to offer. */
  readonly definitions = input<MkBlockDefinition[]>([]);
  /** Trigger presentation: `button` (default) or `slim` between-blocks rule. */
  readonly variant = input<'button' | 'slim'>('button');
  /** Trigger label. */
  readonly label = input<string>(this.i18n.blockEditor.addBlock);
  /** Disable the trigger. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** When true, only blocks allowed inside columns are shown. */
  readonly columnsOnly = input(false, { transform: booleanAttribute });

  /** Emitted with the chosen definition. */
  readonly pick = output<MkBlockDefinition>();

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly panelId = mkUniqueId('mk-inserter-panel');
  protected readonly listId = mkUniqueId('mk-inserter-list');

  protected readonly available = computed(() =>
    this.definitions().filter((d) => (this.columnsOnly() ? d.allowedInColumns !== false : true)),
  );

  /** Flat, filtered list in display order (used for keyboard navigation). */
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.available();
    return this.available().filter((d) => {
      const hay = [d.label, d.type, d.group ?? '', ...(d.keywords ?? [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  });

  /**
   * Filtered list grouped by `group` for rendering, with each option carrying
   * its flat index (single pass — the template previously resolved each
   * option's index with three `indexOf` scans, O(n²) per render).
   */
  protected readonly groups = computed<DefGroup[]>(() => {
    const map = new Map<string, IndexedDef[]>();
    this.filtered().forEach((def, index) => {
      const key = def.group ?? this.i18n.blockEditor.blocks;
      (map.get(key) ?? map.set(key, []).get(key)!).push({ def, index });
    });
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  });

  protected optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  protected toggle(): void {
    if (this.disabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel(): void {
    this.open.set(true);
    this.query.set('');
    this.activeIndex.set(0);
    if (this.focusTimer !== null) clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      this.focusTimer = null;
      this.searchRef()?.nativeElement.focus();
    });
  }

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const list = this.filtered();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) => (list.length ? (i + 1) % list.length : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((i) => (list.length ? (i - 1 + list.length) % list.length : 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (list[this.activeIndex()]) this.choose(list[this.activeIndex()]);
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  protected choose(def: MkBlockDefinition): void {
    this.pick.emit(def);
    this.close();
  }

  protected onDocumentPointerdown(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
