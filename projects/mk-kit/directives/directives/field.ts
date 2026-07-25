import { Directive, ElementRef, computed, inject, input } from '@angular/core';

/** The attributes a field preset can control. */
const MK_FIELD_ATTRS = [
  'type',
  'inputmode',
  'autocomplete',
  'autocapitalize',
  'autocorrect',
  'spellcheck',
  'enterkeyhint',
] as const;

type MkFieldAttr = (typeof MK_FIELD_ATTRS)[number];

/** The attribute bundle applied for one `MkFieldKind`. Omitted = not set. */
export type MkFieldPreset = Partial<Record<MkFieldAttr, string>>;

/** Semantic field kinds understood by {@link MkField}. */
export type MkFieldKind =
  | 'email'
  | 'tel'
  | 'url'
  | 'search'
  | 'numeric'
  | 'given-name'
  | 'family-name'
  | 'name'
  | 'organization'
  | 'street'
  | 'address-line1'
  | 'address-line2'
  | 'city'
  | 'region'
  | 'country'
  | 'postal-code'
  | 'username'
  | 'one-time-code';

/**
 * The attribute bundle per field kind. Exported so hosts can inspect what a
 * kind resolves to, or spread an entry into their own preset table.
 *
 * `autocorrect` (non-standard, honoured by iOS Safari) is set to `off`
 * wherever `spellcheck` is `false`.
 */
export const MK_FIELD_PRESETS: Readonly<Record<MkFieldKind, MkFieldPreset>> = {
  email: {
    type: 'email',
    inputmode: 'email',
    autocomplete: 'email',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
  },
  tel: { type: 'tel', inputmode: 'tel', autocomplete: 'tel' },
  url: {
    type: 'url',
    inputmode: 'url',
    autocomplete: 'url',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
  },
  search: {
    type: 'search',
    inputmode: 'search',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'search',
  },
  numeric: { inputmode: 'numeric' },
  'given-name': {
    type: 'text',
    autocomplete: 'given-name',
    autocapitalize: 'words',
  },
  'family-name': {
    type: 'text',
    autocomplete: 'family-name',
    autocapitalize: 'words',
  },
  name: { type: 'text', autocomplete: 'name', autocapitalize: 'words' },
  organization: {
    type: 'text',
    autocomplete: 'organization',
    autocapitalize: 'words',
  },
  street: {
    type: 'text',
    autocomplete: 'street-address',
    autocapitalize: 'words',
  },
  'address-line1': {
    type: 'text',
    autocomplete: 'address-line1',
    autocapitalize: 'words',
  },
  'address-line2': {
    type: 'text',
    autocomplete: 'address-line2',
    autocapitalize: 'words',
  },
  city: {
    type: 'text',
    autocomplete: 'address-level2',
    autocapitalize: 'words',
  },
  region: {
    type: 'text',
    autocomplete: 'address-level1',
    autocapitalize: 'words',
  },
  country: {
    type: 'text',
    autocomplete: 'country-name',
    autocapitalize: 'words',
  },
  'postal-code': {
    type: 'text',
    autocomplete: 'postal-code',
    autocapitalize: 'characters',
    autocorrect: 'off',
    spellcheck: 'false',
  },
  username: {
    type: 'text',
    autocomplete: 'username',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
  },
  'one-time-code': {
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'one-time-code',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
  },
};

/**
 * Field — applies the semantic mobile-keyboard and autofill attribute bundle
 * for a kind of field, so you never again ship an email input that iOS
 * capitalises or an address input the browser can't autofill.
 *
 * It sets `type`, `inputmode`, `autocomplete`, `autocapitalize`, `autocorrect`,
 * `spellcheck` and `enterkeyhint` (see {@link MK_FIELD_PRESETS}) and nothing
 * else — no styling, no value handling — so it composes with `mkInput`,
 * `mk-form-field`, `[(ngModel)]` and reactive forms untouched.
 *
 * ```html
 * <input mkInput mkField="email" formControlName="email" />
 * <input mkInput mkField="street" formControlName="street" />
 * <input mkInput [mkField]="isCompany() ? 'organization' : 'name'" />
 * ```
 *
 * ## Precedence
 *
 * A **static** attribute you write on the element wins: the directive reads the
 * seven attributes once at construction (before any host binding has run) and
 * keeps whatever was already there, filling in only what you left out. So
 * `<input mkField="username" type="password" />` stays a password field but
 * still gets `autocomplete="username"`, `autocapitalize="off"`, …
 *
 * A **template binding** for the same attribute (`[attr.autocomplete]="…"`)
 * does *not* win — Angular applies directive host bindings after template
 * bindings, so the preset overwrites it. Use a static attribute to override, or
 * drop `mkField` and set the bundle yourself.
 */
@Directive({
  selector: '[mkField]',
  host: {
    '[attr.type]': 'attrs().type',
    '[attr.inputmode]': 'attrs().inputmode',
    '[attr.autocomplete]': 'attrs().autocomplete',
    '[attr.autocapitalize]': 'attrs().autocapitalize',
    '[attr.autocorrect]': 'attrs().autocorrect',
    '[attr.spellcheck]': 'attrs().spellcheck',
    '[attr.enterkeyhint]': 'attrs().enterkeyhint',
  },
})
export class MkField {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Which kind of field this is. */
  readonly kind = input.required<MkFieldKind>({ alias: 'mkField' });

  /**
   * Attributes the consumer put on the element themselves, read once before
   * any host binding has run — these always win over the preset.
   */
  private readonly authored: MkFieldPreset = Object.fromEntries(
    MK_FIELD_ATTRS.map((name) => [name, this.el.nativeElement.getAttribute(name)]).filter(
      ([, value]) => value !== null,
    ),
  );

  /** The resolved attribute bundle: authored value, else preset, else unset. */
  protected readonly attrs = computed<Record<MkFieldAttr, string | null>>(() => {
    const preset = MK_FIELD_PRESETS[this.kind()] ?? {};
    const resolved = {} as Record<MkFieldAttr, string | null>;
    for (const name of MK_FIELD_ATTRS) {
      resolved[name] = this.authored[name] ?? preset[name] ?? null;
    }
    return resolved;
  });
}
