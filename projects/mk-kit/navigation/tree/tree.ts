import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChildren,
} from '@angular/core';

/** A node in an {@link MkTree}. `children` makes it expandable. */
export interface MkTreeNode {
  /** Text shown for the node. */
  label: string;
  /** Value bound to the selection when the node is chosen (defaults to the node). */
  value?: unknown;
  /** Child nodes; a non-empty array makes the node a parent (expandable). */
  children?: MkTreeNode[];
  /** Disable selection/toggling of this node (still focusable). */
  disabled?: boolean;
  /** Expand this node initially. */
  expanded?: boolean;
  /** Optional leading glyph (any short string / emoji). */
  icon?: string;
}

/** One visible row after flattening the tree for keyboard + rendering. */
interface MkTreeRow {
  node: MkTreeNode;
  level: number;
  posinset: number;
  setsize: number;
  expandable: boolean;
  expanded: boolean;
}

/**
 * Tree — renders hierarchical data following the ARIA tree pattern
 * (`role="tree"` / `treeitem` with `aria-level`, `aria-expanded`,
 * `aria-selected`). Supply `nodes`; expansion is managed internally.
 *
 * Keyboard: Up/Down move between visible rows, Right expands (or steps into the
 * first child), Left collapses (or steps out to the parent), Home/End jump, and
 * Enter/Space toggles expansion and selects (when `selectable`). A single
 * roving tabindex keeps the whole tree one tab stop.
 *
 * ```html
 * <mk-tree selectable [nodes]="tree" [(selected)]="picked"
 *   (selectionChange)="onPick($event)" />
 * ```
 */
