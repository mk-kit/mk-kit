import { describe, expect, it } from 'vitest';
import {
  CARD_BRAND_NAMES,
  DIAL_CODES,
  IBAN_LENGTHS,
  POSTAL_FORMATS,
  VAT_FORMATS,
  detectCardBrand,
  formatIban,
  formatNip,
  ibanCheckDigits,
  isCardNumber,
  isE164,
  isIban,
  isKrs,
  isLuhn,
  isNip,
  isPesel,
  isPolishIdCard,
  isPostalCode,
  isRegon,
  isVatId,
  luhnCheckDigit,
  nipCheckDigit,
  normalizeKrs,
  normalizeNip,
  parseIban,
  parsePesel,
  parseVatId,
  peselCheckDigit,
  regon14CheckDigit,
  regon9CheckDigit,
  toE164,
} from './index.js';

// ---------------------------------------------------------------------------
// Deterministic generators (mulberry32) — property tests without a dependency
// ---------------------------------------------------------------------------
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = prng(20260829);
const int = (max: number) => Math.floor(rnd() * max);
const digits = (n: number) => Array.from({ length: n }, () => int(10)).join('');
/** Replaces the digit at `i` with a different one. */
const mutate = (s: string, i: number) =>
  s.slice(0, i) + ((Number(s[i]) + 1 + int(9)) % 10) + s.slice(i + 1);
const N = 400;

const validPesel = () => {
  const year = 1900 + int(200);
  const month = 1 + int(12);
  const day = 1 + int(28);
  const offset = year >= 2000 ? 20 : 0;
  const first10 = `${String(year % 100).padStart(2, '0')}${String(month + offset).padStart(2, '0')}${String(day).padStart(2, '0')}${digits(4)}`;
  return { pesel: first10 + peselCheckDigit(first10), year, month, day };
};
const validNip = () => {
  for (;;) {
    const first9 = digits(9);
    const c = nipCheckDigit(first9);
    if (c >= 0) return first9 + c;
  }
};
const validRegon9 = () => {
  const first8 = digits(8);
  return first8 + regon9CheckDigit(first8);
};
const validRegon14 = () => {
  const r9 = validRegon9();
  const first13 = r9 + digits(4);
  return first13 + regon14CheckDigit(first13);
};
const validIban = (country: string) => {
  const len = IBAN_LENGTHS[country];
  const bban = digits(len - 4);
  return `${country}${ibanCheckDigits(country, bban)}${bban}`;
};

describe('PESEL', () => {
  it('accepts published examples and parses them', () => {
    const p = parsePesel('44051401359');
    expect(p).not.toBeNull();
    expect(p!.birthDate).toEqual(new Date(1944, 4, 14));
    expect(p!.sex).toBe('M');
    // Month 27 = July with the 2000s offset (+20); tenth digit even → F.
    const y2k = '0227080362' + peselCheckDigit('0227080362');
    expect(parsePesel(y2k)!.birthDate).toEqual(new Date(2002, 6, 8));
    expect(parsePesel(y2k)!.sex).toBe('F');
    // The same digits without the offset are a 1902 birth.
    expect(parsePesel('02070803628')!.birthDate).toEqual(new Date(1902, 6, 8));
  });
  it('rejects wrong length, checksum and impossible dates', () => {
    expect(isPesel('4405140135')).toBe(false);
    expect(isPesel('44051401358')).toBe(false);
    // 30 February — checksum-consistent digits, but not a date.
    const first10 = '9902300000';
    expect(isPesel(first10 + peselCheckDigit(first10))).toBe(false);
    expect(isPesel(null)).toBe(false);
    expect(isPesel(44051401359)).toBe(false);
  });
  it(`property: ${N} generated PESELs validate, and any single-digit error is caught`, () => {
    for (let i = 0; i < N; i++) {
      const { pesel, year, month, day } = validPesel();
      const info = parsePesel(pesel);
      expect(info, pesel).not.toBeNull();
      expect(info!.birthDate, pesel).toEqual(new Date(year, month - 1, day));
      expect(isPesel(mutate(pesel, 6 + int(5))), pesel).toBe(false);
    }
  });
});

describe('NIP', () => {
  it('accepts the documented example in every common spelling', () => {
    for (const v of ['1234563218', '123-456-32-18', '123 456 32 18', 'PL1234563218', 'pl 123-456-32-18']) {
      expect(isNip(v), v).toBe(true);
    }
    expect(normalizeNip('PL 123-456-32-18')).toBe('1234563218');
    expect(formatNip('1234563218')).toBe('123-456-32-18');
  });
  it('rejects a bad check digit, the remainder-10 case and wrong lengths', () => {
    expect(isNip('1234563219')).toBe(false);
    expect(isNip('123456321')).toBe(false);
    expect(isNip('')).toBe(false);
    expect(nipCheckDigit('000000001')).toBe(7);
  });
  it(`property: ${N} generated NIPs validate; single-digit errors are caught`, () => {
    for (let i = 0; i < N; i++) {
      const nip = validNip();
      expect(isNip(nip), nip).toBe(true);
      expect(isNip(mutate(nip, int(10))), nip).toBe(false);
    }
  });
});

