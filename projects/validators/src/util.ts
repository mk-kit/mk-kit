/** Keeps only ASCII digits. */
export function digitsOf(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

/** Uppercases and strips spaces, dashes, dots and slashes. */
export function compactOf(value: unknown): string {
  return typeof value === 'string' ? value.replace(/[\s./-]/g, '').toUpperCase() : '';
}

/** Weighted digit sum: Σ weights[i] · digit[i] over `weights.length` positions. */
export function weightedSum(digits: string, weights: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += weights[i] * (digits.charCodeAt(i) - 48);
  return sum;
}

/** `true` when `value` is a string made of exactly `length` digits. */
export function isDigits(value: string, length: number): boolean {
  return value.length === length && /^\d+$/.test(value);
}
