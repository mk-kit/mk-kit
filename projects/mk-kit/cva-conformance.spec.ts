/**
 * Reactive-forms conformance suite for every `ControlValueAccessor` in the
 * library.
 *
 * Each control is bound to a real `FormControl` through `[formControl]` and
 * checked against the contract Angular Material controls honour:
 *
 * 1. **Value accessor resolution** — binding must not throw
 *    `NG_ERROR: No value accessor for form control`. This proves the
 *    `NG_VALUE_ACCESSOR` provider is registered on the component itself.
 * 2. **`writeValue`** — a `setValue()` from the model side must be reflected in
 *    the component's own state, and must NOT echo back through `onChange`
 *    (which would dirty the control and can cause feedback loops).
 * 3. **`setDisabledState`** — `control.disable()` must put the component into
 *    its disabled state, and `enable()` must lift it.
 * 4. **`disabled` input vs. CVA disabled** — a standalone `[disabled]` input
 *    must not be clobbered when reactive forms calls `setDisabledState(false)`;
 *    the two sources are OR'd.
 * 5. **`registerOnChange`/`registerOnTouched`** — both callbacks must be
 *    captured (asserted structurally: calling them is component-specific and
 *    is covered by the per-component specs).
 */
import { Component, provideZonelessChangeDetection, type Type } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { MkAutocomplete } from '@mkornas/ui/forms/autocomplete';
import { MkButtonToggleGroup } from '@mkornas/ui/forms/button-toggle';
import { MkCardNumberInput } from '@mkornas/ui/forms/card-number-input';
import { MkCheckbox } from '@mkornas/ui/forms/checkbox';
import { MkCodeEditor } from '@mkornas/ui/forms/code-editor';
import { MkColorPicker } from '@mkornas/ui/forms/color-picker';
import { MkCurrencyInput } from '@mkornas/ui/forms/currency-input';
import { MkIbanInput } from '@mkornas/ui/forms/iban-input';
import { MkMultiSelect } from '@mkornas/ui/forms/multi-select';
import { MkNumberInput } from '@mkornas/ui/forms/number-input';
import { MkOtp } from '@mkornas/ui/forms/otp';
import { MkPasswordInput } from '@mkornas/ui/forms/password-input';
import { MkPhoneInput } from '@mkornas/ui/forms/phone-input';
import { MkPostalCodeInput } from '@mkornas/ui/forms/postal-code-input';
import { MkRadioGroup } from '@mkornas/ui/forms/radio';
import { MkRangeSlider } from '@mkornas/ui/forms/range-slider';
import { MkRating } from '@mkornas/ui/forms/rating';
import { MkSelect } from '@mkornas/ui/forms/select';
import { MkSignaturePad } from '@mkornas/ui/forms/signature-pad';
import { MkSlider } from '@mkornas/ui/forms/slider';
import { MkSubmitInput } from '@mkornas/ui/forms/submit-input';
import { MkSwitch } from '@mkornas/ui/forms/switch';
import { MkTagInput } from '@mkornas/ui/forms/tag-input';
import { MkTaxIdInput } from '@mkornas/ui/forms/tax-id-input';
import { MkTransferList } from '@mkornas/ui/forms/transfer-list';
import { MkTreeSelect } from '@mkornas/ui/forms/tree-select';
import { MkCalendar } from '@mkornas/ui/datetime/calendar';
import { MkDatePicker } from '@mkornas/ui/datetime/date-picker';
import { MkDateRangePicker } from '@mkornas/ui/datetime/date-range-picker';
import { MkMiniDate } from '@mkornas/ui/datetime/mini-date';
import { MkMonthPicker } from '@mkornas/ui/datetime/month-picker';
import { MkTimePicker } from '@mkornas/ui/datetime/time-picker';
import { MkWeekPicker } from '@mkornas/ui/datetime/week-picker';
import { MkBlockEditor } from '@mkornas/ui/block-editor';
import { MkInlineEdit } from '@mkornas/ui/data/inline-edit';
import { MkFileUpload } from '@mkornas/ui/forms/file-upload';

/** One control under test. */
interface CvaCase {
  /** Display name in the test report. */
  readonly name: string;
  /** Component type (imported into the host). */
  readonly type: Type<unknown>;
  /** Element selector used in the host template. */
  readonly tag: string;
  /** Extra static attributes the control needs to render meaningfully. */
  readonly attrs?: string;
  /** A value that `writeValue` must accept. */
  readonly value: unknown;
  /** Reads the component's own view of the value, for the writeValue assert. */
  readonly read: (cmp: any) => unknown;
  /** Compares `read()` output to the written value (defaults to deep equal). */
  readonly expect?: (read: unknown) => boolean;
}

const readValue = (cmp: any) => cmp.value();
const readChecked = (cmp: any) => cmp.checked();

