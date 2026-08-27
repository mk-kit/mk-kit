import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkCheckbox } from '@mk-kit/ui/checkbox';
import {
  MkAutocomplete,
  MkButtonToggle,
  MkButtonToggleGroup,
  MkCodeEditor,
  MkColorPicker,
  MkCurrencyInput,
  MkFileUpload,
  MkFormField,
  MkInput,
  MkMultiSelect,
  MkNumberInput,
  MkPasswordInput,
  MkPhoneInput,
  MkRadio,
  MkRadioGroup,
  MkRating,
  MkSelect,
  MkSlider,
  MkSwitch,
  MkTagInput,
} from '@mk-kit/ui/forms';
import { MkDatePicker, MkDateTimePicker, MkTimePicker } from '@mk-kit/ui/datetime';
import {
  MkDynamicArray,
  MkDynamicField,
  MkDynamicFieldBase,
  MkDynamicGroup,
  MkDynamicSchema,
  mkIsArray,
  mkIsGroup,
  mkIsSection,
  mkIsValueField,
} from './dynamic-form.types';
import { mkDynamicCondition, mkDynamicForm, mkDynamicGroup, mkDynamicSpan } from './schema';

/** Context handed to a custom field template. */
export interface MkDynamicFieldContext {
  $implicit: MkDynamicFieldBase;
  field: MkDynamicFieldBase;
  /** The field's `FormControl` — bind it with `[formControl]`. */
  control: FormControl;
  /** The current value of the whole form (or array item). */
  value: Record<string, unknown>;
}

/**
 * Registers a renderer for a custom field type:
 *
 * ```html
 * <mk-dynamic-form [schema]="schema">
 *   <ng-template mkDynamicField="signature" let-field let-control="control">
 *     <mk-signature-pad [formControl]="control" />
 *   </ng-template>
 * </mk-dynamic-form>
 * ```
 *
 * A field `{ type: 'custom', key: 'sig', props: { renderer: 'signature' } }`
 * (or any built-in `type` you want to override) then renders this template
 * inside the usual `mk-form-field`.
 */
@Directive({ selector: 'ng-template[mkDynamicField]' })
export class MkDynamicFieldDef {
  /** The type (or `props.renderer` name) this template renders. */
  readonly mkDynamicField = input.required<string>();
  readonly template = inject<TemplateRef<MkDynamicFieldContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: MkDynamicFieldDef, ctx: unknown): ctx is MkDynamicFieldContext {
    return true;
  }
}

/**
 * Renders one field list (the root, a group, or one array item) as a grid.
 * Internal — projected by {@link MkDynamicForm}; recursive for groups/arrays.
 */
@Component({
  selector: 'mk-dynamic-fields',
  templateUrl: './dynamic-fields.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    MkButton,
    MkCheckbox,
    MkFormField,
    MkInput,
    MkNumberInput,
    MkCurrencyInput,
    MkSelect,
    MkMultiSelect,
    MkAutocomplete,
    MkRadioGroup,
    MkRadio,
    MkButtonToggleGroup,
    MkButtonToggle,
    MkSwitch,
    MkSlider,
    MkRating,
    MkColorPicker,
    MkTagInput,
    MkPhoneInput,
    MkFileUpload,
    MkCodeEditor,
    MkPasswordInput,
    MkDatePicker,
    MkTimePicker,
    MkDateTimePicker,
    forwardRef(() => MkDynamicFields),
  ],
  host: {
    class: 'mk-dynamic-fields',
    '[style.--mk-dyn-columns]': 'columns()',
  },
})
export class MkDynamicFields {
  private readonly root = inject(forwardRef(() => MkDynamicForm));
  protected readonly i18n = inject(MK_I18N);

  readonly fields = input.required<readonly MkDynamicField[]>();
  readonly group = input.required<FormGroup>();
  readonly columns = input(1, { transform: numberAttribute });
  /** Value the conditions of this level are evaluated against. */
  readonly scope = input.required<Record<string, unknown>>();

  protected readonly labelPosition = computed(() => this.root.labelPosition());
  protected readonly size = computed(() => this.root.size());

  protected control(f: MkDynamicField): AbstractControl {
    return this.group().get((f as MkDynamicFieldBase).key)!;
  }

  protected formGroup(f: MkDynamicGroup): FormGroup {
    return this.group().get(f.key) as FormGroup;
  }

  protected formArray(f: MkDynamicArray): FormArray<FormGroup> {
    return this.group().get(f.key) as FormArray<FormGroup>;
  }

  protected isVisible(f: MkDynamicField): boolean {
    return mkDynamicCondition(f.showWhen, this.scope());
  }

  protected span(f: MkDynamicField): number {
    return mkDynamicSpan(f, this.columns());
  }

