import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** A duration split into whole day/hour/minute/second parts. */
export interface MkDurationParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Split a positive millisecond duration into whole days, hours, minutes and
 * seconds. Negative inputs clamp to zero.
 *
 * ```ts
 * mkSplitDuration(90_061_000); // { days: 1, hours: 1, minutes: 1, seconds: 1 }
 * ```
 */
export function mkSplitDuration(ms: number): MkDurationParts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

/**
 * Countdown — ticks every second and shows the time remaining until a target
 * instant as days / hours / minutes / seconds. Emits {@link finished} once when
 * the target passes and then keeps showing zeros (or {@link finishedText}).
 *
 * ```html
 * <mk-countdown [to]="launchDate" (finished)="onLaunch()" />
 * ```
 */
@Component({
  selector: 'mk-countdown',
  templateUrl: './countdown.html',
  styleUrl: './countdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-countdown',
    role: 'timer',
  },
})
export class MkCountdown {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The target instant to count down to. */
  readonly to = input<Date | null>(null);
  /** Show the days segment; when false, days roll into the hours value. */
  readonly showDays = input(true, { transform: booleanAttribute });
  /** Show the textual label beneath each value. */
  readonly showLabels = input(true, { transform: booleanAttribute });
  /** Zero-pad values to two digits. */
  readonly pad = input(true, { transform: booleanAttribute });
  /** Text to show instead of zeros once the countdown finishes. */
  readonly finishedText = input('');

  /** Fires exactly once when the target instant is reached. */
  readonly finished = output<void>();

  /** Current wall-clock time, updated every tick. */
  protected readonly now = signal(Date.now());

  /** Remaining milliseconds, clamped at zero. */
  protected readonly remaining = computed(() => {
    const target = this.to();
    if (!target) return 0;
    return Math.max(0, target.getTime() - this.now());
  });

  protected readonly parts = computed(() => {
    const { days, hours, minutes, seconds } = mkSplitDuration(this.remaining());
    return this.showDays()
      ? { days, hours, minutes, seconds }
      : { days: 0, hours: days * 24 + hours, minutes, seconds };
  });

  protected readonly isDone = computed(() => !!this.to() && this.remaining() === 0);

  protected readonly summary = computed(() => {
    const p = this.parts();
    const segs = this.showDays() ? [`${p.days} days`] : [];
    return [...segs, `${p.hours} hours`, `${p.minutes} minutes`, `${p.seconds} seconds`].join(
      ', ',
    );
  });

  private hasFinished = false;
  private intervalId?: number;

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      this.tick();
      this.intervalId = this.document.defaultView?.setInterval(() => this.tick(), 1000);
    });
  }

  private tick(): void {
    this.now.set(Date.now());
    if (!this.hasFinished && this.isDone()) {
      this.hasFinished = true;
      this.finished.emit();
    }
  }

  protected format(value: number): string {
    return this.pad() ? String(value).padStart(2, '0') : String(value);
  }

  ngOnDestroy(): void {
    if (this.intervalId != null) {
      this.document.defaultView?.clearInterval(this.intervalId);
    }
  }
}
