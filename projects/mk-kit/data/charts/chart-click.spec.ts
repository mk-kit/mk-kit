import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkBarChart } from './bar-chart';
import { MkDonutChart } from './donut-chart';
import { MkLineChart } from './line-chart';

@Component({
  imports: [MkDonutChart, MkBarChart, MkLineChart],
  template: `
    <mk-donut-chart [slices]="slices" [interactive]="interactive()" (sliceClick)="last.set('slice:' + $event.slice.name + ':' + $event.index)" />
    <mk-bar-chart [categories]="cats" [series]="series" [interactive]="interactive()" (barClick)="last.set('bar:' + $event.series.name + ':' + $event.category + ':' + $event.value)" />
    <mk-line-chart [categories]="cats" [series]="series" [interactive]="interactive()" (pointClick)="last.set('point:' + $event.category + ':' + $event.values.map(v => v.value).join('/'))" />
  `,
})
class Host {
  readonly interactive = signal(true);
  readonly last = signal('');
  readonly slices = [
    { name: 'Paid', value: 40 },
    { name: 'Pending', value: 10 },
  ];
  readonly cats = ['Q1', 'Q2'];
  readonly series = [
    { name: 'Revenue', data: [10, 20] },
    { name: 'Cost', data: [5, 8] },
  ];
}

describe('chart click outputs', () => {
  const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

  async function setup() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('donut slices and legend rows are buttons that emit sliceClick by click and keyboard', async () => {
    const { el, host } = await setup();
    const slices = el.querySelectorAll('.mk-chart__slice');
    expect(slices[1].getAttribute('role')).toBe('button');
    expect(slices[1].getAttribute('tabindex')).toBe('0');
    expect(slices[1].getAttribute('aria-label')).toBe('Pending: 10');
    expect(el.querySelector('mk-donut-chart svg')?.getAttribute('aria-hidden')).toBeNull();
    (slices[1] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.last()).toBe('slice:Pending:1');
    key(slices[0], 'Enter');
    expect(host.last()).toBe('slice:Paid:0');
    const legend = el.querySelectorAll<HTMLButtonElement>('mk-donut-chart .mk-chart__legend-button');
    expect(legend.length).toBe(2);
    legend[1].click();
    expect(host.last()).toBe('slice:Pending:1');
    key(slices[0], 'ArrowRight'); // ignored
    expect(host.last()).toBe('slice:Pending:1');
  });

  it('bars emit barClick with series, category and value', async () => {
    const { el, host } = await setup();
    const bars = el.querySelectorAll('.mk-chart__bar');
    expect(bars.length).toBe(4);
    expect(bars[0].getAttribute('role')).toBe('button');
    expect(bars[3].getAttribute('aria-label')).toBe('Cost, Q2: 8');
    (bars[3] as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.last()).toBe('bar:Cost:Q2:8');
    key(bars[0], 'Enter');
    expect(host.last()).toBe('bar:Revenue:Q1:10');
  });

  it('line x positions emit pointClick with every series value', async () => {
    const { el, host } = await setup();
    const bands = el.querySelectorAll('.mk-chart__band--interactive');
    expect(bands.length).toBe(2);
    expect(bands[1].getAttribute('aria-label')).toBe('Q2: Revenue 20, Cost 8');
    (bands[1] as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.last()).toBe('point:Q2:20/8');
  });

  it('non-interactive charts stay aria-hidden pictures with no buttons and no emissions', async () => {
    const { fixture, el, host } = await setup();
    host.interactive.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('mk-donut-chart svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelectorAll('[role="button"]').length).toBe(0);
    (el.querySelector('.mk-chart__slice') as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.last()).toBe('');
  });
});
