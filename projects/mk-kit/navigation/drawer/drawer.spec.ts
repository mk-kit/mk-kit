import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkDrawer } from './drawer';

@Component({
  imports: [MkDrawer],
  template: `<mk-drawer
    [(open)]="open"
    [side]="side()"
    [heading]="heading()"
    [hasBackdrop]="hasBackdrop()"
    [closeOnBackdrop]="closeOnBackdrop()"
    [closeOnEscape]="closeOnEscape()"
    [hideClose]="hideClose()"
    [aria-label]="ariaLabel()"
  >
    <button type="button">Inside</button>
  </mk-drawer>`,
})
class Host {
  open = signal(false);
  side = signal<'start' | 'end'>('end');
  heading = signal('');
  hasBackdrop = signal(true);
  closeOnBackdrop = signal(true);
  closeOnEscape = signal(true);
  hideClose = signal(false);
  ariaLabel = signal('');
}

describe('MkDrawer', () => {
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
      root: el.querySelector<HTMLElement>('mk-drawer')!,
      panel: el.querySelector<HTMLElement>('[role=dialog]')!,
      host: fixture.componentInstance,
    };
  }

  /** Open and let the deferred focus/scroll sync run. */
  async function openDrawer(fixture: ReturnType<typeof mount>['fixture'], host: Host) {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    document.body.style.removeProperty('overflow');
  });

  it('renders a dialog panel that is inert while closed', () => {
    const { root, panel } = mount();
    expect(panel.getAttribute('role')).toBe('dialog');
    // Closed: removed from the a11y tree and from the tab order entirely.
    expect(root.hasAttribute('inert')).toBe(true);
    expect(root.classList.contains('mk-drawer--open')).toBe(false);
  });

  it('drops inert and marks itself open once opened', async () => {
    const { fixture, root, host } = mount();
    await openDrawer(fixture, host);

    expect(root.hasAttribute('inert')).toBe(false);
    expect(root.classList.contains('mk-drawer--open')).toBe(true);
  });

  it('exposes the side for styling', () => {
    const { fixture, root, host } = mount();
    expect(root.getAttribute('data-side')).toBe('end');

    host.side.set('start');
    fixture.detectChanges();
    expect(root.getAttribute('data-side')).toBe('start');
  });

  it('labels the panel from the heading, falling back to aria-label', () => {
    const { fixture, panel, host } = mount();
    host.ariaLabel.set('Filters');
    fixture.detectChanges();
    expect(panel.getAttribute('aria-label')).toBe('Filters');
    expect(panel.getAttribute('aria-labelledby')).toBeNull();

    host.heading.set('Filter results');
    fixture.detectChanges();
    // A visible heading wins and is referenced rather than duplicated.
    const labelledBy = panel.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(panel.getAttribute('aria-label')).toBeNull();
    expect(panel.querySelector(`#${labelledBy}`)?.textContent).toContain(
      'Filter results',
    );
  });

  it('is modal only when it has a backdrop', () => {
    const { fixture, panel, host } = mount();
    expect(panel.getAttribute('aria-modal')).toBe('true');

    host.hasBackdrop.set(false);
    fixture.detectChanges();
    // Non-modal: the rest of the page is still available.
    expect(panel.getAttribute('aria-modal')).toBeNull();
  });

  it('closes on a backdrop click, unless told not to', async () => {
    const { fixture, el, host } = mount();
    await openDrawer(fixture, host);

    el.querySelector<HTMLElement>('.mk-drawer__backdrop')!.click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);

    host.closeOnBackdrop.set(false);
    await openDrawer(fixture, host);
    el.querySelector<HTMLElement>('.mk-drawer__backdrop')!.click();
    fixture.detectChanges();
    expect(host.open()).toBe(true);
  });

  it('renders no backdrop when hasBackdrop is off', () => {
    const { fixture, el, host } = mount();
    host.hasBackdrop.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.mk-drawer__backdrop')).toBeNull();
  });

  it('closes with the header close button, which is hideable', async () => {
    const { fixture, el, host } = mount();
    await openDrawer(fixture, host);

    const close = el.querySelector<HTMLButtonElement>('.mk-drawer__close')!;
    expect(close.getAttribute('aria-label')).toBeTruthy();
    close.click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);

    host.hideClose.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.mk-drawer__close')).toBeNull();
  });

  it('locks body scroll while open and releases it on close', async () => {
    const { fixture, host } = mount();
    expect(document.body.style.overflow).toBe('');

    await openDrawer(fixture, host);
    expect(document.body.style.overflow).toBe('hidden');

    host.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('');
  });

  it('does not lock scroll for a non-modal drawer', async () => {
    const { fixture, host } = mount();
    host.hasBackdrop.set(false);
    await openDrawer(fixture, host);
    expect(document.body.style.overflow).toBe('');
  });

  it('releases the scroll lock if destroyed while open', async () => {
    const { fixture, host } = mount();
    await openDrawer(fixture, host);
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();
    expect(document.body.style.overflow).toBe('');
  });

  it('exposes an imperative close()', async () => {
    const { fixture, el, host } = mount();
    await openDrawer(fixture, host);

    const drawer = fixture.debugElement.query(
      (de) => de.componentInstance instanceof MkDrawer,
    ).componentInstance as MkDrawer;
    drawer.close();
    fixture.detectChanges();

    expect(host.open()).toBe(false);
    expect(el.querySelector('mk-drawer')!.hasAttribute('inert')).toBe(true);
  });
});
