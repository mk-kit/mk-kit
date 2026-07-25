import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MkFormField } from '../form-field/form-field';
import { MkSubmitInput } from './submit-input';

function mount(): ComponentFixture<MkSubmitInput> {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(MkSubmitInput);
  fixture.componentRef.setInput('buttonLabel', 'Apply');
  fixture.detectChanges();
  return fixture;
}

function inputOf(fixture: ComponentFixture<unknown>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input') as HTMLInputElement;
}

function actionOf(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector(
    'button.mk-submit-input__button',
  ) as HTMLButtonElement;
}

function type(fixture: ComponentFixture<unknown>, text: string): HTMLInputElement {
  const el = inputOf(fixture);
  el.value = text;
  el.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  return el;
}

/** Dispatches a cancelable Enter keydown and returns the event. */
function pressEnter(el: HTMLElement): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(event);
  return event;
}

describe('MkSubmitInput', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('updates the value model as the user types', () => {
    const fixture = mount();
    type(fixture, 'SUMMER10');
    expect(fixture.componentInstance.value()).toBe('SUMMER10');
  });

  it('renders the button label and keeps it a non-submitting button', () => {
    const fixture = mount();
    const button = actionOf(fixture);
    expect(button.textContent?.trim()).toBe('Apply');
    // A native <button> defaults to type=submit — which would submit a
    // surrounding form on click. It must be explicitly type=button.
    expect(button.getAttribute('type')).toBe('button');
  });

  it('falls back to the i18n caption when no buttonLabel is given', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(MkSubmitInput);
    fixture.detectChanges();
    expect(actionOf(fixture).textContent?.trim()).toBe('Submit');
  });

  describe('button disabled state', () => {
    it('is disabled while the value is empty', () => {
      const fixture = mount();
      expect(actionOf(fixture).disabled).toBe(true);
    });

    it('is disabled while the value is only whitespace', () => {
      const fixture = mount();
      type(fixture, '   ');
      expect(actionOf(fixture).disabled).toBe(true);
    });

    it('enables once a non-blank value is typed', () => {
      const fixture = mount();
      type(fixture, 'X');
      expect(actionOf(fixture).disabled).toBe(false);
    });

    it('is disabled while [disabled]', () => {
      const fixture = mount();
      type(fixture, 'SUMMER10');
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(actionOf(fixture).disabled).toBe(true);
      expect(inputOf(fixture).disabled).toBe(true);
    });

    it('is disabled while [loading] and shows the spinner', () => {
      const fixture = mount();
      type(fixture, 'SUMMER10');
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const button = actionOf(fixture);
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.querySelector('.mk-button__spinner')).not.toBeNull();
      expect(
        (fixture.nativeElement as HTMLElement).getAttribute('aria-busy'),
      ).toBe('true');
    });
  });

  it('emits the trimmed value when the button is clicked', () => {
    const fixture = mount();
    const seen: string[] = [];
    fixture.componentInstance.submitted.subscribe((v) => seen.push(v));

    type(fixture, '  SUMMER10  ');
    actionOf(fixture).click();

    expect(seen).toEqual(['SUMMER10']);
    // The model keeps exactly what was typed; only the emission is trimmed.
    expect(fixture.componentInstance.value()).toBe('  SUMMER10  ');
  });

  it('does not emit while loading, disabled or blank', () => {
    const fixture = mount();
    const seen: string[] = [];
    fixture.componentInstance.submitted.subscribe((v) => seen.push(v));

    pressEnter(inputOf(fixture)); // empty
    type(fixture, '  ');
    pressEnter(inputOf(fixture)); // whitespace

    type(fixture, 'SUMMER10');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    pressEnter(inputOf(fixture));

    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    pressEnter(inputOf(fixture));

    expect(seen).toEqual([]);
  });

  it('clears the value through the clear affix', () => {
    const fixture = mount();
    fixture.componentRef.setInput('clearable', true);
    type(fixture, 'SUMMER10');

    const clear = fixture.nativeElement.querySelector(
      '.mk-submit-input__clear',
    ) as HTMLButtonElement;
    expect(clear).not.toBeNull();
    clear.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('');
    expect(
      fixture.nativeElement.querySelector('.mk-submit-input__clear'),
    ).toBeNull();
  });

  it('gives the icon-only button an accessible name', () => {
    const fixture = mount();
    fixture.componentRef.setInput('buttonIcon', 'search');
    fixture.componentRef.setInput('buttonLabel', 'Search');
    fixture.detectChanges();

    const button = actionOf(fixture);
    expect(button.getAttribute('aria-label')).toBe('Search');
    expect(button.classList).toContain('mk-button--icon');
    // No visible caption in the icon variant — the aria-label carries it.
    expect(button.textContent?.trim()).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Enter inside an enclosing <form>
// ---------------------------------------------------------------------------

/**
 * jsdom does not implement the browser's *implicit submission* (Enter in a
 * text field submitting the form), so the form listener below emulates it:
 * an Enter keydown that reaches the form un-prevented submits it. That makes
 * "the enclosing form was not submitted" a real assertion, and the
 * `defaultPrevented` check below pins the mechanism that guarantees it.
 */
@Component({
  imports: [MkSubmitInput, FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()" (keydown)="implicitSubmit($event)">
      <mk-submit-input
        buttonLabel="Apply"
        [submitOnEnter]="submitOnEnter()"
        [(value)]="code"
        (submitted)="onApply($event)"
      />
    </form>
  `,
})
class FormHost {
  readonly submitOnEnter = signal(true);
  readonly code = signal('');
  submits = 0;
  applied: string[] = [];

  onSubmit(): void {
    this.submits++;
  }
  onApply(value: string): void {
    this.applied.push(value);
  }
  implicitSubmit(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.defaultPrevented) {
      (event.currentTarget as HTMLFormElement).dispatchEvent(
        new Event('submit', { cancelable: true }),
      );
    }
  }
}

describe('MkSubmitInput inside a form', () => {
  afterEach(() => TestBed.resetTestingModule());

  function mountForm(): ComponentFixture<FormHost> {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    return fixture;
  }

  it('emits submitted on Enter without submitting the enclosing form', () => {
    const fixture = mountForm();
    type(fixture, '  SUMMER10 ');

    const event = pressEnter(inputOf(fixture));
    fixture.detectChanges();

    expect(fixture.componentInstance.applied).toEqual(['SUMMER10']);
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.submits).toBe(0);
  });

  it('clicking the button does not submit the enclosing form either', () => {
    const fixture = mountForm();
    type(fixture, 'SUMMER10');
    actionOf(fixture).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.applied).toEqual(['SUMMER10']);
    expect(fixture.componentInstance.submits).toBe(0);
  });

  it('with submitOnEnter=false Enter is left to the form', () => {
    const fixture = mountForm();
    fixture.componentInstance.submitOnEnter.set(false);
    fixture.detectChanges();
    type(fixture, 'SUMMER10');

    const event = pressEnter(inputOf(fixture));
    fixture.detectChanges();

    expect(fixture.componentInstance.applied).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.submits).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Form integration + composition
// ---------------------------------------------------------------------------

@Component({
  imports: [MkSubmitInput, ReactiveFormsModule],
  template: `<mk-submit-input buttonLabel="Apply" [formControl]="ctrl" />`,
})
class CvaHost {
  readonly ctrl = new FormControl('');
}

@Component({
  imports: [MkFormField, MkSubmitInput, FormsModule],
  template: `
    <mk-form-field label="Discount code" hint="Case insensitive" size="lg">
      <mk-submit-input buttonLabel="Apply" [(ngModel)]="code" />
    </mk-form-field>
  `,
})
class FieldHost {
  code = '';
}

describe('MkSubmitInput form integration', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('round-trips through a reactive FormControl', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CvaHost);
    fixture.detectChanges();
    const ctrl = fixture.componentInstance.ctrl;

    // Model → view.
    ctrl.setValue('FROM-MODEL');
    fixture.detectChanges();
    expect(inputOf(fixture).value).toBe('FROM-MODEL');

    // View → model.
    type(fixture, 'FROM-VIEW');
    expect(ctrl.value).toBe('FROM-VIEW');

    // Disabling through the control disables input and button.
    ctrl.disable();
    fixture.detectChanges();
    expect(inputOf(fixture).disabled).toBe(true);
    expect(actionOf(fixture).disabled).toBe(true);

    ctrl.enable();
    fixture.detectChanges();
    expect(inputOf(fixture).disabled).toBe(false);
  });

  it('composes inside mk-form-field: label, hint and size reach the inner input', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const label = el.querySelector('label')!;
    const input = inputOf(fixture);
    expect(input.id).toBe(label.getAttribute('for'));
    expect(input.id).toBeTruthy();
    // The field's own label wins over the fallback aria-label.
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toContain('-hint');
    expect(el.querySelector('mk-input-group')!.classList).toContain(
      'mk-input-group--lg',
    );
  });

  it('labels the input itself when used outside a form field', () => {
    const fixture = mount();
    expect(inputOf(fixture).getAttribute('aria-label')).toBe('Apply');

    fixture.componentRef.setInput('label', 'Discount code');
    fixture.detectChanges();
    expect(inputOf(fixture).getAttribute('aria-label')).toBe('Discount code');
  });
});
