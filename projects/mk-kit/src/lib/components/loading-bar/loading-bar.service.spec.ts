import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkLoadingBarService } from './loading-bar.service';

describe('MkLoadingBarService', () => {
  let svc: MkLoadingBarService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    svc = TestBed.inject(MkLoadingBarService);
  });

  afterEach(() => {
    svc.stop();
    vi.useRealTimers();
  });

  it('start shows the bar and trickles without completing', () => {
    svc.start();
    expect(svc.active()).toBe(true);
    expect(svc.progress()).toBe(8);
    vi.advanceTimersByTime(350 * 3);
    expect(svc.progress()).toBeGreaterThan(8);
    expect(svc.progress()).toBeLessThanOrEqual(90);
  });

  it('trickle never reaches 100', () => {
    svc.start();
    vi.advanceTimersByTime(350 * 100);
    expect(svc.progress()).toBeLessThanOrEqual(90);
  });

  it('set applies a determinate value (clamped)', () => {
    svc.set(50);
    expect(svc.progress()).toBe(50);
    svc.set(200);
    expect(svc.progress()).toBe(100);
  });

  it('complete finishes then hides', () => {
    svc.start();
    svc.complete();
    expect(svc.progress()).toBe(100);
    expect(svc.active()).toBe(true);
    vi.advanceTimersByTime(400);
    expect(svc.active()).toBe(false);
    expect(svc.progress()).toBe(0);
  });

  it('stop hides immediately', () => {
    svc.start();
    svc.stop();
    expect(svc.active()).toBe(false);
    expect(svc.progress()).toBe(0);
  });
});
