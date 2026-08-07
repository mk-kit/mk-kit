import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkDateRangePicker } from './date-range-picker';

/**
 * Keyboard dismissal of the range calendar panel (WCAG 2.1.1).
 *
 * The component had no Escape handling at all, and the panel is teleported to
 * `document.body`, out of reach of any host-level handler. Escape and
 * focusout are now wired on the panel element itself, mirroring
 * `mk-date-picker`.
 */
describe('MkDateRangePicker panel keyboard dismissal', () => {
  let fixture: ComponentFixture<MkDateRangePicker>;
  let rp: MkDateRangePicker;

  function panelEl(): HTMLElement | null {
    return document.querySelector('.mk-date-range-picker__panel');
  }

  async function openPanel(): Promise<HTMLElement> {
    (rp as any).openPanel();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = panelEl();
    expect(panel).toBeTruthy();
    return panel!;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkDateRangePicker);
    rp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('Escape inside the panel closes it and returns focus to the trigger', async () => {
    const panel = await openPanel();
    const day = panel.querySelector<HTMLElement>(
      '.mk-calendar__day[tabindex="0"]',
    )!;
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    day.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((rp as any).open()).toBe(false);
    expect(panelEl()).toBeNull();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.mk-date-range-picker__trigger',
    );
    expect(document.activeElement).toBe(trigger);
    expect(event.defaultPrevented).toBe(true);
  });

  it('Tab-out of the panel (focusout to an outside target) closes it', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      const panel = await openPanel();
      outside.focus();
      panel.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      expect((rp as any).open()).toBe(false);
      expect(panelEl()).toBeNull();
    } finally {
      outside.remove();
    }
  });
});
