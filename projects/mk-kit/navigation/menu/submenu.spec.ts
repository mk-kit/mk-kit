import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkMenu } from './menu';
import { MkMenuTrigger } from './menu-trigger';
import { MkMenuItem } from './menu-item';

@Component({
  imports: [MkMenu, MkMenuTrigger, MkMenuItem],
  template: `
    <div [attr.dir]="dir">
      <button [mkMenuTriggerFor]="menu">Actions</button>
      <mk-menu #menu>
        <mk-menu-item (action)="fired.push('edit')">Edit</mk-menu-item>
        <mk-menu-item [mkSubmenuFor]="exportMenu" [disabled]="exportDisabled">Export</mk-menu-item>
        <mk-menu #exportMenu>
          <mk-menu-item (action)="fired.push('csv')">CSV</mk-menu-item>
          <mk-menu-item [mkSubmenuFor]="pdfMenu">PDF</mk-menu-item>
          <mk-menu #pdfMenu>
            <mk-menu-item (action)="fired.push('pdf-a4')">A4</mk-menu-item>
            <mk-menu-item (action)="fired.push('pdf-letter')">Letter</mk-menu-item>
          </mk-menu>
        </mk-menu>
        <mk-menu-item danger (action)="fired.push('delete')">Delete</mk-menu-item>
      </mk-menu>
    </div>
  `,
})
class Host {
  dir: 'ltr' | 'rtl' = 'ltr';
  exportDisabled = false;
  fired: string[] = [];
}