@Component({
  selector: 'mk-tree',
  templateUrl: './tree.html',
  styleUrl: './tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-tree',
  },
})
export class MkTree {
  /** The hierarchical data to render. */
  readonly nodes = input<readonly MkTreeNode[]>([]);
  /** Allow choosing a node (adds selection styling + `aria-selected`). */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Accessible name for the tree. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });
  /** Two-way selected value (a node's `value`, or the node itself if unset). */
  readonly selected = model<unknown>(null);

  /** Emits the selected value whenever the selection changes. */
  readonly selectionChange = output<unknown>();
  /** Emits a node whenever it is expanded or collapsed. */
  readonly nodeToggle = output<MkTreeNode>();

  protected readonly rowRefs =
    viewChildren<ElementRef<HTMLElement>>('row');

  /**
   * Expanded nodes. Survives `nodes` identity changes (a consumer rebuilding
   * the array keeps the user's expansion state for the node objects it
   * reuses); a node's `expanded` flag only seeds nodes NOT present in the
   * previous array — so it applies on first render and to newly added nodes,
   * without reverting branches the user has since collapsed.
   */
  private readonly expandedSet = linkedSignal<
    readonly MkTreeNode[],
    ReadonlySet<MkTreeNode>
  >({
    source: this.nodes,
    computation: (nodes, previous) => {
      const prevExpanded = previous?.value;
      // Lazily built set of nodes from the previous input — only needed when
      // a node carries `expanded: true` and we must decide whether it is new.
      let prevNodes: Set<MkTreeNode> | null = null;
      const isNewNode = (node: MkTreeNode): boolean => {
        if (!previous) return true;
        if (prevNodes === null) {
          prevNodes = new Set<MkTreeNode>();
          const collect = (list: readonly MkTreeNode[]): void => {
            for (const n of list) {
              prevNodes!.add(n);
              if (n.children?.length) collect(n.children);
            }
          };
          collect(previous.source);
        }
        return !prevNodes.has(node);
      };
      const next = new Set<MkTreeNode>();
      const walk = (list: readonly MkTreeNode[]): void => {
        for (const node of list) {
          if (node.children?.length) {
            if (prevExpanded?.has(node) || (node.expanded && isNewNode(node))) {
              next.add(node);
            }
            walk(node.children);
          }
        }
      };
      walk(nodes);
      return next;
    },
  });
  protected readonly activeIndex = signal(0);

  /** Flattened list of currently visible rows (respects expansion). */
  protected readonly rows = computed<MkTreeRow[]>(() => {
    const expanded = this.expandedSet();
    const out: MkTreeRow[] = [];
    const walk = (list: readonly MkTreeNode[], level: number): void => {
      list.forEach((node, i) => {
        const expandable = !!node.children?.length;
        const isExpanded = expandable && expanded.has(node);
        out.push({
          node,
          level,
          posinset: i + 1,
          setsize: list.length,
          expandable,
          expanded: isExpanded,
        });
        if (isExpanded) walk(node.children!, level + 1);
      });
    };
    walk(this.nodes(), 1);
    return out;
  });

  private valueOf(node: MkTreeNode): unknown {
    return node.value !== undefined ? node.value : node;
  }

  protected isSelected(node: MkTreeNode): boolean {
    return this.selectable() && this.selected() === this.valueOf(node);
  }

  protected isExpanded(node: MkTreeNode): boolean {
    return this.expandedSet().has(node);
  }

  protected toggle(node: MkTreeNode): void {
    if (node.disabled || !node.children?.length) return;
    const next = new Set(this.expandedSet());
    if (next.has(node)) next.delete(node);
    else next.add(node);
    this.expandedSet.set(next);
    this.nodeToggle.emit(node);
  }

  private expand(node: MkTreeNode): void {
    if (node.disabled || !node.children?.length || this.isExpanded(node)) return;
    const next = new Set(this.expandedSet());
    next.add(node);
    this.expandedSet.set(next);
    this.nodeToggle.emit(node);
  }

  private collapse(node: MkTreeNode): void {
    if (!this.isExpanded(node)) return;
    const next = new Set(this.expandedSet());
    next.delete(node);
    this.expandedSet.set(next);
    this.nodeToggle.emit(node);
  }

  protected select(node: MkTreeNode): void {
    if (!this.selectable() || node.disabled) return;
    const value = this.valueOf(node);
    this.selected.set(value);
    this.selectionChange.emit(value);
  }

  /**
   * Click on a parent row's chevron: toggle expansion WITHOUT selecting, so
   * mouse users can open a branch without committing it (hosts like
   * `mk-tree-select` close on any selection, which would make children
   * unreachable by mouse otherwise). On leaf rows the click falls through to
   * the row handler and behaves as a normal row click.
   */
  protected onToggleClick(event: Event, index: number): void {
    const row = this.rows()[index];
    if (!row?.expandable) return;
    event.stopPropagation();
    this.activeIndex.set(index);
    this.toggle(row.node);
  }

  /** Click a row: toggle expansion for parents, select when selectable. */
  protected onRowClick(index: number): void {
    const row = this.rows()[index];
    if (!row) return;
    this.activeIndex.set(index);
    if (row.expandable) this.toggle(row.node);
    this.select(row.node);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const rows = this.rows();
    const row = rows[index];
    if (!row) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusRow(Math.min(index + 1, rows.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusRow(Math.max(index - 1, 0));
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (row.expandable && !row.expanded) this.expand(row.node);
        else if (row.expanded) this.focusRow(index + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (row.expandable && row.expanded) this.collapse(row.node);
        else this.focusRow(this.parentIndex(index));
        break;
      case 'Home':
        event.preventDefault();
        this.focusRow(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusRow(rows.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (row.expandable) this.toggle(row.node);
        this.select(row.node);
        break;
    }
  }

  /** Index of the nearest preceding row one level up (or the row itself). */
  private parentIndex(index: number): number {
    const rows = this.rows();
    const level = rows[index]?.level ?? 1;
    for (let i = index - 1; i >= 0; i--) {
      if (rows[i].level < level) return i;
    }
    return index;
  }

  private focusRow(index: number): void {
    const rows = this.rows();
    if (index < 0 || index >= rows.length) return;
    this.activeIndex.set(index);
    this.rowRefs()[index]?.nativeElement.focus();
  }

  protected tabIndexFor(index: number): number {
    const active = Math.min(this.activeIndex(), this.rows().length - 1);
    return index === Math.max(active, 0) ? 0 : -1;
  }

  protected indent(level: number): string {
    return `calc(${level - 1} * var(--mk-space-5))`;
  }
}
