import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkCountdown, mkSplitDuration } from './countdown';

describe('mkSplitDuration', () => {
  it('splits 90061000 ms into 1d 1h 1m 1s', () => {
    expect(mkSplitDuration(90_061_000)).toEqual({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
    });
  });

  it('returns all zeros for 0', () => {
    expect(mkSplitDuration(0)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('clamps negative durations to zero', () => {
    expect(mkSplitDuration(-5000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('truncates sub-second remainders', () => {
    expect(mkSplitDuration(59_999)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 59,
    });
  });
});

describe('MkCountdown', () => {
  let fixture: ComponentFixture<MkCountdown>;
  let cmp: MkCountdown;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkCountdown);
    cmp = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('rolls days into hours when showDays is false', () => {
    fixture.componentRef.setInput('to', new Date(Date.now() + 90_061_000));
    fixture.componentRef.setInput('showDays', false);
    fixture.detectChanges();
    const parts = (cmp as any).parts();
    expect(parts.days).toBe(0);
    expect(parts.hours).toBe(25);
    expect(parts.minutes).toBe(1);
    expect(parts.seconds).toBe(1);
  });

  it('fires finished once when the target passes', () => {
    const spy = vi.fn();
    fixture.componentRef.setInput('to', new Date(Date.now() + 2000));
    (cmp as any).finished.subscribe(spy);
    fixture.detectChanges();

    vi.advanceTimersByTime(3000);
    expect(spy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    expect(spy).toHaveBeenCalledTimes(1);
    expect((cmp as any).isDone()).toBe(true);
  });
});
