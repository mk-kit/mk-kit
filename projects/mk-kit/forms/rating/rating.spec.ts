import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MkFormField } from '../form-field/form-field';
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

  it('uses the default aria-label when standalone', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('aria-label')).toBeTruthy();
    expect(el.getAttribute('aria-labelledby')).toBeNull();
  });
});

@Component({
  imports: [FormsModule, MkFormField, MkRating],
  template: `
    <mk-form-field label="Score" hint="Pick 1 to 5" [error]="error()">
      <mk-rating [(ngModel)]="score" />
    </mk-form-field>
  `,
})
class FieldHost {
  score = 0;
  readonly error = signal<string | null>(null);
}

describe('MkRating inside mk-form-field', () => {
  it('adopts the field label, description and validity wiring', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('mk-rating') as HTMLElement;
    const label = fixture.nativeElement.querySelector(
      'label',
    ) as HTMLLabelElement;

    // The field label names the control; the built-in default must not win.
    expect(el.getAttribute('aria-labelledby')).toBe(label.id);
    expect(el.getAttribute('aria-label')).toBeNull();
    // The hint describes it.
    expect(el.getAttribute('aria-describedby')).toBeTruthy();
    expect(el.getAttribute('aria-invalid')).toBeNull();

    fixture.componentInstance.error.set('Nope');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.getAttribute('aria-invalid')).toBe('true');

    fixture.destroy();
  });
});
