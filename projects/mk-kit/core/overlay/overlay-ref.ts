import { InjectionToken, signal, type ComponentRef } from '@angular/core';

/** Injection token exposing the data passed to an overlay component. */
export const MK_OVERLAY_DATA = new InjectionToken<unknown>('MK_OVERLAY_DATA');

/**
 * Handle to an open overlay. Injected into the rendered component and returned
 * from `MkOverlayService.open`. Resolve the overlay by calling `close`.
 */
export class MkOverlayRef<TResult = unknown, TComponent = unknown> {
  /** The rendered component instance (set by the service after creation). */
  componentRef?: ComponentRef<TComponent>;

  private readonly _closed = signal(false);
  /** Becomes `true` once the overlay has been dismissed. */
  readonly closed = this._closed.asReadonly();

  private resolveClosed!: (result: TResult | undefined) => void;
  /** Resolves with the close result when the overlay is dismissed. */
  readonly afterClosed = new Promise<TResult | undefined>((resolve) => {
    this.resolveClosed = resolve;
  });

  /** Internal disposer wired up by the service. */
  _dispose: (result: TResult | undefined) => void = () => {};

  /** Close the overlay, optionally returning a result to `afterClosed`. */
  close(result?: TResult): void {
    if (this._closed()) return;
    this._closed.set(true);
    this._dispose(result);
    this.resolveClosed(result);
  }
}
