import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkDatePicker } from './date-picker';

/**
 * Keyboard dismissal of the calendar panel (WCAG 2.1.1, dialog pattern).
 *
 * The panel is teleported to `document.body` by MkAnchoredPanel, so handlers
 * on the component host never see events fired inside it. Escape was only
 * wired on the input — a keyboard user whose focus sat in the calendar grid
 * could not dismiss it — and Tab-out of the panel leaked it open. Both are
 * now handled on the panel element itself.
 */
describe('MkDatePicker panel keyboard dismissal', () => {
  let fixture: ComponentFixture<MkDatePicker>;
  let dp: MkDatePicker;

  function panelEl(): HTMLElement | null {
    return document.querySelector('.mk-date-picker__panel');
  }

  async function openPanel(): Promise<HTMLElement> {
    (dp as any).openPanel();
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
    fixture = TestBed.createComponent(MkDatePicker);
    dp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('moves focus into the calendar grid on open', async () => {
    const panel = await openPanel();
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(
      (document.activeElement as HTMLElement).classList.contains(
        'mk-calendar__day',
      ),
    ).toBe(true);
  });

  it('Escape inside the panel closes it and returns focus to the input', async () => {
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

    expect((dp as any).open()).toBe(false);
    expect(panelEl()).toBeNull();
    const input =
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input');
    expect(document.activeElement).toBe(input);
    // Consumed, so an enclosing dialog's Escape handling does not also fire.
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
      expect((dp as any).open()).toBe(false);
      expect(panelEl()).toBeNull();
    } finally {
      outside.remove();
    }
  });

  it('focus moving from the panel back into the field keeps it open', async () => {
    const panel = await openPanel();
    const input =
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
    panel.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: input }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect((dp as any).open()).toBe(true);
  });
});
