import { FormControl } from '@angular/forms';
import {
  type FieldContext,
  type Schema,
  type SchemaPath,
  type ValidationError,
  applyEach,
  disabled,
  email,
  hidden,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  type MkDynamicArray,
  type MkDynamicField,
  type MkDynamicFieldBase,
  type MkDynamicSchema,
  mkIsArray,
  mkIsGroup,
  mkIsSection,
} from './dynamic-form.types';
import { mkDynamicCondition } from './schema';

/** Any schema path — the dynamic schema is untyped, so rules are bound loosely. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPath = SchemaPath<any>;
/** A field-path tree indexed by the dynamic schema's keys. */
type PathTree = Record<string, AnyPath | undefined>;

/**
 * Converts an `mk-dynamic-form` schema into a Signal Forms `Schema`, so the
 * same JSON definition can drive `form()` from `@angular/forms/signals`:
 *
 * ```ts
 * const definition: MkDynamicSchema = { fields: [ … ] };
 * const model = signal(mkDynamicDefaults(definition.fields));
 * const f = form(model, mkDynamicFormToSignalSchema(definition));
 * ```
 *
 * What maps:
 * - `required` → `required()` (for `checkbox` / `switch` this means "must be
 *   on", as Signal Forms treats `false` as empty — the `requiredTrue`
 *   behaviour of the renderer);
 * - `validators.min` / `max` / `minLength` / `maxLength` / `pattern` / `email`
 *   (and `type: 'email'`) → the matching built-in rules, so the field's
 *   `min()` / `maxLength()` / `pattern()` state is set as well;
 * - `validators.custom` → `validate()` running each `ValidatorFn` against a
 *   throw-away `FormControl` holding the field's value; the reactive error
 *   keys become error `kind`s with their payload attached, so
 *   `mk-form-field` renders them through the same i18n table;
 * - `disabled: true` and `disabledWhen` → `disabled()`, `showWhen` →
 *   `hidden()` — the condition is evaluated against the form value exactly as
 *   the renderer does it (dotted paths, `and` / `or` / `not`, and inside an
 *   array item the item's own value with the root under `$root` and the
 *   position under `$index`);
 * - `group` → the nested fields under the group's key, `array` → `applyEach`
 *   over the items plus `minItems` / `maxItems` errors from `min` / `max`.
 *
 * What differs from the renderer: a hidden Signal Forms field is skipped for
 * validation and touched / dirty state but **keeps its value in the model**
 * (the model is your data — nothing is stripped), so remove hidden controls
 * from the template with `@if (!f.company().hidden())` and drop the value
 * yourself before saving if it must not be sent. Layout properties (`span`,
 * `columns`), `options`, `props` and `section` entries have no schema
 * equivalent and are ignored.
 *
 * @param definition The dynamic-form schema, or just its `fields`.
 * @template TModel The model type the schema binds to (defaults to a loose record).
 */
export function mkDynamicFormToSignalSchema<TModel extends object = Record<string, unknown>>(
  definition: MkDynamicSchema | readonly MkDynamicField[],
): Schema<TModel> {
  const fields = Array.isArray(definition) ? definition : (definition as MkDynamicSchema).fields;
  return schema<TModel>((root) => {
    const rootPath = root as unknown as AnyPath;
    applyFields(root as unknown as PathTree, fields, (ctx) => ctx.valueOf(rootPath) as Record<string, unknown>);
  });
}

/** The condition scope of a field: the value the condition's dotted paths are resolved in. */
type ScopeFn = (ctx: FieldContext<unknown>) => Record<string, unknown>;

function applyFields(tree: PathTree, fields: readonly MkDynamicField[], scopeOf: ScopeFn): void {
  for (const f of fields) {
    if (mkIsSection(f)) continue;
    const path = tree[f.key];
    if (!path) continue;

    if (f.showWhen !== undefined) {
      const cond = f.showWhen;
      hidden(path, { when: (ctx) => !mkDynamicCondition(cond, scopeOf(ctx)) });
    }
    if (f.disabledWhen !== undefined) {
      const cond = f.disabledWhen;
      disabled(path, { when: (ctx) => mkDynamicCondition(cond, scopeOf(ctx)) });
    }

    if (mkIsGroup(f)) {
      applyFields(path as unknown as PathTree, f.fields, scopeOf);
    } else if (mkIsArray(f)) {
      applyArray(path, f, scopeOf);
    } else {
      applyValueField(path, f);
    }
  }
}

function applyArray(path: AnyPath, f: MkDynamicArray, scopeOf: ScopeFn): void {
  if (f.min || f.max) {
    const minItems = f.min;
    const maxItems = f.max;
    validate(path, (ctx) => {
      const length = (ctx.value() as unknown[] | null)?.length ?? 0;
      if (minItems && length < minItems) {
        return customError('minItems', { requiredLength: minItems, actualLength: length });
      }
      if (maxItems && length > maxItems) {
        return customError('maxItems', { requiredLength: maxItems, actualLength: length });
      }
      return undefined;
    });
  }
  const itemPath = path as unknown as AnyPath;
  applyEach(itemPath, (item) => {
    const itemScope: ScopeFn = (ctx) => ({
      ...(ctx.valueOf(item as unknown as AnyPath) as Record<string, unknown>),
      $root: scopeOf(ctx),
      $index: ctx.stateOf(item as unknown as AnyPath).keyInParent(),
    });
    applyFields(item as unknown as PathTree, f.fields, itemScope);
  });
}

function applyValueField(path: AnyPath, f: MkDynamicFieldBase): void {
  const v = f.validators ?? {};
  if (f.required) required(path);
  if (f.disabled) disabled(path);
  if (v.min !== undefined) min(path, v.min);
  if (v.max !== undefined) max(path, v.max);
  if (v.minLength !== undefined) minLength(path, v.minLength);
  if (v.maxLength !== undefined) maxLength(path, v.maxLength);
  if (v.pattern !== undefined) {
    pattern(path, typeof v.pattern === 'string' ? new RegExp(v.pattern) : v.pattern);
  }
  if (v.email || f.type === 'email') email(path);
  if (v.custom?.length) {
    const fns = v.custom;
    validate(path, (ctx) => {
      const control = new FormControl(ctx.value());
      const out: ValidationError.WithoutFieldTree[] = [];
      for (const fn of fns) {
        const errors = fn(control);
        if (!errors) continue;
        for (const [kind, payload] of Object.entries(errors)) {
          out.push(customError(kind, payload));
        }
      }
      return out.length ? out : undefined;
    });
  }
}

/**
 * A validation error of the given kind carrying a reactive-forms payload
 * (`{ requiredLength, actualLength }`, `true`, …) spread onto the error so
 * per-key `errorMessages` functions receive what they always did.
 */
function customError(kind: string, payload: unknown): ValidationError.WithoutFieldTree {
  const err: Record<string, unknown> = { kind };
  if (payload && typeof payload === 'object') Object.assign(err, payload);
  return err as unknown as ValidationError.WithoutFieldTree;
}
