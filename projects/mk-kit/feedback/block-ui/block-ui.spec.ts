import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkBlockUi, MkBlockUiService } from './block-ui';

@Component({
  imports: [MkBlockUi],
  template: `
    <section id="region" [mkBlockUi]="busy()" [mkBlockUiMessage]="message()" [mkBlockUiDelay]="delay()">
      <button id="inner">Inner</button>
      <p>Text</p>
    </section>
  `,
})
class Host {
  readonly busy = signal(false);
  readonly message = signal('');
  readonly delay = signal(0);
}

describe('MkBlockUi', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const region = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#region')!;
  const overlay = () => region().querySelector<HTMLElement>('mk-block-ui-overlay');

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  afterEach(() => fixture.destroy());

  it('mounts an overlay with spinner + message, makes children inert and the host busy; unmounts cleanly', async () => {
    expect(overlay()).toBeNull();
    host.busy.set(true);
    host.message.set('Saving…');
    await settle();
    const ov = overlay()!;
    expect(ov).toBeTruthy();
    expect(ov.getAttribute('role')).toBe('status');
    expect(ov.querySelector('mk-spinner')).toBeTruthy();
    expect(ov.textContent).toContain('Saving…');
    expect(region().getAttribute('aria-busy')).toBe('true');
    expect(region().style.position).toBe('relative');
    expect(region().querySelector('#inner')!.hasAttribute('inert')).toBe(true);
    expect(ov.hasAttribute('inert')).toBe(false);

    host.message.set('Almost done…');
    await settle();
    expect(overlay()!.textContent).toContain('Almost done…');

    host.busy.set(false);
    await settle();
    expect(overlay()).toBeNull();
    expect(region().hasAttribute('aria-busy')).toBe(false);
    expect(region().style.position).toBe('');
    expect(region().querySelector('#inner')!.hasAttribute('inert')).toBe(false);
  });

  it('honours the delay and cancels it when unblocked in time', async () => {
    vi.useFakeTimers();
    try {
      host.delay.set(300);
      host.busy.set(true);
      await settle();
      expect(overlay()).toBeNull();
      vi.advanceTimersByTime(200);
      host.busy.set(false);
      await settle();
      vi.advanceTimersByTime(200);
      expect(overlay()).toBeNull();
      host.busy.set(true);
      await settle();
      vi.advanceTimersByTime(300);
      expect(overlay()).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('MkBlockUiService', () => {
  it('blocks the page with reference counting', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const svc = TestBed.inject(MkBlockUiService);
    const overlay = () => document.body.querySelector<HTMLElement>(':scope > mk-block-ui-overlay');
    const a = svc.block('Exporting…');
    expect(overlay()).toBeTruthy();
    expect(overlay()!.classList.contains('mk-block-ui--page')).toBe(true);
    expect(overlay()!.textContent).toContain('Exporting…');
    expect(document.body.getAttribute('aria-busy')).toBe('true');
    const b = svc.block();
    expect(svc.count()).toBe(2);
    a();
    a(); // idempotent
    expect(svc.isBlocked()).toBe(true);
    expect(overlay()).toBeTruthy();
    b();
    expect(svc.isBlocked()).toBe(false);
    expect(overlay()).toBeNull();
    expect(document.body.hasAttribute('aria-busy')).toBe(false);
  });
});
