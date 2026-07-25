import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkOverlayService } from './overlay.service';

/**
 * `closeAll` exists for app-level events — logging out, a session expiring, a
 * hard route change — where something must clear whatever is floating above
 * the page and the caller has no handle on it. Without it a dialog opened
 * before logout lingers over the login screen.
 */
@Component({ standalone: true, template: `<button>ok</button>` })
class Tiny {}

describe('MkOverlayService closeAll', () => {
  let service: MkOverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MkOverlayService);
    service.closeAll(); // isolate from anything a previous spec left open
  });

  afterEach(() => service.closeAll());

  it('closes every open overlay', () => {
    const a = service.open(Tiny, {});
    const b = service.open(Tiny, {});
    expect(service.openCount).toBe(2);

    service.closeAll();

    expect(a.closed()).toBe(true);
    expect(b.closed()).toBe(true);
    expect(service.openCount).toBe(0);
  });

  it('closes with no result, like a dismissal', async () => {
    const ref = service.open<Tiny, string>(Tiny, {});
    service.closeAll();
    await expect(ref.afterClosed).resolves.toBeUndefined();
  });

  it('releases the body scroll lock', () => {
    service.open(Tiny, {});
    service.open(Tiny, {});
    expect(document.body.style.overflow).toBe('hidden');

    service.closeAll();

    // The open-count bookkeeping has to balance, or the page stays unscrollable
    // for the rest of the session.
    expect(document.body.style.overflow).toBe('');
  });

  it('is a no-op when nothing is open', () => {
    expect(() => service.closeAll()).not.toThrow();
    expect(service.openCount).toBe(0);
  });

  it('does not double-close an already-closed overlay', () => {
    const ref = service.open(Tiny, {});
    ref.close('first');
    service.closeAll();
    // close() is idempotent, so the earlier result must survive closeAll.
    expect(ref.result()).toBe('first');
    expect(service.openCount).toBe(0);
  });
});
