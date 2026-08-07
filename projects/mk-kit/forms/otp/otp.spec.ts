import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MkFormField } from '../form-field/form-field';
import { MkOtp } from './otp';

describe('MkOtp', () => {
  let fixture: ComponentFixture<MkOtp>;
  let otp: MkOtp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkOtp);
    otp = fixture.componentInstance;
    fixture.componentRef.setInput('length', 4);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const type = (i: number, v: string) =>
    (otp as any).onCellInput(i, { target: { value: v } } as unknown as Event);

  it('builds the value as cells are filled', () => {
    const onChange = vi.fn();
    otp.registerOnChange(onChange);
    type(0, '1');
    type(1, '2');
    type(2, '3');
    expect(otp.value()).toBe('123');
    expect(onChange).toHaveBeenLastCalledWith('123');
  });

  it('strips non-digits in number mode', () => {
    type(0, 'a');
    expect(otp.value()).toBe('');
    type(0, '5');
    expect(otp.value()).toBe('5');
  });

  it('distributes a pasted code across cells', () => {
    (otp as any).onPaste(0, {
      preventDefault() {},
      clipboardData: { getData: () => '9876' },
    } as unknown as ClipboardEvent);
    expect(otp.value()).toBe('9876');
  });

  it('clears the previous cell on Backspace when empty', () => {
    type(0, '1');
    type(1, '2');
    (otp as any).onCellKeydown(2, {
      key: 'Backspace',
      preventDefault() {},
    } as KeyboardEvent);
    expect(otp.value()).toBe('1');
  });

  it('writeValue splits the string across cells', () => {
    otp.writeValue('42');
    expect((otp as any).charAt(0)).toBe('4');
    expect((otp as any).charAt(1)).toBe('2');
    expect((otp as any).charAt(2)).toBe('');
  });

  it('cells carry no field wiring when standalone', () => {
    const cell = fixture.nativeElement.querySelector(
      '.mk-otp__cell',
    ) as HTMLInputElement;
    expect(cell.getAttribute('aria-required')).toBeNull();
    expect(cell.getAttribute('aria-describedby')).toBeNull();
  });
});

@Component({
  imports: [FormsModule, MkFormField, MkOtp],
  template: `
    <mk-form-field label="Code" hint="Check your phone" [error]="error()" required>
      <mk-otp [(ngModel)]="code" [length]="4" />
    </mk-form-field>
  `,
})
class FieldHost {
  code = '';
  readonly error = signal<string | null>(null);
}

describe('MkOtp inside mk-form-field', () => {
  it('resolves the field label to the first cell and describes the group', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector(
      'label',
    ) as HTMLLabelElement;
    const group = fixture.nativeElement.querySelector('mk-otp') as HTMLElement;
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('.mk-otp__cell'),
    ) as HTMLInputElement[];

    // The `<label for>` must point at a real element — the first cell.
    expect(label.getAttribute('for')).toBeTruthy();
    expect(cells[0].id).toBe(label.getAttribute('for'));
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);

    // Required + description propagate onto the cells.
    for (const cell of cells) {
      expect(cell.getAttribute('aria-required')).toBe('true');
      expect(cell.getAttribute('aria-describedby')).toBeTruthy();
    }

    fixture.componentInstance.error.set('Wrong code');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cells[0].getAttribute('aria-invalid')).toBe('true');

    fixture.destroy();
  });
});
