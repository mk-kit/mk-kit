import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MkMenu, MkMenuItem } from '@mk-kit/ui/navigation';
import { MkContextMenuTrigger } from './context-menu-trigger';

@Component({
  imports: [MkContextMenuTrigger, MkMenu, MkMenuItem],
  template: `
    <div class="target" [mkContextMenuTriggerFor]="menu" tabindex="0">Row</div>
    <mk-menu #menu>
      <mk-menu-item>Edit</mk-menu-item>
    </mk-menu>
  `,
})
class Host {}

describe('MkContextMenuTrigger long-press', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const target = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.target',
    )!;
    const menu: MkMenu = fixture.debugElement.query(
      By.directive(MkMenu),
    ).componentInstance;
    // The menu machinery (portal, focus) is exercised by the menu specs — here
    // we only care that the trigger asks for the right open.
    const openAt = vi.spyOn(menu, 'openAt').mockImplementation(() => {});
    return { fixture, target, menu, openAt };
  }

  function touch(type: string, x: number, y: number): PointerEvent {
    return new PointerEvent(type, {
      pointerType: 'touch',
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    });
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('opens the menu at the touch coordinates after a long press', () => {
    const { target, openAt } = mount();
    target.dispatchEvent(touch('pointerdown', 40, 60));

    vi.advanceTimersByTime(499);
    expect(openAt).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(openAt).toHaveBeenCalledTimes(1);
    expect(openAt).toHaveBeenCalledWith(40, 60, target);
  });

  it('tolerates movement within the slop', () => {
    const { target, openAt } = mount();
    target.dispatchEvent(touch('pointerdown', 40, 60));
    target.dispatchEvent(touch('pointermove', 44, 63)); // 5px — a shaky finger

    vi.advanceTimersByTime(500);
    expect(openAt).toHaveBeenCalledWith(40, 60, target);
  });

  it('cancels the press when the finger moves too far (scroll intent)', () => {
    const { target, openAt } = mount();
    target.dispatchEvent(touch('pointerdown', 40, 60));
    target.dispatchEvent(touch('pointermove', 40, 80)); // 20px > slop

    vi.advanceTimersByTime(500);
    expect(openAt).not.toHaveBeenCalled();
  });

  it('cancels the press when the finger lifts early', () => {
    const { target, openAt } = mount();
    target.dispatchEvent(touch('pointerdown', 40, 60));
    vi.advanceTimersByTime(300);
    target.dispatchEvent(touch('pointerup', 40, 60));

    vi.advanceTimersByTime(500);
    expect(openAt).not.toHaveBeenCalled();
  });

  it('suppresses the synthetic contextmenu that follows a fired long-press', () => {
    const { target, openAt } = mount();
    target.dispatchEvent(touch('pointerdown', 40, 60));
    vi.advanceTimersByTime(500);
    expect(openAt).toHaveBeenCalledTimes(1);

    // Android synthesizes contextmenu after the long-press — no double open,
    // and the native menu stays suppressed.
    const synthetic = new MouseEvent('contextmenu', {
      clientX: 40,
      clientY: 60,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(synthetic);
    expect(synthetic.defaultPrevented).toBe(true);
    expect(openAt).toHaveBeenCalledTimes(1);

    // Only the one immediately following event is swallowed.
    target.dispatchEvent(
      new MouseEvent('contextmenu', { clientX: 10, clientY: 20, cancelable: true, bubbles: true }),
    );
    expect(openAt).toHaveBeenCalledTimes(2);
    expect(openAt).toHaveBeenLastCalledWith(10, 20, target);
  });

  it('keeps the mouse right-click path unchanged', () => {
    const { target, openAt } = mount();
    // A mouse press never starts a long-press timer…
    target.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerType: 'mouse',
        clientX: 5,
        clientY: 5,
        bubbles: true,
      }),
    );
    vi.advanceTimersByTime(1000);
    expect(openAt).not.toHaveBeenCalled();

    // …and the real contextmenu event opens at the click point.
    const event = new MouseEvent('contextmenu', {
      clientX: 120,
      clientY: 240,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(openAt).toHaveBeenCalledWith(120, 240, target);
  });
});
