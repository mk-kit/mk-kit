import {
  mkCreateQueryGroup,
  mkCreateQueryRule,
  mkQueryCompact,
  mkQueryIsEmpty,
  mkQueryRuleCount,
  mkQueryToPredicate,
  mkQueryToText,
} from './query';
import type { MkQueryField, MkQueryGroup } from './query.types';

const FIELDS: MkQueryField[] = [
  { key: 'name', label: 'Name' },
  { key: 'orders', label: 'Orders', type: 'number' },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'since', label: 'Since', type: 'date' },
  { key: 'role', label: 'Role', type: 'select', options: [{ label: 'Admin', value: 'admin' }, { label: 'Editor', value: 'editor' }] },
  { key: 'tags', label: 'Tags', type: 'select', options: [] },
];

const ROWS = [
  { name: 'Ada Lovelace', orders: 42, active: true, since: '2024-01-15', role: 'admin', tags: ['vip'] },
  { name: 'Grace Hopper', orders: 3, active: false, since: '2025-06-01', role: 'editor', tags: [] },
  { name: 'alan turing', orders: null, active: true, since: null, role: 'editor', tags: ['new', 'vip'] },
];

const q = (rules: MkQueryGroup['rules'], combinator: 'and' | 'or' = 'and', not = false): MkQueryGroup => ({
  id: 'g',
  combinator,
  not,
  rules,
});
const names = (g: MkQueryGroup) => ROWS.filter(mkQueryToPredicate(g, FIELDS)).map((r) => r.name);

describe('mkQueryToPredicate', () => {
  it('matches strings case-insensitively with every text operator', () => {
    expect(names(q([{ id: '1', field: 'name', operator: 'contains', value: 'ADA' }]))).toEqual(['Ada Lovelace']);
    expect(names(q([{ id: '1', field: 'name', operator: 'notContains', value: 'a' }]))).toEqual([]);
    expect(names(q([{ id: '1', field: 'name', operator: 'eq', value: 'ALAN TURING' }]))).toEqual(['alan turing']);
    expect(names(q([{ id: '1', field: 'name', operator: 'startsWith', value: 'gr' }]))).toEqual(['Grace Hopper']);
    expect(names(q([{ id: '1', field: 'name', operator: 'endsWith', value: 'ING' }]))).toEqual(['alan turing']);
  });

  it('compares numbers, dates (by day) and booleans', () => {
    expect(names(q([{ id: '1', field: 'orders', operator: 'gte', value: 3 }]))).toEqual(['Ada Lovelace', 'Grace Hopper']);
    expect(names(q([{ id: '1', field: 'orders', operator: 'between', value: [1, 10] }]))).toEqual(['Grace Hopper']);
    expect(names(q([{ id: '1', field: 'orders', operator: 'empty' }]))).toEqual(['alan turing']);
    expect(names(q([{ id: '1', field: 'since', operator: 'after', value: '2024-12-31' }]))).toEqual(['Grace Hopper']);
    expect(names(q([{ id: '1', field: 'since', operator: 'eq', value: '2024-01-15T23:00:00' }]))).toEqual(['Ada Lovelace']);
    expect(names(q([{ id: '1', field: 'active', operator: 'eq', value: false }]))).toEqual(['Grace Hopper']);
    expect(names(q([{ id: '1', field: 'active', operator: 'eq', value: 'true' }]))).toEqual(['Ada Lovelace', 'alan turing']);
  });

  it('handles select fields with in / notIn, including array-valued rows', () => {
    expect(names(q([{ id: '1', field: 'role', operator: 'in', value: ['admin'] }]))).toEqual(['Ada Lovelace']);
    expect(names(q([{ id: '1', field: 'role', operator: 'notIn', value: ['admin'] }]))).toEqual(['Grace Hopper', 'alan turing']);
    expect(names(q([{ id: '1', field: 'tags', operator: 'in', value: ['vip'] }]))).toEqual(['Ada Lovelace', 'alan turing']);
    expect(names(q([{ id: '1', field: 'tags', operator: 'notEmpty' }]))).toEqual(['Ada Lovelace', 'alan turing']);
  });

  it('combines with and / or, nests groups, negates, and ignores unfinished rules', () => {
    const nested = q(
      [
        { id: '1', field: 'active', operator: 'eq', value: true },
        q([{ id: '2', field: 'orders', operator: 'lt', value: 10 }, { id: '3', field: 'name', operator: 'contains', value: 'ada' }], 'or'),
      ],
    );
    expect(names(nested)).toEqual(['Ada Lovelace']);
    expect(names({ ...nested, not: true })).toEqual(['Grace Hopper', 'alan turing']);
    expect(names(q([{ id: '1', field: 'name', operator: 'contains', value: '' }, { id: '2', field: 'orders', operator: 'between', value: [1] }]))).toEqual(
      ROWS.map((r) => r.name),
    );
    expect(names(q([]))).toHaveLength(3);
  });

  it('infers the type from the value when no field metadata is given', () => {
    const pred = mkQueryToPredicate(q([{ id: '1', field: 'orders', operator: 'gt', value: 10 }]));
    expect(ROWS.filter(pred).map((r) => r.name)).toEqual(['Ada Lovelace']);
  });
});

describe('query helpers', () => {
  it('creates groups and rules, counts, compacts and detects emptiness', () => {
    const g = mkCreateQueryGroup();
    expect(g.rules).toEqual([]);
    expect(mkQueryIsEmpty(g)).toBe(true);
    const r = mkCreateQueryRule(FIELDS[1]);
    expect(r.field).toBe('orders');
    expect(r.operator).toBe('eq');
    const tree = q([r, q([]), q([{ id: 'x', field: 'name', operator: 'contains', value: 'a' }])]);
    expect(mkQueryRuleCount(tree)).toBe(2);
    expect(mkQueryIsEmpty(tree)).toBe(false);
    const compact = mkQueryCompact(tree);
    expect(compact.rules).toHaveLength(1); // incomplete rule + empty group dropped
    expect(mkQueryIsEmpty(q([q([])]))).toBe(true);
  });

  it('renders a readable sentence', () => {
    const tree = q(
      [
        q([{ id: '1', field: 'name', operator: 'contains', value: 'ada' }, { id: '2', field: 'orders', operator: 'gte', value: 10 }]),
        { id: '3', field: 'role', operator: 'in', value: ['admin', 'editor'] },
        { id: '4', field: 'since', operator: 'between', value: ['2024-01-01', '2024-12-31'] },
        { id: '5', field: 'active', operator: 'eq', value: true },
        { id: '6', field: 'name', operator: 'empty' },
      ],
      'or',
    );
    expect(mkQueryToText(tree, FIELDS)).toBe(
      '(Name contains "ada" and Orders at least 10) or Role is any of Admin, Editor or Since between "2024-01-01" – "2024-12-31" or Active equals True or Name is empty',
    );
    expect(mkQueryToText(q([{ id: '1', field: 'x', operator: 'eq', value: 1 }], 'and', true), FIELDS)).toBe('not (x equals 1)');
    expect(mkQueryToText(q([]), FIELDS)).toBe('');
  });
});
