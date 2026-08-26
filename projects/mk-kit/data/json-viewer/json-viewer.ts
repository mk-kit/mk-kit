import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MK_I18N } from '@mk-kit/ui/core';

/** One rendered node of the JSON tree. */
export interface MkJsonNode {
  /** Property name / array index; `null` for the root. */
  key: string | null;
  /** Node kind (drives colouring + expandability). */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'circular';
  /** Display text for primitives. */
  display: string;
  /** Children for objects/arrays. */
  children: MkJsonNode[];
  /** Unique path (e.g. `$.users[0].name`) used for expansion tracking. */
  path: string;
  /** Nesting depth (root = 0). */
  depth: number;
}

/** Build the node tree for a JSON-ish value (circular refs marked). */
export function mkBuildJsonTree(value: unknown): MkJsonNode {
  const seen = new WeakSet<object>();

  const build = (
    v: unknown,
    key: string | null,
    path: string,
    depth: number,
  ): MkJsonNode => {
    if (v === null || v === undefined) {
      return { key, type: 'null', display: String(v), children: [], path, depth };
    }
    if (typeof v === 'string') {
      return { key, type: 'string', display: JSON.stringify(v), children: [], path, depth };
    }
    if (typeof v === 'number' || typeof v === 'bigint') {
      return { key, type: 'number', display: String(v), children: [], path, depth };
    }
    if (typeof v === 'boolean') {
      return { key, type: 'boolean', display: String(v), children: [], path, depth };
    }
    if (typeof v === 'object') {
      if (seen.has(v)) {
        return { key, type: 'circular', display: '[Circular]', children: [], path, depth };
      }
      seen.add(v);
      if (Array.isArray(v)) {
        const children = v.map((item, i) =>
          build(item, String(i), `${path}[${i}]`, depth + 1),
        );
        seen.delete(v);
        return { key, type: 'array', display: '', children, path, depth };
      }
      const children = Object.entries(v as Record<string, unknown>).map(
        ([k, item]) => build(item, k, `${path}.${k}`, depth + 1),
      );
      seen.delete(v);
      return { key, type: 'object', display: '', children, path, depth };
    }
    // Functions/symbols — not JSON, shown as text.
    return { key, type: 'null', display: String(v), children: [], path, depth };
  };

  return build(value, null, '$', 0);
}

/**
 * JsonViewer — a read-only, collapsible tree for JSON-ish data: objects and
 * arrays fold behind disclosure buttons (with a `{…} n items` preview),
 * primitives are colour-coded by type, and circular references render as
 * `[Circular]` instead of recursing. `expandDepth` controls how much is open
 * initially; `expandAll()` / `collapseAll()` are available on the component.
 *
 * The complement of `mk-code-editor`: the editor edits JSON text, this
 * explores JSON *data* (API responses, entity payloads, config dumps).
 *
 * ```html
 * <mk-json-viewer [data]="response" [expandDepth]="2" />
 * ```
 */
@Component({
  selector: 'mk-json-viewer',
  templateUrl: './json-viewer.html',
  styleUrl: './json-viewer.scss',
  exportAs: 'mkJsonViewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    class: 'mk-json-viewer',
    // The host scrolls horizontally; make it keyboard-scrollable (WCAG 2.1.1).
    role: 'region',
    tabindex: '0',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class MkJsonViewer {
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  /** The value to display (any JSON-serialisable data). */
  readonly data = input.required<unknown>();
  /** How many levels start expanded (root = level 1). */
  readonly expandDepth = input(1, { transform: numberAttribute });
  /** Accessible label of the tree region. */
  readonly ariaLabel = input<string>(this.i18n.jsonLabel, {
    alias: 'aria-label',
  });

  /**
   * Paths currently expanded. Mutated in place — a toggle is O(1) instead of
   * copying the whole set — with `expansionVersion` bumped so signal-driven
   * bindings re-evaluate. Always read through {@link isExpanded}.
   */
  private readonly expanded = new Set<string>();
  /** Bumped on every expansion change; the reactive face of `expanded`. */
  private readonly expansionVersion = signal(0);

  /** The built node tree. */
  protected readonly root = computed(() => mkBuildJsonTree(this.data()));

  /**
   * Collapsed previews, cached per node so template bindings don't rebuild the
   * string on every change-detection pass. Keyed weakly: entries die with the
   * tree when `data` changes.
   */
  private readonly previews = new WeakMap<MkJsonNode, string>();

  constructor() {
    // Reset expansion to `expandDepth` whenever the data (or depth) changes.
    effect(() => {
      const root = this.root();
      const depth = this.expandDepth();
      untracked(() => this.replaceExpanded(collectToDepth(root, depth)));
    });
  }

  protected isExpanded(path: string): boolean {
    this.expansionVersion(); // Track: re-evaluate when expansion changes.
    return this.expanded.has(path);
  }

  protected toggle(path: string): void {
    if (!this.expanded.delete(path)) this.expanded.add(path);
    this.expansionVersion.update((v) => v + 1);
  }

  /** Expand every object/array node. */
  expandAll(): void {
    this.replaceExpanded(collectToDepth(this.root(), Number.POSITIVE_INFINITY));
  }

  /** Collapse everything (the root stays visible). */
  collapseAll(): void {
    this.replaceExpanded(EMPTY_PATHS);
  }

  /** Swap the expansion set's contents and notify bindings. */
  private replaceExpanded(paths: ReadonlySet<string>): void {
    this.expanded.clear();
    for (const path of paths) this.expanded.add(path);
    this.expansionVersion.update((v) => v + 1);
  }

  /** Collapsed preview, e.g. `{…}` / `[…]` + item count (cached per node). */
  protected preview(node: MkJsonNode): string {
    let text = this.previews.get(node);
    if (text === undefined) {
      const braces = node.type === 'array' ? '[…]' : '{…}';
      text = `${braces} ${this.i18n.groupCount(node.children.length)}`;
      this.previews.set(node, text);
    }
    return text;
  }
}

const EMPTY_PATHS: ReadonlySet<string> = new Set();

/** All container paths with depth < `maxDepth`. */
function collectToDepth(root: MkJsonNode, maxDepth: number): Set<string> {
  const paths = new Set<string>();
  const walk = (node: MkJsonNode): void => {
    if (node.children.length === 0 && node.type !== 'object' && node.type !== 'array') {
      return;
    }
    if (node.type === 'object' || node.type === 'array') {
      if (node.depth < maxDepth) paths.add(node.path);
      node.children.forEach(walk);
    }
  };
  walk(root);
  return paths;
}
