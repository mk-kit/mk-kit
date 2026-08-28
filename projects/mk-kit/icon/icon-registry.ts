import { Injectable, PendingTasks, Signal, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MK_DEFAULT_ICONS } from './default-icons';

declare const ngDevMode: boolean | undefined;

/** A `{ name: '<svg …>…</svg>' }` map — what every registration API accepts. */
export type MkIconMap = Readonly<Record<string, string>>;

/**
 * Loads an icon map on demand — typically a dynamic import of the extended
 * set: `() => import('@mk-kit/ui/icon/extended').then((m) => m.MK_EXTENDED_ICONS)`.
 */
export type MkIconLoader = () => Promise<MkIconMap>;

/**
 * IconRegistry — the name → SVG store behind `<mk-icon name="…">`. The
 * hand-made {@link MK_DEFAULT_ICONS} are registered on construction and ship
 * with every app. Everything else is opt-in and tree-shakeable: the
 * Lucide-derived extended set via `provideMkExtendedIcons()` (from
 * `@mk-kit/ui/icon/extended`), a themed subset or your own SVGs (from a
 * sprite, a design export, anything) via `provideMkIcons()`, or at runtime
 * with {@link register} / {@link registerIcons} / {@link load}.
 *
 * SVG markup is trusted verbatim (bypassed through `DomSanitizer`), so only
 * register icons from sources you control — never user input.
 *
 * ```ts
 * const reg = inject(MkIconRegistry);
 * reg.register('logo', '<svg viewBox="0 0 24 24">…</svg>');
 * reg.registerIcons({ save: '<svg…>', share: '<svg…>' });
 * reg.load(() => import('@mk-kit/ui/icon/extended').then((m) => m.MK_EXTENDED_ICONS_FILES));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkIconRegistry {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly icons = new Map<string, SafeHtml>();
  private readonly aliases = new Map<string, string>();
  private readonly version = signal(0);
  private readonly loads = signal(0);
  private readonly warned = new Set<string>();

  /**
   * Bumps on every registration. `<mk-icon>` reads it, so an icon that
   * arrives late (a lazy {@link load}, a runtime {@link register}) renders in
   * place without any re-binding.
   */
  readonly changes: Signal<number> = this.version.asReadonly();

  /** Whether a lazy {@link load} is still in flight. */
  readonly pending: Signal<boolean> = computed(() => this.loads() > 0);

  constructor() {
    this.registerIcons(MK_DEFAULT_ICONS);
  }

  /** Register (or overwrite) a single named icon from raw SVG markup. */
  register(name: string, svg: string): this {
    this.icons.set(name, this.sanitizer.bypassSecurityTrustHtml(svg));
    this.version.update((v) => v + 1);
    return this;
  }

  /**
   * Register many icons at once from a `{ name: svg }` map — a whole set, a
   * themed subset (`MK_EXTENDED_ICONS_FILES`) or a hand-picked few. Later
   * registrations overwrite earlier ones on a shared name.
   */
  registerIcons(icons: MkIconMap): this {
    for (const name in icons) {
      this.icons.set(name, this.sanitizer.bypassSecurityTrustHtml(icons[name]));
    }
    this.version.update((v) => v + 1);
    return this;
  }

  /**
   * Register alternative names that resolve to existing icons — e.g. map
   * Material Symbols ligature names onto the built-in set
   * (`{ delete: 'trash', expand_more: 'chevron-down' }`). A real icon
   * registered under an alias name always wins over the alias; an alias
   * whose target is not registered resolves to nothing (and, in dev mode,
   * warns once naming the missing target).
   */
  registerAliases(aliases: Readonly<Record<string, string>>): this {
    for (const [alias, target] of Object.entries(aliases)) {
      this.aliases.set(alias, target);
    }
    this.version.update((v) => v + 1);
    return this;
  }

  /**
   * Load an icon map asynchronously and register it once it arrives. Icons
   * already on screen fill in when the map lands (see {@link changes}); the
   * missing-icon warning stays quiet while a load is pending. Server-side
   * rendering waits for it (Angular's `PendingTasks`), so the HTML ships with
   * the icons in place.
   *
   * ```ts
   * registry.load(() => import('@mk-kit/ui/icon/extended').then((m) => m.MK_EXTENDED_ICONS));
   * ```
   */
  async load(loader: MkIconLoader): Promise<void> {
    const done = this.pendingTasks.add();
    this.loads.update((n) => n + 1);
    try {
      this.registerIcons(await loader());
    } finally {
      this.loads.update((n) => n - 1);
      done();
    }
  }

  /** Sanitized SVG for a name (aliases resolved), or `null` when unknown. */
  get(name: string): SafeHtml | null {
    return this.icons.get(name) ?? this.icons.get(this.aliases.get(name) ?? '') ?? null;
  }

  /** Whether an icon with this name (or alias) is registered. */
  has(name: string): boolean {
    return this.icons.has(name) || this.icons.has(this.aliases.get(name) ?? '');
  }

  /** All registered icon names (useful for a picker / catalogue). */
  names(): string[] {
    return [...this.icons.keys()];
  }

  /**
   * Dev-mode only: warn once per unknown name with a hint about the opt-in
   * extended set. Silent in production builds and while a {@link load} is
   * pending (the name may be on its way). Called by `<mk-icon>`.
   */
  warnMissing(name: string): void {
    if (typeof ngDevMode === 'undefined' || !ngDevMode) return;
    if (this.loads() > 0 || this.warned.has(name)) return;
    this.warned.add(name);
    const target = this.aliases.get(name);
    console.warn(
      `mk-icon: no icon named "${name}" is registered` +
        (target ? ` (alias of "${target}", which is missing too)` : '') +
        '. The Lucide-derived extended set is opt-in: add provideMkExtendedIcons() from ' +
        "'@mk-kit/ui/icon/extended' (or a themed subset via provideMkIcons()) to your providers, " +
        'or register your own SVG with MkIconRegistry.register(). Shown once per name.',
    );
  }
}
