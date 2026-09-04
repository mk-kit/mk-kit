import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { MkTone } from '@mk-kit/ui/core';
import { MkBadgeOverlay, type MkBadgeOverlayPosition } from './badge-overlay';

@Component({
  imports: [MkBadgeOverlay],
  template: `
    <button
      id="host"
      aria-label="Notifications"
      [mkBadgeOverlay]="content()"
      [mkBadgeOverlayPosition]="position()"
      [mkBadgeOverlayTone]="tone()"
      [mkBadgeOverlayDot]="dot()"
      [mkBadgeOverlayMax]="max()"
      [mkBadgeOverlayHidden]="hidden()"
      [mkBadgeOverlayAriaLabel]="ariaLabel()"
    >
      Bell
    </button>
  `,
})
class Host {
  readonly content = signal<string | number | null>(3);
  readonly position = signal<MkBadgeOverlayPosition>('top-end');
  readonly tone = signal<MkTone>('primary');
  readonly dot = signal(false);
  readonly max = signal(99);
  readonly hidden = signal(false);
  readonly ariaLabel = signal('');
}

describe('MkBadgeOverlay', () => {
  let fixture: ComponentFixture<Host>;
  let host: HTMLButtonElement;

  const badge = () => host.querySelector<HTMLElement>('.mk-badge-overlay');
  const sr = () => host.querySelector<HTMLElement>('.mk-visually-hidden');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    await settle();
    host = fixture.nativeElement.querySelector('#host');
  });

  it('renders the content in a badge appended to the host', () => {
    expect(badge()?.textContent).toBe('3');
    expect(badge()?.getAttribute('data-tone')).toBe('primary');
    expect(badge()?.getAttribute('data-position')).toBe('top-end');
  });

  it('makes a static host positioned, and only then', async () => {
    expect(host.style.position).toBe('relative');
    fixture.componentInstance.content.set(null);
    await settle();
    expect(host.style.position).toBe('');
  });

  it('keeps the host a single tab stop (badge is not focusable)', () => {
    expect(badge()?.hasAttribute('tabindex')).toBe(false);
    expect(badge()?.tagName).toBe('SPAN');
  });

  it('collapses numbers above max to "max+"', async () => {
    fixture.componentInstance.content.set(120);
    await settle();
    expect(badge()?.textContent).toBe('99+');

    fixture.componentInstance.max.set(9);
    await settle();
    expect(badge()?.textContent).toBe('9+');

    // Numeric strings count as numbers; other strings are shown verbatim.
    fixture.componentInstance.content.set('42');
    await settle();
    expect(badge()?.textContent).toBe('9+');
    fixture.componentInstance.content.set('new');
    await settle();
    expect(badge()?.textContent).toBe('new');

    // max = 0 disables the cap.
    fixture.componentInstance.content.set(500);
    fixture.componentInstance.max.set(0);
    await settle();
    expect(badge()?.textContent).toBe('500');
  });

  it('renders a textless, aria-hidden dot', async () => {
    fixture.componentInstance.content.set(null);
    fixture.componentInstance.dot.set(true);
    await settle();
    expect(badge()?.classList.contains('mk-badge-overlay--dot')).toBe(true);
    expect(badge()?.textContent).toBe('');
    expect(badge()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes every position via data-position', async () => {
    for (const p of ['top-start', 'bottom-end', 'bottom-start', 'top-end'] as const) {
      fixture.componentInstance.position.set(p);
      await settle();
      expect(badge()?.getAttribute('data-position')).toBe(p);
    }
  });

  it('removes the badge when hidden or when content is empty', async () => {
    fixture.componentInstance.hidden.set(true);
    await settle();
    expect(badge()).toBeNull();

    fixture.componentInstance.hidden.set(false);
    await settle();
    expect(badge()).not.toBeNull();

    fixture.componentInstance.content.set('');
    await settle();
    expect(badge()).toBeNull();
  });

  it('announces the aria label through a hidden description on the host', async () => {
    // Without a label the visible count is part of the accessible content.
    expect(badge()?.hasAttribute('aria-hidden')).toBe(false);
    expect(sr()).toBeNull();
    expect(host.hasAttribute('aria-describedby')).toBe(false);

    fixture.componentInstance.ariaLabel.set('3 unread');
    await settle();
    const hidden = sr();
    expect(hidden?.textContent).toBe('3 unread');
    expect(hidden?.id).toBeTruthy();
    expect(host.getAttribute('aria-describedby')).toBe(hidden!.id);
    // The visible badge must not be read a second time.
    expect(badge()?.getAttribute('aria-hidden')).toBe('true');

    // Clearing the label unwires everything again.
    fixture.componentInstance.ariaLabel.set('');
    await settle();
    expect(sr()).toBeNull();
    expect(host.hasAttribute('aria-describedby')).toBe(false);
    expect(badge()?.hasAttribute('aria-hidden')).toBe(false);
  });

  it('merges with an existing aria-describedby rather than replacing it', async () => {
    host.setAttribute('aria-describedby', 'hint');
    fixture.componentInstance.ariaLabel.set('3 unread');
    await settle();
    expect(host.getAttribute('aria-describedby')).toBe(`hint ${sr()!.id}`);
    fixture.componentInstance.ariaLabel.set('');
    await settle();
    expect(host.getAttribute('aria-describedby')).toBe('hint');
  });

  it('updates tone, position and content in place on input change', async () => {
    const first = badge();
    fixture.componentInstance.tone.set('danger');
    fixture.componentInstance.position.set('bottom-start');
    fixture.componentInstance.content.set(7);
    await settle();
    expect(badge()).toBe(first);
    expect(first?.getAttribute('data-tone')).toBe('danger');
    expect(first?.getAttribute('data-position')).toBe('bottom-start');
    expect(first?.textContent).toBe('7');
  });
});
