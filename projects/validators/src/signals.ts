/**
 * Standard Schema adapters — `@mk-kit/validators/signals`.
 *
 * Every schema here implements the Standard Schema v1 contract
 * (https://standardschema.dev), so it plugs into Angular Signal Forms
 * (`validateStandardSchema(path, peselSchema())`) and into any other
 * Standard-Schema-aware library, with no dependency on either. The interface
 * is copied from `@standard-schema/spec` as the spec recommends.
 */
import { isCardNumber, isLuhn } from './luhn.js';
import { isIban } from './iban.js';
import { isNip } from './nip.js';
import { isPesel } from './pesel.js';
import { isE164 } from './phone.js';
import { isPostalCode } from './postal.js';
import { isKrs, isPolishIdCard, isRegon } from './regon.js';
import { isVatId } from './vat.js';

/** The Standard Schema v1 interface (https://standardschema.dev). */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}
export declare namespace StandardSchemaV1 {
  interface Props<Input = unknown, Output = Input> {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output } | undefined;
  }
  type Result<Output> = { readonly value: Output; readonly issues?: undefined } | { readonly issues: ReadonlyArray<Issue> };
  interface Issue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey> | undefined;
  }
}

/** Options shared by every schema factory. */
export interface SchemaOptions {
  /** Issue message when the value fails; defaults to a short English one. */
  message?: string;
  /** Treat `''`, `null` and `undefined` as valid (default `true`, like Angular's validators). */
  allowEmpty?: boolean;
}

/**
 * Wraps a predicate as a Standard Schema over `string`. Non-string values
 * fail; empty values pass unless `allowEmpty: false`.
 */
export function schemaFrom(
  test: (value: string) => boolean,
  defaultMessage: string,
  options: SchemaOptions = {},
): StandardSchemaV1<string, string> {
  const { message = defaultMessage, allowEmpty = true } = options;
  return {
    '~standard': {
      version: 1,
      vendor: 'mk-kit',
      validate(value: unknown) {
        if (allowEmpty && (value === '' || value === null || value === undefined)) {
          return { value: (value ?? '') as string };
        }
        return typeof value === 'string' && test(value)
          ? { value }
          : { issues: [{ message }] };
      },
    },
  };
}

export const peselSchema = (o?: SchemaOptions) => schemaFrom(isPesel, 'Invalid PESEL', o);
export const nipSchema = (o?: SchemaOptions) => schemaFrom(isNip, 'Invalid NIP', o);
export const regonSchema = (o?: SchemaOptions) => schemaFrom(isRegon, 'Invalid REGON', o);
export const krsSchema = (o?: SchemaOptions) => schemaFrom(isKrs, 'Invalid KRS number', o);
export const polishIdCardSchema = (o?: SchemaOptions) =>
  schemaFrom(isPolishIdCard, 'Invalid ID card number', o);
export const ibanSchema = (o?: SchemaOptions) => schemaFrom(isIban, 'Invalid IBAN', o);
export const vatIdSchema = (country?: string, o?: SchemaOptions) =>
  schemaFrom((v) => isVatId(v, country), 'Invalid VAT number', o);
export const luhnSchema = (o?: SchemaOptions) => schemaFrom(isLuhn, 'Invalid number', o);
export const cardNumberSchema = (o?: SchemaOptions) =>
  schemaFrom(isCardNumber, 'Invalid card number', o);
export const postalCodeSchema = (country: string, o?: SchemaOptions) =>
  schemaFrom((v) => isPostalCode(v, country), 'Invalid postal code', o);
export const e164Schema = (o?: SchemaOptions) =>
  schemaFrom(isE164, 'Enter an international number, e.g. +48 601 234 567', o);
