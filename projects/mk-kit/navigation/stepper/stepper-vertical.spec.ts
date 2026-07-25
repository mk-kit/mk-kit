import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkStepper, MkStepperOrientation } from './stepper';
import { MkStep } from './step';

@Component({
  imports: [MkStepper, MkStep],
  template: `<mk-stepper
    #stepper
    [orientation]="orientation()"
    [(selectedIndex)]="index"
  >
    <mk-step label="Account"><p class="body-one">One body</p></mk-step>
    <mk-step label="Profile"><p class="body-two">Two body</p></mk-step>
    <mk-step label="Review"><p class="body-three">Three body</p></mk-step>
  </mk-stepper>`,
})
class Host {
  readonly stepper = viewChild.required(MkStepper);
  orientation = signal<MkStepperOrientation>('vertical');
  index = signal(0);
}

/**
 * A vertical stepper has to INTERLEAVE each step's body with its own header.
 * Rendering every header first and every panel below (which is what a
 * horizontal layout does) reads as a list of titles followed by an orphaned
 * block of content — the bug this suite pins.
 *
 * The ARIA model necessarily differs between the two orientations: `role=tab`
 * requires tabs to be direct children of their `tablist`, which interleaving
 * cannot satisfy, so vertical uses a disclosure pattern instead.
 */
describe('MkStepper vertical', () => {
  function mount(orientation: MkStepperOrientation = 'vertical') {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.orientation.set(orientation);
    fixture.detectChanges();
    return fixture;
  }

  const el = (f: ReturnType<typeof mount>) =>
    f.nativeElement as HTMLElement;

  it('renders each body inside its own step row, not in a shared panel area', () => {
    const f = mount();
    const rows = el(f).querySelectorAll('.mk-stepper__row');
    expect(rows.length).toBe(3);

    // Every row owns exactly one header and one panel...
    rows.forEach((row) => {
      expect(row.querySelectorAll('.mk-stepper__step').length).toBe(1);
      expect(row.querySelectorAll('.mk-stepper__panel').length).toBe(1);
    });
    // ...and the bodies land in their own rows, in order.
    expect(rows[0].querySelector('.body-one')).toBeTruthy();
    expect(rows[1].querySelector('.body-two')).toBeTruthy();
    expect(rows[2].querySelector('.body-three')).toBeTruthy();
    // The horizontal-only shared panel area must not exist here.
    expect(el(f).querySelector('.mk-stepper__panels')).toBeNull();
  });

  it('puts each panel AFTER its own header in document order', () => {
    const f = mount();
    const nodes = [
      ...el(f).querySelectorAll('.mk-stepper__step, .mk-stepper__panel'),
    ];
    // Strict header,panel,header,panel,… alternation is what "interleaved" means.
    expect(
      nodes.map((n) =>
        n.classList.contains('mk-stepper__step') ? 'h' : 'p',
      ),
    ).toEqual(['h', 'p', 'h', 'p', 'h', 'p']);
  });

  it('shows only the active body and follows selection', () => {
    const f = mount();
    const panels = () =>
      [...el(f).querySelectorAll<HTMLElement>('.mk-stepper__panel')];

    expect(panels().map((p) => p.hidden)).toEqual([false, true, true]);

    f.componentInstance.index.set(2);
    f.detectChanges();
    expect(panels().map((p) => p.hidden)).toEqual([true, true, false]);
  });

  it('uses the disclosure ARIA model, not tabs', () => {
    const f = mount();
    const headers = [
      ...el(f).querySelectorAll<HTMLElement>('.mk-stepper__step'),
    ];
    const panels = [
      ...el(f).querySelectorAll<HTMLElement>('.mk-stepper__panel'),
    ];

    expect(el(f).querySelector('[role="tablist"]')).toBeNull();
    headers.forEach((h) => expect(h.getAttribute('role')).toBeNull());

    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
    expect(headers[1].getAttribute('aria-expanded')).toBe('false');
    expect(headers[0].getAttribute('aria-current')).toBe('step');
    expect(headers[1].getAttribute('aria-current')).toBeNull();

    panels.forEach((p) => expect(p.getAttribute('role')).toBe('region'));
    // Each region is still named by its own header.
    expect(panels[0].getAttribute('aria-labelledby')).toBe(headers[0].id);
  });

  it('keeps the tablist model when horizontal', () => {
    const f = mount('horizontal');
    expect(el(f).querySelector('[role="tablist"]')).toBeTruthy();
    expect(el(f).querySelector('.mk-stepper__panels')).toBeTruthy();
    expect(el(f).querySelectorAll('.mk-stepper__row').length).toBe(0);

    const headers = [
      ...el(f).querySelectorAll<HTMLElement>('.mk-stepper__step'),
    ];
    expect(headers[0].getAttribute('role')).toBe('tab');
    expect(headers[0].getAttribute('aria-selected')).toBe('true');
    expect(headers[0].getAttribute('aria-posinset')).toBe('1');
    expect(headers[0].getAttribute('aria-setsize')).toBe('3');
    // Disclosure-only attributes must not leak into the tab model.
    expect(headers[0].getAttribute('aria-expanded')).toBeNull();

    expect(
      el(f).querySelector('.mk-stepper__panel')?.getAttribute('role'),
    ).toBe('tabpanel');
  });

  it('survives switching orientation at runtime', () => {
    const f = mount('horizontal');
    expect(el(f).querySelector('.mk-stepper__panels')).toBeTruthy();

    f.componentInstance.orientation.set('vertical');
    f.detectChanges();

    expect(el(f).querySelector('.mk-stepper__panels')).toBeNull();
    expect(el(f).querySelectorAll('.mk-stepper__row').length).toBe(3);
    // The bodies must survive being re-hosted, not vanish.
    expect(el(f).querySelector('.body-one')).toBeTruthy();
  });
});