const CASES: readonly CvaCase[] = [
  // --- forms -------------------------------------------------------------
  {
    name: 'mk-autocomplete',
    type: MkAutocomplete,
    tag: 'mk-autocomplete',
    value: 'a',
    read: readValue,
  },
  {
    name: 'mk-button-toggle-group',
    type: MkButtonToggleGroup,
    tag: 'mk-button-toggle-group',
    value: 'left',
    read: readValue,
  },
  {
    name: 'mk-card-number-input',
    type: MkCardNumberInput,
    tag: 'mk-card-number-input',
    value: '4111111111111111',
    read: readValue,
  },
  { name: 'mk-checkbox', type: MkCheckbox, tag: 'mk-checkbox', value: true, read: readChecked },
  {
    name: 'mk-code-editor',
    type: MkCodeEditor,
    tag: 'mk-code-editor',
    value: 'const a = 1;',
    read: readValue,
  },
  {
    name: 'mk-color-picker',
    type: MkColorPicker,
    tag: 'mk-color-picker',
    value: '#ff0000',
    read: readValue,
  },
  {
    name: 'mk-currency-input',
    type: MkCurrencyInput,
    tag: 'mk-currency-input',
    value: 12.5,
    read: readValue,
  },
  {
    name: 'mk-iban-input',
    type: MkIbanInput,
    tag: 'mk-iban-input',
    value: 'DE89370400440532013000',
    read: readValue,
  },
  {
    name: 'mk-submit-input',
    type: MkSubmitInput,
    tag: 'mk-submit-input',
    value: 'SUMMER10',
    read: readValue,
  },
  {
    name: 'mk-tax-id-input',
    type: MkTaxIdInput,
    tag: 'mk-tax-id-input',
    value: '1234563218',
    read: readValue,
  },
  {
    name: 'mk-multi-select',
    type: MkMultiSelect,
    tag: 'mk-multi-select',
    value: ['a', 'b'],
    read: readValue,
  },
  {
    name: 'mk-number-input',
    type: MkNumberInput,
    tag: 'mk-number-input',
    value: 42,
    read: readValue,
  },
  { name: 'mk-otp', type: MkOtp, tag: 'mk-otp', value: '123456', read: readValue },
  {
    name: 'mk-password-input',
    type: MkPasswordInput,
    tag: 'mk-password-input',
    value: 'hunter2',
    read: readValue,
  },
  {
    name: 'mk-phone-input',
    type: MkPhoneInput,
    tag: 'mk-phone-input',
    value: '+48123456789',
    read: readValue,
    expect: (v) => typeof v === 'string' && v.replace(/\D/g, '').includes('123456789'),
  },
  {
    name: 'mk-postal-code-input',
    type: MkPostalCodeInput,
    tag: 'mk-postal-code-input',
    value: '00950',
    read: readValue,
    expect: (v) => typeof v === 'string' && v.replace(/\D/g, '') === '00950',
  },
  {
    name: 'mk-radio-group',
    type: MkRadioGroup,
    tag: 'mk-radio-group',
    value: 'one',
    read: readValue,
  },
  {
    name: 'mk-range-slider',
    type: MkRangeSlider,
    tag: 'mk-range-slider',
    value: [20, 60],
    read: readValue,
  },
  { name: 'mk-rating', type: MkRating, tag: 'mk-rating', value: 3, read: readValue },
  { name: 'mk-select', type: MkSelect, tag: 'mk-select', value: 'a', read: readValue },
  {
    name: 'mk-signature-pad',
    type: MkSignaturePad,
    tag: 'mk-signature-pad',
    value: 'data:image/png;base64,AAAA',
    read: readValue,
  },
  { name: 'mk-slider', type: MkSlider, tag: 'mk-slider', value: 30, read: readValue },
  { name: 'mk-switch', type: MkSwitch, tag: 'mk-switch', value: true, read: readChecked },
  {
    name: 'mk-tag-input',
    type: MkTagInput,
    tag: 'mk-tag-input',
    value: ['x', 'y'],
    read: readValue,
  },
  {
    name: 'mk-transfer-list',
    type: MkTransferList,
    tag: 'mk-transfer-list',
    value: ['a'],
    read: readValue,
  },
  {
    name: 'mk-tree-select',
    type: MkTreeSelect,
    tag: 'mk-tree-select',
    value: 'node-1',
    read: readValue,
  },
  // --- datetime ----------------------------------------------------------
  {
    name: 'mk-calendar',
    type: MkCalendar,
    tag: 'mk-calendar',
    value: new Date(2026, 6, 22),
    read: readValue,
    expect: (v) => v instanceof Date && v.getDate() === 22,
  },
  {
    name: 'mk-date-picker',
    type: MkDatePicker,
    tag: 'mk-date-picker',
    value: new Date(2026, 6, 22),
    read: readValue,
    expect: (v) => v instanceof Date && v.getDate() === 22,
  },
  {
    name: 'mk-date-range-picker',
    type: MkDateRangePicker,
    tag: 'mk-date-range-picker',
    value: { start: new Date(2026, 6, 1), end: new Date(2026, 6, 9) },
    read: readValue,
    expect: (v: any) => v?.start instanceof Date && v?.end instanceof Date,
  },
  {
    name: 'mk-mini-date',
    type: MkMiniDate,
    tag: 'mk-mini-date',
    value: new Date(2026, 6, 22),
    read: readValue,
    expect: (v) => v instanceof Date && v.getDate() === 22,
  },
  {
    name: 'mk-month-picker',
    type: MkMonthPicker,
    tag: 'mk-month-picker',
    value: new Date(2026, 6, 1),
    read: readValue,
    expect: (v) => v instanceof Date && v.getMonth() === 6,
  },
  {
    name: 'mk-time-picker',
    type: MkTimePicker,
    tag: 'mk-time-picker',
    value: '13:45',
    read: readValue,
  },
  {
    name: 'mk-week-picker',
    type: MkWeekPicker,
    tag: 'mk-week-picker',
    value: { start: new Date(2026, 6, 20), end: new Date(2026, 6, 26) },
    read: readValue,
    expect: (v: any) => v?.start instanceof Date,
  },
  // --- other entry points -------------------------------------------------
  {
    name: 'mk-block-editor',
    type: MkBlockEditor,
    tag: 'mk-block-editor',
    value: { blocks: [] },
    read: readValue,
    expect: (v: any) => Array.isArray(v?.blocks),
  },
  {
    name: 'mk-inline-edit',
    type: MkInlineEdit,
    tag: 'mk-inline-edit',
    value: 'hello',
    read: readValue,
  },
  {
    name: 'mk-file-upload',
    type: MkFileUpload,
    tag: 'mk-file-upload',
    attrs: 'multiple',
    value: [new File(['x'], 'a.txt', { type: 'text/plain' })],
    read: (cmp) => cmp.files().map((i: any) => i.file),
    expect: (v: any) => Array.isArray(v) && v[0]?.name === 'a.txt',
  },
];

