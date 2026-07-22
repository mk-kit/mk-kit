import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkSwitch } from './switch';

@Component({
  imports: [MkSwitch],
  template: `<mk-switch [(checked)]="checked" [disabled]="disabled()"
    >Notifications</mk-switch
  >`,
})
class Host {
  checked = signal(false);
  disabled = signal(false);
}

describe('MkSwitch', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      button: el.querySelector<HTMLButtonElement>('button[role=switch]')!,
      host: fixture.componentInstance,
    };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('implements the ARIA switch pattern', () => {
    const { fixture, button, host } = mount();
    expect(button.getAttribute('role')).toBe('switch');
    expect(button.getAttribute('aria-checked')).toBe('false');

    host.checked.set(true);
    fixture.detectChanges();
    expect(button.getAttribute('aria-checked')).toBe('true');
  });

  it('labels itself from the projected text when no aria-label is given', () => {
    const { el, button } = mount();
    const labelId = button.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(el.querySelector(`#${labelId}`)?.textContent).toContain('Notifications');
  });

  it('toggles on click', () => {
    const { fixture, button, host } = mount();
    button.click();
    fixture.detectChanges();
    expect(host.checked()).toBe(true);

    button.click();
    fixture.detectChanges();
    expect(host.checked()).toBe(false);
  });

  it('toggles on Space and Enter, and preventDefaults so the page does not scroll', () => {
    const { fixture, button, host } = mount();

    for (const key of [' ', 'Enter']) {
      const before = host.checked();
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      button.dispatchEvent(event);
      fixture.detectChanges();

      expect(host.checked(), `key ${key}`).toBe(!before);
      expect(event.defaultPrevented, `key ${key} preventDefault`).toBe(true);
    }
  });

  it('ignores other keys', () => {
    const { fixture, button, host } = mount();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', cancelable: true }));
    fixture.detectChanges();
    expect(host.checked()).toBe(false);
  });

  it('does not toggle while disabled', () => {
    const { fixture, button, host } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    expect(button.disabled).toBe(true);
    button.click();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    fixture.detectChanges();
    expect(host.checked()).toBe(false);
  });

  it('toggles when the adjacent label text is clicked', () => {
    const { fixture, el, host } = mount();
    el.querySelector<HTMLElement>('.mk-switch__label')!.click();
    fixture.detectChanges();
    expect(host.checked()).toBe(true);
  });
});
