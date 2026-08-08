import { Component, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MkOnScreenKeyboard } from './on-screen-keyboard';
import { MkOnScreenKeyboardTrigger } from './on-screen-keyboard-trigger';

@Component({
  imports: [MkOnScreenKeyboard, MkOnScreenKeyboardTrigger, FormsModule],
  template: `
    <input [mkOnScreenKeyboardFor]="kbd" [(ngModel)]="text" />
    <textarea [mkOnScreenKeyboardFor]="kbd"></textarea>
    <mk-on-screen-keyboard #kbd (enter)="entered = entered + 1" />
  `,
})
class Host {
  readonly kbd = viewChild.required(MkOnScreenKeyboard);
  text = '';
  entered = 0;
}

function keyByLabel(label: string): HTMLButtonElement | null {
  const keys = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.mk-on-screen-keyboard__key'),
  );
  return (
    keys.find(
      (k) => k.textContent?.trim() === label || k.getAttribute('aria-label') === label,
    ) ?? null
  );
}

describe('MkOnScreenKeyboard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    return { fixture, input, textarea };
  }

  it('stays closed until opened; trigger focus opens it', () => {
    const { fixture, input } = setup();
    expect(document.querySelector('.mk-on-screen-keyboard__panel')).toBeNull();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(document.querySelector('.mk-on-screen-keyboard__panel')).toBeTruthy();
    expect(fixture.componentInstance.kbd().opened()).toBe(true);
  });

  it('suppresses the OS keyboard and wires aria on the trigger', () => {
    const { fixture, input } = setup();
    expect(input.getAttribute('inputmode')).toBe('none');
    expect(input.getAttribute('aria-controls')).toBeNull();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(input.getAttribute('aria-controls')).toBe(
      fixture.componentInstance.kbd().panelId,
    );
  });

  it('types into the input at the caret and dispatches input events', () => {
    const { fixture, input } = setup();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    keyByLabel('a')!.click();
    keyByLabel('b')!.click();
    expect(input.value).toBe('ab');
    // ngModel picked the change up through the dispatched input event.
    expect(fixture.componentInstance.text).toBe('ab');
    // Caret-aware: insert in the middle.
    input.setSelectionRange(1, 1);
    keyByLabel('x')!.click();
    expect(input.value).toBe('axb');
  });

  it('shift produces one uppercase character then resets', () => {
    const { fixture, input } = setup();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    keyByLabel('Shift')!.click();
    fixture.detectChanges();
    keyByLabel('A')!.click();
    fixture.detectChanges();
    keyByLabel('a')!.click();
    expect(input.value).toBe('Aa');
  });

  it('the alternate layer offers Polish diacritics', () => {
    const { fixture, input } = setup();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    keyByLabel('More characters')!.click();
    fixture.detectChanges();
    keyByLabel('ą')!.click();
    keyByLabel('ż')!.click();
    expect(input.value).toBe('ąż');
    keyByLabel('Letters')!.click();
    fixture.detectChanges();
    expect(keyByLabel('q')).toBeTruthy();
  });

  it('backspace deletes back from the caret; space and enter behave per target', () => {
    const { fixture, input, textarea } = setup();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    keyByLabel('a')!.click();
    keyByLabel('Space')!.click();
    keyByLabel('b')!.click();
    expect(input.value).toBe('a b');
    keyByLabel('Backspace')!.click();
    expect(input.value).toBe('a ');
    // Enter on a single-line input emits instead of inserting.
    keyByLabel('Enter')!.click();
    expect(fixture.componentInstance.entered).toBe(1);
    expect(input.value).toBe('a ');
    // Enter in a textarea inserts a newline.
    textarea.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    keyByLabel('a')!.click();
    keyByLabel('Enter')!.click();
    expect(textarea.value).toBe('a\n');
    expect(fixture.componentInstance.entered).toBe(1);
  });

  it('blur on the trigger closes the panel and resets layers', () => {
    const { fixture, input } = setup();
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    keyByLabel('Shift')!.click();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(document.querySelector('.mk-on-screen-keyboard__panel')).toBeNull();
    expect(fixture.componentInstance.kbd().opened()).toBe(false);
  });
});
