/**
 * Entity model of the `crud` schematic: the parsed `--fields` grammar plus
 * the naming derivations every generated file shares.
 *
 * Field grammar (comma-separated): `key:type`, `key!:type` (required),
 * `key:select=a|b|c` (options). Example:
 * `name!:string,price:currency,status:select=active|archived,createdAt:date`.
 */
import { SchematicsException } from '@angular-devkit/schematics';

/** Field kinds the generator understands (a practical subset of the dynamic-form types). */
export const CRUD_FIELD_TYPES = [
  'string',
  'textarea',
  'email',
  'url',
  'number',
  'currency',
  'boolean',
  'date',
  'datetime',
  'select',
  'tags',
] as const;

export type CrudFieldType = (typeof CRUD_FIELD_TYPES)[number];

export interface CrudField {
  /** Property key, camelCased (`created_at` → `createdAt`). */
  key: string;
  type: CrudFieldType;
  required: boolean;
  /** Select options (raw values as written); empty for other types. */
  options: string[];
  /** Human label derived from the key (`createdAt` → `Created at`). */
  label: string;
}

export interface CrudEntity {
  /** Class-cased singular (`Product`, `OrderLine`). */
  className: string;
  /** camelCased singular (`product`, `orderLine`). */
  propertyName: string;
  /** dash-cased singular (`product`, `order-line`) — file name prefix. */
  fileName: string;
  /** camelCased plural (`products`) — routes, service collections. */
  pluralProperty: string;
  /** dash-cased plural (`order-lines`) — directory and route path. */
  pluralFile: string;
  /** SHOUT_CASED singular (`ORDER_LINE`) — const name prefix. */
  constName: string;
  /** Human singular, lower-case (`order line`) — messages. */
  human: string;
  /** Human plural, lower-case (`order lines`). */
  humanPlural: string;
  fields: CrudField[];
}

/** Split an identifier into lower-case words: camelCase, snake_case, dash-case, spaces. */
function words(name: string): string[] {
  return name
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

export function classify(name: string): string {
  return words(name)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
}

export function camelize(name: string): string {
  const c = classify(name);
  return c ? c[0].toLowerCase() + c.slice(1) : c;
}

export function dasherize(name: string): string {
  return words(name).join('-');
}

/** Naive English pluralizer — `--plural` overrides it when it guesses wrong. */
export function pluralize(word: string): string {
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

/** `createdAt` → `Created at`. */
export function humanize(key: string): string {
  const ws = words(key);
  if (!ws.length) return key;
  return [ws[0][0].toUpperCase() + ws[0].slice(1), ...ws.slice(1)].join(' ');
}

/** Parse one `key[!]:type[=a|b|c]` segment. */
function parseField(segment: string): CrudField {
  const match = /^\s*([A-Za-z][A-Za-z\d_-]*)(!?)\s*(?::\s*([A-Za-z-]+)\s*(?:=\s*([^,]+))?)?\s*$/.exec(segment);
  if (!match) {
    throw new SchematicsException(
      `Cannot parse field "${segment.trim()}". Expected "key:type", "key!:type" or "key:select=a|b|c".`,
    );
  }
  const [, rawKey, bang, rawType = 'string', rawOptions] = match;
  const type = rawType.toLowerCase() as CrudFieldType;
  if (!CRUD_FIELD_TYPES.includes(type)) {
    throw new SchematicsException(
      `Unknown field type "${rawType}" in "${segment.trim()}". Valid types: ${CRUD_FIELD_TYPES.join(', ')}.`,
    );
  }
  const options = rawOptions
    ? rawOptions
        .split('|')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];
  if (type === 'select' && !options.length) {
    throw new SchematicsException(
      `Field "${rawKey}" is a select but lists no options. Write it as "${rawKey}:select=draft|published".`,
    );
  }
  if (type !== 'select' && options.length) {
    throw new SchematicsException(`Only select fields take "=a|b|c" options (field "${rawKey}").`);
  }
  const key = camelize(rawKey);
  return { key, type, required: bang === '!', options, label: humanize(key) };
}

/** Parse the `--fields` option into an ordered, key-unique field list. */
export function parseFields(spec: string): CrudField[] {
  const fields = spec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseField);
  if (!fields.length) {
    throw new SchematicsException('At least one field is required, e.g. --fields "name!:string".');
  }
  const seen = new Set<string>();
  for (const f of fields) {
    if (f.key === 'id') {
      throw new SchematicsException('The "id" field is added automatically — remove it from --fields.');
    }
    if (seen.has(f.key)) throw new SchematicsException(`Duplicate field key "${f.key}".`);
    seen.add(f.key);
  }
  return fields;
}

/** Derive every name the generated files need from the entity option. */
export function buildEntity(name: string, fieldsSpec: string, plural?: string): CrudEntity {
  if (!/^[A-Za-z][A-Za-z\d_-]*$/.test(name)) {
    throw new SchematicsException(
      `"${name}" is not a valid entity name — use letters/digits like "product" or "OrderLine".`,
    );
  }
  const propertyName = camelize(name);
  const pluralProperty = plural ? camelize(plural) : pluralize(propertyName);
  return {
    className: classify(name),
    propertyName,
    fileName: dasherize(name),
    pluralProperty,
    pluralFile: dasherize(plural ?? pluralize(dasherize(name))),
    constName: words(name).join('_').toUpperCase(),
    human: words(name).join(' '),
    humanPlural: words(plural ?? pluralize(propertyName)).join(' '),
    fields: parseFields(fieldsSpec),
  };
}

/** TypeScript type of one field on the entity interface. */
export function tsType(field: CrudField): string {
  switch (field.type) {
    case 'number':
    case 'currency':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'select':
      return field.options.map((o) => `'${o.replace(/'/g, "\\'")}'`).join(' | ');
    case 'date':
    case 'datetime':
      // What mk-date-picker / mk-datetime-picker controls hold.
      return 'Date | null';
    case 'tags':
      return 'string[]';
    default:
      // string, textarea, email, url.
      return 'string';
  }
}
