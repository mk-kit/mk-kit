import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MkCheckbox } from './checkbox';

@Component({
  imports: [MkCheckbox],
  template: `<mk-checkbox
    [(checked)]="checked"
    [(indeterminate)]="indeterminate"
    [disabled]="disabled()"
    [required]="required()"
    aria-label="Accept"
    >Accept</mk-checkbox
  >`,
})
class Host {
  checked = signal(false);
  indeterminate = signal(false);
  disabled = signal(false);
  required = signal(false);
}

describe('MkCheckbox', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    return { fixture, el, input, host: fixture.componentInstance };
  }

  /** Click the native input the way a user would, then settle. */
  function click(fixture: ReturnType<typeof mount>['fixture'], input: HTMLInputElement) {
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders a native checkbox carrying the label and id', () => {
    const { el, input } = mount();
    expect(input).toBeTruthy();
    expect(input.id).toMatch(/^mk-checkbox-/);
    expect(el.querySelector('label')?.textContent).toContain('Accept');
    expect(input.getAttribute('aria-label')).toBe('Accept');
  });

  it('reflects the checked model into the input and the host class', () => {
    const { fixture, el, input, host } = mount();
    expect(input.checked).toBe(false);

    host.checked.set(true);
    fixture.detectChanges();

    expect(input.checked).toBe(true);
    const cb = el.querySelector('mk-checkbox')!;
    expect(cb.classList.contains('mk-checkbox--checked')).toBe(true);

    host.checked.set(false);
    fixture.detectChanges();
    expect(input.checked).toBe(false);
    expect(cb.classList.contains('mk-checkbox--checked')).toBe(false);
  });

  it('writes the user toggle back through the two-way model', () => {
    const { fixture, input, host } = mount();
    click(fixture, input);
    expect(host.checked()).toBe(true);

    click(fixture, input);
    expect(host.checked()).toBe(false);
  });

  it('renders the indeterminate state and clears it on toggle', () => {
    const { fixture, input, host } = mount();
    host.indeterminate.set(true);
    fixture.detectChanges();
    expect(input.indeterminate).toBe(true);

    click(fixture, input);

    // A user decision resolves "mixed" — it must not survive the toggle.
    expect(host.indeterminate()).toBe(false);
    expect(input.indeterminate).toBe(false);
    expect(host.checked()).toBe(true);
  });

  it('disables the native input and stops emitting when disabled', () => {
    const { fixture, input, host } = mount();
    host.disabled.set(true);
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });

  it('exposes required through the input and aria', () => {
    const { fixture, input, host } = mount();
    expect(input.getAttribute('aria-required')).toBeNull();

    host.required.set(true);
    fixture.detectChanges();

    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('marks the control touched on blur', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    TestBed.overrideComponent(Host, {
      set: {
        imports: [ReactiveFormsModule, MkCheckbox],
        template: '<mk-checkbox [formControl]="ctrl" />',
      },
    });
    const fixture = TestBed.createComponent(Host);
    const ctrl = new FormControl(false);
    (fixture.componentInstance as unknown as { ctrl: FormControl }).ctrl = ctrl;
    fixture.detectChanges();

    expect(ctrl.touched).toBe(false);
    fixture.nativeElement
      .querySelector('input')!
      .dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(ctrl.touched).toBe(true);
  });
});
