/** Options for `ng g @mk-kit/ui:migrate-primeng`. Mirrors `schema.json`. */
export interface Schema {
  /** Directory to migrate (default `src`). */
  path?: string;
  /** Compute and print the report without writing any file. */
  dryRun?: boolean;
  /** Path of the Markdown report (default `primeng-migration.md`). */
  report?: string;
}
