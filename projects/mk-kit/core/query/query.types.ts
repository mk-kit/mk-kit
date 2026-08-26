/** Value kind of a filterable field; decides the editor and the operators offered. */
export type MkQueryValueType = 'string' | 'number' | 'boolean' | 'date' | 'select';

/** A choice for `select` fields. */
export interface MkQueryFieldOption {
  label: string;
  value: unknown;
}

/** A field the user can filter on. */
export interface MkQueryField {
  /** Property key on the row objects / the API's filter name. */
  key: string;
  /** Label shown in the field picker. */
  label: string;
  /** Default `string`. */
  type?: MkQueryValueType;
  /** Choices for `select` fields. */
  options?: readonly MkQueryFieldOption[];
  /** Restrict / reorder the operators offered (default: all for the type). */
  operators?: readonly MkQueryOperator[];
  /** Placeholder of the value editor. */
  placeholder?: string;
}

/** Comparison operators. Which apply depends on the field type. */
export type MkQueryOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'notIn'
  | 'before'
  | 'after'
  | 'empty'
  | 'notEmpty';

/** A leaf condition. `value` is `[from, to]` for `between`, an array for `in` / `notIn`, absent for `empty` / `notEmpty`. Dates are ISO strings. */
export interface MkQueryRule {
  id: string;
  field: string;
  operator: MkQueryOperator;
  value?: unknown;
}

export type MkQueryCombinator = 'and' | 'or';

/** A group of rules and nested groups joined by one combinator, optionally negated. */
export interface MkQueryGroup {
  id: string;
  combinator: MkQueryCombinator;
  /** Negate the whole group. */
  not?: boolean;
  rules: MkQueryNode[];
}

export type MkQueryNode = MkQueryRule | MkQueryGroup;
