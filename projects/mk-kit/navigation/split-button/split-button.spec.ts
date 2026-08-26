import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkMenu } from '../menu/menu';
import { MkMenuItem } from '../menu/menu-item';
import { MkSplitButton } from './split-button';

@Component({
  imports: [MkSplitButton, MkMenu, MkMenuItem],
  template: `
    <mk-split-button
      [menu]="menu"
      [tone]="tone()"
      [variant]="variant()"
      [size]="size()"
      [disabled]="disabled()"
      [loading]="loading()"
      (action)="fired.push('save')"
    >
      Save
    </mk-split-button>
    <mk-menu #menu>
      <mk-menu-item (action)="fired.push('save-as')">Save as…</mk-menu-item>
      <mk-menu-item (action)="fired.push('template')">Save as template</mk-menu-item>
    </mk-menu>
  `,
})
class Host {
  readonly tone = signal<'primary' | 'danger'>('primary');
  readonly variant = signal<'solid' | 'outline'>('solid');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly disabled = signal(false);
  readonly loading = signal(false);
  fired: string[] = [];
}

describe('MkSplitButton', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const main = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.mk-split-button__main',
    )!;
  const toggle = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.mk-split-button__toggle',
    )!;
  const panel = () => document.querySelector<HTMLElement>('[role=menu]');

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function press(target: HTMLElement, key: string): void {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('renders a main segment with the projected label and a labelled menu segment', () => {
    expect(main().textContent!.trim()).toBe('Save');
    expect(main().getAttribute('type')).toBe('button');
    expect(toggle().getAttribute('aria-label')).toBe('More actions');
    expect(toggle().getAttribute('aria-haspopup')).toBe('menu');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=group]')).toBeTruthy();
  });

  it('shares tone, variant and size with both segments', async () => {
    host.tone.set('danger');
    host.variant.set('outline');
    host.size.set('sm');
    await settle();
    for (const el of [main(), toggle()]) {
      expect(el.getAttribute('data-tone')).toBe('danger');
      expect(el.classList.contains('mk-button--outline')).toBe(true);
      expect(el.classList.contains('mk-button--sm')).toBe(true);
    }
    expect(toggle().classList.contains('mk-button--icon')).toBe(true);
  });

  it('emits action from the main segment without opening the menu', async () => {
    main().click();
    await settle();
    expect(host.fired).toEqual(['save']);
    expect(panel()).toBeNull();
  });

  it('opens the menu from the chevron segment and runs a menu item', async () => {
    toggle().click();
    await settle();
    expect(panel()).toBeTruthy();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    document.querySelector<HTMLElement>('[role=menuitem]')!.click();
    await settle();
    expect(host.fired).toEqual(['save-as']);
    expect(panel()).toBeNull();
  });

  it('ArrowDown on the chevron opens the menu and focuses the first item', async () => {
    press(toggle(), 'ArrowDown');
    await settle();
    expect(panel()).toBeTruthy();
    expect(document.activeElement).toBe(document.querySelector('[role=menuitem]'));
  });

  it('disabled disables both segments and blocks action', async () => {
    host.disabled.set(true);
    await settle();
    expect(main().disabled).toBe(true);
    expect(toggle().disabled).toBe(true);
    main().click();
    toggle().click();
    await settle();
    expect(host.fired).toEqual([]);
    expect(panel()).toBeNull();
  });

  it('loading shows the spinner on the main segment, disables the chevron and blocks action', async () => {
    host.loading.set(true);
    await settle();
    expect(main().getAttribute('aria-busy')).toBe('true');
    expect(main().classList.contains('mk-button--loading')).toBe(true);
    expect(toggle().disabled).toBe(true);
    main().click();
    await settle();
    expect(host.fired).toEqual([]);
  });
});
