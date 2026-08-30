let counter = 0;

/**
 * Generates a stable, unique DOM id for wiring `aria-*` relationships
 * (labels, descriptions, controls). Prefer this over `Math.random()` so
 * ids are deterministic within a render and SSR-safe.
 *
 * @param prefix short semantic prefix, e.g. `mk-input`.
 */
export function mkUniqueId(prefix = 'mk'): string {
  return `${prefix}-${++counter}`;
}
