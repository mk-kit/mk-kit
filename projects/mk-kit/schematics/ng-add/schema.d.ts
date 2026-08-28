/**
 * Options for the `ng add @mk-kit/ui` schematic. Mirrors `schema.json`.
 */
export interface Schema {
  /** The name of the project to add @mk-kit/ui to. */
  project?: string;
  /** Insert a `provideMkI18n({})` override block into the application config. */
  i18n?: boolean;
  /** Insert `provideMkExtendedIcons()` so the opt-in Lucide-derived icon set resolves. */
  extendedIcons?: boolean;
}
