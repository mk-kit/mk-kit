# Changelog

All notable changes to **`@mk-kit/validators`**. Keep-a-Changelog format;
versions are published to npm by the `release-validators` workflow when the
version in `projects/validators/package.json` changes on `main`.

## [0.1.0] — 2026-08-29

### Added

- Polish identifiers: `isPesel` / `parsePesel` (checksum + real calendar
  date, birth date and sex), `isNip` / `normalizeNip` / `formatNip`
  (`PL` prefix and separators tolerated), `isRegon` (9 and 14 digits),
  `isKrs` / `normalizeKrs` (shape only — KRS has no check digit),
  `isPolishIdCard` (dowód osobisty control digit). Check-digit helpers
  exported for generating test data.
- Financial: `isIban` / `parseIban` / `formatIban` with the SWIFT registry
  lengths for 88 countries and a digit-by-digit MOD 97-10; `isVatId` /
  `parseVatId` — VIES syntax for all 27 member states plus `XI`, Greece as
  `EL` or `GR`, PL checksum; `isLuhn` / `luhnCheckDigit`, `isCardNumber`
  (Luhn + brand-valid length), `detectCardBrand`.
- Addresses & phones: `isPostalCode` for 36 countries (separator optional,
  case-insensitive), `isE164`, `toE164` (national → international with a
  default country, `00` prefix, trunk `0`).
- `@mk-kit/validators/forms` — a `ValidatorFn` for each check (type-only
  import of `@angular/forms`, no runtime dependency).
- `@mk-kit/validators/signals` — Standard Schema v1 objects for each check
  (`validateStandardSchema(path, nipSchema())` in Angular Signal Forms, or
  any Standard-Schema-aware library) plus `schemaFrom(predicate, message)`.
- Property tests: hundreds of generated PESEL / NIP / REGON / IBAN (every
  registry country) / Luhn values validate and single-digit errors are
  caught; published examples for every identifier.
