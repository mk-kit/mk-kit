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

import { mkUniqueId } from './id.js';

/**
 * The strings {@link mkQueryToText} and {@link mkQueryOperatorLabel} render
 * with. A structural subset of mk-kit's `MkI18nStrings`, so the UI's full
 * i18n map can be passed directly; defaults to {@link MK_QUERY_TEXT_EN}.
 */
export interface MkQueryTextStrings {
  queryTrue: string;
  queryFalse: string;
  queryAnd: string;
  queryOr: string;
  queryNot: string;
  queryOpEq: string;
  queryOpNeq: string;
  queryOpContains: string;
  queryOpNotContains: string;
  queryOpStartsWith: string;
  queryOpEndsWith: string;
  queryOpGt: string;
  queryOpGte: string;
  queryOpLt: string;
  queryOpLte: string;
  queryOpBetween: string;
  queryOpIn: string;
  queryOpNotIn: string;
  queryOpBefore: string;
  queryOpAfter: string;
  queryOpEmpty: string;
  queryOpNotEmpty: string;
}

/** English defaults for {@link MkQueryTextStrings}. */
export const MK_QUERY_TEXT_EN: MkQueryTextStrings = {
  queryTrue: 'True',
  queryFalse: 'False',
  queryAnd: 'And',
  queryOr: 'Or',
  queryNot: 'Not',
  queryOpEq: 'equals',
  queryOpNeq: 'does not equal',
  queryOpContains: 'contains',
  queryOpNotContains: 'does not contain',
  queryOpStartsWith: 'starts with',
  queryOpEndsWith: 'ends with',
  queryOpGt: 'greater than',
  queryOpGte: 'at least',
  queryOpLt: 'less than',
  queryOpLte: 'at most',
  queryOpBetween: 'between',
  queryOpIn: 'is any of',
  queryOpNotIn: 'is none of',
  queryOpBefore: 'before',
  queryOpAfter: 'after',
  queryOpEmpty: 'is empty',
  queryOpNotEmpty: 'is not empty',
};

/** Operators offered per field type, in menu order. */
export const MK_QUERY_OPERATORS: Readonly<Record<MkQueryValueType, readonly MkQueryOperator[]>> = {
  string: ['contains', 'notContains', 'eq', 'neq', 'startsWith', 'endsWith', 'empty', 'notEmpty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'notEmpty'],
  boolean: ['eq'],
  date: ['eq', 'neq', 'before', 'after', 'between', 'empty', 'notEmpty'],
  select: ['eq', 'neq', 'in', 'notIn', 'empty', 'notEmpty'],
};

/** Operators that take no value. */
export const MK_QUERY_UNARY: ReadonlySet<MkQueryOperator> = new Set(['empty', 'notEmpty']);

/** True for a group node (as opposed to a rule). */
export function mkIsQueryGroup(node: MkQueryNode): node is MkQueryGroup {
  return Array.isArray((node as MkQueryGroup).rules);
}

/** A fresh empty group. */
export function mkCreateQueryGroup(init: Partial<Omit<MkQueryGroup, 'id'>> = {}): MkQueryGroup {
  return { id: mkUniqueId('mkq'), combinator: 'and', rules: [], ...init };
}

/** A fresh rule on `field`, using its first operator. */
export function mkCreateQueryRule(field: MkQueryField): MkQueryRule {
  const ops = mkQueryOperatorsFor(field);
  return { id: mkUniqueId('mkq'), field: field.key, operator: ops[0] ?? 'eq' };
}

/** Operators a field offers (its own list, else the defaults for its type). */
export function mkQueryOperatorsFor(field: MkQueryField | undefined): readonly MkQueryOperator[] {
  if (!field) return MK_QUERY_OPERATORS.string;
  return field.operators ?? MK_QUERY_OPERATORS[field.type ?? 'string'];
}

/** True when the tree holds no rule at all (empty groups only). */
export function mkQueryIsEmpty(group: MkQueryGroup): boolean {
  return group.rules.every((n) => (mkIsQueryGroup(n) ? mkQueryIsEmpty(n) : false));
}

/** Number of rules in the tree. */
export function mkQueryRuleCount(group: MkQueryGroup): number {
  return group.rules.reduce((n, r) => n + (mkIsQueryGroup(r) ? mkQueryRuleCount(r) : 1), 0);
}

/** Drop empty groups and rules that still need a value, so the API gets only complete conditions. */
export function mkQueryCompact(group: MkQueryGroup): MkQueryGroup {
  const rules = group.rules
    .map((n) => (mkIsQueryGroup(n) ? mkQueryCompact(n) : n))
    .filter((n) => (mkIsQueryGroup(n) ? n.rules.length > 0 : mkQueryRuleIsComplete(n)));
  return { ...group, rules };
}

/** A rule is complete when its operator needs no value or has one. */
export function mkQueryRuleIsComplete(rule: MkQueryRule): boolean {
  if (MK_QUERY_UNARY.has(rule.operator)) return true;
  const v = rule.value;
  if (v == null || v === '') return false;
  if (rule.operator === 'between') return Array.isArray(v) && v.length === 2 && v.every((x) => x != null && x !== '');
  if (rule.operator === 'in' || rule.operator === 'notIn') return Array.isArray(v) && v.length > 0;
  return true;
}

/** Sortable / comparable primitive of a raw value for a field type. */
function normalise(value: unknown, type: MkQueryValueType): number | string | boolean | null {
  if (value == null || value === '') return null;
  switch (type) {
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      return Number.isNaN(n) ? null : n;
    }
    case 'date': {
      const d = value instanceof Date ? value : new Date(value as string);
      return Number.isNaN(d.getTime()) ? null : d.getTime();
    }
    case 'boolean':
      return value === true || value === 'true';
    default:
      return typeof value === 'string' ? value : String(value);
  }
}

