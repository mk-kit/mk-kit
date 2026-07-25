/**
 * Reactive-forms integration tests for the behaviour mk-kit controls share
 * with Angular Material: constraint inputs surfacing as validation errors,
 * `mk-form-field` deriving its own error/required/disabled state from the
 * projected control, touched-on-blur, and `mk-form-error-summary` collecting
 * a whole form.
 *
 * The per-control CVA contract itself lives in `cva-conformance.spec.ts`.
 */
import {
  Component,
  provideZonelessChangeDetection,
  signal,
  type Type,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { MkFormField } from '@mkornas/ui/forms/form-field';
import { MkFormErrorSummary } from '@mkornas/ui/forms/form-error-summary';
import { MkInput } from '@mkornas/ui/forms/input';
import { MkNumberInput } from '@mkornas/ui/forms/number-input';
import { MkCurrencyInput } from '@mkornas/ui/forms/currency-input';
import { MkSlider } from '@mkornas/ui/forms/slider';
import { MkRangeSlider } from '@mkornas/ui/forms/range-slider';
import { MkRating } from '@mkornas/ui/forms/rating';
import { MkMultiSelect } from '@mkornas/ui/forms/multi-select';
import { MkTagInput } from '@mkornas/ui/forms/tag-input';
import { MkPasswordInput } from '@mkornas/ui/forms/password-input';
import { MkOtp } from '@mkornas/ui/forms/otp';
import { MkCheckbox } from '@mkornas/ui/forms/checkbox';
import { MkRadioGroup } from '@mkornas/ui/forms/radio';
import { MkCardNumberInput } from '@mkornas/ui/forms/card-number-input';
import { MkIbanInput } from '@mkornas/ui/forms/iban-input';
import { MkPostalCodeInput } from '@mkornas/ui/forms/postal-code-input';
import { MkTaxIdInput } from '@mkornas/ui/forms/tax-id-input';
import { MkFileUpload } from '@mkornas/ui/forms/file-upload';
import { MkButtonToggleGroup } from '@mkornas/ui/forms/button-toggle';
import { MkTransferList } from '@mkornas/ui/forms/transfer-list';
import { MkSignaturePad } from '@mkornas/ui/forms/signature-pad';
import { MkDatePicker } from '@mkornas/ui/datetime/date-picker';
import { MkMonthPicker } from '@mkornas/ui/datetime/month-picker';
import { MkWeekPicker } from '@mkornas/ui/datetime/week-picker';
import { MkDateRangePicker } from '@mkornas/ui/datetime/date-range-picker';
import { MkTimePicker } from '@mkornas/ui/datetime/time-picker';
import { MkCalendar } from '@mkornas/ui/datetime/calendar';
import { MkMiniDate } from '@mkornas/ui/datetime/mini-date';

/** Empty shell; each case supplies its own template via `overrideComponent`. */
@Component({ template: '' })
class Host {
  ctrl = new FormControl<unknown>(null);
  form: FormGroup = new FormGroup({});
  submitted = false;
}

function mount(imports: Type<unknown>[], template: string) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  TestBed.overrideComponent(Host, {
    set: { imports: [ReactiveFormsModule, ...imports], template },
  });
  const fixture = TestBed.createComponent(Host);
  return fixture;
}

afterEach(() => TestBed.resetTestingModule());

// ---------------------------------------------------------------------------
// 1. Constraint inputs surface as validation errors
// ---------------------------------------------------------------------------

interface ValidatorCase {
  readonly name: string;
  readonly type: Type<unknown>;
  /** Element with its constraint inputs bound, minus `[formControl]`. */
  readonly template: string;
  /** A value that must trip the validator. */
  readonly bad: unknown;
  /** The error key it must report. */
  readonly key: string;
  /** A value that must pass. */
  readonly good: unknown;
}

const D = (y: number, m: number, d: number) => new Date(y, m, d);

