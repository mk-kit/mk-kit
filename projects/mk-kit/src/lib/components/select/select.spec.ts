import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkSelect, MkSelectOption } from './select';

const OPTIONS: MkSelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer', disabled: true },
];

describe('MkSelect', () => {
  let fixture: ComponentFixture<MkSelect>;
  let select: MkSelect;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkSelect);
    select = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
  });

  it('shows the placeholder when nothing is selected', () => {
    expect((select as any).displayLabel()).toBe('');
  });

  it('writeValue updates the displayed label (ControlValueAccessor)', () => {
    select.writeValue('editor');
    fixture.detectChanges();
    expect((select as any).displayLabel()).toBe('Editor');
    expect((select as any).selectedIndex()).toBe(1);
  });

  it('selecting an option updates value and notifies the form', () => {
    const onChange = vi.fn();
    select.registerOnChange(onChange);
    (select as any).selectOption(0);
    expect(select.value()).toBe('admin');
    expect(onChange).toHaveBeenCalledWith('admin');
  });

  it('ignores selection of a disabled option', () => {
    const onChange = vi.fn();
    select.registerOnChange(onChange);
    (select as any).selectOption(2);
    expect(select.value()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reflects the disabled state from setDisabledState', () => {
    select.setDisabledState(true);
    expect((select as any).isDisabled()).toBe(true);
  });
});