/** Day precision for date equality: two timestamps on the same local day are equal. */
function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function inferType(rule: MkQueryRule): MkQueryValueType {
  const v = Array.isArray(rule.value) ? rule.value[0] : rule.value;
  if (typeof v === 'number') return 'number';
  if (typeof v === 'boolean') return 'boolean';
  if (v instanceof Date) return 'date';
  return 'string';
}

/** Evaluate one rule against a row. */
export function mkQueryRuleMatches(rule: MkQueryRule, row: Record<string, unknown>, field?: MkQueryField): boolean {
  const type: MkQueryValueType = field?.type ?? inferType(rule);
  const raw = row[rule.field];
  const isEmpty = raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0);
  if (rule.operator === 'empty') return isEmpty;
  if (rule.operator === 'notEmpty') return !isEmpty;
  if (!mkQueryRuleIsComplete(rule)) return true; // an unfinished rule filters nothing
  if (isEmpty) return false;

  const cmpType = type === 'select' ? 'string' : type;
  const left = normalise(raw, cmpType);
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
  const eqText = (a: unknown, b: unknown) => collator.compare(String(a), String(b)) === 0;

  switch (rule.operator) {
    case 'eq':
    case 'neq': {
      const right = normalise(rule.value, cmpType);
      let equal: boolean;
      if (left == null || right == null) equal = left === right;
      else if (cmpType === 'date') equal = sameDay(left as number, right as number);
      else if (cmpType === 'string') equal = eqText(left, right);
      else equal = left === right;
      return rule.operator === 'eq' ? equal : !equal;
    }
    case 'contains':
    case 'notContains': {
      const has = String(raw).toLocaleLowerCase().includes(String(rule.value).toLocaleLowerCase());
      return rule.operator === 'contains' ? has : !has;
    }
    case 'startsWith':
      return String(raw).toLocaleLowerCase().startsWith(String(rule.value).toLocaleLowerCase());
    case 'endsWith':
      return String(raw).toLocaleLowerCase().endsWith(String(rule.value).toLocaleLowerCase());
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
    case 'before':
    case 'after': {
      const right = normalise(rule.value, cmpType);
      if (left == null || right == null || typeof left === 'boolean' || typeof right === 'boolean') return false;
      const c = typeof left === 'number' && typeof right === 'number' ? left - right : collator.compare(String(left), String(right));
      switch (rule.operator) {
        case 'gt':
        case 'after':
          return c > 0;
        case 'gte':
          return c >= 0;
        case 'lt':
        case 'before':
          return c < 0;
        default:
          return c <= 0;
      }
    }
    case 'between': {
      const [a, b] = rule.value as [unknown, unknown];
      const lo = normalise(a, cmpType);
      const hi = normalise(b, cmpType);
      if (left == null || lo == null || hi == null) return false;
      if (typeof left === 'number' && typeof lo === 'number' && typeof hi === 'number') return left >= lo && left <= hi;
      return collator.compare(String(left), String(lo)) >= 0 && collator.compare(String(left), String(hi)) <= 0;
    }
    case 'in':
    case 'notIn': {
      const set = rule.value as unknown[];
      const hit = Array.isArray(raw)
        ? raw.some((r) => set.some((s) => eqText(r, s)))
        : set.some((s) => (cmpType === 'string' ? eqText(raw, s) : normalise(raw, cmpType) === normalise(s, cmpType)));
      return rule.operator === 'in' ? hit : !hit;
    }
    default:
      return true;
  }
}

