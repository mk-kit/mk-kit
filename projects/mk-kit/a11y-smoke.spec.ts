/**
 * Accessibility smoke test (axe-core) for the @mk-kit/ui component library.
 *
 * Renders a representative set of statically-renderable components through
 * TestBed host fixtures and runs axe-core (WCAG 2.x A/AA rule set) against
 * each rendered fixture, asserting zero violations.
 *
 * Scope notes:
 * - Only components that render fully in jsdom without overlays, timers or
 *   layout are covered (dialog/tooltip/menu open states are overlay-based
 *   and excluded here — they have their own unit specs).
 * - jsdom has no layout engine, so layout-dependent axe rules are disabled
 *   below (each disable is documented at the definition of AXE_RUN_OPTIONS).
 */
import {
  type AfterViewInit,
  Component,
  provideZonelessChangeDetection,
  type Type,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';

import { MkButton } from '@mk-kit/ui/button';
import { MkChip } from '@mk-kit/ui/chip';
import { MkFormField } from '@mk-kit/ui/forms/form-field';
import { MkInput } from '@mk-kit/ui/forms/input';
import { MkInputGroup } from '@mk-kit/ui/forms/input-group';
import { MkSubmitInput } from '@mk-kit/ui/forms/submit-input';
import { MkCheckbox } from '@mk-kit/ui/checkbox';
import { MkRadio, MkRadioGroup } from '@mk-kit/ui/forms/radio';
import { MkSwitch } from '@mk-kit/ui/forms/switch';
import { MkSelect } from '@mk-kit/ui/forms/select';
import { MkPhoneInput } from '@mk-kit/ui/forms/phone-input';
import { MkPostalCodeInput } from '@mk-kit/ui/forms/postal-code-input';
import { MkCurrencyInput } from '@mk-kit/ui/forms/currency-input';
import { MkCardNumberInput } from '@mk-kit/ui/forms/card-number-input';
import { MkNumericKeypad } from '@mk-kit/ui/forms/numeric-keypad';
import {
  MkOnScreenKeyboard,
  MkOnScreenKeyboardTrigger,
} from '@mk-kit/ui/forms/on-screen-keyboard';
import { MkIbanInput } from '@mk-kit/ui/forms/iban-input';
import { MkTaxIdInput } from '@mk-kit/ui/forms/tax-id-input';
import { MkDateTimePicker } from '@mk-kit/ui/datetime/datetime-picker';
import { MkSignaturePad } from '@mk-kit/ui/forms/signature-pad';
import { MkJsonViewer } from '@mk-kit/ui/data/json-viewer';
import { MkImage } from '@mk-kit/ui/media/image';
import { MkImageGallery } from '@mk-kit/ui/media/image-gallery';
import { MkImageCropper } from '@mk-kit/ui/media/image-cropper';
import { MkMediaGallery, type MkMediaItem } from '@mk-kit/ui/media/media-gallery';
import { MkProfileCard, MkProfileMeta, MkProfileActions } from '@mk-kit/ui/data/profile-card';
import { MkTab, MkTabs } from '@mk-kit/ui/navigation/tabs';
import { MkAccordion, MkAccordionItem } from '@mk-kit/ui/navigation/accordion';
import { MkBreadcrumb, MkBreadcrumbItem } from '@mk-kit/ui/navigation/breadcrumb';
import { MkPagination } from '@mk-kit/ui/navigation/pagination';
import { MkStep, MkStepper } from '@mk-kit/ui/navigation/stepper';
import { MkTree, type MkTreeNode } from '@mk-kit/ui/navigation/tree';
import { MkAlert } from '@mk-kit/ui/feedback/alert';
import { MkBadge } from '@mk-kit/ui/data/badge';
import { MkProgressBar } from '@mk-kit/ui/data/progress-bar';
import { MkCard, MkCardFooter, MkCardHeader, MkCardTitle } from '@mk-kit/ui/data/card';

/**
 * axe run options shared by every fixture.
 *
 * Rules are the default axe-core rule set minus the disables below. Every
 * disable must be justified — do not add entries to silence real findings.
 */
const AXE_RUN_OPTIONS: axe.RunOptions = {
  rules: {
    // jsdom has no layout/paint engine: computed colors resolve to defaults
    // (no theme stylesheet is loaded in unit tests either), so contrast
    // cannot be evaluated meaningfully here. Covered by manual/E2E review.
    'color-contrast': { enabled: false },
  },
};

/** Serializes axe violations into a readable assertion message. */
function formatViolations(violations: axe.Result[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    ${n.target.join(' ')}\n      ${n.failureSummary?.replace(/\n/g, '\n      ')}`)
        .join('\n');
      return `  [${v.id}] ${v.help} (${v.helpUrl})\n${nodes}`;
    })
    .join('\n');
}

// --- Host fixtures ---------------------------------------------------------
// One small host per component (or tightly-coupled component family), using
// the same canonical usage the docs site demonstrates.

@Component({
  imports: [MkButton],
  template: `
    <button mkButton tone="primary">Save</button>
    <button mkButton tone="danger" [disabled]="true">Delete</button>
    <a mkButton tone="neutral" href="#docs">Docs</a>
  `,
})
class ButtonHost {}

@Component({
  imports: [MkFormField, MkInput],
  template: `
    <mk-form-field label="Full name" hint="As on your ID">
      <input mkInput placeholder="Ada Lovelace" />
    </mk-form-field>
  `,
})
class FormFieldInputHost {}

@Component({
  imports: [MkFormField, MkDateTimePicker],
  template: `
    <mk-form-field label="Starts at" hint="Local time">
      <mk-datetime-picker [value]="startsAt" [step]="15" clearable />
    </mk-form-field>
  `,
})
class DateTimePickerHost {
  readonly startsAt = new Date(2026, 7, 26, 14, 30);
}

@Component({
  imports: [MkInputGroup, MkInput],
  template: `
    <mk-input-group>
      <span mkInputPrefix aria-hidden="true">@</span>
      <input mkInput placeholder="handle" aria-label="Handle" />
    </mk-input-group>
  `,
})
class InputGroupHost {}

@Component({
  imports: [MkCheckbox],
  template: `
    <mk-checkbox [checked]="true">Accept terms</mk-checkbox>
    <mk-checkbox disabled>Subscribe to newsletter</mk-checkbox>
  `,
})
class CheckboxHost {}

@Component({
  imports: [MkRadioGroup, MkRadio],
  template: `
    <mk-radio-group aria-label="Plan" [value]="'pro'">
      <mk-radio [value]="'free'">Free</mk-radio>
      <mk-radio [value]="'pro'">Pro</mk-radio>
      <mk-radio [value]="'team'" [disabled]="true">Team</mk-radio>
    </mk-radio-group>
  `,
})
class RadioGroupHost {}

@Component({
  imports: [MkSwitch],
  template: `<mk-switch [checked]="true">Email notifications</mk-switch>`,
})
class SwitchHost {}

@Component({
  imports: [MkFormField, MkPhoneInput],
  template: `
    <mk-form-field label="Phone">
      <mk-phone-input country="PL" />
    </mk-form-field>
  `,
})
class PhoneInputHost {}

@Component({
  imports: [MkFormField, MkPostalCodeInput],
  template: `
    <mk-form-field label="Postal code">
      <mk-postal-code-input country="PL" />
    </mk-form-field>
  `,
})
class PostalCodeInputHost {}

@Component({
  imports: [MkFormField, MkCurrencyInput],
  template: `
    <mk-form-field label="Price">
      <mk-currency-input currency="PLN" locale="pl-PL" />
    </mk-form-field>
  `,
})
class CurrencyInputHost {}

@Component({
  imports: [MkFormField, MkCardNumberInput],
  template: `
    <mk-form-field label="Card number">
      <mk-card-number-input value="4111111111111111" />
    </mk-form-field>
  `,
})
class CardNumberInputHost {}

@Component({
  imports: [MkNumericKeypad],
  template: `<mk-numeric-keypad mode="pin" [length]="4" />`,
})
class NumericKeypadHost {}

@Component({
  imports: [MkOnScreenKeyboard, MkOnScreenKeyboardTrigger],
  template: `
    <label for="osk-input">Name</label>
    <input id="osk-input" [mkOnScreenKeyboardFor]="kbd" />
    <mk-on-screen-keyboard #kbd />
  `,
})
class OnScreenKeyboardHost implements AfterViewInit {
  readonly kbd = viewChild.required(MkOnScreenKeyboard);
  ngAfterViewInit(): void {
    // Open the panel so axe audits the key surface, not an empty host.
    const el = document.getElementById('osk-input') as HTMLInputElement;
    this.kbd().open(el, el);
  }
}

@Component({
  imports: [MkFormField, MkIbanInput],
  template: `
    <mk-form-field label="IBAN">
      <mk-iban-input value="DE89370400440532013000" />
    </mk-form-field>
  `,
})
class IbanInputHost {}

@Component({
  imports: [MkFormField, MkSubmitInput],
  template: `
    <mk-form-field label="Discount code">
      <mk-submit-input buttonLabel="Apply" value="SUMMER10" clearable />
    </mk-form-field>
    <mk-submit-input buttonIcon="search" buttonLabel="Search" label="Quick search" value="ramen" />
  `,
})
class SubmitInputHost {}

@Component({
  imports: [MkFormField, MkTaxIdInput],
  template: `
    <mk-form-field label="NIP">
      <mk-tax-id-input country="PL" value="1234563218" />
    </mk-form-field>
  `,
})
class TaxIdInputHost {}

@Component({
  imports: [MkFormField, MkSignaturePad],
  template: `
    <mk-form-field label="Signature">
      <mk-signature-pad />
    </mk-form-field>
  `,
})
class SignaturePadHost {}

@Component({
  imports: [MkJsonViewer],
  template: `<mk-json-viewer [data]="data" [expandDepth]="2" />`,
})
class JsonViewerHost {
  readonly data = { user: { name: 'Ada' }, roles: ['admin'], active: true };
}

@Component({
  imports: [MkImage],
  template: `
    <mk-image
      src="/assets/dish.jpg"
      alt="Grilled salmon on a plate"
      aspectRatio="4 / 3"
      caption="Today's special"
    />
  `,
})
class ImageHost {}

@Component({
  imports: [MkImageGallery],
  template: `
    <mk-image-gallery
      [items]="[
        { src: '/a.jpg', alt: 'Starter plate' },
        { src: '/b.jpg', alt: 'Main course' },
        { src: '/c.jpg', alt: 'Dessert' },
      ]"
      [lightbox]="false"
    />
  `,
})
class ImageGalleryHost {}

@Component({
  imports: [MkImageCropper],
  template: `<mk-image-cropper src="/assets/avatar-source.jpg" [aspect]="1" round />`,
})
class ImageCropperHost {}

@Component({
  imports: [MkMediaGallery],
  template: `
    <mk-media-gallery [items]="items" selectable [selection]="['m1']" />
  `,
})
class MediaGalleryHost {
  readonly items: MkMediaItem[] = [
    { id: 'm1', src: '/a.jpg', name: 'hero.jpg', meta: '1.2 MB · JPG' },
    { id: 'm2', src: '/b.jpg', name: 'menu.pdf', meta: '0.4 MB · PDF' },
  ];
}

@Component({
  imports: [MkProfileCard, MkProfileMeta, MkProfileActions],
  template: `
    <mk-profile-card
      name="Ada Lovelace"
      subtitle="Head chef"
      coverSrc="/cover.jpg"
    >
      <p>Seasonal tasting menus and pastry.</p>
      <div mkProfileMeta>
        <span>128 dishes</span>
        <span>4.9 rating</span>
      </div>
      <div mkProfileActions>
        <button type="button">Follow</button>
      </div>
    </mk-profile-card>
  `,
})
class ProfileCardHost {}

@Component({
  imports: [MkFormField, MkSelect],
  template: `
    <mk-form-field label="Role">
      <mk-select placeholder="Pick a role" [options]="options" />
    </mk-form-field>
  `,
})
class SelectHost {
  readonly options = [
    { label: 'Admin', value: 'admin' },
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' },
  ];
}

@Component({
  imports: [MkTabs, MkTab],
  template: `
    <mk-tabs>
      <mk-tab label="Overview"><p>Overview content</p></mk-tab>
      <mk-tab label="Activity"><p>Activity content</p></mk-tab>
      <mk-tab label="Settings" disabled><p>Settings content</p></mk-tab>
    </mk-tabs>
  `,
})
class TabsHost {}

@Component({
  imports: [MkAccordion, MkAccordionItem],
  template: `
    <mk-accordion>
      <mk-accordion-item header="What is mk-kit?" [open]="true">
        An Angular component library.
      </mk-accordion-item>
      <mk-accordion-item header="How is it themed?">CSS variables.</mk-accordion-item>
    </mk-accordion>
  `,
})
class AccordionHost {}

@Component({
  imports: [MkPagination],
  template: `<mk-pagination [total]="120" [pageSize]="10" [page]="3" label="Results pages" />`,
})
class PaginationHost {}

@Component({
  imports: [MkAlert],
  template: `
    <mk-alert tone="info" title="Heads up">Maintenance window on Sunday.</mk-alert>
    <mk-alert tone="danger" title="Payment failed">Card was declined.</mk-alert>
  `,
})
class AlertHost {}

@Component({
  imports: [MkBadge],
  template: `
    <mk-badge tone="success">Live</mk-badge>
    <mk-badge tone="neutral" variant="soft">Draft</mk-badge>
  `,
})
class BadgeHost {}

@Component({
  imports: [MkProgressBar],
  template: `<mk-progress-bar [value]="64" label="Upload progress" />`,
})
class ProgressBarHost {}

@Component({
  imports: [MkBreadcrumb, MkBreadcrumbItem],
  template: `
    <mk-breadcrumb>
      <mk-breadcrumb-item href="#home">Home</mk-breadcrumb-item>
      <mk-breadcrumb-item href="#users">Users</mk-breadcrumb-item>
      <mk-breadcrumb-item>Jane Doe</mk-breadcrumb-item>
    </mk-breadcrumb>
  `,
})
class BreadcrumbHost {}

@Component({
  imports: [MkCard, MkCardHeader, MkCardTitle, MkCardFooter],
  template: `
    <mk-card>
      <mk-card-header>
        <mk-card-title>Monthly revenue</mk-card-title>
      </mk-card-header>
      <p>Revenue is up 12% month over month.</p>
      <mk-card-footer>Updated 5 minutes ago</mk-card-footer>
    </mk-card>
  `,
})
class CardHost {}

@Component({
  imports: [MkChip],
  template: `
    <mk-chip>Static</mk-chip>
    <mk-chip selectable [selected]="true">Filter: active</mk-chip>
    <mk-chip removable>Token</mk-chip>
  `,
})
class ChipHost {}

@Component({
  imports: [MkStepper, MkStep],
  template: `
    <mk-stepper [selectedIndex]="1">
      <mk-step label="Account" description="Your login"><p>Account step</p></mk-step>
      <mk-step label="Profile" description="About you"><p>Profile step</p></mk-step>
      <mk-step label="Done"><p>Done step</p></mk-step>
    </mk-stepper>
  `,
})
class StepperHost {}

@Component({
  imports: [MkTree],
  template: `<mk-tree [nodes]="nodes" aria-label="Project files" />`,
})
class TreeHost {
  readonly nodes: MkTreeNode[] = [
    {
      label: 'src',
      expanded: true,
      children: [{ label: 'index.ts' }, { label: 'app.ts' }],
    },
    { label: 'README.md' },
  ];
}

// --- Test loop --------------------------------------------------------------

const CASES: ReadonlyArray<{ name: string; host: Type<unknown>; disabledRules?: string[] }> = [
  { name: 'button', host: ButtonHost },
  { name: 'form-field + input', host: FormFieldInputHost },
  { name: 'form-field + datetime-picker', host: DateTimePickerHost },
  { name: 'input group', host: InputGroupHost },
  { name: 'checkbox', host: CheckboxHost },
  { name: 'radio group', host: RadioGroupHost },
  { name: 'switch', host: SwitchHost },
  { name: 'select (closed)', host: SelectHost },
  { name: 'phone input (closed)', host: PhoneInputHost },
  { name: 'postal code input', host: PostalCodeInputHost },
  { name: 'currency input', host: CurrencyInputHost },
  { name: 'card number input', host: CardNumberInputHost },
  { name: 'numeric keypad', host: NumericKeypadHost },
  { name: 'on-screen keyboard (open)', host: OnScreenKeyboardHost },
  { name: 'iban input', host: IbanInputHost },
  { name: 'tax id input', host: TaxIdInputHost },
  { name: 'submit input', host: SubmitInputHost },
  { name: 'signature pad', host: SignaturePadHost },
  { name: 'json viewer', host: JsonViewerHost },
  { name: 'image', host: ImageHost },
  { name: 'image gallery', host: ImageGalleryHost },
  { name: 'image cropper', host: ImageCropperHost },
  { name: 'media gallery', host: MediaGalleryHost },
  { name: 'profile card', host: ProfileCardHost },
  { name: 'tabs', host: TabsHost },
  { name: 'accordion', host: AccordionHost },
  { name: 'pagination', host: PaginationHost },
  { name: 'alert', host: AlertHost },
  { name: 'badge', host: BadgeHost },
  { name: 'progress bar', host: ProgressBarHost },
  { name: 'breadcrumb', host: BreadcrumbHost },
  { name: 'card', host: CardHost },
  { name: 'chip', host: ChipHost },
  { name: 'stepper', host: StepperHost },
  { name: 'tree', host: TreeHost },
];

describe('a11y smoke (axe-core)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });
  // Destroy fixtures between cases. The runner shares one jsdom realm across
  // spec files (isolate: false), so a host that opens an overlay (e.g. the
  // on-screen keyboard's anchored panel) would otherwise leak its window
  // scroll/resize listeners into later spec files.
  afterEach(() => TestBed.resetTestingModule());

  for (const { name, host, disabledRules } of CASES) {
    it(`${name} renders with zero axe violations`, async () => {
      const fixture = TestBed.createComponent(host);
      await fixture.whenStable();

      const options: axe.RunOptions = {
        rules: {
          ...AXE_RUN_OPTIONS.rules,
          // Per-case exclusions for known, documented findings (see CASES).
          ...Object.fromEntries((disabledRules ?? []).map((id) => [id, { enabled: false }])),
        },
      };

      // axe requires the element to be attached to the document (TestBed
      // fixtures are). Runs are sequential — axe forbids concurrent runs.
      const results = await axe.run(fixture.nativeElement as HTMLElement, options);

      expect(
        results.violations.length,
        `axe violations for "${name}":\n${formatViolations(results.violations)}`,
      ).toBe(0);
    });
  }
});
