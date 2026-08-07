import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkBlockList } from './block-list';
import { MkBlockEditorContext } from './block-context';
import type { MkBlock } from './block-model';

@Component({
  imports: [MkBlockList],
  providers: [MkBlockEditorContext],
  template: `<mk-block-list [blocks]="blocks()" (blocksChange)="blocks.set($event)" />`,
})
class Host {
  readonly blocks = signal<MkBlock[]>([
    { id: 'p1', type: 'paragraph', data: { html: 'Hello' } },
  ]);
}

describe('MkBlockList options disclosure', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const toggle = () =>
    fixture.nativeElement.querySelector('.mk-block__action') as HTMLButtonElement;
  const menu = () =>
    fixture.nativeElement.querySelector('.mk-block__menu') as HTMLElement | null;

  const open = async () => {
    toggle().click();
    await fixture.whenStable();
  };

  it('is a plain disclosure: aria-expanded + aria-controls, no menu roles', async () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(toggle().getAttribute('aria-controls')).toBe('mk-block-menu-p1');
    expect(toggle().hasAttribute('aria-haspopup')).toBe(false);

    await open();
    const popup = menu()!;
    expect(popup).toBeTruthy();
    expect(popup.id).toBe('mk-block-menu-p1');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(popup.getAttribute('role')).toBeNull();
    expect(popup.querySelector('[role="menuitem"]')).toBeNull();
    // Ordinary buttons, reachable by Tab.
    const buttons = popup.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((b) => expect(b.tabIndex).toBe(0));
  });

  it('Escape inside the popup closes it and returns focus to the toggle', async () => {
    await open();
    const first = menu()!.querySelector('button')!;
    first.focus();
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(menu()).toBeNull();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
  });

  it('toggle click closes an open popup', async () => {
    await open();
    expect(menu()).toBeTruthy();
    toggle().click();
    await fixture.whenStable();
    expect(menu()).toBeNull();
  });
});
