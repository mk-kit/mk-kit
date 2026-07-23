import { MkOverlayRef } from './overlay-ref';

/**
 * The close result is exposed as a signal, an Observable and a Promise so the
 * handle fits whichever style the calling code already uses. A consumer that
 * returns dialog results to its callers as an Observable shouldn't have to wrap
 * the promise in `from(...)`, and a signal component shouldn't have to await.
 *
 * All three must agree, including on dismissal (close with no argument).
 */
describe('MkOverlayRef result', () => {
  it('starts open with no result', () => {
    const ref = new MkOverlayRef<string>();
    expect(ref.closed()).toBe(false);
    expect(ref.result()).toBeUndefined();
  });

  it('exposes the result as a signal', () => {
    const ref = new MkOverlayRef<string>();
    ref.close('saved');
    expect(ref.closed()).toBe(true);
    expect(ref.result()).toBe('saved');
  });

  it('resolves the promise with the same value', async () => {
    const ref = new MkOverlayRef<string>();
    ref.close('saved');
    await expect(ref.afterClosed).resolves.toBe('saved');
  });

  it('emits once on closed$ and completes', () => {
    const ref = new MkOverlayRef<string>();
    const seen: (string | undefined)[] = [];
    let completed = false;
    ref.closed$.subscribe({
      next: (v) => seen.push(v),
      complete: () => (completed = true),
    });
    ref.close('saved');
    expect(seen).toEqual(['saved']);
    expect(completed).toBe(true);
  });

  it('replays to a late subscriber instead of hanging', () => {
    const ref = new MkOverlayRef<string>();
    ref.close('saved');
    const seen: (string | undefined)[] = [];
    let completed = false;
    ref.closed$.subscribe({
      next: (v) => seen.push(v),
      complete: () => (completed = true),
    });
    expect(seen).toEqual(['saved']);
    expect(completed).toBe(true);
  });

  it('reports undefined for a dismissal, on all three surfaces', async () => {
    const ref = new MkOverlayRef<string>();
    const seen: (string | undefined)[] = [];
    ref.closed$.subscribe((v) => seen.push(v));
    ref.close();
    expect(ref.closed()).toBe(true);
    expect(ref.result()).toBeUndefined();
    expect(seen).toEqual([undefined]);
    await expect(ref.afterClosed).resolves.toBeUndefined();
  });

  it('ignores a second close', () => {
    const ref = new MkOverlayRef<string>();
    const seen: (string | undefined)[] = [];
    ref.closed$.subscribe((v) => seen.push(v));
    ref.close('first');
    ref.close('second');
    expect(ref.result()).toBe('first');
    expect(seen).toEqual(['first']);
  });

  it('unsubscribing before close does not throw on close', () => {
    const ref = new MkOverlayRef<string>();
    const sub = ref.closed$.subscribe();
    sub.unsubscribe();
    expect(() => ref.close('saved')).not.toThrow();
    expect(ref.result()).toBe('saved');
  });
});
