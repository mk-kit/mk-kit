import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MK_DEFAULT_ICONS } from './default-icons';

/**
 * IconRegistry — the name → SVG store behind `<mk-icon name="…">`. The built-in
 * {@link MK_DEFAULT_ICONS} set is registered on construction; add your own SVGs
 * (from a sprite, a design export, anything) with {@link register} /
 * {@link registerIcons}.
 *
 * SVG markup is trusted verbatim (bypassed through `DomSanitizer`), so only
 * register icons from sources you control — never user input.
 *
 * ```ts
 * const reg = inject(MkIconRegistry);
 * reg.register('logo', '<svg viewBox="0 0 24 24">…</svg>');
 * reg.registerIcons({ save: '<svg…>', share: '<svg…>' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkIconRegistry {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly icons = new Map<string, SafeHtml>();
  private readonly aliases = new Map<string, string>();

  constructor() {
    this.registerIcons(MK_DEFAULT_ICONS);
  }

  /** Register (or overwrite) a single named icon from raw SVG markup. */
  register(name: string, svg: string): this {
    this.icons.set(name, this.sanitizer.bypassSecurityTrustHtml(svg));
    return this;
  }

  /** Register many icons at once from a `{ name: svg }` map. */
  registerIcons(icons: Readonly<Record<string, string>>): this {
    for (const [name, svg] of Object.entries(icons)) this.register(name, svg);
    return this;
  }

  /**
   * Register alternative names that resolve to existing icons — e.g. map
   * Material Symbols ligature names onto the built-in set
   * (`{ delete: 'trash', expand_more: 'chevron-down' }`). A real icon
   * registered under an alias name always wins over the alias.
   */
  registerAliases(aliases: Readonly<Record<string, string>>): this {
    for (const [alias, target] of Object.entries(aliases)) {
      this.aliases.set(alias, target);
    }
    return this;
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
}
