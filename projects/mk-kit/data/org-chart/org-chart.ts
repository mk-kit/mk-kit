import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  Directive,
  ElementRef,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkAvatar } from '../avatar/avatar';

/** A node in an {@link MkOrgChart} tree. `children` makes it a parent. */
export interface MkOrgChartNode<T = unknown> {
  /** Unique id — drives selection (`[(selected)]`) and expansion (`[(expanded)]`). */
  id: string;
  /** Primary text of the default card (and the initials fallback). */
  label?: string;
  /**
   * Arbitrary payload handed to the node template. The default card reads
   * `data.title` (sub-label) and `data.avatar` (image URL) when present.
   */
  data?: T;
  /** Direct reports; a non-empty array makes the node collapsible. */
  children?: MkOrgChartNode<T>[];
  /** Initial expansion (default `true`). Only consulted when `[(expanded)]` is not bound. */
  expanded?: boolean;
}

/** One row of a flat list accepted by {@link mkOrgChartFromFlat}. */
export interface MkOrgChartFlatNode<T = unknown> {
  id: string;
  label?: string;
  data?: T;
  /** Id of the parent row; `null` / `undefined` / unknown id = root. */
  parentId?: string | null;
  expanded?: boolean;
}

/**
 * Build the nested `nodes` input from a flat `parentId` list (the shape most
 * HR / directory APIs return). Row order is preserved among siblings; rows
 * whose `parentId` does not match any row become roots.
 *
 * ```ts
 * const nodes = mkOrgChartFromFlat([
 *   { id: 'ceo', label: 'Ada' },
 *   { id: 'cto', label: 'Grace', parentId: 'ceo' },
 * ]);
 * ```
 */
export function mkOrgChartFromFlat<T = unknown>(
  list: readonly MkOrgChartFlatNode<T>[],
): MkOrgChartNode<T>[] {
  const byId = new Map<string, MkOrgChartNode<T>>();
  for (const row of list) {
    const node: MkOrgChartNode<T> = { id: row.id };
    if (row.label !== undefined) node.label = row.label;
    if (row.data !== undefined) node.data = row.data;
    if (row.expanded !== undefined) node.expanded = row.expanded;
    byId.set(row.id, node);
  }
  const roots: MkOrgChartNode<T>[] = [];
  for (const row of list) {
    const node = byId.get(row.id)!;
    const parent = row.parentId != null ? byId.get(row.parentId) : undefined;
    if (parent && parent !== node) (parent.children ??= []).push(node);
    else roots.push(node);
  }
  return roots;
}

/**
 * `data` type seen by a node template: `T` when it could be inferred (the
 * template binds `[mkOrgChartNodeDef]="nodes"`), otherwise `any` so an
 * untyped `<ng-template mkOrgChartNodeDef>` can still read `node.data?.title`.
 */
export type MkOrgChartTemplateData<T> = keyof T extends never ? any : T;

/** Template context of `ng-template[mkOrgChartNodeDef]`. */
export interface MkOrgChartNodeContext<T = unknown> {
  /** The node (also available as `let-node`). */
  $implicit: MkOrgChartNode<MkOrgChartTemplateData<T>>;
  node: MkOrgChartNode<MkOrgChartTemplateData<T>>;
  /** 1-based depth (roots are 1). */
  depth: number;
  /** Whether the node's children are currently shown. */
  expanded: boolean;
  /** Whether the node is the selected one. */
  selected: boolean;
}

/**
 * Custom node card for `mk-org-chart`:
 *
 * ```html
 * <mk-org-chart [nodes]="nodes">
 *   <ng-template mkOrgChartNodeDef let-node let-selected="selected">
 *     <strong>{{ node.label }}</strong> — {{ node.data?.title }}
 *   </ng-template>
 * </mk-org-chart>
 * ```
 *
 * Bind the same array you pass to `nodes` to get a typed `node.data` in the
 * template: `<ng-template [mkOrgChartNodeDef]="nodes" let-node>`.
 */
@Directive({ selector: 'ng-template[mkOrgChartNodeDef]' })
export class MkOrgChartNodeDef<T = unknown> {
  /**
   * Type-inference hook only (the value is not used at runtime): bind the
   * `nodes` array so `let-node` is typed as `MkOrgChartNode<T>`.
   */
  readonly mkOrgChartNodeDef = input<readonly MkOrgChartNode<T>[] | '' | undefined>(undefined);
  readonly template = inject(TemplateRef<MkOrgChartNodeContext<T>>);
  static ngTemplateContextGuard<T>(
    _dir: MkOrgChartNodeDef<T>,
    ctx: unknown,
  ): ctx is MkOrgChartNodeContext<T> {
    return true;
  }
}

