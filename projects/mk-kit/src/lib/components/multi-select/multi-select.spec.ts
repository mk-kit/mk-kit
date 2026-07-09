import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkMultiSelect, MkMultiSelectOption } from './multi-select';

const OPTIONS: MkMultiSelectOption[] = [
  { label: 'Angular', value: 'ng' },
  { label: 'React', value: 'react' },
  { label: 'Svelte', value: 'svelte', disabled: true },
];

describe('MkMultiSelect', () => {
  let fixture: ComponentFixture<MkMultiSelect>;
  let ms: MkMultiSelect;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkMultiSelect);
    ms = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
  });

  it('adds an option to the value and emits the change', () => {
    const onChange = vi.fn();
    ms.registerOnChange(onChange);
    (ms as any).toggleOption(0);
    expect(ms.value()).toEqual(['ng']);
    expect(onChange).toHaveBeenCalledWith(['ng']);
  });

  it('toggling a selected option removes it', () => {
    (ms as any).toggleOption(0);
    (ms as any).toggleOption(1);
    expect(ms.value()).toEqual(['ng', 'react']);
    (ms as any).toggleOption(0);
    expect(ms.value()).toEqual(['react']);
  });

  it('ignores a disabled option', () => {
    (ms as any).toggleOption(2);
    expect(ms.value()).toEqual([]);
  });

  it('respects the max selection cap', () => {
    fixture.componentRef.setInput('max', 1);
    fixture.detectChanges();
    (ms as any).toggleOption(0);
    (ms as any).toggleOption(1);
    expect(ms.value()).toEqual(['ng']);
    expect((ms as any).atMax()).toBe(true);
  });

  it('derives chips (with labels) from the value, remembering async options', () => {
    (ms as any).toggleOption(1);
    // Simulate the async source dropping the option out of the list.
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
    const chips = (ms as any).chips() as MkMultiSelectOption[];
    expect(chips).toEqual([{ label: 'React', value: 'react' }]);
  });

  it('removeChip drops the value', () => {
    (ms as any).toggleOption(0);
    (ms as any).toggleOption(1);
    (ms as any).removeChip('ng');
    expect(ms.value()).toEqual(['react']);
  });

  it('filters options against the query (contains)', () => {
    (ms as any).query.set('re');
    expect((ms as any).filtered().map((o: MkMultiSelectOption) => o.value)).toEqual([
      'react',
    ]);
  });

  it('writeValue accepts an array and normalises null to []', () => {
    ms.writeValue(['ng']);
    expect(ms.value()).toEqual(['ng']);
    ms.writeValue(null);
    expect(ms.value()).toEqual([]);
  });
});
