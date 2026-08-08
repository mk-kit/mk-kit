/**
 * Options for the `ng add @mkornas/ui` schematic. Mirrors `schema.json`.
 */
export interface Schema {
  /** The name of the project to add @mkornas/ui to. */
  project?: string;
  /** Insert a `provideMkI18n({})` override block into the application config. */
  i18n?: boolean;
}
