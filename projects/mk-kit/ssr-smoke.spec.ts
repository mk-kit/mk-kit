// @vitest-environment node
//
// platform-server unconditionally patches globalThis with its bundled domino
// DOM implementation (`Object.assign(globalThis, domino.impl)`), and the
// @angular/build unit-test runner executes all spec files with
// `isolate: false` (shared worker globals). Running this file in the plain
// node environment keeps the domino globals from clobbering the shared jsdom
// realm used by every other spec (e.g. jsdom's KeyboardEvent).
/**
 * SSR render smoke test for the @mkornas/ui component library.
 *
 * Server-renders (via `renderApplication` from @angular/platform-server) a
 * standalone root component whose template composes a broad set of mk
 * components — static ones plus components that rely on browser APIs at
 * runtime (tooltip host, scroll-area, virtual-scroll, back-to-top).
 *
 * Purpose: catch any component whose constructor / field initializers /
 * render-time effects touch `window` or `document` without a platform guard,
 * which would throw during server-side rendering.
 *
 * Note: this runs inside the jsdom test env, but platform-server provides
 * its own DOCUMENT (domino) through DI, so the render exercises the real
 * server code paths regardless of the surrounding globals.
 */
import {
  type AfterViewInit,
  Component,
  provideZonelessChangeDetection,
  viewChild,
} from '@angular/core';
import {
  bootstrapApplication,
  type BootstrapContext,
  ɵBrowserDomAdapter as BrowserDomAdapter,
} from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

import { MkButton } from '@mkornas/ui/button';
import { MkChip } from '@mkornas/ui/chip';
import { MkFormField } from '@mkornas/ui/forms/form-field';
import { MkInput } from '@mkornas/ui/forms/input';
import { MkInputGroup } from '@mkornas/ui/forms/input-group';
import { MkCheckbox } from '@mkornas/ui/forms/checkbox';
import { MkRadio, MkRadioGroup } from '@mkornas/ui/forms/radio';
import { MkSwitch } from '@mkornas/ui/forms/switch';
import { MkSelect, type MkSelectOption } from '@mkornas/ui/forms/select';
import { MkPhoneInput } from '@mkornas/ui/forms/phone-input';
import { MkPostalCodeInput } from '@mkornas/ui/forms/postal-code-input';
import { MkCurrencyInput } from '@mkornas/ui/forms/currency-input';
import { MkCardNumberInput } from '@mkornas/ui/forms/card-number-input';
import { MkIbanInput } from '@mkornas/ui/forms/iban-input';
import { MkSubmitInput } from '@mkornas/ui/forms/submit-input';
import { MkTaxIdInput } from '@mkornas/ui/forms/tax-id-input';
import { MkSignaturePad } from '@mkornas/ui/forms/signature-pad';
import { MkBlockEditor, mkHtmlToBlocks } from '@mkornas/ui/block-editor';
import { MkJsonViewer } from '@mkornas/ui/data/json-viewer';
import { MkImage } from '@mkornas/ui/media/image';
import { MkImageGallery } from '@mkornas/ui/media/image-gallery';
import { MkImageCropper } from '@mkornas/ui/media/image-cropper';
import { MkMediaGallery, type MkMediaItem } from '@mkornas/ui/media/media-gallery';
import { MkProfileCard } from '@mkornas/ui/data/profile-card';
import { MkTab, MkTabs } from '@mkornas/ui/navigation/tabs';
import { MkAccordion, MkAccordionItem } from '@mkornas/ui/navigation/accordion';
import { MkBreadcrumb, MkBreadcrumbItem } from '@mkornas/ui/navigation/breadcrumb';
import { MkPagination } from '@mkornas/ui/navigation/pagination';
import { MkStep, MkStepper } from '@mkornas/ui/navigation/stepper';
import { MkTree, type MkTreeNode } from '@mkornas/ui/navigation/tree';
import { MkScrollArea } from '@mkornas/ui/navigation/scroll-area';
import { MkBackToTop } from '@mkornas/ui/navigation/back-to-top';
import { MkAlert } from '@mkornas/ui/feedback/alert';
import { MkTooltip } from '@mkornas/ui/feedback/tooltip';
import { MkBadge } from '@mkornas/ui/data/badge';
import { MkProgressBar } from '@mkornas/ui/data/progress-bar';
import { MkCard, MkCardFooter, MkCardHeader, MkCardTitle } from '@mkornas/ui/data/card';
import { MkVirtualScroll } from '@mkornas/ui/data/virtual-scroll';

/**
 * Gallery root: composes static components plus browser-API-dependent ones
 * (tooltip host, scroll-area, virtual-scroll, back-to-top) so an unguarded
 * `window`/`document` access anywhere in their creation path fails the test.
 */
