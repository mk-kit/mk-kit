import { InjectionToken, signal, type ComponentRef } from '@angular/core';
import { Observable } from 'rxjs';

/** Injection token exposing the data passed to an overlay component. */
export const MK_OVERLAY_DATA = new InjectionToken<unknown>('MK_OVERLAY_DATA');

/**
 * Handle to an open overlay. Injected into the rendered component and returned
 * from `MkOverlayService.open`. Resolve the overlay by calling `close`.
 *
 * The close result is exposed three ways so the handle fits whatever style the
 * calling code already uses — they all settle together:
 *
 * - `result` — a signal, for template binding and signal-based components.
 * - `closed$` — an Observable that emits once and completes, for RxJS
 *   pipelines. A service that hands a dialog result back to its callers can
 *   return this directly instead of wrapping the promise in `from(...)`.
 * - `afterClosed` — a Promise, for `await` / `.then()`.
 */
export class MkOverlayRef<TResult = unknown, TComponent = unknown> {
  /** The rendered component instance (set by the service after creation). */
  componentRef?: ComponentRef<TComponent>;

  private readonly _closed = signal(false);
  /** Becomes `true` once the overlay has been dismissed. */
  readonly closed = this._closed.asReadonly();

  private readonly _result = signal<TResult | undefined>(undefined);
  /**
   * The value passed to `close`, or `undefined` while open and for a dismissal
   * (Escape / backdrop). Read `closed()` to tell "closed with no result" apart
   * from "still open".
   */
  readonly result = this._result.asReadonly();

  private resolveClosed!: (result: TResult | undefined) => void;
  /** Resolves with the close result when the overlay is dismissed. */
  readonly afterClosed = new Promise<TResult | undefined>((resolve) => {
    this.resolveClosed = resolve;
  });

  private emitClosed?: (result: TResult | undefined) => void;
  /**
   * Emits the close result once, then completes. Subscribing after the overlay
   * has already closed replays the result immediately, so a late subscriber
   * never hangs.
   */
  readonly closed$ = new Observable<TResult | undefined>((subscriber) => {
    if (this._closed()) {
      subscriber.next(this._result());
      subscriber.complete();
      return;
    }
    this.emitClosed = (result) => {
      subscriber.next(result);
      subscriber.complete();
    };
    return () => {
      this.emitClosed = undefined;
    };
  });

  /** Internal disposer wired up by the service. */
  _dispose: (result: TResult | undefined) => void = () => {};

  /** Close the overlay, optionally returning a result. */
  close(result?: TResult): void {
    if (this._closed()) return;
    this._closed.set(true);
    this._result.set(result);
    this._dispose(result);
    this.resolveClosed(result);
    this.emitClosed?.(result);
  }
}