describe('REGON / KRS / ID card', () => {
  it('accepts published REGON examples', () => {
    expect(isRegon('123456785')).toBe(true);
    expect(isRegon('12345678512347')).toBe(true);
    expect(isRegon('123456784')).toBe(false);
    expect(isRegon('12345678512346')).toBe(false);
    expect(isRegon('12345678')).toBe(false);
  });
  it(`property: ${N} generated 9- and 14-digit REGONs validate; a wrong check digit is caught`, () => {
    // REGON maps both remainders 0 and 10 to check digit 0, so unlike NIP a
    // body substitution can slip through; the check digit itself never can.
    for (let i = 0; i < N; i++) {
      const r9 = validRegon9();
      const r14 = validRegon14();
      expect(isRegon(r9), r9).toBe(true);
      expect(isRegon(r14), r14).toBe(true);
      expect(isRegon(mutate(r9, 8)), r9).toBe(false);
      expect(isRegon(mutate(r14, 13)), r14).toBe(false);
    }
  });
  it('KRS is a shape check with zero padding', () => {
    expect(isKrs('0000123456')).toBe(true);
    expect(isKrs('123456')).toBe(true);
    expect(normalizeKrs('123456')).toBe('0000123456');
    expect(isKrs('12345678901')).toBe(false);
    expect(isKrs('')).toBe(false);
  });
  it('ID card numbers verify the control digit', () => {
    expect(isPolishIdCard('ABA300000')).toBe(true);
    expect(isPolishIdCard('aba 300000')).toBe(true);
    expect(isPolishIdCard('ABA400000')).toBe(false);
    expect(isPolishIdCard('AB1300000')).toBe(false);
  });
});

describe('IBAN', () => {
  it('accepts registry examples in electronic and print form', () => {
    expect(isIban('GB82WEST12345698765432')).toBe(true);
    expect(isIban('gb82 west 1234 5698 7654 32')).toBe(true);
    expect(isIban('PL61109010140000071219812874')).toBe(true);
    expect(isIban('DE89 3704 0044 0532 0130 00')).toBe(true);
    const info = parseIban('PL61 1090 1014 0000 0712 1981 2874')!;
    expect(info.country).toBe('PL');
    expect(info.checkDigits).toBe('61');
    expect(info.bban).toBe('109010140000071219812874');
    expect(info.formatted).toBe('PL61 1090 1014 0000 0712 1981 2874');
    expect(formatIban('GB82WEST12345698765432')).toBe('GB82 WEST 1234 5698 7654 32');
  });
  it('rejects a wrong checksum, a wrong length for the country and junk', () => {
    expect(isIban('GB82WEST12345698765433')).toBe(false);
    expect(isIban('PL6110901014000007121981287')).toBe(false);
    expect(isIban('PL61 1090 1014 0000 0712 1981 2874 1')).toBe(false);
    expect(isIban('1234')).toBe(false);
    expect(isIban('')).toBe(false);
  });
  it('property: generated IBANs for every registry country validate; errors are caught', () => {
    for (const country of Object.keys(IBAN_LENGTHS)) {
      for (let i = 0; i < 8; i++) {
        const iban = validIban(country);
        expect(isIban(iban), iban).toBe(true);
        expect(isIban(mutate(iban, 4 + int(iban.length - 4))), iban).toBe(false);
      }
    }
  });
});

describe('EU VAT', () => {
  it('validates syntax per member state, with the PL checksum', () => {
    expect(isVatId('PL1234563218')).toBe(true);
    expect(isVatId('PL1234563219')).toBe(false);
    expect(isVatId('DE123456789')).toBe(true);
    expect(isVatId('ATU12345678')).toBe(true);
    expect(isVatId('NL123456789B01')).toBe(true);
    expect(isVatId('IE1234567T')).toBe(true);
    expect(isVatId('IE1234567FA')).toBe(true);
    expect(isVatId('EL123456789')).toBe(true);
    expect(isVatId('GR123456789')).toBe(true);
    expect(isVatId('XI123456789')).toBe(true);
    expect(isVatId('SE123456789001')).toBe(true);
    expect(isVatId('SE123456789002')).toBe(false);
    expect(isVatId('DE12345678')).toBe(false);
    expect(isVatId('US123456789')).toBe(false);
  });
  it('takes a country hint for prefix-less input and rejects a conflicting prefix', () => {
    expect(isVatId('123-456-32-18', 'PL')).toBe(true);
    expect(isVatId('123456789', 'de')).toBe(true);
    expect(isVatId('123456789')).toBe(false);
    expect(isVatId('DE123456789', 'PL')).toBe(false);
    expect(parseVatId('pl 123-456-32-18')).toEqual({ country: 'PL', number: '1234563218', vies: 'PL1234563218' });
    expect(parseVatId('GR123456789', 'GR')!.country).toBe('EL');
  });
  it('covers all 27 member states plus XI', () => {
    expect(Object.keys(VAT_FORMATS)).toHaveLength(28);
  });
});

