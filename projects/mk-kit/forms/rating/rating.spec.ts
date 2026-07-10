import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkRating } from './rating';

describe('MkRating', () => {
  let fixture: ComponentFixture<MkRating>;
  let rating: MkRating;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkRating);
    rating = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('sets the value when a star is chosen and notifies the form', () => {
    const onChange = vi.fn();
    rating.registerOnChange(onChange);
    (rating as any).setValue(3);
    expect(rating.value()).toBe(3);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('clears when the current top star is clicked again', () => {
    (rating as any).setValue(3);
    (rating as any).setValue(3);
    expect(rating.value()).toBe(2);
  });

  it('steps with Arrow keys and clamps to [0, max]', () => {
    const key = (k: string) =>
      (rating as any).onKeydown(new KeyboardEvent('keydown', { key: k }));
    rating.value.set(4);
    key('ArrowRight');
    expect(rating.value()).toBe(5);
    key('ArrowRight'); // clamp at max
    expect(rating.value()).toBe(5);
    key('Home');
    expect(rating.value()).toBe(0);
    key('ArrowLeft'); // clamp at 0
    expect(rating.value()).toBe(0);
  });

  it('ignores interaction when read-only', () => {
    fixture.componentRef.setInput('readonly', true);
    (rating as any).setValue(4);
    expect(rating.value()).toBe(0);
  });
});
