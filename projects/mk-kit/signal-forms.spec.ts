/**
 * Signal Forms conformance suite: every control that implements the
 * `FormValueControl` / `FormCheckboxControl` surface is bound to a real
 * `form()` through Angular's `[formField]` directive and checked for:
 *
 * 1. **Model → control** — `field().value.set()` reaches the control's own
 *    `value` / `checked` model (or the native element).
 * 2. **Control → model** — a user change reported by the control lands in
 *    the field (and the model signal behind it).
 * 3. **Disabled** — a `disabled()` rule in the schema disables the control,
 *    and lifting it re-enables.
 * 4. **Errors gated on touch** — a `required()` (or length / min) rule makes
 *    the field `invalid()` immediately, but the control only paints its
 *    invalid state once the field is touched — the same moment
 *    `mk-form-field` reveals the message and `submit()` reaches.
 * 5. **Required** — the schema's `required()` reaches the control's
 *    `required` input / `aria-required` where the control has one.
 */
import {
  Component,
  provideZonelessChangeDetection,
  signal,
  type Type,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  type SchemaPath,
  disabled,
  form,
  minLength,
  min,
  required,
} from '@angular/forms/signals';

import { MkInput } from '@mk-kit/ui/forms/input';
import { MkNumberInput } from '@mk-kit/ui/forms/number-input';
import { MkSelect } from '@mk-kit/ui/forms/select';
import { MkMultiSelect } from '@mk-kit/ui/forms/multi-select';
import { MkAutocomplete } from '@mk-kit/ui/forms/autocomplete';
import { MkCheckbox } from '@mk-kit/ui/checkbox';
import { MkSwitch } from '@mk-kit/ui/forms/switch';
import { MkRadio, MkRadioGroup } from '@mk-kit/ui/forms/radio';
import { MkSlider } from '@mk-kit/ui/forms/slider';
import { MkListbox } from '@mk-kit/ui/forms/listbox';
import { MkTagInput } from '@mk-kit/ui/forms/tag-input';
import { MkButtonToggle, MkButtonToggleGroup } from '@mk-kit/ui/forms/button-toggle';
import { MkDatePicker } from '@mk-kit/ui/datetime/date-picker';
import { MkTimePicker } from '@mk-kit/ui/datetime/time-picker';
import { MkDateTimePicker } from '@mk-kit/ui/datetime/datetime-picker';

/** One control under test. */
interface SignalCase {
  readonly name: string;
  readonly types: Type<unknown>[];
  /** Host template for the control; `[formField]="f.x"` is added by the suite. */
  readonly tag: string;
  readonly attrs?: string;
  readonly content?: string;
  /** The empty value the model starts with. */
  readonly initial: unknown;
  /** A value that must round-trip. */
  readonly filled: unknown;
  /** The rule that makes `initial` invalid (default: `required`). */
  readonly rule?: (p: SchemaPath<any>) => void;
  /** Reads the control's own view of the value. */
  readonly read?: (cmp: any, el: HTMLElement) => unknown;
  /** Reports a user change the way the control does (default: its CVA `onChange`). */
  readonly emit?: (cmp: any, el: HTMLElement, value: unknown) => void;
  /** Reads the control's disabled state. */
  readonly readDisabled?: (cmp: any, el: HTMLElement) => boolean;
  /** Whether the control exposes `isRequired()`. */
  readonly hasRequired?: boolean;
}

const OPTS = [
  { label: 'Alpha', value: 'a' },
  { label: 'Beta', value: 'b' },
];