describe('Luhn / cards', () => {
  it('accepts well-known test PANs and detects brands', () => {
    const cases: Array<[string, string]> = [
      ['4111 1111 1111 1111', 'visa'],
      ['5555 5555 5555 4444', 'mastercard'],
      ['2223 0031 2200 3222', 'mastercard'],
      ['3782 822463 10005', 'amex'],
      ['6011 1111 1111 1117', 'discover'],
      ['3056 9309 0259 04', 'diners'],
      ['3530 1113 3330 0000', 'jcb'],
    ];
    for (const [pan, brand] of cases) {
      expect(isLuhn(pan), pan).toBe(true);
      expect(isCardNumber(pan), pan).toBe(true);
      expect(detectCardBrand(pan), pan).toBe(brand);
      expect(CARD_BRAND_NAMES[brand as keyof typeof CARD_BRAND_NAMES]).toBeTruthy();
    }
    expect(isCardNumber('4111 1111 1111 1112')).toBe(false);
    // Visa's 13-digit test number is fine; a Luhn-valid 15-digit "Visa" is not a Visa length.
    expect(isCardNumber('4222222222222')).toBe(true);
    expect(isLuhn('4111111111111114')).toBe(false);
    expect(isCardNumber('4' + '0'.repeat(13) + luhnCheckDigit('4' + '0'.repeat(13)))).toBe(false);
    expect(detectCardBrand('9999')).toBeNull();
    expect(isLuhn('0')).toBe(false);
  });
  it(`property: ${N} generated numbers with a Luhn digit validate; errors are caught`, () => {
    for (let i = 0; i < N; i++) {
      const body = digits(12 + int(7));
      const n = body + luhnCheckDigit(body);
      expect(isLuhn(n), n).toBe(true);
      expect(isLuhn(mutate(n, int(n.length))), n).toBe(false);
    }
  });
});

describe('postal codes', () => {
  it('accepts every format example, with and without the separator, any case', () => {
    for (const f of POSTAL_FORMATS) {
      expect(isPostalCode(f.example, f.country), f.country).toBe(true);
      expect(isPostalCode(f.example.toLowerCase(), f.country.toLowerCase()), f.country).toBe(true);
      expect(isPostalCode(` ${f.example} `, f.country), f.country).toBe(true);
      expect(isPostalCode(f.example.replace(/[- ]/g, ''), f.country), f.country).toBe(true);
    }
  });
  it('rejects wrong shapes, empty values and passes unknown countries', () => {
    expect(isPostalCode('00950', 'PL')).toBe(true);
    expect(isPostalCode('0-0950', 'PL')).toBe(false);
    expect(isPostalCode('ABCDE', 'DE')).toBe(false);
    expect(isPostalCode('', 'DE')).toBe(false);
    expect(isPostalCode('anything', 'ZZ')).toBe(true);
    expect(isPostalCode('SW1A1AA', 'GB')).toBe(true);
    expect(isPostalCode('k1a0b1', 'CA')).toBe(true);
  });
});

describe('E.164', () => {
  it('normalises national and international spellings', () => {
    expect(toE164('601 234 567', { defaultCountry: 'PL' })).toBe('+48601234567');
    expect(toE164('0601-234-567', { defaultCountry: 'pl' })).toBe('+48601234567');
    expect(toE164('+48 (601) 234.567')).toBe('+48601234567');
    expect(toE164('0048601234567')).toBe('+48601234567');
    expect(toE164('601234567', { defaultCountry: '48' })).toBe('+48601234567');
    expect(toE164('(555) 123-4567', { defaultCountry: 'US' })).toBe('+15551234567');
  });
  it('returns "" when it cannot produce E.164', () => {
    expect(toE164('601234567')).toBe('');
    expect(toE164('+0123')).toBe('');
    expect(toE164('12', { defaultCountry: 'PL' })).toBe('');
    expect(toE164(null)).toBe('');
    expect(isE164('+48601234567')).toBe(true);
    expect(isE164('48601234567')).toBe(false);
    expect(isE164('+1234567890123456')).toBe(false);
    expect(DIAL_CODES['PL']).toBe('48');
  });
});