  protected columnsOf(f: MkDynamicGroup | MkDynamicArray): number {
    return f.columns ?? this.columns();
  }

  protected isGroup = mkIsGroup;
  protected isArray = mkIsArray;
  protected isSection = mkIsSection;
  protected isValue = mkIsValueField;

  /** Custom template for a value field, if one is registered. */
  protected customTemplate(f: MkDynamicFieldBase): TemplateRef<MkDynamicFieldContext> | null {
    const name = (f.props?.['renderer'] as string | undefined) ?? f.type;
    return this.root.templateFor(name);
  }

  protected customContext(f: MkDynamicFieldBase): MkDynamicFieldContext {
    return { $implicit: f, field: f, control: this.control(f) as FormControl, value: this.scope() };
  }

  /** `props.x` with a typed default. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected p(f: MkDynamicFieldBase, key: string, fallback: unknown): any {
    const v = f.props?.[key];
    return v === undefined ? fallback : v;
  }

  protected inputType(f: MkDynamicFieldBase): string {
    return f.type === 'text' || f.type === 'textarea' ? 'text' : f.type;
  }

  protected itemScope(f: MkDynamicArray, index: number): Record<string, unknown> {
    const item = (this.formArray(f).at(index)?.getRawValue() ?? {}) as Record<string, unknown>;
    return { ...item, $root: this.scope()['$root'] ?? this.scope(), $index: index };
  }

  protected canAdd(f: MkDynamicArray): boolean {
    return !this.control(f).disabled && (!f.max || this.formArray(f).length < f.max);
  }

  protected canRemove(f: MkDynamicArray): boolean {
    return !this.control(f).disabled && this.formArray(f).length > (f.min ?? 0);
  }

  protected addItem(f: MkDynamicArray): void {
    const arr = this.formArray(f);
    arr.push(mkDynamicGroup(f.fields));
    arr.markAsDirty();
    this.root.sync();
  }

  protected removeItem(f: MkDynamicArray, index: number): void {
    const arr = this.formArray(f);
    arr.removeAt(index);
    arr.markAsDirty();
    this.root.sync();
  }

  protected trackItem(index: number, item: FormGroup): FormGroup {
    return item;
  }
}

/**
 * Dynamic form — renders a form from a JSON schema and manages one reactive
 * `FormGroup` for it. Every value field renders inside `mk-form-field`, so
 * labels, hints, required marks and localised validation messages come from
 * the schema alone.
 *
 * ```html
 * <mk-dynamic-form [schema]="schema" [(value)]="user" (formSubmit)="save($event)">
 *   <button mkButton type="submit">Save</button>
 * </mk-dynamic-form>
 * ```
 *
 * ```ts
 * schema: MkDynamicSchema = {
 *   columns: 2,
 *   fields: [
 *     { key: 'name', type: 'text', label: 'Name', required: true },
 *     { key: 'role', type: 'select', label: 'Role', options: roles },
 *     { key: 'company', type: 'text', label: 'Company', showWhen: { field: 'role', eq: 'b2b' } },
 *   ],
 * };
 * ```
 *
 * - Hidden fields (`showWhen` false) are disabled, so `value` only carries
 *   what the user can see; `form.getRawValue()` has everything.
 * - `form` is the live `FormGroup` for anything the schema does not cover.
 * - Custom field types: project an `ng-template[mkDynamicField]`.
 */
@Component({
  selector: 'mk-dynamic-form',
  templateUrl: './dynamic-form.html',
  styleUrl: './dynamic-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MkDynamicFields],
  host: {
    class: 'mk-dynamic-form',
    '[class.mk-dynamic-form--disabled]': 'disabled()',
  },
})
export class MkDynamicForm {
  private readonly destroyRef = inject(DestroyRef);

  /** The schema. Changing it rebuilds the form (values of surviving keys are kept). */
  readonly schema = input.required<MkDynamicSchema>();
  /** Two-way form value (visible, enabled fields only). */
  readonly value = model<Record<string, unknown>>({});
  /** Disable every control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Label placement forwarded to every `mk-form-field`. */
  readonly labelPosition = input<'top' | 'float'>('top');
  /** Control size forwarded to the fields. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Emits the value when the form is submitted and valid. */
  readonly formSubmit = output<Record<string, unknown>>();
  /** Emits when a submit is attempted while invalid (every control is marked touched). */
  readonly invalidSubmit = output<FormGroup>();

  private readonly defs = contentChildren(MkDynamicFieldDef, { descendants: true });

  private readonly formSignal = signal<FormGroup>(new FormGroup({}));
  private readonly formValue = signal<Record<string, unknown>>({});
  private subscription: { unsubscribe(): void } | null = null;
  private applying = false;

