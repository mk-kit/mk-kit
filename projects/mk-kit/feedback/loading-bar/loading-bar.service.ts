import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Drives a global {@link MkLoadingBar} — the thin top-of-page progress bar for
 * route changes and background work. `start()` shows it and trickles toward 90%;
 * `complete()` finishes and hides it. Also supports a determinate `set(value)`.
 *
 * ```ts
 * const bar = inject(MkLoadingBarService);
 * router.events.subscribe(e => {
 *   if (e instanceof NavigationStart) bar.start();
 *   if (e instanceof NavigationEnd) bar.complete();
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkLoadingBarService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _progress = signal(0);
  private readonly _active = signal(false);
  /** Current progress, 0–100. */
  readonly progress = this._progress.asReadonly();
  /** Whether the bar is visible. */
  readonly active = this._active.asReadonly();

  private timer?: ReturnType<typeof setInterval>;
  private doneTimer?: ReturnType<typeof setTimeout>;

  /** Show the bar and start trickling toward 90%. */
  start(): void {
    if (!this.isBrowser) return;
    this.clearTimers();
    this._active.set(true);
    this._progress.set(8);
    this.timer = setInterval(() => this.trickle(), 350);
  }

  /** Set an explicit determinate value (0–100). */
  set(value: number): void {
    this.clearTimers();
    this._active.set(true);
    this._progress.set(Math.max(0, Math.min(100, value)));
  }

  /** Nudge progress up by `amount` (default 5), capped at 90%. */
  inc(amount = 5): void {
    if (!this._active()) this.start();
    this._progress.set(Math.min(90, this._progress() + amount));
  }

  /** Finish (jump to 100%) then fade out. */
  complete(): void {
    if (!this.isBrowser) {
      this._active.set(false);
      return;
    }
    this.clearTimers();
    this._progress.set(100);
    this.doneTimer = setTimeout(() => {
      this._active.set(false);
      this._progress.set(0);
    }, 350);
  }

  /** Hide immediately without finishing. */
  stop(): void {
    this.clearTimers();
    this._active.set(false);
    this._progress.set(0);
  }

  /** Auto-slowing trickle so the bar keeps moving without ever completing. */
  private trickle(): void {
    const p = this._progress();
    if (p >= 90) return;
    const step = p < 20 ? 10 : p < 50 ? 4 : p < 80 ? 2 : 0.5;
    this._progress.set(Math.min(90, p + step));
  }

  private clearTimers(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.doneTimer) clearTimeout(this.doneTimer);
    this.timer = undefined;
    this.doneTimer = undefined;
  }

  /** True while finishing (progress full but not yet hidden). */
  readonly finishing = computed(() => this._active() && this._progress() >= 100);
}
