/**
 * Accessibility smoke test (axe-core) for the @mkornas/ui component library.
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
import { Component, provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';

import { MkButton } from '@mkornas/ui/button';
import { MkChip } from '@mkornas/ui/chip';
import { MkFormField } from '@mkornas/ui/forms/form-field';
import { MkInput } from '@mkornas/ui/forms/input';
import { MkCheckbox } from '@mkornas/ui/forms/checkbox';
import { MkRadio, MkRadioGroup } from '@mkornas/ui/forms/radio';
import { MkSwitch } from '@mkornas/ui/forms/switch';
import { MkSelect } from '@mkornas/ui/forms/select';
import { MkTab, MkTabs } from '@mkornas/ui/navigation/tabs';
import { MkAccordion, MkAccordionItem } from '@mkornas/ui/navigation/accordion';
import { MkBreadcrumb, MkBreadcrumbItem } from '@mkornas/ui/navigation/breadcrumb';
import { MkPagination } from '@mkornas/ui/navigation/pagination';
import { MkStep, MkStepper } from '@mkornas/ui/navigation/stepper';
import { MkTree, type MkTreeNode } from '@mkornas/ui/navigation/tree';
import { MkAlert } from '@mkornas/ui/feedback/alert';
import { MkBadge } from '@mkornas/ui/data/badge';
import { MkProgressBar } from '@mkornas/ui/data/progress-bar';
import { MkCard, MkCardFooter, MkCardHeader, MkCardTitle } from '@mkornas/ui/data/card';

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
  { name: 'checkbox', host: CheckboxHost },
  { name: 'radio group', host: RadioGroupHost },
  { name: 'switch', host: SwitchHost },
  { name: 'select (closed)', host: SelectHost },
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
