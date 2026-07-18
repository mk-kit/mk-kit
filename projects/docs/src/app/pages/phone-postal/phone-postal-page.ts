import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkFormField,
  MkPhoneInput,
  type MkPhoneValue,
  MkPostalCodeInput,
  MkSelect,
  type MkSelectOption,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the masked location/contact inputs of
 * `@mkornas/ui`: Phone input (country prefix + national mask) and Postal code
 * input (country-aware mask + validation).
 */
@Component({
  selector: 'docs-phone-postal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkFormField,
    MkPhoneInput,
    MkPostalCodeInput,
    MkSelect,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Phone &amp; postal code</h1>
      <p class="docs-lead">
        Two masked, country-aware inputs.
        <code class="docs-inline">&lt;mk-phone-input&gt;</code> pairs a searchable
        country-prefix dropdown with a national-number field that formats itself
        with the selected country's mask;
        <code class="docs-inline">&lt;mk-postal-code-input&gt;</code> masks,
        uppercases and validates postal/ZIP codes for 35+ countries. Both
        implement <code class="docs-inline">ControlValueAccessor</code>, work
        with <code class="docs-inline">[(ngModel)]</code>, reactive forms and
        <code class="docs-inline">[(value)]</code>, and wire themselves to a
        wrapping <code class="docs-inline">&lt;mk-form-field&gt;</code>.
      </p>

      <!-- ============================================================ -->
      <h2>Phone input</h2>
      <p>
        The dropdown lists every country with its flag, localised name and dial
        code (searchable by any of them); the number field masks as you type
        — e.g. <code class="docs-inline">601 234 567</code> for Poland or
        <code class="docs-inline">(202) 555-0123</code> for the US. Pasting a
        full international number like
        <code class="docs-inline">+44 7911 123456</code> switches the country
        automatically. The default form value is a single E.164 string.
      </p>

      <docs-example [code]="phoneCode" [column]="true">
        <mk-form-field label="Phone" hint="Try pasting +44 7911 123456" style="max-width: 26rem; width: 100%;">
          <mk-phone-input
            country="PL"
            [preferredCountries]="['PL', 'DE', 'CZ', 'GB', 'US']"
            [(ngModel)]="phone"
          />
        </mk-form-field>
        <p class="echo">Value: {{ phone() ?? '—' }}</p>
      </docs-example>

      <h3>Dual output — prefix + number</h3>
      <p>
        With <code class="docs-inline">valueFormat="parts"</code> the form value
        is a structured object
        (<code class="docs-inline">{{ '{' }} country, dialCode, national, e164 {{ '}' }}</code>)
        instead of one string — for APIs that store the prefix and number
        separately.
      </p>
      <docs-example [code]="phonePartsCode" [column]="true">
        <mk-form-field label="Phone (parts mode)" style="max-width: 26rem; width: 100%;">
          <mk-phone-input valueFormat="parts" country="US" [(value)]="phoneParts" />
        </mk-form-field>
        <p class="echo">
          {{ phoneParts() ? (phoneParts()!.dialCode + ' · ' + phoneParts()!.national) : '—' }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string | MkPhoneValue | null&gt;</td><td>null</td><td>Two-way form value: E.164 string, or MkPhoneValue in parts mode; null when empty.</td></tr>
          <tr><td>country</td><td>model&lt;string&gt;</td><td>'US'</td><td>Two-way selected ISO 3166-1 country code.</td></tr>
          <tr><td>valueFormat</td><td>'e164' | 'parts'</td><td>'e164'</td><td>Shape of the emitted value.</td></tr>
          <tr><td>countries</td><td>MkPhoneCountry[]</td><td>60 built-ins</td><td>The selectable country set (code, dialCode, mask) — extend or replace.</td></tr>
          <tr><td>preferredCountries</td><td>string[]</td><td>[]</td><td>ISO codes pinned, in order, to the top of the dropdown.</td></tr>
          <tr><td>placeholder</td><td>string</td><td>''</td><td>Placeholder for the national-number field.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling when standalone.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Where</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td>Enter / Space / ↓ / ↑</td><td>Country trigger</td><td>Open the country list (focus moves to the search field).</td></tr>
          <tr><td>↓ / ↑ / Home / End</td><td>Search field</td><td>Move the highlighted country.</td></tr>
          <tr><td>Enter</td><td>Search field</td><td>Select the highlighted country and focus the number field.</td></tr>
          <tr><td>Esc</td><td>Search field</td><td>Close the list and refocus the trigger.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Postal code input</h2>
      <p>
        Pick a <code class="docs-inline">country</code> and the field adopts its
        mask (<code class="docs-inline">00-000</code> for PL,
        <code class="docs-inline">A0A 0A0</code> for CA,
        <code class="docs-inline">0000 AA</code> for NL, optional
        <code class="docs-inline">ZIP+4</code> for US, …), uppercases letters and
        defaults its placeholder to a valid example. Variable-format countries
        like GB skip the mask and validate against the national pattern instead
        — the missing space is inserted on blur
        (<code class="docs-inline">SW1A1AA → SW1A 1AA</code>). Invalid styling
        engages only after the field was touched.
      </p>

      <docs-example [code]="postalCode" [column]="true">
        <mk-form-field label="Country" style="max-width: 16rem; width: 100%;">
          <mk-select [options]="countryOptions" [(value)]="postalCountry" />
        </mk-form-field>
        <mk-form-field label="Postal code" style="max-width: 16rem; width: 100%;">
          <mk-postal-code-input [country]="postalCountryCode()" [(value)]="zip" />
        </mk-form-field>
        <p class="echo">Value: {{ zip() || '—' }}</p>
      </docs-example>

      <p>
        For reactive forms there is a matching validator:
        <code class="docs-inline">mkPostalCodeValidator('PL')</code> adds a
        <code class="docs-inline">postalCode</code> error (with the expected
        example) when the value doesn't match the country pattern.
      </p>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string&gt;</td><td>''</td><td>Two-way formatted value (e.g. "00-950", "K1A 0B1").</td></tr>
          <tr><td>country</td><td>string</td><td>'US'</td><td>ISO 3166-1 country whose format applies. Unknown codes fall back to free text.</td></tr>
          <tr><td>formats</td><td>MkPostalFormat[]</td><td>35+ built-ins</td><td>The format table (mask, pattern, example) — extend to add countries.</td></tr>
          <tr><td>placeholder</td><td>string</td><td>country example</td><td>Override the example-based placeholder.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling when standalone.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>valid()</td><td>Signal&lt;boolean | null&gt;</td><td>—</td><td>true/false for a complete/incomplete code; null when empty or unknown country (via exportAs "mkPostalCodeInput").</td></tr>
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
export class PhonePostalPage {
  // --- Phone ------------------------------------------------------------------
  protected readonly phone = signal<string | null>(null);
  protected readonly phoneParts = signal<MkPhoneValue | null>(null);

  // --- Postal -----------------------------------------------------------------
  protected readonly postalCountry = signal<unknown>('PL');
  protected readonly postalCountryCode = () => String(this.postalCountry());
  protected readonly zip = signal('');
  protected readonly countryOptions: MkSelectOption[] = [
    { label: 'Poland (00-000)', value: 'PL' },
    { label: 'United States (ZIP / ZIP+4)', value: 'US' },
    { label: 'Canada (A0A 0A0)', value: 'CA' },
    { label: 'United Kingdom (free format)', value: 'GB' },
    { label: 'Netherlands (0000 AA)', value: 'NL' },
    { label: 'Japan (000-0000)', value: 'JP' },
  ];

  // --- Code snippets ----------------------------------------------------------
  protected readonly phoneCode = `<mk-form-field label="Phone">
  <mk-phone-input
    country="PL"
    [preferredCountries]="['PL', 'DE', 'CZ', 'GB', 'US']"
    [(ngModel)]="phone" />
</mk-form-field>
<!-- phone === '+48601234567' -->`;

  protected readonly phonePartsCode = `<mk-phone-input valueFormat="parts" country="US" [(value)]="phoneParts" />
<!-- phoneParts === {
  country: 'US', dialCode: '+1',
  national: '2025550123', e164: '+12025550123'
} -->`;

  protected readonly postalCode = `<mk-postal-code-input country="PL" [(value)]="zip" />

<!-- reactive forms -->
zip: ['', [Validators.required, mkPostalCodeValidator('PL')]]`;
}
