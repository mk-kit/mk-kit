import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkMenu } from './menu';
import { MkMenuTrigger } from './menu-trigger';
import { MkMenuItem } from './menu-item';

@Component({
  imports: [MkMenu, MkMenuTrigger, MkMenuItem],
  template: `
    <button [mkMenuTriggerFor]="menu">Actions</button>
    <mk-menu #menu>
      <mk-menu-item (action)="fired.push('edit')">Edit</mk-menu-item>
      <mk-menu-item [disabled]="dupDisabled()" (action)="fired.push('duplicate')">
        Duplicate
      </mk-menu-item>
      <mk-menu-item danger (action)="fired.push('delete')">Delete</mk-menu-item>
    </mk-menu>
  `,
})
class Host {
  dupDisabled = signal(false);
  fired: string[] = [];
}

describe('MkMenu', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      trigger: el.querySelector<HTMLButtonElement>('button')!,
      host: fixture.componentInstance,
    };
  }

  // The panel is teleported into a document.body portal by mkAnchoredPanel.
  const panel = () => document.querySelector<HTMLElement>('[role=menu]');
  const items = () => [...document.querySelectorAll<HTMLElement>('[role=menuitem]')];

  /**
   * Open by click. Deliberately leaves focus on the trigger — a mouse user did
   * not ask for focus to jump into the panel.
   */
  async function open(fixture: ReturnType<typeof mount>['fixture'], trigger: HTMLElement) {
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** Open from the keyboard, which does focus the first enabled item. */
  async function openWithKeyboard(
    fixture: ReturnType<typeof mount>['fixture'],
    trigger: HTMLElement,
  ) {
    press(fixture, trigger, 'ArrowDown');
    // Focus moves in an afterNextRender write callback.
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function press(
    fixture: ReturnType<typeof mount>['fixture'],
    target: HTMLElement,
    key: string,
  ) {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('marks the trigger as a menu button', () => {
    const { trigger } = mount();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();
  });

  it('is closed until the trigger is used', () => {
    mount();
    expect(panel()).toBeNull();
  });

  it('opens on click and reflects aria-expanded', async () => {
    const { fixture, trigger } = mount();
    await open(fixture, trigger);

    expect(panel()).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel()!.id).toBe(trigger.getAttribute('aria-controls'));
  });

  it('renders the items with the menuitem role', async () => {
    const { fixture, trigger } = mount();
    await open(fixture, trigger);
    expect(items().map((i) => i.textContent!.trim())).toEqual([
      'Edit',
      'Duplicate',
      'Delete',
    ]);
  });

  it('toggles closed on a second trigger click', async () => {
    const { fixture, trigger } = mount();
    await open(fixture, trigger);
    trigger.click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('opens with ArrowDown, Enter and Space, focusing the first item', async () => {
    for (const key of ['ArrowDown', 'Enter', ' ']) {
      const { fixture, trigger } = mount();
      expect(press(fixture, trigger, key).defaultPrevented, key).toBe(true);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(panel(), key).toBeTruthy();
      expect(document.activeElement, key).toBe(items()[0]);
      TestBed.resetTestingModule();
    }
  });

  it('does not pull focus into the panel when opened by click', async () => {
    const { fixture, trigger } = mount();
    await open(fixture, trigger);

    // A mouse user did not ask for focus to jump; nothing inside the panel has
    // it. (jsdom does not focus a button on .click() the way a real mousedown
    // does, so assert the invariant rather than the trigger specifically.)
    expect(panel()!.contains(document.activeElement)).toBe(false);

    // The first arrow then enters the menu at the top.
    press(fixture, panel()!, 'ArrowDown');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('moves focus with the arrow keys and wraps', async () => {
    const { fixture, trigger } = mount();
    await openWithKeyboard(fixture, trigger);
    const list = items();
    expect(document.activeElement).toBe(list[0]);

    press(fixture, panel()!, 'ArrowDown');
    expect(document.activeElement).toBe(list[1]);

    press(fixture, panel()!, 'ArrowDown');
    expect(document.activeElement).toBe(list[2]);

    press(fixture, panel()!, 'ArrowDown');
    expect(document.activeElement).toBe(list[0]);

    press(fixture, panel()!, 'ArrowUp');
    expect(document.activeElement).toBe(list[2]);
  });

  it('skips disabled items when arrowing', async () => {
    const { fixture, trigger, host } = mount();
    host.dupDisabled.set(true);
    fixture.detectChanges();
    await openWithKeyboard(fixture, trigger);

    press(fixture, panel()!, 'ArrowDown');
    // 'Duplicate' is disabled, so focus lands on 'Delete'.
    expect(document.activeElement).toBe(items()[2]);
  });

  it('jumps to the ends with Home and End', async () => {
    const { fixture, trigger } = mount();
    await open(fixture, trigger);

    press(fixture, panel()!, 'End');
    expect(document.activeElement).toBe(items()[2]);
    press(fixture, panel()!, 'Home');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('jumps to an item by typeahead', async () => {
    const { fixture, trigger } = mount();
    await openWithKeyboard(fixture, trigger);

    press(fixture, panel()!, 'd');
    expect(document.activeElement).toBe(items()[1]); // Duplicate
  });

  it('activates the focused item on Enter and closes', async () => {
    const { fixture, trigger, host } = mount();
    await openWithKeyboard(fixture, trigger);

    press(fixture, panel()!, 'ArrowDown'); // Duplicate
    press(fixture, panel()!, 'Enter');

    expect(host.fired).toEqual(['duplicate']);
    expect(panel()).toBeNull();
  });

  it('activates on click and closes', async () => {
    const { fixture, trigger, host } = mount();
    await open(fixture, trigger);

    items()[0].click();
    fixture.detectChanges();

    expect(host.fired).toEqual(['edit']);
    expect(panel()).toBeNull();
  });

  it('ignores a click on a disabled item and stays open', async () => {
    const { fixture, trigger, host } = mount();
    host.dupDisabled.set(true);
    fixture.detectChanges();
    await open(fixture, trigger);

    expect(items()[1].getAttribute('aria-disabled')).toBe('true');
    items()[1].click();
    fixture.detectChanges();

    expect(host.fired).toEqual([]);
    expect(panel()).toBeTruthy();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const { fixture, trigger } = mount();
    await open(fixture, trigger);

    expect(press(fixture, panel()!, 'Escape').defaultPrevented).toBe(true);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Tab rather than letting focus escape into the panel', async () => {
    const { fixture, trigger } = mount();
    await open(fixture, trigger);

    expect(press(fixture, panel()!, 'Tab').defaultPrevented).toBe(true);
    expect(panel()).toBeNull();
  });
});
