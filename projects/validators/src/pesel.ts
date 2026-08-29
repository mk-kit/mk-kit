import { digitsOf, isDigits, weightedSum } from './util.js';

/**
 * PESEL check-digit weights over the first ten digits. The eleventh digit is
 * `(10 − Σ mod 10) mod 10`. Reference: Rozporządzenie MSWiA z 2015 r. w
 * sprawie trybu nadawania numeru PESEL, § 3.
 */
const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3] as const;

/** Month offsets encode the century: 1800–2299 in steps of 20. */
const CENTURY_BY_OFFSET: ReadonlyArray<readonly [offset: number, century: number]> = [
  [80, 1800], [0, 1900], [20, 2000], [40, 2100], [60, 2200],
];

/** What a PESEL encodes. */
export interface PeselInfo {
  /** Date of birth at local midnight. */
  birthDate: Date;
  /** `'F'` for even, `'M'` for odd tenth digit. */
  sex: 'F' | 'M';
  /** The four-digit serial, including the sex digit. */
  serial: string;
}

/** Check digit for the first ten digits of a PESEL. */
export function peselCheckDigit(first10: string): number {
  return (10 - (weightedSum(first10, PESEL_WEIGHTS) % 10)) % 10;
}

/**
 * Parses a PESEL: shape, checksum **and** a real calendar date (a checksum-
 * valid `99-02-30` is still rejected). Returns `null` when invalid.
 */
export function parsePesel(value: unknown): PeselInfo | null {
  const d = digitsOf(value);
  if (!isDigits(d, 11)) return null;
  if (peselCheckDigit(d.slice(0, 10)) !== Number(d[10])) return null;
  const yy = Number(d.slice(0, 2));
  const mmRaw = Number(d.slice(2, 4));
  const dd = Number(d.slice(4, 6));
  const entry = CENTURY_BY_OFFSET.find(([o]) => mmRaw > o && mmRaw <= o + 12);
  if (!entry) return null;
  const year = entry[1] + yy;
  const month = mmRaw - entry[0];
  const birthDate = new Date(year, month - 1, dd);
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== dd) {
    return null;
  }
  return { birthDate, sex: Number(d[9]) % 2 === 0 ? 'F' : 'M', serial: d.slice(6, 10) };
}

/** `true` for a syntactically and semantically valid PESEL. */
export function isPesel(value: unknown): boolean {
  return parsePesel(value) !== null;
}
