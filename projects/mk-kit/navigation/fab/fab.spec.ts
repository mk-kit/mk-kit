import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkFab, MkFabAction } from './fab';

// Two hosts: content wrapped in @if would land in the DEFAULT projection slot
// (the @if anchor carries no [mkFabAction] attribute), so the action buttons
// must be static top-level content nodes to reach the actions slot.
@Component({
  imports: [MkFab, MkFabAction],
  template: `<mk-fab label="Create">
    +
    <button mkFabAction>Doc</button>
    <button mkFabAction>Folder</button>
  </mk-fab>`,
})
class HostWithActions {}

@Component({
  imports: [MkFab],
  template: `<mk-fab label="Create">+</mk-fab>`,
})
class HostPlain {}

describe('MkFab', () => {
  let fixture: ComponentFixture<HostWithActions | HostPlain>;
  let fab: MkFab;

  const setup = (withActions: boolean) => {
    fixture = TestBed.createComponent(withActions ? HostWithActions : HostPlain);
    fixture.detectChanges();
    fab = fixture.debugElement.children[0].componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => fixture.destroy());

  const trigger = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.mk-fab__button',
    )!;
  const actionsBox = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.mk-fab__actions',
    )!;

  it('emits action when it has no speed-dial actions', () => {
    setup(false);
    const action = vi.fn();
    fab.action.subscribe(action);
    (fab as any).onClick();
    expect(action).toHaveBeenCalledOnce();
    expect(fab.open()).toBe(false);
  });

  it('toggles the speed-dial when it has actions', () => {
    setup(true);
    expect((fab as any).hasActions()).toBe(true);
    (fab as any).onClick();
    expect(fab.open()).toBe(true);
    (fab as any).onClick();
    expect(fab.open()).toBe(false);
  });

  it('Escape closes an open speed-dial', () => {
    setup(true);
    fab.open.set(true);
    (fab as any).onKeydown(
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }),
    );
    expect(fab.open()).toBe(false);
  });

  it('uses disclosure semantics: no aria-haspopup, aria-controls wired', () => {
    setup(true);
    expect(trigger().hasAttribute('aria-haspopup')).toBe(false);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(actionsBox().id).toBeTruthy();
    expect(trigger().getAttribute('aria-controls')).toBe(actionsBox().id);
  });

  it('renders the actions after the trigger in DOM order', () => {
    setup(true);
    expect(
      trigger().compareDocumentPosition(actionsBox()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('moves focus to the first action when the speed-dial opens', async () => {
    setup(true);
    trigger().click();
    await fixture.whenStable();

    const first = actionsBox().querySelector<HTMLButtonElement>(
      '.mk-fab__action',
    )!;
    expect(fab.open()).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('returns focus to the trigger when Escape closes the dial', async () => {
    setup(true);
    trigger().click();
    await fixture.whenStable();

    const first = actionsBox().querySelector<HTMLButtonElement>(
      '.mk-fab__action',
    )!;
    first.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        cancelable: true,
        bubbles: true,
      }),
    );
    await fixture.whenStable();

    expect(fab.open()).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });
});
