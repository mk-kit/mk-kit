import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkCardNumberInput,
  type MkCardBrand,
  MkCurrencyInput,
  MkFormField,
  MkIbanInput,
  MkSelect,
  type MkSelectOption,
  MkTaxIdInput,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the MONEY & PAYMENT inputs of
 * `@mkornas/ui`: Currency/amount input, Card number input, IBAN input and
 * Tax-ID input.
 */
@Component({
  selector: 'docs-payment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkFormField,
    MkCurrencyInput,
    MkCardNumberInput,
    MkIbanInput,
    MkTaxIdInput,
    MkSelect,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Money &amp; payment</h1>
      <p class="docs-lead">
        Three masked financial inputs.
        <code class="docs-inline">&lt;mk-currency-input&gt;</code> formats amounts
        with <code class="docs-inline">Intl.NumberFormat</code> while keeping a
        plain <code class="docs-inline">number</code> form value;
        <code class="docs-inline">&lt;mk-card-number-input&gt;</code> groups card
        digits per detected network and validates with Luhn;
        <code class="docs-inline">&lt;mk-iban-input&gt;</code> groups, caps and
        checksums IBANs for 65 countries;
        <code class="docs-inline">&lt;mk-tax-id-input&gt;</code> masks and
        checksums business tax identifiers (PL NIP, …). All implement
        <code class="docs-inline">ControlValueAccessor</code> and wire themselves
        to a wrapping <code class="docs-inline">&lt;mk-form-field&gt;</code>.
      </p>

      <!-- ============================================================ -->
      <h2>Currency input</h2>
      <p>
        Thousands group live as you type, the decimal part is kept exactly as
        typed and padded to the currency's convention on blur
        (<code class="docs-inline">1234,5 → 1&nbsp;234,50</code>). The symbol
        sits as a fixed affix on the locale's side; zero-decimal currencies
        (JPY) drop fraction input. The form value is always a plain
        <code class="docs-inline">number</code> —
        <code class="docs-inline">null</code> when empty — with optional
        <code class="docs-inline">min</code>/<code class="docs-inline">max</code>
        clamping on blur.
      </p>

      <docs-example [code]="currencyCode" [column]="true">
        <mk-form-field label="Currency" style="max-width: 12rem; width: 100%;">
          <mk-select [options]="currencyOptions" [(value)]="currency" />
        </mk-form-field>
        <mk-form-field label="Amount" style="max-width: 16rem; width: 100%;">
          <mk-currency-input [currency]="currencyCodeOf()" [(value)]="amount" />
        </mk-form-field>
        <p class="echo">Value: {{ amount() ?? '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;number | null&gt;</td><td>null</td><td>Two-way numeric value; the locale formatting never leaks into the data.</td></tr>
          <tr><td>currency</td><td>string</td><td>''</td><td>ISO 4217 code (symbol affix + fraction convention). Empty = plain grouped decimal.</td></tr>
          <tr><td>locale</td><td>string</td><td>runtime locale</td><td>BCP 47 locale for separators and symbol placement.</td></tr>
          <tr><td>decimals</td><td>number | null</td><td>currency default</td><td>Override the max fraction digits.</td></tr>
          <tr><td>min / max</td><td>number | null</td><td>null</td><td>Clamp the value on blur.</td></tr>
          <tr><td>allowNegative</td><td>boolean</td><td>true</td><td>Allow a leading minus sign.</td></tr>
          <tr><td>size / invalid / disabled / placeholder</td><td>—</td><td>—</td><td>Standard control inputs; size/invalid inherit from mk-form-field.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Card number input</h2>
      <p>
        Digits group per network — 16-digit cards as
        <code class="docs-inline">0000 0000 0000 0000</code>, American Express
        as <code class="docs-inline">0000 000000 00000</code> — with the brand
        detected from the leading digits (Visa, Mastercard, Amex, Discover,
        Diners, JCB) and shown as a badge. The form value is the raw digit
        string; <code class="docs-inline">valid()</code> runs the Luhn checksum
        once the number is complete. Try
        <code class="docs-inline">4111 1111 1111 1111</code> or
        <code class="docs-inline">378282246310005</code>.
      </p>

      <docs-example [code]="cardCode" [column]="true">
        <mk-form-field label="Card number" style="max-width: 22rem; width: 100%;">
          <mk-card-number-input [(value)]="card" (brandChange)="brand.set($event)" />
        </mk-form-field>
        <p class="echo">Digits: {{ card() || '—' }} · Brand: {{ brand() ?? '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string&gt;</td><td>''</td><td>Two-way card number, digits only (no spaces).</td></tr>
          <tr><td>showBrand</td><td>boolean</td><td>true</td><td>Show the detected brand badge inside the field.</td></tr>
          <tr><td>(brandChange)</td><td>MkCardBrand | null</td><td>—</td><td>Emits when the detected network changes; also readable via brand().</td></tr>
          <tr><td>valid()</td><td>Signal&lt;boolean | null&gt;</td><td>—</td><td>Luhn result for a complete number, null while empty/incomplete (exportAs "mkCardNumberInput").</td></tr>
          <tr><td>size / invalid / disabled / placeholder</td><td>—</td><td>—</td><td>Standard control inputs.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>IBAN input</h2>
      <p>
        Uppercases and groups in blocks of four as you type, caps input at the
        country's exact length (65 countries built in) and validates with the
        ISO 13616 mod-97 checksum. The form value is the compact electronic
        format (no spaces);
        <code class="docs-inline">mkIbanValidator()</code> covers reactive
        forms. Try
        <code class="docs-inline">PL61109010140000071219812874</code>.
      </p>

      <docs-example [code]="ibanCode" [column]="true">
        <mk-form-field label="IBAN" style="max-width: 28rem; width: 100%;">
          <mk-iban-input #iban="mkIbanInput" [(value)]="account" />
        </mk-form-field>
        <p class="echo">
          Compact: {{ account() || '—' }} ·
          Valid: {{ iban.valid() === null ? '—' : iban.valid() }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string&gt;</td><td>''</td><td>Two-way IBAN in compact electronic format (uppercase, no spaces).</td></tr>
          <tr><td>valid()</td><td>Signal&lt;boolean | null&gt;</td><td>—</td><td>mod-97 result for a complete IBAN, null while empty/incomplete (exportAs "mkIbanInput").</td></tr>
          <tr><td>size / invalid / disabled / placeholder</td><td>—</td><td>—</td><td>Standard control inputs.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Tax ID input</h2>
      <p>
        A country-aware business tax identifier for invoice forms. Pick a
        <code class="docs-inline">country</code> and the field adopts its mask
        and rules — <code class="docs-inline">PL</code> NIP
        (<code class="docs-inline">000-000-00-00</code>, checksum-verified),
        <code class="docs-inline">DE</code> USt-IdNr.,
        <code class="docs-inline">CZ</code> DIČ,
        <code class="docs-inline">IT</code> Partita IVA,
        <code class="docs-inline">SK</code> IČ DPH (shape-verified). The form
        value is the compact identifier (digits only) while the field displays
        it masked, and the placeholder defaults to a valid example. Try
        <code class="docs-inline">1234563218</code>.
      </p>

      <docs-example [code]="taxIdCode" [column]="true">
        <mk-form-field label="Country" style="max-width: 16rem; width: 100%;">
          <mk-select [options]="taxCountryOptions" [(value)]="taxCountry" />
        </mk-form-field>
        <mk-form-field label="Tax ID" style="max-width: 20rem; width: 100%;">
          <mk-tax-id-input
            #taxId="mkTaxIdInput"
            [country]="taxCountryCode()"
            [(value)]="tin"
          />
        </mk-form-field>
        <p class="echo">
          Compact: {{ tin() || '—' }} ·
          Valid: {{ taxId.valid() === null ? '—' : taxId.valid() }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string&gt;</td><td>''</td><td>Two-way identifier in compact form (digits only, e.g. "1234563218").</td></tr>
          <tr><td>country</td><td>string</td><td>'PL'</td><td>ISO 3166-1 country whose format applies. Unknown codes fall back to free digits.</td></tr>
          <tr><td>valid()</td><td>Signal&lt;boolean | null&gt;</td><td>—</td><td>Format + checksum result for a complete identifier, null while empty/incomplete or the country is unknown (exportAs "mkTaxIdInput").</td></tr>
          <tr><td>size / invalid / disabled / placeholder</td><td>—</td><td>—</td><td>Standard control inputs.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .echo {
        margin: 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class PaymentPage {
  // --- Currency ---------------------------------------------------------------
  protected readonly amount = signal<number | null>(1999.5);
  protected readonly currency = signal<unknown>('PLN');
  protected readonly currencyCodeOf = () => String(this.currency());
  protected readonly currencyOptions: MkSelectOption[] = [
    { label: 'PLN', value: 'PLN' },
    { label: 'EUR', value: 'EUR' },
    { label: 'USD', value: 'USD' },
    { label: 'GBP', value: 'GBP' },
    { label: 'JPY (0 decimals)', value: 'JPY' },
  ];

  // --- Card / IBAN ------------------------------------------------------------
  protected readonly card = signal('');
  protected readonly brand = signal<MkCardBrand | null>(null);
  protected readonly account = signal('');

  // --- Tax ID -----------------------------------------------------------------
  protected readonly tin = signal('');
  protected readonly taxCountry = signal<unknown>('PL');
  protected readonly taxCountryCode = () => String(this.taxCountry());
  protected readonly taxCountryOptions: MkSelectOption[] = [
    { label: 'Poland — NIP', value: 'PL' },
    { label: 'Germany — USt-IdNr.', value: 'DE' },
    { label: 'Czechia — DIČ', value: 'CZ' },
    { label: 'Italy — Partita IVA', value: 'IT' },
    { label: 'Slovakia — IČ DPH', value: 'SK' },
  ];

  // --- Code snippets ----------------------------------------------------------
  protected readonly currencyCode = `<mk-currency-input currency="PLN" [(ngModel)]="price" />
<mk-currency-input currency="USD" [min]="0" [(value)]="budget" />
<!-- price === 1234.5 (number), displayed as "1 234,50" with a "zł" affix -->`;

  protected readonly cardCode = `<mk-card-number-input [(value)]="card" (brandChange)="brand = $event" />
<!-- card === '4111111111111111', brand === 'visa' -->`;

  protected readonly ibanCode = `<mk-iban-input #iban="mkIbanInput" [(value)]="account" />
<!-- account === 'PL61109010140000071219812874', iban.valid() === true -->

// reactive forms
account: ['', [Validators.required, mkIbanValidator()]]`;

  protected readonly taxIdCode = `<mk-tax-id-input #taxId="mkTaxIdInput" country="PL" [(value)]="nip" />
<!-- nip === '1234563218' (displayed as 123-456-32-18), taxId.valid() === true -->

// reactive forms
nip: ['', [Validators.required, mkTaxIdValidator('PL')]]`;
}
