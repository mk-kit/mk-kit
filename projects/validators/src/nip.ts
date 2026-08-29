import { compactOf, isDigits, weightedSum } from './util.js';

/**
 * NIP weights over the first nine digits; the tenth is `Σ mod 11`, and a
 * remainder of 10 makes the number invalid. Reference: Ustawa o zasadach
 * ewidencji i identyfikacji podatników (NIP), algorithm published by MF.
 */
const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const;

/** Check digit for the first nine digits, or `-1` when the sum leaves 10. */
export function nipCheckDigit(first9: string): number {
  const r = weightedSum(first9, NIP_WEIGHTS) % 11;
  return r === 10 ? -1 : r;
}

/**
 * The ten digits of a NIP without separators or the `PL` prefix
 * (`'PL 123-456-32-18'` → `'1234563218'`); `''` when the input is not a NIP.
 */
export function normalizeNip(value: unknown): string {
  const c = compactOf(value).replace(/^PL/, '');
  return isDigits(c, 10) ? c : '';
}

/** `true` for a NIP with a valid checksum (masked, spaced or `PL`-prefixed input accepted). */
export function isNip(value: unknown): boolean {
  const n = normalizeNip(value);
  return n !== '' && nipCheckDigit(n.slice(0, 9)) === Number(n[9]);
}

/** `'123-456-32-18'` — the conventional dashed form; `''` when invalid. */
export function formatNip(value: unknown): string {
  const n = normalizeNip(value);
  return n ? `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6, 8)}-${n.slice(8)}` : '';
}
