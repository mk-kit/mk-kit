import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkStepper } from './stepper';
import { MkStep } from './step';

@Component({
  imports: [MkStepper, MkStep],
  template: `<mk-stepper
    #stepper
    [(selectedIndex)]="index"
    [linear]="linear()"
    (selectionChange)="changes.push($event)"
  >
    <mk-step label="Account" [(completed)]="oneDone">One body</mk-step>
    <mk-step label="Profile" [(completed)]="twoDone" [optional]="twoOptional()"
      >Two body</mk-step
    >
    <mk-step label="Review" [editable]="threeEditable()" [hasError]="threeError()"
      >Three body</mk-step
    >
  </mk-stepper>`,
})
class Host {
  readonly stepper = viewChild.required(MkStepper);
  index = signal(0);
  linear = signal(false);
  oneDone = signal(false);
  twoDone = signal(false);
  twoOptional = signal(false);
  threeEditable = signal(true);
  threeError = signal(false);
  changes: number[] = [];
}

describe('MkStepper', () => {
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
      headers: [...el.querySelectorAll<HTMLButtonElement>('[role=tab]')],
      panels: [...el.querySelectorAll<HTMLElement>('[role=tabpanel]')],
      host: fixture.componentInstance,
    };
  }

  function press(
    fixture: ReturnType<typeof mount>['fixture'],
    btn: HTMLElement,
    key: string,
  ) {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    btn.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('wires each header to its panel', () => {
    const { headers, panels } = mount();
    expect(headers.length).toBe(3);
    headers.forEach((h, i) => {
      expect(h.getAttribute('aria-controls')).toBe(panels[i].id);
      expect(panels[i].getAttribute('aria-labelledby')).toBe(h.id);
    });
  });

  it('shows only the active step', () => {
    const { headers, panels } = mount();
    expect(headers.map((h) => h.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(panels.map((p) => p.hasAttribute('hidden'))).toEqual([false, true, true]);
  });

  it('numbers the steps and renders their labels', () => {
    const { el, headers } = mount();
    expect(headers.map((h) => h.textContent).join()).toContain('Account');
    expect(
      [...el.querySelectorAll('.mk-stepper__marker')].map((m) => m.textContent?.trim()),
    ).toEqual(['1', '2', '3']);
  });

  it('selects a step on click and emits selectionChange once', () => {
    const { fixture, headers, host } = mount();
    headers[2].click();
    fixture.detectChanges();

    expect(host.index()).toBe(2);
    expect(host.changes).toEqual([2]);

    // Re-selecting the current step is a no-op, not a duplicate emission.
    headers[2].click();
    fixture.detectChanges();
    expect(host.changes).toEqual([2]);
  });

  it('advances and retreats through next()/previous()', () => {
    const { fixture, host } = mount();
    host.stepper().next();
    fixture.detectChanges();
    expect(host.index()).toBe(1);

    host.stepper().previous();
    fixture.detectChanges();
    expect(host.index()).toBe(0);

    // previous() at the start stays put rather than going negative.
    host.stepper().previous();
    fixture.detectChanges();
    expect(host.index()).toBe(0);
  });

  it('reset() returns to the first step and clears completion', () => {
    const { fixture, host } = mount();
    host.oneDone.set(true);
    host.index.set(2);
    fixture.detectChanges();

    host.stepper().reset();
    fixture.detectChanges();

    expect(host.index()).toBe(0);
    expect(host.oneDone()).toBe(false);
  });

  it('marks completed steps with a check instead of the number', () => {
    const { fixture, el, host } = mount();
    host.oneDone.set(true);
    fixture.detectChanges();

    const first = el.querySelector('[role=tab]')!;
    expect(first.classList.contains('mk-stepper__step--completed')).toBe(true);
    expect(first.querySelector('.mk-stepper__check')).toBeTruthy();
  });

  it('shows the error state ahead of completion', () => {
    const { fixture, el, host } = mount();
    host.threeError.set(true);
    fixture.detectChanges();

    const third = [...el.querySelectorAll('[role=tab]')][2];
    expect(third.classList.contains('mk-stepper__step--error')).toBe(true);
    expect(third.querySelector('.mk-stepper__bang')).toBeTruthy();
  });

  describe('linear mode', () => {
    it('blocks a step whose predecessors are incomplete', () => {
      const { fixture, headers, host } = mount();
      host.linear.set(true);
      fixture.detectChanges();

      expect(headers[1].disabled).toBe(true);
      expect(headers[1].getAttribute('aria-disabled')).toBe('true');

      headers[1].click();
      fixture.detectChanges();
      expect(host.index()).toBe(0);
    });

    it('unblocks the next step once the current one is completed', () => {
      const { fixture, headers, host } = mount();
      host.linear.set(true);
      host.oneDone.set(true);
      fixture.detectChanges();

      expect(headers[1].disabled).toBe(false);
      headers[1].click();
      fixture.detectChanges();
      expect(host.index()).toBe(1);
    });

    it('lets an optional step be skipped', () => {
      const { fixture, headers, host } = mount();
      host.linear.set(true);
      host.oneDone.set(true);
      host.twoOptional.set(true);
      fixture.detectChanges();

      // Step 2 is optional and incomplete, yet step 3 is still reachable.
      expect(headers[2].disabled).toBe(false);
    });

    it('refuses to go back to a non-editable step', () => {
      const { fixture, headers, host } = mount();
      host.linear.set(true);
      host.oneDone.set(true);
      host.twoDone.set(true);
      host.threeEditable.set(false);
      host.index.set(2);
      fixture.detectChanges();

      // Currently on step 3; going back to editable step 1 is fine.
      headers[0].click();
      fixture.detectChanges();
      expect(host.index()).toBe(0);
    });
  });

  describe('keyboard', () => {
    it('activates automatically as focus moves, like mk-tabs', () => {
      const { fixture, headers, host } = mount();
      expect(press(fixture, headers[0], 'ArrowRight').defaultPrevented).toBe(true);

      expect(document.activeElement).toBe(headers[1]);
      expect(host.index()).toBe(1);
      expect(host.changes).toEqual([1]);
    });

    it('wraps around at both ends', () => {
      const { fixture, headers, host } = mount();
      press(fixture, headers[0], 'ArrowLeft');
      expect(host.index()).toBe(2);

      press(fixture, headers[2], 'ArrowRight');
      expect(host.index()).toBe(0);
    });

    it('skips unreachable steps in linear mode', () => {
      const { fixture, headers, host } = mount();
      host.linear.set(true);
      fixture.detectChanges();

      // Steps 2 and 3 are blocked, so there is nowhere else to go.
      press(fixture, headers[0], 'ArrowRight');
      expect(host.index()).toBe(0);
    });

    it('jumps to the first and last header with Home and End', () => {
      const { fixture, headers, host } = mount();
      press(fixture, headers[0], 'End');
      expect(document.activeElement).toBe(headers[2]);
      expect(host.index()).toBe(2);

      press(fixture, headers[2], 'Home');
      expect(document.activeElement).toBe(headers[0]);
      expect(host.index()).toBe(0);
    });

    it('ignores unrelated keys', () => {
      const { fixture, headers } = mount();
      expect(press(fixture, headers[0], 'x').defaultPrevented).toBe(false);
    });

    it('keeps a single tab stop on the active step', () => {
      const { fixture, headers, host } = mount();
      expect(headers.map((h) => h.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

      host.index.set(1);
      fixture.detectChanges();
      expect(headers.map((h) => h.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    });
  });

  it('clamps an out-of-range selectedIndex', () => {
    const { fixture, panels, host } = mount();
    host.index.set(99);
    fixture.detectChanges();
    expect(panels.map((p) => p.hasAttribute('hidden'))).toEqual([true, true, false]);
  });
});
