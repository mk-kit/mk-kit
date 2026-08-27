import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkDatePicker } from '@mk-kit/ui/datetime/date-picker';
import { MkTimePicker } from '@mk-kit/ui/datetime/time-picker';
import { MkAutocomplete } from './autocomplete/autocomplete';
import { MkCurrencyInput } from './currency-input/currency-input';
import { MkFormField } from './form-field/form-field';
import { MkMultiSelect } from './multi-select/multi-select';
import { MkNumberInput } from './number-input/number-input';
import { MkSelect } from './select/select';

@Component({
  imports: [MkNumberInput, MkSelect, MkMultiSelect, MkAutocomplete, MkCurrencyInput, MkDatePicker, MkTimePicker, MkFormField],
  template: `
    <mk-number-input aria-label="Quantity" />
    <mk-select aria-label="Role" [options]="opts" />
    <mk-multi-select aria-label="Tags" [options]="opts" />
    <mk-autocomplete aria-label="City" [options]="opts" />
    <mk-currency-input aria-label="Budget" />
    <mk-date-picker aria-label="Due" />
    <mk-time-picker aria-label="At" />

    <mk-form-field label="Seats"><mk-number-input aria-label="ignored" /></mk-form-field>
    <mk-form-field label="Plan"><mk-select aria-label="ignored" [options]="opts" /></mk-form-field>
    <mk-form-field label="Start"><mk-date-picker aria-label="ignored" /></mk-form-field>
  `,
})
class Host {
  readonly opts = [{ label: 'A', value: 'a' }];
}

describe('aria-label forwarding on standalone controls', () => {
  it('puts the label on the focusable control, and yields to an mk-form-field label', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const labelOf = (sel: string) => el.querySelector(sel)?.getAttribute('aria-label');

    expect(labelOf('mk-number-input input')).toBe('Quantity');
    expect(labelOf('mk-select [role="combobox"]')).toBe('Role');
    expect(labelOf('mk-multi-select input, mk-multi-select [role="combobox"]')).toBe('Tags');
    expect(labelOf('mk-autocomplete input')).toBe('City');
    expect(labelOf('mk-currency-input input')).toBe('Budget');
    expect(labelOf('mk-date-picker input')).toBe('Due');
    expect(labelOf('mk-time-picker input')).toBe('At');

    // Inside a form field the label element wins: aria-labelledby / for, no aria-label.
    const fields = Array.from(el.querySelectorAll('mk-form-field'));
    expect(fields[0].querySelector('input')?.getAttribute('aria-label')).toBeNull();
    expect(fields[0].querySelector('input')?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(fields[1].querySelector('[role="combobox"]')?.getAttribute('aria-label')).toBeNull();
    expect(fields[1].querySelector('[role="combobox"]')?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(fields[2].querySelector('input')?.getAttribute('aria-label')).toBeNull();
  });
});
