# @mk-kit/validators

**Zero-dependency validators for Polish and European identifiers.** Pure
TypeScript functions — usable in Angular, React, Node, a worker, a script —
plus thin adapters for Angular reactive forms and Signal Forms. Every
algorithm cites its source in the code and is covered by property tests
(hundreds of generated values, single-digit errors caught).

```bash
npm install @mk-kit/validators
```

| Identifier | Functions | Checks |
|---|---|---|
| PESEL | `isPesel`, `parsePesel` → `{ birthDate, sex, serial }` | weights 1-3-7-9, check digit, real calendar date, century from the month offset |
| NIP | `isNip`, `normalizeNip`, `formatNip` | weights 6-5-7-2-3-4-5-6-7 mod 11; `PL` prefix, dashes and spaces tolerated |
| REGON | `isRegon` | 9- and 14-digit variants, both check digits |
| KRS | `isKrs`, `normalizeKrs` | 10 digits with zero padding (no check digit exists) |
| ID card (dowód) | `isPolishIdCard` | letters A→10…, weights 7-3-1, control digit |
| IBAN | `isIban`, `parseIban`, `formatIban` | ISO 7064 MOD 97-10, SWIFT registry lengths (88 countries) |
| EU VAT | `isVatId`, `parseVatId` | VIES syntax for 27 states + `XI`, `EL`/`GR`, PL checksum |
| Cards | `isLuhn`, `isCardNumber`, `detectCardBrand` | Luhn, IIN ranges, brand-valid lengths |
| Postal codes | `isPostalCode` | 36 countries, separator optional |
| Phones | `isE164`, `toE164` | E.164 shape; national → international normalisation |

```ts
import { isNip, parsePesel, parseIban, toE164 } from '@mk-kit/validators';

isNip('PL 123-456-32-18');                    // true
parsePesel('44051401359');                    // { birthDate: 1944-05-14, sex: 'M', serial: '0135' }
parseIban('pl61 1090 1014 0000 0712 1981 2874')?.formatted; // 'PL61 1090 1014 0000 0712 1981 2874'
toE164('601 234 567', { defaultCountry: 'PL' }); // '+48601234567'
```

Every `is*` takes `unknown` and returns `boolean`; every `parse*` returns a
typed object or `null`. Separators, case and surrounding whitespace are
forgiven where the identifier allows it. Syntax validity is not registration:
a VAT number still needs a VIES lookup, an IBAN still needs a bank.

## Angular reactive forms

```ts
import { nipValidator, ibanValidator, postalCodeValidator } from '@mk-kit/validators/forms';

form = new FormGroup({
  nip: new FormControl('', [Validators.required, nipValidator()]),
  iban: new FormControl('', ibanValidator()),
  zip: new FormControl('', postalCodeValidator('PL')),
});
```

Empty values pass (compose with `Validators.required`). Errors are
`{ nip: { value } }`, `{ postalCode: { value, country } }` and so on. The entry
imports only *types* from `@angular/forms` — no runtime dependency.

## Angular Signal Forms / Standard Schema

```ts
import { form, schema, validateStandardSchema } from '@angular/forms/signals';
import { nipSchema, peselSchema } from '@mk-kit/validators/signals';

const customer = schema<Customer>((p) => {
  validateStandardSchema(p.nip, nipSchema({ message: 'Nieprawidłowy NIP' }));
  validateStandardSchema(p.pesel, peselSchema());
});
```

Each schema is a plain [Standard Schema v1](https://standardschema.dev)
object, so it also works with any other library that accepts one.
`schemaFrom(predicate, message)` wraps your own check the same way.

## Related

- [`@mk-kit/ui`](https://www.npmjs.com/package/@mk-kit/ui) — the Angular
  component library these checks grew out of (`mk-tax-id-input`,
  `mk-iban-input`, `mk-postal-code-input`, `mk-phone-input`).
- Docs: <https://mk-kit.dev>

MIT © Mateusz Kornaś
