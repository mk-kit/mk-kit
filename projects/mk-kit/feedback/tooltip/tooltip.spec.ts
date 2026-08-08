import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkTooltip } from './tooltip';

@Component({
  imports: [MkTooltip],
  template: `<button
    [mkTooltip]="text()"
    [attr.aria-describedby]="existingDescribedBy()"
  >
    Save
  </button>`,
})
class Host {
  text = signal('Saves your changes');
  existingDescribedBy = signal<string | null>(null);
}

describe('MkTooltip', () => {
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

  // The panel is created imperatively and appended to document.body.
  const panel = () => document.querySelector<HTMLElement>('mk-tooltip');

  /** Focus opens with no delay; hover is deliberately delayed. */
  function focusIn(fixture: ReturnType<typeof mount>['fixture'], trigger: HTMLElement) {
    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
  }

  function out(fixture: ReturnType<typeof mount>['fixture'], trigger: HTMLElement) {
    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();
  }

  const clearPanels = () =>
    document.querySelectorAll('mk-tooltip').forEach((n) => n.remove());

  beforeEach(() => {
    vi.useFakeTimers();
    // The directive portals its panel into document.body, which is shared with
    // every other spec in this worker. Start from a clean slate so a stray
    // panel from elsewhere can never be mistaken for this test's own.
    clearPanels();
  });
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
    clearPanels();
  });

  it('shows nothing until the trigger is used', () => {
    mount();
    expect(panel()).toBeNull();
  });

  it('opens immediately on focus', () => {
    const { fixture, trigger } = mount();
    focusIn(fixture, trigger);

    // Keyboard users get no artificial delay.
    expect(panel()).toBeTruthy();
    expect(panel()!.textContent).toContain('Saves your changes');
  });

  it('waits out the hover delay before opening', () => {
    const { fixture, trigger } = mount();
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    // Still closed — a pointer sweeping across the button must not flash it.
    expect(panel()).toBeNull();

    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();
  });

  it('cancels a pending hover open when the pointer leaves first', () => {
    const { fixture, trigger } = mount();
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('describes the trigger while open and cleans up after', () => {
    const { fixture, trigger } = mount();
    expect(trigger.getAttribute('aria-describedby')).toBeNull();

    focusIn(fixture, trigger);
    const describedBy = trigger.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(panel()!.id).toBe(describedBy);

    const mine = panel()!;
    out(fixture, trigger);
    expect(mine.isConnected).toBe(false);
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
  });

  it('preserves a pre-existing aria-describedby', () => {
    const { fixture, trigger, host } = mount();
    host.existingDescribedBy.set('hint-1');
    fixture.detectChanges();

    focusIn(fixture, trigger);
    const value = trigger.getAttribute('aria-describedby')!;
    expect(value.split(' ')).toContain('hint-1');
    expect(value.split(' ').length).toBe(2);

    out(fixture, trigger);
    // Restored exactly, not clobbered.
    expect(trigger.getAttribute('aria-describedby')).toBe('hint-1');
  });

  it('closes on Escape', () => {
    const { fixture, trigger } = mount();
    focusIn(fixture, trigger);
    const mine = panel()!;
    expect(mine).toBeTruthy();

    // Invoke the host listener directly instead of dispatching a synthetic
    // KeyboardEvent. Angular registers `keydown.escape` through its
    // KeyEventsPlugin, and whether a hand-built event matches that pseudo-name
    // varies with the jsdom/worker setup — it failed on CI while passing
    // locally. Matching key names is Angular's job; ours is that the binding
    // is wired to hide(), which this asserts deterministically.
    const btn = fixture.debugElement.query((de) => de.nativeElement === trigger);
    btn.triggerEventHandler('keydown.escape', new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-describedby')).toBeNull();
    expect(mine.isConnected).toBe(false);
  });

  it('survives the pointer moving from the trigger onto the panel', () => {
    const { fixture, trigger } = mount();
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    const tip = panel()!;
    expect(tip).toBeTruthy();

    // Leaving the trigger only SCHEDULES the hide (WCAG 1.4.13 hoverable) —
    // the pointer needs time to cross the gap onto the panel.
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    // Entering the panel cancels the pending hide for good.
    tip.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    // Leaving the panel hides it after the same grace period.
    tip.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(150);
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('hides after the grace period when the pointer leaves and never reaches the panel', () => {
    const { fixture, trigger } = mount();
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(150);
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('re-entering the trigger during the grace period keeps the tooltip up', () => {
    const { fixture, trigger } = mount();
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();

    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(100);
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(panel()).toBeTruthy();
  });

  it('Escape pressed anywhere in the document dismisses a visible tooltip', () => {
    const { fixture, trigger } = mount();
    focusIn(fixture, trigger);
    expect(panel()).toBeTruthy();

    // Focus is elsewhere — the listener is document-level while visible.
    const e = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(e);
    fixture.detectChanges();

    expect(e.defaultPrevented).toBe(true);
    expect(panel()).toBeNull();
  });

  it('leaves Escape alone when no tooltip is visible', () => {
    mount();
    const e = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });

  it('does not open for empty or whitespace-only text', () => {
    const { fixture, trigger, host } = mount();
    host.text.set('   ');
    fixture.detectChanges();

    focusIn(fixture, trigger);
    expect(panel()).toBeNull();
  });

  it('does not stack panels when opened twice', () => {
    const { fixture, trigger } = mount();
    focusIn(fixture, trigger);
    focusIn(fixture, trigger);
    expect(document.querySelectorAll('mk-tooltip').length).toBe(1);
  });
});

/**
 * Tooltips deliberately sit ABOVE dialogs (--mk-z-tooltip 1300 vs
 * --mk-z-dialog 1100) so a tip on a control INSIDE a modal is visible. The
 * cost of that ordering is that a tooltip which outlives its interaction
 * floats over whatever the interaction opened — so it must dismiss on
 * pointer input.
 */
describe('MkTooltip dismissal on pointer input', () => {
  function mount() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    return f;
  }

  const tips = () => document.querySelectorAll('.mk-tooltip').length;

  afterEach(() =>
    document.querySelectorAll('.mk-tooltip').forEach((t) => t.remove()),
  );

  it('hides on pointerdown, so it cannot linger over what the tap opens', async () => {
    const f = mount();
    const el = (f.nativeElement as HTMLElement).querySelector('button')!;

    el.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise((r) => setTimeout(r, 400));
    expect(tips()).toBe(1);

    el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(tips()).toBe(0);
  });

  it('does not reopen via the focus that the same pointerdown causes', async () => {
    const f = mount();
    const el = (f.nativeElement as HTMLElement).querySelector('button')!;

    el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    el.dispatchEvent(new Event('focusin', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 50));

    expect(tips()).toBe(0);
  });

  it('still shows for keyboard focus, which has no preceding pointerdown', async () => {
    const f = mount();
    const el = (f.nativeElement as HTMLElement).querySelector('button')!;

    el.dispatchEvent(new Event('focusin', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 50));

    expect(tips()).toBe(1);
  });
});

/**
 * Touch has no hover, and pointerdown-dismiss alone would make tooltips
 * unreachable with a finger (the tap that focuses the trigger would kill the
 * tip in the same gesture). So a touch tap on the trigger TOGGLES: tap shows,
 * tap again — or tap anywhere else — dismisses. Mouse and pen keep the plain
 * dismiss-on-pointerdown behaviour.
 */
describe('MkTooltip on touch', () => {
  function mount() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    return {
      f,
      trigger: (f.nativeElement as HTMLElement).querySelector('button')!,
    };
  }

  const tips = () => document.querySelectorAll('.mk-tooltip').length;
  const touchDown = () =>
    new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' });

  afterEach(() =>
    document.querySelectorAll('.mk-tooltip').forEach((t) => t.remove()),
  );

  it('a touch tap on the trigger shows the tooltip immediately', () => {
    const { trigger } = mount();
    trigger.dispatchEvent(touchDown());
    expect(tips()).toBe(1);
  });

  it('a second tap on the trigger hides it (toggle)', () => {
    const { trigger } = mount();
    trigger.dispatchEvent(touchDown());
    expect(tips()).toBe(1);

    trigger.dispatchEvent(touchDown());
    expect(tips()).toBe(0);
  });

  it('a tap anywhere else dismisses via the document pointerdown path', () => {
    const { trigger } = mount();
    trigger.dispatchEvent(touchDown());
    expect(tips()).toBe(1);

    document.body.dispatchEvent(touchDown());
    expect(tips()).toBe(0);
  });

  it('does not re-show via the focusin the same tap causes', () => {
    const { trigger } = mount();
    trigger.dispatchEvent(touchDown());
    trigger.dispatchEvent(touchDown()); // toggle off …
    trigger.dispatchEvent(new Event('focusin', { bubbles: true })); // … tap's focus
    expect(tips()).toBe(0);
  });

  it('a press on the tooltip panel itself keeps it up (hoverable)', () => {
    const { trigger } = mount();
    trigger.dispatchEvent(touchDown());
    const panel = document.querySelector<HTMLElement>('.mk-tooltip')!;

    panel.dispatchEvent(touchDown());
    expect(tips()).toBe(1);
  });

  it('mouse pointerdown on the trigger still dismisses a hover tooltip', async () => {
    const { trigger } = mount();
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise((r) => setTimeout(r, 400));
    expect(tips()).toBe(1);

    trigger.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
    );
    expect(tips()).toBe(0);
  });
});