/**
 * Compile a query into a row predicate for client-side filtering
 * (`rows.filter(mkQueryToPredicate(query, fields))`). Unfinished rules are
 * ignored, so a half-edited query never blanks the table.
 */
export function mkQueryToPredicate<T extends object = Record<string, unknown>>(
  group: MkQueryGroup,
  fields: readonly MkQueryField[] = [],
): (row: T) => boolean {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const evalGroup = (g: MkQueryGroup, row: Record<string, unknown>): boolean => {
    const active = g.rules.filter((n) => (mkIsQueryGroup(n) ? !mkQueryIsEmpty(n) : mkQueryRuleIsComplete(n)));
    let result: boolean;
    if (!active.length) result = true;
    else if (g.combinator === 'or') result = active.some((n) => evalNode(n, row));
    else result = active.every((n) => evalNode(n, row));
    return g.not ? !result : result;
  };
  const evalNode = (n: MkQueryNode, row: Record<string, unknown>): boolean =>
    mkIsQueryGroup(n) ? evalGroup(n, row) : mkQueryRuleMatches(n, row, byKey.get(n.field));
  return (row) => evalGroup(group, row as Record<string, unknown>);
}

/** Localised label of an operator. */
export function mkQueryOperatorLabel(op: MkQueryOperator, i18n: MkQueryTextStrings = MK_QUERY_TEXT_EN): string {
  const key = `queryOp${op[0].toUpperCase()}${op.slice(1)}` as keyof MkQueryTextStrings;
  return i18n[key] ?? op;
}

/**
 * Human-readable sentence for a query, e.g.
 * `(Name contains "ada" and Orders at least 10) or Status is any of Active, Invited`.
 */
export function mkQueryToText(
  group: MkQueryGroup,
  fields: readonly MkQueryField[] = [],
  i18n: MkQueryTextStrings = MK_QUERY_TEXT_EN,
): string {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const fmt = (v: unknown, field?: MkQueryField): string => {
    if (field?.type === 'select') {
      const opt = field.options?.find((o) => o.value === v);
      if (opt) return opt.label;
    }
    if (field?.type === 'boolean' || typeof v === 'boolean') return v === true || v === 'true' ? i18n.queryTrue : i18n.queryFalse;
    if (typeof v === 'number') return String(v);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return `"${String(v)}"`;
  };
  const rule = (r: MkQueryRule): string => {
    const f = byKey.get(r.field);
    const label = f?.label ?? r.field;
    const op = mkQueryOperatorLabel(r.operator, i18n);
    if (MK_QUERY_UNARY.has(r.operator)) return `${label} ${op}`;
    if (r.operator === 'between' && Array.isArray(r.value)) return `${label} ${op} ${fmt(r.value[0], f)} – ${fmt(r.value[1], f)}`;
    if (Array.isArray(r.value)) return `${label} ${op} ${r.value.map((v) => fmt(v, f)).join(', ')}`;
    return `${label} ${op} ${fmt(r.value, f)}`;
  };
  const grp = (g: MkQueryGroup, top: boolean): string => {
    const parts = g.rules
      .filter((n) => (mkIsQueryGroup(n) ? !mkQueryIsEmpty(n) : mkQueryRuleIsComplete(n)))
      .map((n) => (mkIsQueryGroup(n) ? grp(n, false) : rule(n)));
    if (!parts.length) return '';
    const joiner = g.combinator === 'or' ? i18n.queryOr : i18n.queryAnd;
    const body = parts.join(` ${joiner.toLocaleLowerCase()} `);
    const wrapped = top && !g.not ? body : parts.length > 1 || g.not ? `(${body})` : body;
    return g.not ? `${i18n.queryNot.toLocaleLowerCase()} ${wrapped}` : wrapped;
  };
  return grp(group, true);
}