/** Chart direction: `top` = root at the top, `left` = root at the inline start. */
export type MkOrgChartOrientation = 'top' | 'left';

/** Payload of `(nodeToggle)`. */
export interface MkOrgChartToggleEvent<T = unknown> {
  node: MkOrgChartNode<T>;
  expanded: boolean;
}

/** One visible node after flattening (pre-order, i.e. DOM order). */
interface MkOrgChartRow {
  node: MkOrgChartNode;
  depth: number;
  parentId: string | null;
  /** Ids of the sibling set this row belongs to (in order). */
  siblings: readonly string[];
  hasChildren: boolean;
  expanded: boolean;
}

/**
 * Organisation chart — a reporting-line hierarchy drawn with plain nested
 * lists and CSS connectors (no canvas, prints and themes like everything
 * else). Feed it a tree (`nodes`) or convert a flat `parentId` list with
 * {@link mkOrgChartFromFlat}. Nodes render as a default card (avatar /
 * initials, label, `data.title`) or through an `mkOrgChartNodeDef` template.
 *
 * Follows the ARIA tree pattern (`role="tree"` / `treeitem` / `group`, one
 * roving tab stop). Keyboard (top-down; the axes swap for `orientation="left"`
 * and in RTL): Down = first child (expands a collapsed node first), Up =
 * parent, Left/Right = previous/next sibling, Home/End = first/last visible
 * node, Enter/Space = select (or toggle when not selectable), `*` = expand
 * all siblings, `+`/`-` = expand/collapse.
 *
 * ```html
 * <mk-org-chart
 *   [nodes]="company"
 *   selectable
 *   [(selected)]="personId"
 *   collapsible
 *   (nodeClick)="open($event)"
 * />
 * ```
 */
