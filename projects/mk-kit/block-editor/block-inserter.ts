import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MK_I18N } from '@mkornas/ui/core';
import type { MkBlockDefinition } from './block-registry';

/** A group of definitions for the inserter list. */
interface DefGroup {
  name: string;
  items: MkBlockDefinition[];
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
    '(document:pointerdown)': 'onDocumentPointerdown($event)',
  },
})
export class MkBlockInserter {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('search');
  protected readonly i18n = inject(MK_I18N);

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

  /** Filtered list grouped by `group` for rendering. */
  protected readonly groups = computed<DefGroup[]>(() => {
    const map = new Map<string, MkBlockDefinition[]>();
    for (const def of this.filtered()) {
      const key = def.group ?? this.i18n.blockEditor.blocks;
      (map.get(key) ?? map.set(key, []).get(key)!).push(def);
    }
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  });

  protected optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  /** Global index of a definition within the flat filtered list. */
  protected indexOf(def: MkBlockDefinition): number {
    return this.filtered().indexOf(def);
  }

  protected toggle(): void {
    if (this.disabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel(): void {
    this.open.set(true);
    this.query.set('');
    this.activeIndex.set(0);
    setTimeout(() => this.searchRef()?.nativeElement.focus());
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
