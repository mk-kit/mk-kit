import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
});
