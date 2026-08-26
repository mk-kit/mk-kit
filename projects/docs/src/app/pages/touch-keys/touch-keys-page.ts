import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkFormField,
  MkInput,
  MkNumericKeypad,
  MkOnScreenKeyboard,
  MkOnScreenKeyboardTrigger,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the touch key surfaces of `@mk-kit/ui`:
 * the numeric keypad and the on-screen keyboard (kiosk / POS screens).
 */
@Component({
  selector: 'docs-touch-keys-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkFormField,
    MkInput,
    MkNumericKeypad,
    MkOnScreenKeyboard,
    MkOnScreenKeyboardTrigger,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Keypad &amp; on-screen keyboard</h1>
      <p class="docs-lead">
        Touch key surfaces for tills, kiosks and tablet screens.
        <code class="docs-inline">&lt;mk-numeric-keypad&gt;</code> is a 3×4
        digit pad (PIN / quantity / amount modes) implementing
        <code class="docs-inline">ControlValueAccessor</code>;
        <code class="docs-inline">&lt;mk-on-screen-keyboard&gt;</code> is a
        QWERTY panel that docks under an input via the
        <code class="docs-inline">mkOnScreenKeyboardFor</code> directive and
        types caret-aware into its native value, so forms stay in sync with
        no extra wiring.
      </p>

      <h2>PIN entry</h2>
      <p>
        <code class="docs-inline">mode="pin"</code> keeps the value a string
        (leading zeros preserved), masks the echo row and emits
        <code class="docs-inline">(submit)</code> automatically when
        <code class="docs-inline">length</code> digits are in — the shape of a
        staff-switch lock screen.
      </p>
      <docs-example [code]="pinCode" [column]="true">
        <mk-numeric-keypad
          mode="pin"
          [length]="4"
          (submit)="lastPin.set($event)"
        />
        <p class="echo">
          Submitted PIN: {{ lastPin() === null ? '—' : '****' }}
          @if (lastPin() !== null) {
            <span>({{ lastPin() }})</span>
          }
        </p>
      </docs-example>

      <h2>Quantity &amp; amount</h2>
      <p>
        <code class="docs-inline">mode="quantity"</code> builds an integer
        (bottom-left clears); <code class="docs-inline">mode="amount"</code>
        swaps the clear key for a decimal separator and caps fraction digits
        at <code class="docs-inline">fractionDigits</code> — cash-tendered
        entry on a POS. Bounds go through the validator as
        <code class="docs-inline">min</code>/<code class="docs-inline">max</code>
        errors.
      </p>
      <docs-example [code]="quantityCode">
        <mk-numeric-keypad mode="quantity" [min]="1" [(value)]="qty" />
        <mk-numeric-keypad mode="amount" [(value)]="amount" />
      </docs-example>
      <p class="echo">Quantity: {{ qty() ?? '—' }} · Amount: {{ amount() ?? '—' }} zł</p>

      <h2>On-screen keyboard</h2>
      <p>
        Focus a field below. The trigger sets
        <code class="docs-inline">inputmode="none"</code> (no OS keyboard on
        touch devices), the panel renders in the browser top layer under the
        input, and keys never steal focus. Shift produces one uppercase
        character; the <code class="docs-inline">?ąę</code> layer holds Polish
        diacritics and symbols. Enter emits for single-line inputs and inserts
        a newline in a textarea.
      </p>
      <docs-example [code]="keyboardCode" [column]="true">
        <mk-form-field label="Customer name" style="max-width: 24rem; width: 100%;">
          <input mkInput [mkOnScreenKeyboardFor]="kbd" />
        </mk-form-field>
        <mk-on-screen-keyboard #kbd />
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td colspan="4"><strong>mk-numeric-keypad</strong></td></tr>
          <tr><td>mode</td><td>'pin' | 'quantity' | 'amount'</td><td>'quantity'</td><td>Value type: string (pin) or number | null.</td></tr>
          <tr><td>value</td><td>model&lt;string | number | null&gt;</td><td>null</td><td>Two-way value ([(value)]; also a ControlValueAccessor).</td></tr>
          <tr><td>length</td><td>number</td><td>4</td><td>PIN length; reaching it emits (submit).</td></tr>
          <tr><td>min / max</td><td>number | null</td><td>null</td><td>Validator bounds (quantity/amount).</td></tr>
          <tr><td>mask / showValue</td><td>boolean</td><td>true</td><td>Masked PIN echo · echo row visibility.</td></tr>
          <tr><td>decimalSeparator / fractionDigits</td><td>string / number</td><td>',' / 2</td><td>Amount-mode display separator and precision.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the pad (forms' setDisabledState also applies).</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling.</td></tr>
          <tr><td>ariaLabel</td><td>string</td><td><em>i18n "Numeric keypad"</em></td><td>Accessible label for the pad's group role.</td></tr>
          <tr><td>(submit)</td><td>string | number | null</td><td>—</td><td>Enter key, or PIN reaching full length.</td></tr>
          <tr><td colspan="4"><strong>mk-on-screen-keyboard</strong></td></tr>
          <tr><td>layout</td><td>MkKeyboardLayout</td><td>QWERTY-PL</td><td>Rows per layer + shift map; supply your own for other languages.</td></tr>
          <tr><td>placement</td><td>MkPlacement</td><td>'bottom-start'</td><td>Panel position relative to the input.</td></tr>
          <tr><td>(enter) / (closed)</td><td>void</td><td>—</td><td>Enter on single-line input · panel closed (any reason).</td></tr>
          <tr><td>opened</td><td>Signal&lt;boolean&gt;</td><td>false</td><td>Read-only signal: whether the panel is open.</td></tr>
          <tr><td>open(anchor, target)</td><td>(HTMLElement, input | textarea) =&gt; void</td><td>—</td><td>Open the panel anchored to an element, typing into the target. The trigger directive calls this on focus.</td></tr>
          <tr><td>close()</td><td>() =&gt; void</td><td>—</td><td>Close the panel (resets shift and the alt layer; emits closed).</td></tr>
          <tr><td>panelId</td><td>string</td><td><em>auto</em></td><td>Stable id for aria-controls on the trigger.</td></tr>
          <tr><td>[mkOnScreenKeyboardFor]</td><td>MkOnScreenKeyboard</td><td>—</td><td>Trigger directive on input/textarea: opens on focus, inputmode="none".</td></tr>
        </tbody>
      </table>

      <h3>Custom layouts</h3>
      <p>
        The default layout is the exported
        <code class="docs-inline">MK_KEYBOARD_LAYOUT_QWERTY_PL</code> — plain
        QWERTY letters with the Polish diacritics and common symbols on the
        alternate layer (programmer-Polish convention). To support another
        language, pass your own <code class="docs-inline">MkKeyboardLayout</code>:
        two row grids, <code class="docs-inline">base</code> and
        <code class="docs-inline">alt</code>, where each key is either a string
        (a literal lowercase character) or an action object
        (<code class="docs-inline">shift</code>,
        <code class="docs-inline">backspace</code>,
        <code class="docs-inline">space</code>,
        <code class="docs-inline">enter</code>,
        <code class="docs-inline">layer</code> — with an optional
        <code class="docs-inline">span</code> to stretch across grid columns).
        An optional <code class="docs-inline">shiftMap</code> overrides shifted
        characters; keys missing from it fall back to
        <code class="docs-inline">toUpperCase()</code>, which handles diacritics
        like <code class="docs-inline">ą → Ą</code> for free.
      </p>
      <docs-example [code]="layoutCode" [column]="true">
        <p class="echo">
          The demo keyboard above uses MK_KEYBOARD_LAYOUT_QWERTY_PL — tap the
          ?ąę key to see its alternate layer.
        </p>
      </docs-example>
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
export class TouchKeysPage {
  readonly lastPin = signal<string | number | null>(null);
  readonly qty = signal<number | null>(2);
  readonly amount = signal<number | null>(null);

  readonly pinCode = `<mk-numeric-keypad mode="pin" [length]="4" (submit)="unlock($event)" />`;

  readonly quantityCode = `<mk-numeric-keypad mode="quantity" [min]="1" [(value)]="qty" />
<mk-numeric-keypad mode="amount" [(value)]="amount" />`;

  readonly keyboardCode = `<input mkInput [mkOnScreenKeyboardFor]="kbd" />
<mk-on-screen-keyboard #kbd />`;

  readonly layoutCode = `const MY_LAYOUT: MkKeyboardLayout = {
  base: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p'],
    // …
    [{ action: 'shift' }, 'y', 'x', 'c', { action: 'backspace' }],
    [{ action: 'layer' }, { action: 'space', span: 5 }, { action: 'enter', span: 2 }],
  ],
  alt: [ /* diacritics + symbols */ ],
  shiftMap: { 'ß': 'ẞ' }, // missing keys fall back to toUpperCase()
};

<mk-on-screen-keyboard #kbd [layout]="myLayout" />`;
}
