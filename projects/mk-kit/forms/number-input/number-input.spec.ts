import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkNumberInput } from './number-input';

describe('MkNumberInput', () => {
  let fixture: ComponentFixture<MkNumberInput>;
  let ni: MkNumberInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkNumberInput);
    ni = fixture.componentInstance;
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('step', 2);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('steps by step and clamps to bounds', () => {
    ni.value.set(8);
    (ni as any).step_(1);
    expect(ni.value()).toBe(10);
    (ni as any).step_(1); // clamp at max
    expect(ni.value()).toBe(10);
    (ni as any).step_(-1);
    expect(ni.value()).toBe(8);
  });

  it('starts from min when empty', () => {
    ni.value.set(null);
    (ni as any).step_(1);
    expect(ni.value()).toBe(0); // min, not min+step (base = min)
  });

  it('disables the buttons at the bounds', () => {
    ni.value.set(0);
    expect((ni as any).canDecrement()).toBe(false);
    expect((ni as any).canIncrement()).toBe(true);
    ni.value.set(10);
    expect((ni as any).canIncrement()).toBe(false);
  });

  it('parses typed input and treats blank as null', () => {
    (ni as any).onInput({ target: { value: '4' } } as unknown as Event);
    expect(ni.value()).toBe(4);
    (ni as any).onInput({ target: { value: '' } } as unknown as Event);
    expect(ni.value()).toBeNull();
  });
});
