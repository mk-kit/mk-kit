import type { ValidatorFn } from '@angular/forms';

/**
 * Field kinds `mk-dynamic-form` renders out of the box. Each maps to one
 * mk-kit control; `custom` renders a projected `mkDynamicField` template.
 */
export type MkDynamicFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'url'
  | 'tel'
  | 'search'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multi-select'
  | 'autocomplete'
  | 'radio'
  | 'toggle'
  | 'checkbox'
  | 'switch'
  | 'slider'
  | 'rating'
  | 'color'
  | 'tags'
  | 'phone'
  | 'file'
  | 'code'
  | 'custom';

/** One option of a select / radio / toggle / autocomplete field. */
export interface MkDynamicOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

/**
 * Declarative validators — plain data so a schema can be stored as JSON.
 * `custom` takes Angular validator functions for anything else.
 */
export interface MkDynamicValidators {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** A RegExp or its source string. */
  pattern?: string | RegExp;
  email?: boolean;
  /** Angular validator functions appended after the declarative ones. */
  custom?: ValidatorFn[];
}

/**
 * A serialisable condition over the form value (dotted paths reach into
 * groups: `address.country`). Combine with `and` / `or`; a function is the
 * escape hatch for TypeScript-only schemas.
 */
export type MkDynamicCondition =
  | { field: string; eq?: unknown; neq?: unknown; in?: unknown[]; notIn?: unknown[]; truthy?: boolean; empty?: boolean }
  | { and: MkDynamicCondition[] }
  | { or: MkDynamicCondition[] }
  | { not: MkDynamicCondition }
  | ((value: Record<string, unknown>) => boolean);

/** Properties shared by every field that holds a value. */
export interface MkDynamicFieldBase {
  /** Key in the form value. */
  key: string;
  type: MkDynamicFieldType;
  label?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Initial value when the form (or a new array item) is created. */
  default?: unknown;
  validators?: MkDynamicValidators;
  /** Options for select / multi-select / radio / toggle / autocomplete. */
  options?: readonly MkDynamicOption[];
  /**
   * Extra inputs forwarded to the underlying control — the subset each type
   * understands (`rows`, `min`, `max`, `step`, `currency`, `accept`,
   * `multiple`, `swatches`, `language`, …). See the docs table.
   */
  props?: Record<string, unknown>;
  /** Grid columns (1–12) the field spans. Default: the form's `columns` split. */
  span?: number;
  /** Render (and enable) only when the condition holds. Hidden fields are excluded from the value. */
  showWhen?: MkDynamicCondition;
  /** Disable while the condition holds. */
  disabledWhen?: MkDynamicCondition;
}

/** A nested object: its fields become a child `FormGroup` under `key`. */
export interface MkDynamicGroup {
  type: 'group';
  key: string;
  label?: string;
  hint?: string;
  fields: MkDynamicField[];
  span?: number;
  /** Columns for the group's own grid (default: inherits the form's). */
  columns?: number;
  showWhen?: MkDynamicCondition;
  disabledWhen?: MkDynamicCondition;
}

/** A list of objects: a `FormArray` of groups with add / remove controls. */
export interface MkDynamicArray {
  type: 'array';
  key: string;
  label?: string;
  hint?: string;
  /** Fields of one item. */
  fields: MkDynamicField[];
  min?: number;
  max?: number;
  addLabel?: string;
  /** Initial items (each is patched over the item defaults). */
  default?: Record<string, unknown>[];
  span?: number;
  columns?: number;
  showWhen?: MkDynamicCondition;
  disabledWhen?: MkDynamicCondition;
}

/** A heading + description with no value of its own. */
export interface MkDynamicSection {
  type: 'section';
  label: string;
  hint?: string;
  span?: number;
  showWhen?: MkDynamicCondition;
}

export type MkDynamicField = MkDynamicFieldBase | MkDynamicGroup | MkDynamicArray | MkDynamicSection;

/** The whole form. */
export interface MkDynamicSchema {
  fields: MkDynamicField[];
  /** Default number of columns fields are laid out in (1–12). Default 1. */
  columns?: number;
}

export function mkIsGroup(f: MkDynamicField): f is MkDynamicGroup {
  return f.type === 'group';
}
export function mkIsArray(f: MkDynamicField): f is MkDynamicArray {
  return f.type === 'array';
}
export function mkIsSection(f: MkDynamicField): f is MkDynamicSection {
  return f.type === 'section';
}
export function mkIsValueField(f: MkDynamicField): f is MkDynamicFieldBase {
  return f.type !== 'group' && f.type !== 'array' && f.type !== 'section';
}
