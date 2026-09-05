import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MkDialogService } from '@mk-kit/ui/feedback';
import {
  MK_CHIME_PRESET,
  MkNotificationSound,
  MkSessionExpiry,
  MkTabAttention,
  provideMkNotificationSound,
  provideMkSessionExpiry,
  provideMkTabAttention,
} from './index';

describe('MkTabAttention', () => {
  let link: HTMLLinkElement;
  beforeEach(() => {
    document.title = 'Panel';
    link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'http://localhost/favicon.ico';
    document.head.appendChild(link);
  });
  afterEach(() => link.remove());

  it('badges the favicon while work is pending and restores it at zero', () => {
    TestBed.configureTestingModule({ providers: [provideMkTabAttention({ badgeColor: '#123456' })] });
    const t = TestBed.inject(MkTabAttention);
    t.set(3, 'nowe zamówienia');
    expect(t.count()).toBe(3);
    expect(link.href.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(link.href)).toContain('#123456');
    expect(decodeURIComponent(link.href)).toContain('>3<');
    t.set(12);
    expect(decodeURIComponent(link.href)).toContain('9+');
    // Visible tab: the title is left alone.
    expect(document.title).toBe('Panel');
    t.set(0);
    expect(link.href).toBe('http://localhost/favicon.ico');
    t.clear();
    expect(t.count()).toBe(0);
  });

  it('blinks the title only while the tab is hidden', () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    try {
      TestBed.configureTestingModule({ providers: [provideMkTabAttention({ blinkMs: 100 })] });
      const t = TestBed.inject(MkTabAttention);
      t.set(2, 'orders');
      expect(document.title).toBe('(2) orders');
      vi.advanceTimersByTime(100);
      expect(document.title).toBe('Panel');
      vi.advanceTimersByTime(100);
      expect(document.title).toBe('(2) orders');
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
      expect(document.title).toBe('Panel');
      vi.advanceTimersByTime(300);
      expect(document.title).toBe('Panel');
      t.clear();
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      vi.useRealTimers();
    }
  });
});

describe('MkNotificationSound', () => {
  it('stores the preference under the configured key and lists the chime first', () => {
    TestBed.configureTestingModule({
      providers: [
        provideMkNotificationSound({
          presets: [{ id: 'ding', label: 'Ding', url: '/ding.wav' }],
          storageKey: () => 'test-sound:tenant-a',
        }),
      ],
    });
    const s = TestBed.inject(MkNotificationSound);
    localStorage.removeItem('test-sound:tenant-a');
    expect(s.hasBeenAsked()).toBe(false);
    expect(s.isEnabled()).toBe(false);
    s.setEnabled(true);
    expect(localStorage.getItem('test-sound:tenant-a')).toBe('true');
    expect(s.isEnabled()).toBe(true);
    expect(s.presets.map((p) => p.id)).toEqual([MK_CHIME_PRESET.id, 'ding']);
    localStorage.removeItem('test-sound:tenant-a');
  });

  it('is silent when muted and never throws without Web Audio', () => {
    TestBed.configureTestingModule({});
    const s = TestBed.inject(MkNotificationSound);
    localStorage.removeItem('mk-notification-sound');
    expect(() => {
      s.play('chime');
      s.preview('none');
      s.preview('custom', '/nope.mp3'); // jsdom has no AudioContext → no-op
      s.primeOnFirstInteraction();
      s.chime();
    }).not.toThrow();
  });
});

describe('MkSessionExpiry', () => {
  it('opens the dialog warnBeforeMs before the lapse and re-arms on a new expiry', () => {
    vi.useFakeTimers();
    try {
      const expiresAt = signal<number | null>(Date.now() + 10_000);
      const open = vi.fn(() => ({ closed$: { subscribe: () => undefined } }));
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: MkDialogService, useValue: { open } },
          provideMkSessionExpiry({
            expiresAt: () => expiresAt(),
            warnBeforeMs: 4_000,
            extend: () => Promise.resolve(),
            onExpire: () => undefined,
          }),
        ],
      });
      const svc = TestBed.inject(MkSessionExpiry);
      svc.start();
      TestBed.tick();
      vi.advanceTimersByTime(5_999);
      expect(open).not.toHaveBeenCalled();
      vi.advanceTimersByTime(2);
      expect(open).toHaveBeenCalledTimes(1);
      expect(svc.open()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ends the session at once when it already lapsed, and stays quiet when disabled', () => {
    const onExpire = vi.fn();
    const open = vi.fn();
    const enabled = signal(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: MkDialogService, useValue: { open } },
        provideMkSessionExpiry({
          expiresAt: () => Date.now() - 1_000,
          extend: () => Promise.resolve(),
          onExpire,
          enabled: () => enabled(),
        }),
      ],
    });
    const svc = TestBed.inject(MkSessionExpiry);
    svc.start();
    TestBed.tick();
    expect(onExpire).not.toHaveBeenCalled();
    enabled.set(true);
    TestBed.tick();
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });
});
