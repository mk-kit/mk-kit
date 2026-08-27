import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  MkDynamicArray,
  MkDynamicCondition,
  MkDynamicField,
  MkDynamicFieldBase,
  MkDynamicGroup,
  MkDynamicSchema,
  mkIsArray,
  mkIsGroup,
  mkIsSection,
} from './dynamic-form.types';

/* ------------------------------------------------------------------------ */
/* Defaults                                                                  */
/* ------------------------------------------------------------------------ */

/** The empty value a field type starts with when no `default` is given. */
export function mkDynamicEmptyValue(field: MkDynamicFieldBase): unknown {
  switch (field.type) {
    case 'checkbox':
    case 'switch':
      return false;
    case 'multi-select':
    case 'tags':
    case 'file':
      return [];
    case 'number':
    case 'currency':
    case 'slider':
    case 'rating':
    case 'date':
    case 'time':
    case 'datetime':
    case 'select':
    case 'radio':
    case 'toggle':
    case 'autocomplete':
    case 'color':
    case 'phone':
      return null;
    default:
      return '';
  }
}

/** Default value object of a field list (groups nested, arrays as item lists). */
export function mkDynamicDefaults(fields: readonly MkDynamicField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (mkIsSection(f)) continue;
    if (mkIsGroup(f)) out[f.key] = mkDynamicDefaults(f.fields);
    else if (mkIsArray(f)) out[f.key] = (f.default ?? []).map((item) => ({ ...mkDynamicDefaults(f.fields), ...item }));
    else out[f.key] = f.default !== undefined ? f.default : mkDynamicEmptyValue(f);
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* Validators                                                                */
/* ------------------------------------------------------------------------ */

/** Angular validators for one value field, from its declarative `validators` + `required`. */
export function mkDynamicValidators(field: MkDynamicFieldBase): ValidatorFn[] {
  const v = field.validators ?? {};
  const out: ValidatorFn[] = [];
  if (field.required) out.push(field.type === 'checkbox' || field.type === 'switch' ? Validators.requiredTrue : Validators.required);
  if (v.min !== undefined) out.push(Validators.min(v.min));
  if (v.max !== undefined) out.push(Validators.max(v.max));
  if (v.minLength !== undefined) out.push(Validators.minLength(v.minLength));
  if (v.maxLength !== undefined) out.push(Validators.maxLength(v.maxLength));
  if (v.pattern !== undefined) out.push(Validators.pattern(v.pattern));
  if (v.email || field.type === 'email') out.push(Validators.email);
  if (v.custom) out.push(...v.custom);
  return out;
}

/* ------------------------------------------------------------------------ */
/* Form construction                                                         */
/* ------------------------------------------------------------------------ */

/** Build the `FormControl` / `FormGroup` / `FormArray` for one field. */
export function mkDynamicControl(field: MkDynamicField, value?: unknown): AbstractControl {
  if (mkIsGroup(field)) return mkDynamicGroup(field.fields, value as Record<string, unknown> | undefined);
  if (mkIsArray(field)) {
    const items = (value as Record<string, unknown>[] | undefined) ?? field.default ?? [];
    return new FormArray(
      items.map((item) => mkDynamicGroup(field.fields, item)),
      arrayValidators(field),
    );
  }
  const f = field as MkDynamicFieldBase;
  const initial = value !== undefined ? value : f.default !== undefined ? f.default : mkDynamicEmptyValue(f);
  return new FormControl({ value: initial, disabled: !!f.disabled }, { validators: mkDynamicValidators(f) });
}

function arrayValidators(field: MkDynamicArray): ValidatorFn[] {
  const out: ValidatorFn[] = [];
  if (field.min) out.push((c) => ((c as FormArray).length < field.min! ? { minItems: { requiredLength: field.min, actualLength: (c as FormArray).length } } : null));
  if (field.max) out.push((c) => ((c as FormArray).length > field.max! ? { maxItems: { requiredLength: field.max, actualLength: (c as FormArray).length } } : null));
  return out;
}

/** A `FormGroup` for a field list; `value` (partial) overrides the defaults. */
export function mkDynamicGroup(fields: readonly MkDynamicField[], value?: Record<string, unknown>): FormGroup {
  const controls: Record<string, AbstractControl> = {};
  for (const f of fields) {
    if (mkIsSection(f)) continue;
    controls[f.key] = mkDynamicControl(f, value?.[f.key]);
  }
  return new FormGroup(controls);
}

/** Build the reactive form of a whole schema. */
export function mkDynamicForm(schema: MkDynamicSchema, value?: Record<string, unknown>): FormGroup {
  return mkDynamicGroup(schema.fields, value);
}

/* ------------------------------------------------------------------------ */
/* Conditions                                                                */
/* ------------------------------------------------------------------------ */

function read(value: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), value);
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '' || v === false || (Array.isArray(v) && v.length === 0);
}

/**
 * Evaluate a condition against a form value. `value` is normally the whole
 * form value; inside an array item the item's own value is used, with the
 * root available under `$root`.
 */
export function mkDynamicCondition(cond: MkDynamicCondition | undefined, value: Record<string, unknown>): boolean {
  if (cond === undefined) return true;
  if (typeof cond === 'function') return !!cond(value);
  if ('and' in cond) return cond.and.every((c) => mkDynamicCondition(c, value));
  if ('or' in cond) return cond.or.some((c) => mkDynamicCondition(c, value));
  if ('not' in cond) return !mkDynamicCondition(cond.not, value);
  const v = read(value, cond.field);
  if ('eq' in cond && v !== cond.eq) return false;
  if ('neq' in cond && v === cond.neq) return false;
  if (cond.in && !cond.in.includes(v)) return false;
  if (cond.notIn && cond.notIn.includes(v)) return false;
  if (cond.truthy !== undefined && !!v !== cond.truthy) return false;
  if (cond.empty !== undefined && isEmpty(v) !== cond.empty) return false;
  return true;
}

/* ------------------------------------------------------------------------ */
/* Introspection helpers                                                     */
/* ------------------------------------------------------------------------ */

/** Depth-first list of every value field with its dotted path. */
export function mkDynamicFlatten(
  fields: readonly MkDynamicField[],
  prefix = '',
): Array<{ path: string; field: MkDynamicFieldBase | MkDynamicGroup | MkDynamicArray }> {
  const out: Array<{ path: string; field: MkDynamicFieldBase | MkDynamicGroup | MkDynamicArray }> = [];
  for (const f of fields) {
    if (mkIsSection(f)) continue;
    const path = prefix ? `${prefix}.${f.key}` : f.key;
    out.push({ path, field: f });
    if (mkIsGroup(f)) out.push(...mkDynamicFlatten(f.fields, path));
  }
  return out;
}

/** Column span a field takes in a grid of `columns`. */
export function mkDynamicSpan(field: MkDynamicField, columns: number): number {
  const c = Math.min(12, Math.max(1, columns || 1));
  if (mkIsSection(field) || mkIsGroup(field) || mkIsArray(field)) return field.span ?? 12;
  const span = field.span ?? Math.round(12 / c);
  return Math.min(12, Math.max(1, span));
}

export type { MkDynamicGroup as MkDynamicGroupField };