@Component({
  selector: 'ssr-smoke-root',
  imports: [
    MkButton,
    MkChip,
    MkFormField,
    MkInput,
    MkInputGroup,
    MkCheckbox,
    MkRadioGroup,
    MkRadio,
    MkSwitch,
    MkSelect,
    MkPhoneInput,
    MkPostalCodeInput,
    MkCurrencyInput,
    MkCardNumberInput,
    MkIbanInput,
    MkTaxIdInput,
    MkSubmitInput,
    MkSignaturePad,
    MkBlockEditor,
    MkJsonViewer,
    MkImage,
    MkImageGallery,
    MkImageCropper,
    MkMediaGallery,
    MkProfileCard,
    MkTabs,
    MkTab,
    MkAccordion,
    MkAccordionItem,
    MkBreadcrumb,
    MkBreadcrumbItem,
    MkPagination,
    MkStepper,
    MkStep,
    MkTree,
    MkScrollArea,
    MkBackToTop,
    MkAlert,
    MkTooltip,
    MkBadge,
    MkProgressBar,
    MkCard,
    MkCardHeader,
    MkCardTitle,
    MkCardFooter,
    MkVirtualScroll,
  ],
  template: `
    <main>
      <button mkButton tone="primary" mkTooltip="Saves the draft">Save</button>
      <a mkButton href="#docs">Docs</a>

      <mk-badge tone="success">Live</mk-badge>
      <mk-chip removable>Token</mk-chip>

      <mk-alert tone="info" title="Heads up">Maintenance window on Sunday.</mk-alert>
      <mk-progress-bar [value]="64" label="Upload progress" />

      <mk-card>
        <mk-card-header><mk-card-title>Monthly revenue</mk-card-title></mk-card-header>
        <p>Revenue is up 12% month over month.</p>
        <mk-card-footer>Updated 5 minutes ago</mk-card-footer>
      </mk-card>

      <mk-form-field label="Full name" hint="As on your ID">
        <input mkInput placeholder="Ada Lovelace" />
      </mk-form-field>
      <mk-input-group>
        <span mkInputPrefix>@</span>
        <input mkInput placeholder="handle" />
      </mk-input-group>
      <mk-form-field label="Role">
        <mk-select placeholder="Pick a role" [options]="roleOptions" />
      </mk-form-field>
      <mk-form-field label="Phone">
        <mk-phone-input country="PL" value="+48601234567" />
      </mk-form-field>
      <mk-form-field label="Postal code">
        <mk-postal-code-input country="PL" value="00-950" />
      </mk-form-field>
      <mk-form-field label="Price">
        <mk-currency-input currency="USD" locale="en-US" [value]="1234.5" />
      </mk-form-field>
      <mk-form-field label="Card number">
        <mk-card-number-input value="4111111111111111" />
      </mk-form-field>
      <mk-form-field label="IBAN">
        <mk-iban-input value="DE89370400440532013000" />
      </mk-form-field>
      <mk-form-field label="NIP">
        <mk-tax-id-input country="PL" value="1234563218" />
      </mk-form-field>
      <mk-form-field label="Discount code">
        <mk-submit-input buttonLabel="Apply" value="SUMMER10" clearable />
      </mk-form-field>
      <mk-form-field label="Signature">
        <mk-signature-pad />
      </mk-form-field>
      <mk-block-editor [value]="parsedDoc" />
      <mk-json-viewer [data]="jsonData" [expandDepth]="2" />

      <mk-image src="/dish.jpg" alt="Dish" aspectRatio="4 / 3" caption="Special" />
      <mk-image-gallery
        [items]="[{ src: '/a.jpg', alt: 'A' }, { src: '/b.jpg', alt: 'B' }]"
        [lightbox]="false"
      />
      <mk-image-cropper src="/avatar.jpg" [aspect]="1" />
      <mk-media-gallery [items]="mediaItems" selectable />
      <mk-profile-card name="Ada Lovelace" subtitle="Head chef" avatarSrc="/ada.jpg">
        <p>Bio text</p>
      </mk-profile-card>

      <mk-checkbox [checked]="true">Accept terms</mk-checkbox>
      <mk-radio-group aria-label="Plan" [value]="'pro'">
        <mk-radio [value]="'free'">Free</mk-radio>
        <mk-radio [value]="'pro'">Pro</mk-radio>
      </mk-radio-group>
      <mk-switch>Email notifications</mk-switch>

      <mk-tabs>
        <mk-tab label="Overview"><p>Overview content</p></mk-tab>
        <mk-tab label="Activity"><p>Activity content</p></mk-tab>
      </mk-tabs>

      <mk-accordion>
        <mk-accordion-item header="Shipping" [open]="true">Ships in 2–4 days.</mk-accordion-item>
        <mk-accordion-item header="Returns">Free returns within 30 days.</mk-accordion-item>
      </mk-accordion>

      <mk-breadcrumb>
        <mk-breadcrumb-item href="#home">Home</mk-breadcrumb-item>
        <mk-breadcrumb-item>Jane Doe</mk-breadcrumb-item>
      </mk-breadcrumb>

      <mk-pagination [total]="120" [pageSize]="10" label="Results pages" />

      <mk-stepper [selectedIndex]="0">
        <mk-step label="Account"><p>Account step</p></mk-step>
        <mk-step label="Done"><p>Done step</p></mk-step>
      </mk-stepper>

      <mk-tree [nodes]="nodes" aria-label="Project files" />

      <mk-scroll-area style="height: 8rem">
        <p>Scrollable content</p>
      </mk-scroll-area>

      <mk-virtual-scroll [items]="items" [itemHeight]="32" style="height: 10rem" />

      <mk-back-to-top />
    </main>
  `,
})
class SsrSmokeRoot implements AfterViewInit {
  // Runs the HTML → blocks parser during server bootstrap: without a DOM it
  // must fall back to a sanitised paragraph, never throw.
  readonly parsedDoc = mkHtmlToBlocks('<h2>Title</h2><p>Body copy.</p>');
  private readonly pad = viewChild.required(MkSignaturePad);