const readValue = (cmp: any) => cmp.value();
const readChecked = (cmp: any) => cmp.checked();
const cvaEmit = (cmp: any, _el: HTMLElement, v: unknown) => cmp.onChange(v);
const nativeEmit = (_cmp: any, el: HTMLElement, v: unknown) => {
  (el as HTMLInputElement).value = String(v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
const D = new Date(2026, 0, 15, 9, 30);

const CASES: readonly SignalCase[] = [
  {
    name: 'input[mkInput]',
    types: [MkInput],
    tag: 'input',
    attrs: 'mkInput type="text"',
    initial: '',
    filled: 'ada',
    read: (_c, el) => (el as HTMLInputElement).value,
    emit: nativeEmit,
    readDisabled: (_c, el) => (el as HTMLInputElement).disabled,
  },
  {
    name: 'textarea[mkInput]',
    types: [MkInput],
    tag: 'textarea',
    attrs: 'mkInput',
    initial: '',
    filled: 'notes',
    read: (_c, el) => (el as HTMLTextAreaElement).value,
    emit: nativeEmit,
    readDisabled: (_c, el) => (el as HTMLTextAreaElement).disabled,
  },
  { name: 'mk-number-input', types: [MkNumberInput], tag: 'mk-number-input', initial: null, filled: 42, hasRequired: true },
  {
    name: 'mk-select',
    types: [MkSelect],
    tag: 'mk-select',
    attrs: '[options]="opts"',
    initial: null,
    filled: 'a',
    hasRequired: true,
  },
  {
    name: 'mk-multi-select',
    types: [MkMultiSelect],
    tag: 'mk-multi-select',
    attrs: '[options]="opts"',
    initial: [],
    filled: ['a'],
    rule: (p) => minLength(p, 1),
    hasRequired: true,
  },
  {
    name: 'mk-autocomplete',
    types: [MkAutocomplete],
    tag: 'mk-autocomplete',
    attrs: '[options]="opts"',
    initial: null,
    filled: 'a',
    hasRequired: true,
  },
  { name: 'mk-checkbox', types: [MkCheckbox], tag: 'mk-checkbox', content: 'Terms', initial: false, filled: true, read: readChecked, hasRequired: true },
  { name: 'mk-switch', types: [MkSwitch], tag: 'mk-switch', content: 'On', initial: false, filled: true, read: readChecked, hasRequired: true },
  {
    name: 'mk-radio-group',
    types: [MkRadioGroup, MkRadio],
    tag: 'mk-radio-group',
    content: '<mk-radio value="a">A</mk-radio><mk-radio value="b">B</mk-radio>',
    initial: null,
    filled: 'a',
    hasRequired: true,
  },
  {
    name: 'mk-slider',
    types: [MkSlider],
    tag: 'mk-slider',
    initial: 0,
    filled: 50,
    rule: (p) => min(p, 10),
    hasRequired: true,
  },
  { name: 'mk-listbox', types: [MkListbox], tag: 'mk-listbox', attrs: '[options]="opts"', initial: null, filled: 'a' },
  {
    name: 'mk-tag-input',
    types: [MkTagInput],
    tag: 'mk-tag-input',
    initial: [],
    filled: ['x'],
    rule: (p) => minLength(p, 1),
    hasRequired: true,
  },
  {
    name: 'mk-button-toggle-group',
    types: [MkButtonToggleGroup, MkButtonToggle],
    tag: 'mk-button-toggle-group',
    content: '<mk-button-toggle value="a">A</mk-button-toggle><mk-button-toggle value="b">B</mk-button-toggle>',
    initial: null,
    filled: 'a',
  },
  { name: 'mk-date-picker', types: [MkDatePicker], tag: 'mk-date-picker', initial: null, filled: new Date(2026, 0, 15), hasRequired: true },
  { name: 'mk-time-picker', types: [MkTimePicker], tag: 'mk-time-picker', initial: null, filled: '09:30', hasRequired: true },
  { name: 'mk-datetime-picker', types: [MkDateTimePicker], tag: 'mk-datetime-picker', initial: null, filled: D, hasRequired: true },
];

@Component({ template: '' })
class Host {
  readonly opts = OPTS;
  readonly off = signal(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model!: WritableSignal<{ x: any }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f!: ReturnType<typeof form<{ x: any }>>;
}

function mount(c: SignalCase) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const attrs = c.attrs ? ` ${c.attrs}` : '';
  const close = c.tag === 'input' ? '' : `${c.content ?? ''}</${c.tag}>`;
  const template = `<${c.tag} id="ctl"${attrs} [formField]="f.x">${close}`;
  TestBed.overrideComponent(Host, { set: { imports: [FormField, ...c.types], template } });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  host.model = signal({ x: c.initial });
  host.f = TestBed.runInInjectionContext(() =>
    form(host.model, (p) => {
      (c.rule ?? required)(p.x);
      disabled(p.x, { when: () => host.off() });
    }),
  );
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('#ctl') as HTMLElement;
  const cmp = fixture.debugElement.query((d) => d.nativeElement === el).componentInstance;
  return { fixture, host, el, cmp };
}

afterEach(() => TestBed.resetTestingModule());

describe('Signal Forms [formField] conformance', () => {
  for (const c of CASES) {
    describe(c.name, () => {
      it('writes the model value into the control', async () => {
        const { fixture, host, el, cmp } = mount(c);
        host.f.x().value.set(c.filled);
        fixture.detectChanges();
        await fixture.whenStable();
        expect((c.read ?? readValue)(cmp, el)).toEqual(c.filled);
      });

      it('writes a user change back into the field and the model', async () => {
        const { fixture, host, el, cmp } = mount(c);
        (c.emit ?? cvaEmit)(cmp, el, c.filled);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(host.f.x().value()).toEqual(c.filled);
        expect(host.model().x).toEqual(c.filled);
        expect(host.f.x().dirty()).toBe(true);
      });

      it('follows a disabled() rule', async () => {
        const { fixture, host, el, cmp } = mount(c);
        const readDisabled = c.readDisabled ?? ((cmp: any) => cmp.isDisabled());
        expect(readDisabled(cmp, el)).toBe(false);
        host.off.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(host.f.x().disabled()).toBe(true);
        expect(readDisabled(cmp, el)).toBe(true);
        host.off.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(readDisabled(cmp, el)).toBe(false);
      });

      it('shows the invalid state only once the field is touched', async () => {
        const { fixture, host, cmp } = mount(c);
        expect(host.f.x().invalid()).toBe(true);
        expect(host.f.x().errors().length).toBeGreaterThan(0);
        expect(cmp.isInvalid()).toBe(false);
        host.f.x().markAsTouched();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(cmp.isInvalid()).toBe(true);
        host.f.x().value.set(c.filled);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(host.f.x().invalid()).toBe(false);
        expect(cmp.isInvalid()).toBe(false);
      });

      if (c.hasRequired && !c.rule) {
        it('reflects the schema required() rule', () => {
          const { cmp } = mount(c);
          expect(cmp.isRequired()).toBe(true);
        });
      }
    });
  }
});