describe('MkMenu submenus', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let trigger: HTMLButtonElement;

  const panels = () => [...document.querySelectorAll<HTMLElement>('[role=menu]')];
  const itemByText = (text: string) =>
    [...document.querySelectorAll<HTMLElement>('[role=menuitem]')].find((el) =>
      el.textContent!.trim().startsWith(text),
    )!;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function press(target: HTMLElement, key: string): KeyboardEvent {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  }

  async function openRoot(): Promise<void> {
    press(trigger, 'ArrowDown');
    await settle();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
    trigger = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('marks a submenu item with aria-haspopup / aria-expanded and a chevron', async () => {
    await openRoot();
    const item = itemByText('Export');
    expect(item.getAttribute('aria-haspopup')).toBe('menu');
    expect(item.getAttribute('aria-expanded')).toBe('false');
    expect(item.querySelector('.mk-menu-item__chevron')).toBeTruthy();
    expect(itemByText('Edit').hasAttribute('aria-haspopup')).toBe(false);
    expect(panels().length).toBe(1);
  });

  it('ArrowRight on the item opens the submenu beside it and focuses its first item', async () => {
    await openRoot();
    const item = itemByText('Export');
    item.focus();
    press(item, 'ArrowRight');
    await settle();
    expect(panels().length).toBe(2);
    expect(item.getAttribute('aria-expanded')).toBe('true');
    expect(panels()[1].getAttribute('data-placement')).toMatch(/^right/);
    expect(document.activeElement).toBe(itemByText('CSV'));
  });

  it('Enter and Space on the item open the submenu instead of emitting action', async () => {
    await openRoot();
    const item = itemByText('Export');
    item.focus();
    press(item, 'Enter');
    await settle();
    expect(panels().length).toBe(2);
    expect(host.fired).toEqual([]);
    expect(document.activeElement).toBe(itemByText('CSV'));
  });

  it('ArrowLeft in the submenu closes only that level and refocuses the item', async () => {
    await openRoot();
    const item = itemByText('Export');
    item.focus();
    press(item, 'ArrowRight');
    await settle();
    press(itemByText('CSV'), 'ArrowLeft');
    await settle();
    expect(panels().length).toBe(1);
    expect(document.activeElement).toBe(item);
    expect(item.getAttribute('aria-expanded')).toBe('false');
  });

  it('Escape in the submenu closes only that level, not the root', async () => {
    await openRoot();
    const item = itemByText('Export');
    item.focus();
    press(item, 'ArrowRight');
    await settle();
    const e = press(itemByText('CSV'), 'Escape');
    await settle();
    expect(e.defaultPrevented).toBe(true);
    expect(panels().length).toBe(1);
    expect(document.activeElement).toBe(item);
  });

  it('activating a leaf inside a nested submenu closes the whole chain and refocuses the trigger', async () => {
    await openRoot();
    itemByText('Export').focus();
    press(itemByText('Export'), 'ArrowRight');
    await settle();
    itemByText('PDF').focus();
    press(itemByText('PDF'), 'ArrowRight');
    await settle();
    expect(panels().length).toBe(3);
    press(itemByText('A4'), 'Enter');
    await settle();
    expect(host.fired).toEqual(['pdf-a4']);
    expect(panels().length).toBe(0);
    expect(document.activeElement).toBe(trigger);
  });

  it('a pointerdown inside the submenu does not dismiss the parent panel', async () => {
    await openRoot();
    itemByText('Export').focus();
    press(itemByText('Export'), 'ArrowRight');
    await settle();
    const csv = itemByText('CSV');
    csv.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await settle();
    expect(panels().length).toBe(2);
    csv.click();
    await settle();
    expect(host.fired).toEqual(['csv']);
    expect(panels().length).toBe(0);
  });

  it('a pointerdown on a sibling item dismisses the submenu but keeps the root open', async () => {
    await openRoot();
    itemByText('Export').focus();
    press(itemByText('Export'), 'ArrowRight');
    await settle();
    itemByText('Delete').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await settle();
    expect(panels().length).toBe(1);
    expect(itemByText('Export').getAttribute('aria-expanded')).toBe('false');
  });

  it('hovering the item opens the submenu after a short delay without moving focus', async () => {
    await openRoot();
    const item = itemByText('Export');
    const edit = itemByText('Edit');
    edit.focus();
    item.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(panels().length).toBe(1);
    await new Promise((r) => setTimeout(r, 200));
    await settle();
    expect(panels().length).toBe(2);
    expect(document.activeElement).toBe(edit);
  });

  it('leaving the item before the delay cancels the pending open', async () => {
    await openRoot();
    const item = itemByText('Export');
    item.dispatchEvent(new Event('mouseenter'));
    item.dispatchEvent(new Event('mouseleave'));
    await new Promise((r) => setTimeout(r, 200));
    await settle();
    expect(panels().length).toBe(1);
  });

  it('hovering another item closes an open sibling submenu', async () => {
    await openRoot();
    itemByText('Export').focus();
    press(itemByText('Export'), 'ArrowRight');
    await settle();
    itemByText('Edit').dispatchEvent(new Event('mouseenter'));
    await settle();
    expect(panels().length).toBe(1);
  });

  it('closing the root closes every open submenu', async () => {
    await openRoot();
    itemByText('Export').focus();
    press(itemByText('Export'), 'ArrowRight');
    await settle();
    press(itemByText('CSV'), 'Tab');
    await settle();
    expect(panels().length).toBe(0);
    expect(document.activeElement).toBe(trigger);
  });

  it('in RTL the submenu opens on the left and the arrow keys swap', async () => {
    host.dir = 'rtl';
    await settle();
    await openRoot();
    const item = itemByText('Export');
    item.focus();
    press(item, 'ArrowRight');
    await settle();
    expect(panels().length).toBe(1);
    press(item, 'ArrowLeft');
    await settle();
    expect(panels().length).toBe(2);
    expect(panels()[1].getAttribute('data-placement')).toMatch(/^left/);
    press(itemByText('CSV'), 'ArrowRight');
    await settle();
    expect(panels().length).toBe(1);
    expect(document.activeElement).toBe(item);
  });

  it('does not open a submenu from a disabled item', async () => {
    host.exportDisabled = true;
    await settle();
    await openRoot();
    const item = itemByText('Export');
    item.dispatchEvent(new Event('mouseenter'));
    await new Promise((r) => setTimeout(r, 200));
    await settle();
    expect(panels().length).toBe(1);
    expect(item.getAttribute('aria-expanded')).toBe('false');
  });
});