  ngAfterViewInit(): void {
    // clear() → redraw() touches canvas/window APIs; must be a no-op on the
    // server rather than a ReferenceError.
    this.pad().clear();
  }

  readonly roleOptions: MkSelectOption[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'Viewer', value: 'viewer' },
  ];
  readonly nodes: MkTreeNode[] = [
    { label: 'src', expanded: true, children: [{ label: 'index.ts' }] },
    { label: 'README.md' },
  ];
  readonly items = Array.from({ length: 200 }, (_, i) => `Row ${i + 1}`);
  readonly jsonData = { user: { name: 'Ada' }, active: true };
  readonly mediaItems: MkMediaItem[] = [
    { id: 'm1', src: '/a.jpg', name: 'hero.jpg' },
    { id: 'm2', src: '/b.jpg', name: 'menu.jpg' },
  ];
}

const INDEX_HTML = '<html><head><title>ssr-smoke</title></head><body><ssr-smoke-root></ssr-smoke-root></body></html>';

describe('SSR render smoke (@angular/platform-server)', () => {
  // Two test-runner artifacts require one tiny, targeted patch:
  // 1. Angular's `setRootDomAdapter` is first-write-wins, and the runner's
  //    shared TestBed setup (isolate: false) has already installed
  //    BrowserDomAdapter in this worker, so platform-server's DominoAdapter
  //    can never take the slot.
  // 2. The DOM renderer's dev-mode-only CSS source-map handling then calls
  //    `BrowserDomAdapter.getBaseHref()`, which reads the *global*
  //    `document` — absent in this node environment. (Real production SSR
  //    never runs this path: it is behind `ngDevMode`.)
  // Neutralize only this base-href lookup instead of stubbing a global
  // `document`, which would mask exactly the unguarded DOM access this test
  // exists to catch.
  let originalGetBaseHref: (doc: Document) => string | null;

  beforeAll(() => {
    originalGetBaseHref = BrowserDomAdapter.prototype.getBaseHref;
    BrowserDomAdapter.prototype.getBaseHref = () => null;
  });

  afterAll(() => {
    BrowserDomAdapter.prototype.getBaseHref = originalGetBaseHref;
  });

  async function render(): Promise<string> {
    return renderApplication(
      (context: BootstrapContext) =>
        bootstrapApplication(
          SsrSmokeRoot,
          {
            providers: [provideServerRendering(), provideZonelessChangeDetection()],
          },
          context,
        ),
      { document: INDEX_HTML, url: '/' },
    );
  }

  it('server-renders the component gallery without throwing', async () => {
    const html = await render();

    // Every composed component must leave its host tag in the SSR output.
    const markers = [
      '<main',
      'mk-button', // class on the [mkButton] host
      'mk-badge',
      'mk-chip',
      'mk-alert',
      'mk-progress-bar',
      'mk-card',
      'mk-form-field',
      'mk-select',
      'mk-phone-input',
      'mk-postal-code-input',
      'mk-currency-input',
      'mk-card-number-input',
      'mk-iban-input',
      'mk-tax-id-input',
      'mk-submit-input',
      'mk-signature-pad',
      'mk-block-editor',
      'mk-json-viewer',
      'mk-image',
      'mk-image-gallery',
      'mk-image-cropper',
      'mk-media-gallery',
      'mk-profile-card',
      'mk-checkbox',
      'mk-radio-group',
      'mk-switch',
      'mk-tabs',
      'mk-accordion',
      'mk-breadcrumb',
      'mk-pagination',
      'mk-stepper',
      'mk-tree',
      'mk-scroll-area',
      'mk-virtual-scroll',
      'mk-back-to-top',
    ];
    for (const marker of markers) {
      expect(html, `SSR output is missing "${marker}"`).toContain(marker);
    }

    // Some real content must have been serialized, not just empty shells.
    expect(html).toContain('Monthly revenue');
    expect(html).toContain('Overview content');
  });
});
