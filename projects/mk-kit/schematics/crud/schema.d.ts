/** Options of the `crud` schematic — kept in sync with schema.json. */
export interface Schema {
  /** Singular entity name, e.g. `product` or `OrderLine`. */
  entity: string;
  /** Comma-separated `key:type` field spec (see schema.json for the grammar). */
  fields?: string;
  /** Plural override when the naive pluralizer guesses wrong. */
  plural?: string;
  /** REST base URL; unset generates an in-memory service. */
  api?: string;
  /** Directory the entity folder is created in (default: the app's src/app). */
  path?: string;
  /** Workspace project to target (default: the first application project). */
  project?: string;
  /** Wire a lazy route into app.routes.ts (default true). */
  route?: boolean;
  /** Generate the harness-driven spec (default true). */
  spec?: boolean;
}
