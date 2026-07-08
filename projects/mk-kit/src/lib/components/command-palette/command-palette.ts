import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkFocusTrap } from '../../core/a11y/focus-trap';
import { MkIcon } from '../icon/icon';

/** A single actionable entry in the {@link MkCommandPalette}. */
export interface MkCommand {
  /** Stable unique id. */
  id: string;
  /** Text shown (and the primary search target). */
  label: string;
  /** Optional section heading this command is grouped under. */
  group?: string;
  /** Secondary text shown after the label. */
  hint?: string;
  /** Name of a registered icon (see `MkIconRegistry`). */
  icon?: string;
  /** Extra search terms (not shown). */
  keywords?: string;
  /** Display-only shortcut hint, e.g. `⌘S`. */
  shortcut?: string;
  /** Disable the command (skipped by keyboard, not runnable). */
  disabled?: boolean;
  /** Invoked when the command is chosen. */
  run?: () => void;
}

interface Group {
  name: string;
  items: { cmd: MkCommand; index: number }[];
}

/**
 * CommandPalette — a modal ⌘K/Ctrl+K menu for fast, keyboard-first actions and
 * navigation. Supply a flat `commands` list (optionally grouped); the palette
 * filters as you type, groups results, and runs the chosen command. Implements
 * the ARIA combobox + listbox pattern with full keyboard support and focus
 * trapping.
 *
 * Mount it once near your app root and bind `open` (the built-in hotkey toggles
 * it, or open it yourself).
 *
 * ```html
 * <mk-command-palette [(open)]="paletteOpen" [commands]="commands"
 *   (commandSelected)="run($event)" />
 * ```
 */
@Component({
  selector: 'mk-command-palette',
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkIcon],
  host: {
    class: 'mk-command-palette',
    '[class.mk-command-palette--open]': 'open()',
    '[attr.inert]': "open() ? null : ''",
    '(document:keydown)': 'onGlobalKey($event)',
  },
})
export class MkCommandPalette {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Whether the palette is open (two-way). */
  readonly open = model(false);
  /** The commands to search and run. */
  readonly commands = input<readonly MkCommand[]>([]);
  /** Search field placeholder. */
  readonly placeholder = input('Type a command or search…');
  /** Message shown when nothing matches. */
  readonly emptyMessage = input('No results');
  /** Toggle open with ⌘K / Ctrl+K anywhere. */
  readonly hotkey = input(true, { transform: booleanAttribute });

  /** Emits the chosen command (its own `run` callback also fires). */
  readonly commandSelected = output<MkCommand>();

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  readonly listId = mkUniqueId('mk-cmdk-list');

  private focusTrap?: MkFocusTrap;
  private previouslyFocused: HTMLElement | null = null;

  /** Commands matching the current query (label + keywords + group). */
  protected readonly filtered = computed<readonly MkCommand[]>(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.commands();
    if (!q) return list;
    return list.filter((c) =>
      `${c.label} ${c.keywords ?? ''} ${c.group ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  });

  /** Filtered commands bucketed into ordered groups (flat index preserved). */
  protected readonly grouped = computed<Group[]>(() => {
    const groups: Group[] = [];
    this.filtered().forEach((cmd, index) => {
      const name = cmd.group ?? '';
      let g = groups.find((x) => x.name === name);
      if (!g) {
        g = { name, items: [] };
        groups.push(g);
      }
      g.items.push({ cmd, index });
    });
    return groups;
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (!this.isBrowser) return;
      queueMicrotask(() => this.sync(isOpen));
    });
  }

  protected optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  private sync(isOpen: boolean): void {
    const panel = this.panelRef()?.nativeElement;
    if (isOpen) {
      this.previouslyFocused = this.document.activeElement as HTMLElement | null;
      this.query.set('');
      this.activeIndex.set(this.firstEnabled());
      this.document.body.style.setProperty('overflow', 'hidden');
      if (panel) {
        this.focusTrap = new MkFocusTrap(panel);
        this.focusTrap.activate();
      }
      this.inputRef()?.nativeElement.focus();
    } else {
      this.focusTrap?.release();
      this.focusTrap = undefined;
      this.document.body.style.removeProperty('overflow');
      this.previouslyFocused?.focus?.();
    }
  }

  protected onGlobalKey(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.hotkey() && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.open.update((v) => !v);
    }
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(this.firstEnabled());
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        e.preventDefault();
        this.activeIndex.set(this.firstEnabled());
        break;
      case 'End':
        e.preventDefault();
        this.activeIndex.set(this.lastEnabled());
        break;
      case 'Enter':
        e.preventDefault();
        if (this.activeIndex() >= 0) this.select(this.activeIndex());
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  }

  protected select(index: number): void {
    const cmd = this.filtered()[index];
    if (!cmd || cmd.disabled) return;
    this.commandSelected.emit(cmd);
    cmd.run?.();
    this.close();
  }

  protected close(): void {
    this.open.set(false);
  }

  private move(delta: number): void {
    const list = this.filtered();
    if (!list.length) return;
    let i = this.activeIndex();
    for (let step = 0; step < list.length; step++) {
      i = (i + delta + list.length) % list.length;
      if (!list[i].disabled) {
        this.activeIndex.set(i);
        return;
      }
    }
  }

  private firstEnabled(): number {
    return this.filtered().findIndex((c) => !c.disabled);
  }

  private lastEnabled(): number {
    const list = this.filtered();
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].disabled) return i;
    }
    return -1;
  }
}
