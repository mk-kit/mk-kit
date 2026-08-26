import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import {
  MK_I18N,
  MK_QUERY_UNARY,
  mkCreateQueryGroup,
  mkCreateQueryRule,
  mkIsQueryGroup,
  mkQueryOperatorLabel,
  mkQueryOperatorsFor,
  type MkQueryCombinator,
  type MkQueryField,
  type MkQueryGroup,
  type MkQueryNode,
  type MkQueryOperator,
  type MkQueryRule,
} from '@mk-kit/ui/core';
import type { MkSize } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkIcon } from '@mk-kit/ui/icon';
import { MkInput, MkMultiSelect, MkNumberInput, MkSelect, type MkSelectOption } from '@mk-kit/ui/forms';
import { MkDatePicker } from '@mk-kit/ui/datetime';

/** Format a Date as an ISO calendar date (`YYYY-MM-DD`, local). */
function toIsoDate(d: Date | null): string | null {
  if (!d) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse an ISO calendar date back into a local Date (`null` when invalid). */
function fromIsoDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v !== 'string' || !v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * One group of the builder — its combinator toggle, rules, nested groups and
 * the add / remove actions. Used by `mk-query-builder`; every edit emits a
 * new immutable group upward.
 */
@Component({
  selector: 'mk-query-group',
  templateUrl: './query-group.html',
  styleUrl: './query-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    forwardRef(() => MkQueryGroupComponent),
    MkButton,
    MkDatePicker,
    MkIcon,
    MkInput,
    MkMultiSelect,
    MkNumberInput,
    MkSelect,
  ],
  host: {
    class: 'mk-query-group',
    role: 'group',
    '[class.mk-query-group--root]': 'root()',
    '[class.mk-query-group--not]': '!!group().not',
    '[attr.aria-label]': 'root() ? null : i18n.queryAddGroup',
  },
})
export class MkQueryGroupComponent {
  protected readonly i18n = inject(MK_I18N);

  readonly group = input.required<MkQueryGroup>();
  readonly fields = input.required<readonly MkQueryField[]>();
  readonly depth = input(0, { transform: numberAttribute });
  readonly maxDepth = input(3, { transform: numberAttribute });
  readonly allowNot = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly root = input(false, { transform: booleanAttribute });
  readonly size = input<MkSize>('sm');

  /** A new version of this group after an edit. */
  readonly groupChange = output<MkQueryGroup>();
  /** The user removed this (non-root) group. */
  readonly remove = output<void>();

  protected readonly fieldOptions = computed<MkSelectOption[]>(() =>
    this.fields().map((f) => ({ label: f.label, value: f.key })),
  );
  protected readonly canNest = computed(() => this.depth() < this.maxDepth());
  protected readonly booleanOptions = computed<MkSelectOption[]>(() => [
    { label: this.i18n.queryTrue, value: true },
    { label: this.i18n.queryFalse, value: false },
  ]);

  protected isGroup = mkIsQueryGroup;

  protected fieldOf(rule: MkQueryRule): MkQueryField | undefined {
    return this.fields().find((f) => f.key === rule.field);
  }

  protected typeOf(rule: MkQueryRule): string {
    return this.fieldOf(rule)?.type ?? 'string';
  }

  protected operatorOptions(rule: MkQueryRule): MkSelectOption[] {
    return mkQueryOperatorsFor(this.fieldOf(rule)).map((op) => ({
      label: mkQueryOperatorLabel(op, this.i18n),
      value: op,
    }));
  }

  protected needsValue(rule: MkQueryRule): boolean {
    return !MK_QUERY_UNARY.has(rule.operator);
  }

  protected selectOptions(rule: MkQueryRule): MkSelectOption[] {
    return (this.fieldOf(rule)?.options ?? []).map((o) => ({ label: o.label, value: o.value }));
  }

  protected isList(rule: MkQueryRule): boolean {
    return rule.operator === 'in' || rule.operator === 'notIn';
  }

  protected isRange(rule: MkQueryRule): boolean {
    return rule.operator === 'between';
  }

  protected asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  protected rangePart(rule: MkQueryRule, index: 0 | 1): unknown {
    return Array.isArray(rule.value) ? rule.value[index] : undefined;
  }

  protected dateValue(v: unknown): Date | null {
    return fromIsoDate(v);
  }

  protected numberValue(v: unknown): number | null {
    return typeof v === 'number' ? v : v == null || v === '' ? null : Number(v);
  }

  protected textValue(v: unknown): string {
    return v == null ? '' : String(v);
  }

  // --- Edits (all immutable) --------------------------------------------------

  protected setCombinator(combinator: MkQueryCombinator): void {
    if (this.group().combinator === combinator) return;
    this.groupChange.emit({ ...this.group(), combinator });
  }

  protected toggleNot(): void {
    this.groupChange.emit({ ...this.group(), not: !this.group().not });
  }

  protected addRule(): void {
    const field = this.fields()[0];
    if (!field) return;
    this.groupChange.emit({ ...this.group(), rules: [...this.group().rules, mkCreateQueryRule(field)] });
  }

  protected addGroup(): void {
    this.groupChange.emit({ ...this.group(), rules: [...this.group().rules, mkCreateQueryGroup()] });
  }

  protected removeAt(index: number): void {
    this.groupChange.emit({ ...this.group(), rules: this.group().rules.filter((_, i) => i !== index) });
  }

  protected replaceAt(index: number, node: MkQueryNode): void {
    this.groupChange.emit({ ...this.group(), rules: this.group().rules.map((n, i) => (i === index ? node : n)) });
  }

  protected setField(index: number, rule: MkQueryRule, key: unknown): void {
    const field = this.fields().find((f) => f.key === key);
    if (!field || field.key === rule.field) return;
    const ops = mkQueryOperatorsFor(field);
    const operator = ops.includes(rule.operator) ? rule.operator : ops[0];
    this.replaceAt(index, { ...rule, field: field.key, operator, value: undefined });
  }

  protected setOperator(index: number, rule: MkQueryRule, op: unknown): void {
    const operator = op as MkQueryOperator;
    if (operator === rule.operator) return;
    const shapeChanged =
      MK_QUERY_UNARY.has(operator) !== MK_QUERY_UNARY.has(rule.operator) ||
      (operator === 'between') !== (rule.operator === 'between') ||
      this.isList({ ...rule, operator }) !== this.isList(rule);
    this.replaceAt(index, { ...rule, operator, value: shapeChanged ? undefined : rule.value });
  }

  protected setValue(index: number, rule: MkQueryRule, value: unknown): void {
    this.replaceAt(index, { ...rule, value });
  }

  protected setRangePart(index: number, rule: MkQueryRule, part: 0 | 1, value: unknown): void {
    const current = Array.isArray(rule.value) ? [...rule.value] : [undefined, undefined];
    current[part] = value;
    this.setValue(index, rule, current);
  }

  protected setDate(index: number, rule: MkQueryRule, d: Date | null): void {
    this.setValue(index, rule, toIsoDate(d));
  }

  protected setDateRange(index: number, rule: MkQueryRule, part: 0 | 1, d: Date | null): void {
    this.setRangePart(index, rule, part, toIsoDate(d));
  }

  protected onTextInput(index: number, rule: MkQueryRule, event: Event): void {
    this.setValue(index, rule, (event.target as HTMLInputElement).value);
  }
}
