import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkColorPicker } from './color-picker';

describe('MkColorPicker', () => {
  let fixture: ComponentFixture<MkColorPicker>;
  let cp: MkColorPicker;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkColorPicker);
    cp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('picks a preset swatch and notifies the form', () => {
    const onChange = vi.fn();
    cp.registerOnChange(onChange);
    (cp as any).pickSwatch('#FF8800');
    expect(cp.value()).toBe('#ff8800'); // normalised to lowercase
    expect(onChange).toHaveBeenCalledWith('#ff8800');
  });

  it('commits a valid hex typed into the field (adds #)', () => {
    (cp as any).hexText.set('abcdef');
    (cp as any).commitHex();
    expect(cp.value()).toBe('#abcdef');
  });

  it('reverts an invalid hex on commit', () => {
    cp.writeValue('#123456');
    (cp as any).hexText.set('nope');
    (cp as any).commitHex();
    expect((cp as any).hexText()).toBe('#123456');
    expect(cp.value()).toBe('#123456');
  });

  it('expands short hex for the native input', () => {
    cp.writeValue('#abc');
    expect((cp as any).nativeValue()).toBe('#aabbcc');
  });
});