@Component({
  selector: 'mk-org-chart',
  templateUrl: './org-chart.html',
  styleUrl: './org-chart.scss',
  exportAs: 'mkOrgChart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, MkAvatar],
  host: {
    class: 'mk-org-chart',
    '[class.mk-org-chart--top]': "orientation() === 'top'",
    '[class.mk-org-chart--left]': "orientation() === 'left'",
    '[class.mk-org-chart--selectable]': 'selectable()',
    '[class.mk-org-chart--collapsible]': 'collapsible()',
  },
})
export class MkOrgChart<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** The hierarchy to render (roots first). */
  readonly nodes = input<readonly MkOrgChartNode<T>[]>([]);
  /** Root at the top (children below) or at the inline start (children to the side). */
  readonly orientation = input<MkOrgChartOrientation>('top');
  /** Allow choosing a node (adds selection styling + `aria-selected`). */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Show a toggle on every parent so branches can be hidden. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Scale factor applied to the whole chart (clamped to 0.5–2). */
  readonly zoom = input(1, { transform: numberAttribute });
  /** Accessible name for the tree. */
  readonly ariaLabel = input<string>(this.i18n.orgChartLabel, { alias: 'aria-label' });

  /** Two-way selected node id (`null` = nothing selected). */
  readonly selected = model<string | null>(null);
  /**
   * Two-way ids of the expanded parents. Leave unbound to let the chart
   * manage expansion itself (seeded from each node's `expanded` flag).
   */
  readonly expanded = model<readonly string[] | undefined>(undefined);

  /** Emits the node whose card was clicked or activated with Enter/Space. */
  readonly nodeClick = output<MkOrgChartNode<T>>();
  /** Emits whenever a node is expanded or collapsed. */
  readonly nodeToggle = output<MkOrgChartToggleEvent<T>>();

  protected readonly nodeDef = contentChild(MkOrgChartNodeDef<T>);

  protected readonly zoomLevel = computed(() => {
    const z = this.zoom();
    return Number.isFinite(z) ? Math.min(2, Math.max(0.5, z)) : 1;
  });

  /**
   * Expanded parent ids. Controlled by `expanded` when bound; otherwise kept
   * locally — a node's `expanded` flag only seeds ids not present in the
   * previous `nodes` value, so re-emitting the array never reverts branches
   * the user has since toggled.
   */
  private readonly expandedIds = linkedSignal<
    { nodes: readonly MkOrgChartNode<T>[]; expanded: readonly string[] | undefined },
    ReadonlySet<string>
  >({
    source: () => ({ nodes: this.nodes(), expanded: this.expanded() }),
    computation: ({ nodes, expanded }, previous) => {
      if (expanded) return new Set(expanded);
      const prev = previous?.value;
      const known = previous ? collectIds(previous.source.nodes) : null;
      const next = new Set<string>();
      walk(nodes, (node) => {
        if (!node.children?.length) return;
        const isKnown = known?.has(node.id) ?? false;
        if (isKnown ? prev!.has(node.id) : node.expanded !== false) next.add(node.id);
      });
      return next;
    },
  });

  /** Id of the node holding the roving tab stop. */
  private readonly activeId = signal<string | null>(null);

  /** Visible nodes in DOM (pre-order) order. */
  protected readonly rows = computed<MkOrgChartRow[]>(() => {
    const collapsible = this.collapsible();
    const expandedIds = this.expandedIds();
    const out: MkOrgChartRow[] = [];
    const visit = (list: readonly MkOrgChartNode[], depth: number, parentId: string | null) => {
      const siblings = list.map((n) => n.id);
      for (const node of list) {
        const hasChildren = !!node.children?.length;
        const expanded = hasChildren && (!collapsible || expandedIds.has(node.id));
        out.push({ node, depth, parentId, siblings, hasChildren, expanded });
        if (expanded) visit(node.children!, depth + 1, node.id);
      }
    };
    visit(this.nodes(), 1, null);
    return out;
  });

  private readonly rowById = computed(() => new Map(this.rows().map((r) => [r.node.id, r])));

  /** The single id with `tabindex="0"` (falls back to the first visible node). */
  private readonly tabStopId = computed(() => {
    const active = this.activeId();
    if (active !== null && this.rowById().has(active)) return active;
    return this.rows()[0]?.node.id ?? null;
  });

  // ---- template helpers --------------------------------------------------

  protected isExpanded(node: MkOrgChartNode<T>): boolean {
    if (!node.children?.length) return false;
    return !this.collapsible() || this.expandedIds().has(node.id);
  }

  protected isSelected(node: MkOrgChartNode<T>): boolean {
    return this.selectable() && this.selected() === node.id;
  }

  protected tabIndexFor(node: MkOrgChartNode<T>): number {
    return this.tabStopId() === node.id ? 0 : -1;
  }

  protected toggleLabel(node: MkOrgChartNode<T>): string {
    const tpl = this.isExpanded(node) ? this.i18n.orgChartCollapse : this.i18n.orgChartExpand;
    return tpl.replace('{label}', node.label ?? node.id);
  }

  protected context(
    node: MkOrgChartNode<T>,
    depth: number,
  ): MkOrgChartNodeContext<T> {
    return {
      $implicit: node,
      node,
      depth,
      expanded: this.isExpanded(node),
      selected: this.isSelected(node),
    };
  }

  /** `data.title` / `data.avatar` of the default card, read defensively. */
  protected field(node: MkOrgChartNode<T>, key: 'title' | 'avatar'): string | undefined {
    const data = node.data as Record<string, unknown> | undefined;
    const value = data?.[key];
    return typeof value === 'string' && value ? value : undefined;
  }

  // ---- state changes -----------------------------------------------------

  /** Expand or collapse a parent (no-op for leaves / non-collapsible charts). */
  toggle(node: MkOrgChartNode<T>): void {
    this.setExpanded(node, !this.isExpanded(node));
  }

  /** Expand or collapse a parent explicitly. */
  setExpanded(node: MkOrgChartNode<T>, expanded: boolean): void {
    if (!this.collapsible() || !node.children?.length) return;
    if (this.expandedIds().has(node.id) === expanded) return;
    const next = new Set(this.expandedIds());
    if (expanded) next.add(node.id);
    else next.delete(node.id);
    this.expandedIds.set(next);
    this.expanded.set([...next]);
    this.nodeToggle.emit({ node, expanded });
  }

  /** Select a node by reference (no-op unless `selectable`). */
  select(node: MkOrgChartNode<T>): void {
    if (!this.selectable()) return;
    this.selected.set(node.id);
  }

  private activate(node: MkOrgChartNode<T>): void {
    this.activeId.set(node.id);
    if (this.selectable()) this.select(node);
    this.nodeClick.emit(node);
  }

  protected onCardClick(event: Event, node: MkOrgChartNode<T>): void {
    event.stopPropagation();
    this.activate(node);
  }

  protected onToggleClick(event: Event, node: MkOrgChartNode<T>): void {
    event.stopPropagation();
    this.activeId.set(node.id);
    this.toggle(node);
    this.focusItem(node.id);
  }

  /** Keeps the roving tab stop on whichever item last received focus. */
  protected onFocusIn(event: Event): void {
    const id = this.itemIdOf(event.target);
    if (id !== null) this.activeId.set(id);
  }

  protected onKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    const id = this.itemIdOf(event.target);
    if (id === null) return;
    const row = this.rowById().get(id);
    if (!row) return;
    const node = row.node as MkOrgChartNode<T>;

    const intent = this.intentOf(event.key);
    switch (intent) {
      case 'into':
        event.preventDefault();
        if (row.hasChildren && !row.expanded) {
          this.setExpanded(node, true);
        } else if (row.expanded) {
          this.focusItem(node.children![0].id);
        }
        return;
      case 'parent':
        event.preventDefault();
        if (row.parentId !== null) this.focusItem(row.parentId);
        return;
      case 'next':
      case 'prev': {
        event.preventDefault();
        const i = row.siblings.indexOf(id);
        const target = row.siblings[intent === 'next' ? i + 1 : i - 1];
        if (target !== undefined) this.focusItem(target);
        return;
      }
    }

    switch (event.key) {
      case 'Home':
        event.preventDefault();
        this.focusItem(this.rows()[0]?.node.id ?? null);
        break;
      case 'End': {
        event.preventDefault();
        const rows = this.rows();
        this.focusItem(rows[rows.length - 1]?.node.id ?? null);
        break;
      }
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.selectable() && row.hasChildren && this.collapsible()) {
          this.toggle(node);
        }
        this.activate(node);
        break;
      case '*': {
        event.preventDefault();
        const nodes = this.siblingsOf(row);
        for (const sibling of nodes) this.setExpanded(sibling, true);
        break;
      }
      case '+':
      case '=':
        event.preventDefault();
        this.setExpanded(node, true);
        break;
      case '-':
        event.preventDefault();
        this.setExpanded(node, false);
        break;
    }
  }

  /**
   * Map an arrow key to a tree direction. Top-down: Down = into, Up = parent,
   * Left/Right = siblings (mirrored in RTL). Left-to-right: Right = into,
   * Left = parent (mirrored in RTL), Up/Down = siblings.
   */
  private intentOf(key: string): 'into' | 'parent' | 'next' | 'prev' | null {
    const rtl = this.isRtl();
    if (this.orientation() === 'left') {
      switch (key) {
        case 'ArrowRight':
          return rtl ? 'parent' : 'into';
        case 'ArrowLeft':
          return rtl ? 'into' : 'parent';
        case 'ArrowDown':
          return 'next';
        case 'ArrowUp':
          return 'prev';
      }
      return null;
    }
    switch (key) {
      case 'ArrowDown':
        return 'into';
      case 'ArrowUp':
        return 'parent';
      case 'ArrowRight':
        return rtl ? 'prev' : 'next';
      case 'ArrowLeft':
        return rtl ? 'next' : 'prev';
    }
    return null;
  }

  private siblingsOf(row: MkOrgChartRow): MkOrgChartNode<T>[] {
    const list =
      row.parentId === null
        ? this.nodes()
        : ((this.rowById().get(row.parentId)?.node.children ?? []) as MkOrgChartNode<T>[]);
    return list.filter((n) => !!n.children?.length);
  }


  private isRtl(): boolean {
    const el = this.host.nativeElement;
    const dir = el.closest('[dir]')?.getAttribute('dir');
    if (dir) return dir.toLowerCase() === 'rtl';
    const view = this.document.defaultView;
    return (view?.getComputedStyle(el).direction ?? 'ltr') === 'rtl';
  }

  private itemIdOf(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) return null;
    const item = target.closest<HTMLElement>('.mk-org-chart__item');
    if (!item || !this.host.nativeElement.contains(item)) return null;
    return item.dataset['mkId'] ?? null;
  }

  private focusItem(id: string | null): void {
    if (id === null) return;
    this.activeId.set(id);
    const items = this.host.nativeElement.querySelectorAll<HTMLElement>('.mk-org-chart__item');
    for (const item of Array.from(items)) {
      if (item.dataset['mkId'] === id) {
        item.focus();
        return;
      }
    }
  }
}

function walk<T>(list: readonly MkOrgChartNode<T>[], fn: (node: MkOrgChartNode<T>) => void): void {
  for (const node of list) {
    fn(node);
    if (node.children?.length) walk(node.children, fn);
  }
}

function collectIds<T>(list: readonly MkOrgChartNode<T>[]): Set<string> {
  const ids = new Set<string>();
  walk(list, (n) => ids.add(n.id));
  return ids;
}