const VALIDATOR_CASES: readonly ValidatorCase[] = [
  {
    name: 'mk-number-input [min]',
    type: MkNumberInput,
    template: '<mk-number-input [min]="10" [formControl]="ctrl" />',
    bad: 4,
    key: 'min',
    good: 12,
  },
  {
    name: 'mk-number-input [max]',
    type: MkNumberInput,
    template: '<mk-number-input [max]="10" [formControl]="ctrl" />',
    bad: 40,
    key: 'max',
    good: 9,
  },
  {
    name: 'mk-currency-input [min]',
    type: MkCurrencyInput,
    template: '<mk-currency-input [min]="10" [formControl]="ctrl" />',
    bad: 4.5,
    key: 'min',
    good: 10,
  },
  {
    name: 'mk-slider [max]',
    type: MkSlider,
    template: '<mk-slider [max]="50" [formControl]="ctrl" />',
    bad: 80,
    key: 'max',
    good: 20,
  },
  {
    name: 'mk-range-slider [max]',
    type: MkRangeSlider,
    template: '<mk-range-slider [max]="50" [formControl]="ctrl" />',
    bad: [10, 80],
    key: 'max',
    good: [10, 40],
  },
  {
    name: 'mk-rating [max]',
    type: MkRating,
    template: '<mk-rating [max]="5" [formControl]="ctrl" />',
    bad: 7,
    key: 'max',
    good: 4,
  },
  {
    name: 'mk-multi-select [max]',
    type: MkMultiSelect,
    template: '<mk-multi-select [max]="2" [formControl]="ctrl" />',
    bad: ['a', 'b', 'c'],
    key: 'mkMaxItems',
    good: ['a', 'b'],
  },
  {
    name: 'mk-tag-input [max]',
    type: MkTagInput,
    template: '<mk-tag-input [max]="2" [formControl]="ctrl" />',
    bad: ['a', 'b', 'c'],
    key: 'mkMaxItems',
    good: ['a'],
  },
  {
    name: 'mk-password-input [minLength]',
    type: MkPasswordInput,
    template: '<mk-password-input [minLength]="8" [formControl]="ctrl" />',
    bad: 'short',
    key: 'minlength',
    good: 'longenough1',
  },
  {
    name: 'mk-otp [length]',
    type: MkOtp,
    template: '<mk-otp [length]="6" [formControl]="ctrl" />',
    bad: '123',
    key: 'minlength',
    good: '123456',
  },
  {
    name: 'mk-checkbox required',
    type: MkCheckbox,
    template: '<mk-checkbox required [formControl]="ctrl" />',
    bad: false,
    key: 'required',
    good: true,
  },
  {
    name: 'mk-radio-group required',
    type: MkRadioGroup,
    template: '<mk-radio-group required [formControl]="ctrl" />',
    bad: null,
    key: 'required',
    good: 'a',
  },
  {
    name: 'mk-card-number-input Luhn',
    type: MkCardNumberInput,
    template: '<mk-card-number-input [formControl]="ctrl" />',
    bad: '4111111111111112',
    key: 'cardNumber',
    good: '4111111111111111',
  },
  {
    name: 'mk-iban-input checksum',
    type: MkIbanInput,
    template: '<mk-iban-input [formControl]="ctrl" />',
    bad: 'DE89370400440532013001',
    key: 'iban',
    good: 'DE89370400440532013000',
  },
  {
    name: 'mk-tax-id-input NIP checksum',
    type: MkTaxIdInput,
    template: '<mk-tax-id-input country="PL" [formControl]="ctrl" />',
    bad: '1234563219',
    key: 'taxId',
    good: '1234563218',
  },
  {
    name: 'mk-postal-code-input format',
    type: MkPostalCodeInput,
    template: '<mk-postal-code-input country="PL" [formControl]="ctrl" />',
    bad: '00950',
    key: 'postalCode',
    good: '00-950',
  },
  {
    name: 'mk-date-picker [min]',
    type: MkDatePicker,
    template: '<mk-date-picker [min]="min" [formControl]="ctrl" />',
    bad: D(2026, 0, 1),
    key: 'mkMinDate',
    good: D(2026, 6, 1),
  },
  {
    name: 'mk-mini-date [max]',
    type: MkMiniDate,
    template: '<mk-mini-date [max]="max" [formControl]="ctrl" />',
    bad: D(2027, 0, 1),
    key: 'mkMaxDate',
    good: D(2026, 6, 1),
  },
  {
    name: 'mk-calendar [min]',
    type: MkCalendar,
    template: '<mk-calendar [min]="min" [formControl]="ctrl" />',
    bad: D(2026, 0, 1),
    key: 'mkMinDate',
    good: D(2026, 6, 1),
  },
  {
    name: 'mk-month-picker [min]',
    type: MkMonthPicker,
    template: '<mk-month-picker [min]="min" [formControl]="ctrl" />',
    bad: D(2026, 0, 1),
    key: 'mkMinDate',
    good: D(2026, 6, 1),
  },
  {
    name: 'mk-week-picker [min]',
    type: MkWeekPicker,
    template: '<mk-week-picker [min]="min" [formControl]="ctrl" />',
    bad: { start: D(2026, 0, 4), end: D(2026, 0, 10) },
    key: 'mkMinDate',
    good: { start: D(2026, 6, 19), end: D(2026, 6, 25) },
  },
  {
    name: 'mk-date-range-picker half-picked',
    type: MkDateRangePicker,
    template: '<mk-date-range-picker [formControl]="ctrl" />',
    bad: { start: D(2026, 6, 1), end: null },
    key: 'mkDateRangeIncomplete',
    good: { start: D(2026, 6, 1), end: D(2026, 6, 9) },
  },
  {
    name: 'mk-time-picker [min]',
    type: MkTimePicker,
    template: '<mk-time-picker min="09:00" [formControl]="ctrl" />',
    bad: '07:30',
    key: 'mkMinTime',
    good: '10:30',
  },
  {
    name: 'mk-file-upload [maxFiles]',
    type: MkFileUpload,
    template: '<mk-file-upload multiple [maxFiles]="1" [formControl]="ctrl" />',
    bad: [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')],
    key: 'mkMaxItems',
    good: [new File(['a'], 'a.txt')],
  },
];

describe('Validator conformance', () => {
  for (const c of VALIDATOR_CASES) {
    it(`${c.name} reports \`${c.key}\``, () => {
      const fixture = mount([c.type], c.template);
      // `min` / `max` referenced by the date templates above.
      Object.assign(fixture.componentInstance, {
        min: D(2026, 5, 1),
        max: D(2026, 11, 31),
      });
      const ctrl = fixture.componentInstance.ctrl;
      fixture.detectChanges();

      ctrl.setValue(c.bad);
      fixture.detectChanges();
      expect(ctrl.errors, `errors for ${JSON.stringify(c.bad)}`).toHaveProperty(
        c.key,
      );
      expect(ctrl.valid).toBe(false);

      ctrl.setValue(c.good);
      fixture.detectChanges();
      expect(ctrl.errors).toBeNull();
    });
  }

  it('re-validates when a constraint input changes', () => {
    @Component({
      imports: [ReactiveFormsModule, MkNumberInput],
      template: '<mk-number-input [max]="max()" [formControl]="ctrl" />',
    })
    class Reactive {
      readonly max = signal(100);
      readonly ctrl = new FormControl<number | null>(50);
    }
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Reactive);
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.valid).toBe(true);

    // Tightening the constraint must re-run validate() on the bound control —
    // this is what `registerOnValidatorChange` buys.
    fixture.componentInstance.max.set(10);
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.errors).toHaveProperty('max');

    fixture.componentInstance.max.set(100);
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.errors).toBeNull();
  });

  it('leaves an empty value to Validators.required', () => {
    const fixture = mount(
      [MkIbanInput],
      '<mk-iban-input [formControl]="ctrl" />',
    );
    fixture.detectChanges();
    fixture.componentInstance.ctrl.setValue('');
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.errors).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. mk-form-field derives its state from the projected control
// ---------------------------------------------------------------------------

describe('MkFormField automatic errors', () => {
  const TEMPLATE = `
    <mk-form-field label="Email" [error]="explicit" [errorMessages]="messages">
      <input mkInput type="email" [formControl]="ctrl" />
    </mk-form-field>`;

  function field(overrides: Partial<Host & Record<string, unknown>> = {}) {
    const fixture = mount([MkFormField, MkInput], TEMPLATE);
    Object.assign(fixture.componentInstance, {
      explicit: null,
      messages: null,
      ...overrides,
    });
    fixture.detectChanges();
    const cmp = fixture.debugElement.query(
      (de) => de.componentInstance instanceof MkFormField,
    ).componentInstance as MkFormField;
    return { fixture, cmp, ctrl: fixture.componentInstance.ctrl };
  }

  it('stays quiet while the control is untouched', () => {
    const { fixture, cmp, ctrl } = field();
    ctrl.setValidators(Validators.required);
    ctrl.updateValueAndValidity();
    fixture.detectChanges();

    expect(ctrl.invalid).toBe(true);
    expect(cmp.hasError()).toBe(false);
    expect(cmp.errorText()).toBeNull();
  });

  it('shows the validator message once the control is touched', () => {
    const { fixture, cmp, ctrl } = field();
    ctrl.setValidators(Validators.required);
    ctrl.updateValueAndValidity();
    ctrl.markAsTouched();
    fixture.detectChanges();

    expect(cmp.hasError()).toBe(true);
    expect(cmp.errorText()).toBe('This field is required');
    expect(
      fixture.nativeElement.querySelector('.mk-form-field__error').textContent,
    ).toContain('This field is required');
  });

  it('honours errorOn="always" by showing before the control is touched', () => {
    const fixture = mount(
      [MkFormField, MkInput],
      `<mk-form-field label="Email" errorOn="always">
         <input mkInput [formControl]="ctrl" />
       </mk-form-field>`,
    );
    fixture.detectChanges();
    const cmp = fixture.debugElement.query(
      (de) => de.componentInstance instanceof MkFormField,
    ).componentInstance as MkFormField;
    const ctrl = fixture.componentInstance.ctrl;

    ctrl.setValidators(Validators.required);
    ctrl.updateValueAndValidity();
    fixture.detectChanges();

    expect(ctrl.touched).toBe(false);
    expect(cmp.hasError()).toBe(true);
  });

  it('picks the first error when several validators fail', () => {
    const { fixture, cmp, ctrl } = field();
    ctrl.setValidators([Validators.required, Validators.email]);
    ctrl.updateValueAndValidity();
    ctrl.markAsTouched();
    fixture.detectChanges();
    expect(cmp.errorText()).toBe('This field is required');
  });

  it('lets errorMessages reword a key', () => {
    const { fixture, cmp, ctrl } = field({
      messages: { required: 'We need your email' },
    });
    ctrl.setValidators(Validators.required);
    ctrl.updateValueAndValidity();
    ctrl.markAsTouched();
    fixture.detectChanges();
    expect(cmp.errorText()).toBe('We need your email');
  });

  it('lets an explicit [error] win over the automatic message', () => {
    const { fixture, cmp, ctrl } = field({ explicit: 'Server said no' });
    ctrl.setValidators(Validators.required);
    ctrl.updateValueAndValidity();
    ctrl.markAsTouched();
    fixture.detectChanges();
    expect(cmp.errorText()).toBe('Server said no');
  });

  it('derives required from the control validators', () => {
    const { fixture, cmp, ctrl } = field();
    expect(cmp.isRequired()).toBe(false);

    ctrl.setValidators(Validators.required);
    ctrl.updateValueAndValidity();
    fixture.detectChanges();
    expect(cmp.isRequired()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.mk-form-field__required'),
    ).not.toBeNull();
  });

  it('derives disabled from the control', () => {
    const { fixture, cmp, ctrl } = field();
    expect(cmp.isDisabled()).toBe(false);

    ctrl.disable();
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    // A disabled control is never invalid, so no error shows either.
    expect(cmp.hasError()).toBe(false);
  });

  it('hides the hint while an error shows and describes both', () => {
    const fixture = mount(
      [MkFormField, MkInput],
      `<mk-form-field label="Email" hint="We never share it.">
         <input mkInput [formControl]="ctrl" />
       </mk-form-field>`,
    );
    fixture.detectChanges();
    const cmp = fixture.debugElement.query(
      (de) => de.componentInstance instanceof MkFormField,
    ).componentInstance as MkFormField;
    const ctrl = fixture.componentInstance.ctrl;

    expect(cmp.describedBy()).toBe(cmp.hintId);

    ctrl.setValidators(Validators.required);
    ctrl.updateValueAndValidity();
    ctrl.markAsTouched();
    fixture.detectChanges();

    expect(cmp.hintVisible()).toBe(false);
    expect(cmp.describedBy()).toBe(cmp.errorId);
  });

  it('stays fully manual for a control with no form binding', () => {
    const fixture = mount(
      [MkFormField, MkInput],
      '<mk-form-field label="Email" error="Nope"><input mkInput /></mk-form-field>',
    );
    fixture.detectChanges();
    const cmp = fixture.debugElement.query(
      (de) => de.componentInstance instanceof MkFormField,
    ).componentInstance as MkFormField;
    expect(cmp.hasError()).toBe(true);
    expect(cmp.errorText()).toBe('Nope');
  });

  it('renders the message from an mk-kit control own validator', () => {
    const fixture = mount(
      [MkFormField, MkNumberInput],
      `<mk-form-field label="Age">
         <mk-number-input [min]="18" [formControl]="ctrl" />
       </mk-form-field>`,
    );
    fixture.detectChanges();
    const cmp = fixture.debugElement.query(
      (de) => de.componentInstance instanceof MkFormField,
    ).componentInstance as MkFormField;
    const ctrl = fixture.componentInstance.ctrl;

    ctrl.setValue(12);
    ctrl.markAsTouched();
    fixture.detectChanges();
    expect(cmp.errorText()).toBe('Must be 18 or more');
  });
});

// ---------------------------------------------------------------------------
// 3. Touched on blur
// ---------------------------------------------------------------------------

describe('touched on blur', () => {
  const CASES: ReadonlyArray<[string, Type<unknown>, string]> = [
    ['mk-radio-group', MkRadioGroup, '<mk-radio-group [formControl]="ctrl" />'],
    [
      'mk-button-toggle-group',
      MkButtonToggleGroup,
      '<mk-button-toggle-group [formControl]="ctrl" />',
    ],
    [
      'mk-transfer-list',
      MkTransferList,
      '<mk-transfer-list [formControl]="ctrl" />',
    ],
    [
      'mk-signature-pad',
      MkSignaturePad,
      '<mk-signature-pad [formControl]="ctrl" />',
    ],
    [
      'mk-range-slider',
      MkRangeSlider,
      '<mk-range-slider [formControl]="ctrl" />',
    ],
    [
      'mk-file-upload',
      MkFileUpload,
      '<mk-file-upload [formControl]="ctrl" />',
    ],
  ];

  for (const [name, type, template] of CASES) {
    it(`${name} marks touched when focus leaves`, () => {
      const fixture = mount([type], template);
      fixture.detectChanges();
      const ctrl = fixture.componentInstance.ctrl;
      expect(ctrl.touched).toBe(false);

      const host = fixture.debugElement.query(
        (de) => de.componentInstance instanceof type,
      ).nativeElement as HTMLElement;
      host.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }));
      fixture.detectChanges();

      expect(ctrl.touched).toBe(true);
    });

    it(`${name} stays untouched while focus moves inside it`, () => {
      const fixture = mount([type], template);
      fixture.detectChanges();
      const ctrl = fixture.componentInstance.ctrl;

      const host = fixture.debugElement.query(
        (de) => de.componentInstance instanceof type,
      ).nativeElement as HTMLElement;
      const inner = host.querySelector('*') ?? host;
      host.dispatchEvent(
        new FocusEvent('focusout', { relatedTarget: inner as EventTarget }),
      );
      fixture.detectChanges();

      expect(ctrl.touched).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. mk-form-error-summary collects a form
// ---------------------------------------------------------------------------

describe('MkFormErrorSummary automatic collection', () => {
  const TEMPLATE = `
    <form [formGroup]="form">
      <mk-form-error-summary [form]="form" [labels]="labels" showOn="always" />
      <input mkInput formControlName="email" />
      <mk-number-input formControlName="age" [min]="18" />
    </form>`;

  function summary() {
    const fixture = mount([MkFormErrorSummary, MkInput, MkNumberInput], TEMPLATE);
    fixture.componentInstance.form = new FormGroup({
      email: new FormControl('', Validators.required),
      age: new FormControl<number | null>(null),
    });
    Object.assign(fixture.componentInstance, {
      labels: { email: 'Email address', age: 'Age' },
    });
    fixture.detectChanges();
    const cmp = fixture.debugElement.query(
      (de) => de.componentInstance instanceof MkFormErrorSummary,
    ).componentInstance as MkFormErrorSummary;
    return { fixture, cmp };
  }

  it('lists one labelled entry per invalid control', () => {
    const { fixture } = summary();
    const items = fixture.nativeElement.querySelectorAll(
      '.mk-form-error-summary__item',
    );
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Email address');
    expect(items[0].textContent).toContain('This field is required');
  });

  it('picks up an error appearing on another control', () => {
    const { fixture } = summary();
    fixture.componentInstance.form.get('age')!.setValue(12 as never);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Age');
    expect(text).toContain('Must be 18 or more');
  });

  it('empties out once the form is valid', () => {
    const { fixture, cmp } = summary();
    fixture.componentInstance.form.get('email')!.setValue('a@b.co' as never);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.mk-form-error-summary__item')
        .length,
    ).toBe(0);
    expect(cmp['host'].nativeElement.hasAttribute('hidden')).toBe(true);
  });

  it('lets an explicit [errors] list win', () => {
    const fixture = mount(
      [MkFormErrorSummary],
      `<mk-form-error-summary [form]="form" [errors]="errors" showOn="always" />`,
    );
    fixture.componentInstance.form = new FormGroup({
      email: new FormControl('', Validators.required),
    });
    Object.assign(fixture.componentInstance, {
      errors: [{ fieldId: 'x', message: 'Server rejected this' }],
    });
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll(
      '.mk-form-error-summary__item',
    );
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Server rejected this');
  });
});
