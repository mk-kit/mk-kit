import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkAccordion } from './accordion';
import { MkAccordionItem } from './accordion-item';

@Component({
  imports: [MkAccordion, MkAccordionItem],
  template: `<mk-accordion [multi]="multi()">
    <mk-accordion-item header="One">First body</mk-accordion-item>
    <mk-accordion-item header="Two" [disabled]="twoDisabled()">Second body</mk-accordion-item>
    <mk-accordion-item header="Three" [(open)]="thirdOpen">Third body</mk-accordion-item>
  </mk-accordion>`,
})
class Host {
  multi = signal(false);
  twoDisabled = signal(false);
  thirdOpen = signal(false);
}

describe('MkAccordion', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      triggers: [...el.querySelectorAll<HTMLButtonElement>('.mk-accordion-item__trigger')],
      panels: [...el.querySelectorAll<HTMLElement>('[role=region]')],
      host: fixture.componentInstance,
    };
  }

  const expanded = (triggers: HTMLButtonElement[]) =>
    triggers.map((t) => t.getAttribute('aria-expanded'));

  afterEach(() => TestBed.resetTestingModule());

  it('wires each trigger to its panel', () => {
    const { triggers, panels } = mount();
    expect(triggers.length).toBe(3);
    triggers.forEach((trigger, i) => {
      expect(trigger.getAttribute('aria-controls')).toBe(panels[i].id);
      expect(panels[i].getAttribute('aria-labelledby')).toBe(trigger.id);
    });
  });

  it('renders the plain-text headers', () => {
    const { triggers } = mount();
    expect(triggers.map((t) => t.textContent?.trim())).toEqual(['One', 'Two', 'Three']);
  });

  it('starts collapsed, with the panels inert', () => {
    const { triggers, panels } = mount();
    expect(expanded(triggers)).toEqual(['false', 'false', 'false']);
    expect(panels.every((p) => p.hasAttribute('inert'))).toBe(true);
  });

  it('expands and collapses on click', () => {
    const { fixture, triggers, panels } = mount();
    triggers[0].click();
    fixture.detectChanges();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(panels[0].hasAttribute('inert')).toBe(false);

    triggers[0].click();
    fixture.detectChanges();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(panels[0].hasAttribute('inert')).toBe(true);
  });

  it('collapses the open sibling in single mode', () => {
    const { fixture, triggers } = mount();
    triggers[0].click();
    fixture.detectChanges();
    triggers[2].click();
    fixture.detectChanges();

    expect(expanded(triggers)).toEqual(['false', 'false', 'true']);
  });

  it('keeps siblings open in multi mode', () => {
    const { fixture, triggers, host } = mount();
    host.multi.set(true);
    fixture.detectChanges();

    triggers[0].click();
    fixture.detectChanges();
    triggers[2].click();
    fixture.detectChanges();

    expect(expanded(triggers)).toEqual(['true', 'false', 'true']);
  });

  it('does not toggle a disabled item', () => {
    const { fixture, triggers, host } = mount();
    host.twoDisabled.set(true);
    fixture.detectChanges();

    expect(triggers[1].disabled).toBe(true);
    triggers[1].click();
    fixture.detectChanges();
    expect(triggers[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('honours the two-way open model in both directions', () => {
    const { fixture, triggers, host } = mount();
    host.thirdOpen.set(true);
    fixture.detectChanges();
    expect(triggers[2].getAttribute('aria-expanded')).toBe('true');

    triggers[2].click();
    fixture.detectChanges();
    expect(host.thirdOpen()).toBe(false);
  });
});
