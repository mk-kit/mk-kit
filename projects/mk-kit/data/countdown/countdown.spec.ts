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
    Reflect.deleteProperty(document, 'hidden');
    vi.useRealTimers();
  });

  /** Fake `document.hidden` and fire the visibilitychange the component listens for. */
  function setHidden(hidden: boolean): void {
    Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }

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

  it('live text omits seconds so it only changes when the minute rolls over', () => {
    fixture.componentRef.setInput('to', new Date(Date.now() + 65_000));
    fixture.detectChanges();
    const live = () => (cmp as any).liveText() as string;

    expect(live()).toBe('0 days, 0 hrs, 1 min');

    // 4 seconds later — same minute, so the announcement text is unchanged.
    vi.advanceTimersByTime(4000);
    expect(live()).toBe('0 days, 0 hrs, 1 min');

    // Minute rolls over (65s -> 59s remaining).
    vi.advanceTimersByTime(2000);
    expect(live()).toBe('0 days, 0 hrs, 0 min');
  });

  it('live text switches to a final finished announcement at zero', () => {
    fixture.componentRef.setInput('to', new Date(Date.now() + 1000));
    fixture.detectChanges();

    vi.advanceTimersByTime(2000);
    expect((cmp as any).liveText()).toBe('Finished');

    fixture.componentRef.setInput('finishedText', 'Launched!');
    fixture.detectChanges();
    expect((cmp as any).liveText()).toBe('Launched!');
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

  it('stops ticking entirely once the countdown reaches zero', () => {
    fixture.componentRef.setInput('to', new Date(Date.now() + 2000));
    fixture.detectChanges();

    vi.advanceTimersByTime(3000);
    expect((cmp as any).isDone()).toBe(true);

    // The interval is cleared at zero — no further `now` writes, ever.
    const frozen = (cmp as any).now();
    vi.advanceTimersByTime(30_000);
    expect((cmp as any).now()).toBe(frozen);
  });

  it('re-arms the interval when `to` moves into the future again', () => {
    const spy = vi.fn();
    (cmp as any).finished.subscribe(spy);
    fixture.componentRef.setInput('to', new Date(Date.now() + 1000));
    fixture.detectChanges();
    vi.advanceTimersByTime(2000);
    expect((cmp as any).isDone()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);

    // A "next round" target restarts the stopped interval and re-arms finished.
    fixture.componentRef.setInput('to', new Date(Date.now() + 5000));
    fixture.detectChanges();
    expect((cmp as any).isDone()).toBe(false);

    const before = (cmp as any).now();
    vi.advanceTimersByTime(1000);
    expect((cmp as any).now()).toBeGreaterThan(before);

    vi.advanceTimersByTime(5000);
    expect((cmp as any).isDone()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('pauses ticking while the tab is hidden and resyncs on return', () => {
    fixture.componentRef.setInput('to', new Date(Date.now() + 60_000));
    fixture.detectChanges();

    vi.advanceTimersByTime(3000);
    expect((cmp as any).remaining()).toBe(57_000);

    // Hidden tab: the interval is cleared — time passes, `now` stays frozen.
    setHidden(true);
    vi.advanceTimersByTime(10_000);
    expect((cmp as any).remaining()).toBe(57_000);

    // Visible again: immediate resync from Date.now(), then normal ticking.
    setHidden(false);
    expect((cmp as any).remaining()).toBe(47_000);
    vi.advanceTimersByTime(1000);
    expect((cmp as any).remaining()).toBe(46_000);
  });
});