  /** The live reactive form. */
  get form(): FormGroup {
    return this.formSignal();
  }

  protected readonly formRef = computed(() => this.formSignal());
  /** Value including disabled fields — what conditions are evaluated against. */
  protected readonly scope = computed(() => this.formValue());
  protected readonly columns = computed(() => this.schema().columns ?? 1);
  protected readonly fields = computed(() => this.schema().fields);

  /** `true` while every control passes validation. */
  readonly valid = computed(() => {
    this.formValue();
    return this.formSignal().valid;
  });

  constructor() {
    // Rebuild on schema change, keeping the current value where keys survive.
    effect(() => {
      const schema = this.schema();
      const current = untracked(() => ({ ...this.formValue(), ...this.value() }));
      const form = mkDynamicForm(schema, current);
      untracked(() => this.attach(form));
    });
    // External value → form.
    effect(() => {
      const v = this.value();
      untracked(() => {
        if (this.applying) return;
        const form = this.formSignal();
        if (!shallowEqual(v, form.value as Record<string, unknown>)) {
          form.patchValue(v ?? {}, { emitEvent: true });
        }
      });
    });
    // Disabled input.
    effect(() => {
      const disabled = this.disabled();
      untracked(() => {
        const form = this.formSignal();
        if (disabled) form.disable({ emitEvent: false });
        else form.enable({ emitEvent: false });
        this.applyConditions(form, this.schema().fields, form.getRawValue() as Record<string, unknown>);
        this.sync();
      });
    });
    this.destroyRef.onDestroy(() => this.subscription?.unsubscribe());
  }

  private attach(form: FormGroup): void {
    this.subscription?.unsubscribe();
    this.subscription = form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sync());
    this.formSignal.set(form);
    if (this.disabled()) form.disable({ emitEvent: false });
    this.sync();
  }

  /** Re-evaluate conditions and push the form value to `value`. @internal */
  sync(): void {
    const form = this.formSignal();
    const raw = form.getRawValue() as Record<string, unknown>;
    this.applyConditions(form, this.schema().fields, raw);
    this.formValue.set(raw);
    const visible = form.value as Record<string, unknown>;
    if (!shallowEqual(visible, this.value())) {
      this.applying = true;
      try {
        this.value.set(visible);
      } finally {
        this.applying = false;
      }
    }
  }

  private applyConditions(group: FormGroup, fields: readonly MkDynamicField[], scope: Record<string, unknown>): void {
    if (this.disabled()) return;
    for (const f of fields) {
      if (mkIsSection(f)) continue;
      const ctrl = group.get(f.key);
      if (!ctrl) continue;
      const visible = mkDynamicCondition(f.showWhen, scope);
      const disabled = !visible || mkDynamicCondition(f.disabledWhen ?? (() => false), scope) || (mkIsValueField(f) && !!f.disabled);
      if (disabled && ctrl.enabled) ctrl.disable({ emitEvent: false });
      else if (!disabled && ctrl.disabled) ctrl.enable({ emitEvent: false });
      if (visible && mkIsGroup(f)) this.applyConditions(ctrl as FormGroup, f.fields, scope);
      if (visible && mkIsArray(f)) {
        for (const item of (ctrl as FormArray<FormGroup>).controls) {
          this.applyConditions(item, f.fields, { ...(item.getRawValue() as Record<string, unknown>), $root: scope });
        }
      }
    }
  }

  /** Template registered for a custom type / renderer name. @internal */
  templateFor(name: string): TemplateRef<MkDynamicFieldContext> | null {
    return this.defs().find((d) => d.mkDynamicField() === name)?.template ?? null;
  }

  /** Patch part of the value. */
  patch(value: Record<string, unknown>): void {
    this.form.patchValue(value);
    this.sync();
  }

  /** Reset to the schema defaults (or the given value). */
  reset(value?: Record<string, unknown>): void {
    const form = mkDynamicForm(this.schema(), value);
    this.attach(form);
  }

  /** Mark every control touched so validation messages show. */
  touchAll(): void {
    this.form.markAllAsTouched();
    this.formValue.set({ ...this.form.getRawValue() });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const form = this.form;
    if (form.valid) {
      this.formSubmit.emit(form.value as Record<string, unknown>);
    } else {
      this.touchAll();
      this.invalidSubmit.emit(form);
    }
  }
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    const x = (a as Record<string, unknown>)[k];
    const y = (b as Record<string, unknown>)[k];
    if (x === y) continue;
    if (x && y && typeof x === 'object' && typeof y === 'object') {
      if (JSON.stringify(x) !== JSON.stringify(y)) return false;
      continue;
    }
    return false;
  }
  return true;
}