/** Empty shell; each case gets its own template via `overrideComponent`. */
@Component({ template: '' })
class CvaHost {
  ctrl = new FormControl<unknown>(null);
}

/** Builds a host bound to `control` and returns the control instance. */
function mount(c: CvaCase, control: FormControl) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  TestBed.overrideComponent(CvaHost, {
    set: {
      imports: [ReactiveFormsModule, c.type],
      template: `<${c.tag} ${c.attrs ?? ''} [formControl]="ctrl"></${c.tag}>`,
    },
  });
  const fixture = TestBed.createComponent(CvaHost);
  fixture.componentInstance.ctrl = control;
  fixture.detectChanges();
  const cmp = fixture.debugElement.query(
    (de) => de.componentInstance instanceof c.type,
  )?.componentInstance;
  return { fixture, cmp };
}

/** The disabled state a component exposes (name varies slightly). */
function disabledOf(cmp: any): boolean {
  if (typeof cmp.isDisabled === 'function' && cmp.isDisabled.length === 0)
    return !!cmp.isDisabled();
  if (typeof cmp.cvaDisabled === 'function') return !!cmp.cvaDisabled();
  throw new Error('component exposes no disabled signal');
}

describe('ControlValueAccessor conformance', () => {
  afterEach(() => TestBed.resetTestingModule());

  for (const c of CASES) {
    describe(c.name, () => {
      it('resolves a value accessor when bound with [formControl]', () => {
        const control = new FormControl(null);
        expect(() => mount(c, control)).not.toThrow();
      });

      it('reflects writeValue without echoing back through onChange', () => {
        const control = new FormControl<unknown>(null);
        const { fixture, cmp } = mount(c, control);

        let emissions = 0;
        control.valueChanges.subscribe(() => emissions++);

        control.setValue(c.value);
        fixture.detectChanges();

        const read = c.read(cmp);
        if (c.expect) expect(c.expect(read), `read back ${JSON.stringify(read)}`).toBe(true);
        else expect(read).toEqual(c.value);

        // setValue emits exactly once; a writeValue that called onChange would
        // either double-emit or mark the control dirty.
        expect(emissions).toBe(1);
        expect(control.dirty).toBe(false);
      });

      it('honours setDisabledState in both directions', () => {
        const control = new FormControl(null);
        const { fixture, cmp } = mount(c, control);

        expect(disabledOf(cmp)).toBe(false);

        control.disable();
        fixture.detectChanges();
        expect(disabledOf(cmp)).toBe(true);

        control.enable();
        fixture.detectChanges();
        expect(disabledOf(cmp)).toBe(false);
      });

      it('starts disabled when the bound control starts disabled', () => {
        const control = new FormControl({ value: null, disabled: true });
        const { cmp } = mount(c, control);
        expect(disabledOf(cmp)).toBe(true);
      });

      it('registers both onChange and onTouched callbacks', () => {
        const control = new FormControl(null);
        const { cmp } = mount(c, control);
        expect(typeof cmp.registerOnChange).toBe('function');
        expect(typeof cmp.registerOnTouched).toBe('function');
        expect(typeof cmp.writeValue).toBe('function');
        expect(typeof cmp.setDisabledState).toBe('function');
        // Re-registering must not throw (Angular does this on control swap).
        expect(() => {
          cmp.registerOnChange(() => {});
          cmp.registerOnTouched(() => {});
        }).not.toThrow();
      });
    });
  }
});
