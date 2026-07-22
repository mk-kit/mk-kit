import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkPagination } from './pagination';

@Component({
  imports: [MkPagination],
  template: `<mk-pagination
    [(page)]="page"
    [total]="total()"
    [pageSize]="pageSize()"
    [pageCount]="pageCount()"
  />`,
})
class Host {
  page = signal(1);
  total = signal(0);
  pageSize = signal(10);
  pageCount = signal(0);
}

describe('MkPagination', () => {
  function mount(setup: Partial<Record<'total' | 'pageSize' | 'pageCount' | 'page', number>> = {}) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    for (const [k, v] of Object.entries(setup)) {
      (host[k as keyof Host] as ReturnType<typeof signal<number>>).set(v as number);
    }
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, host };
  }

  /** The rendered cells, with ellipses as '…'. */
  const cells = (el: HTMLElement) =>
    [...el.querySelectorAll('.mk-pagination__btn:not(.mk-pagination__btn--nav), .mk-pagination__ellipsis')].map(
      (n) => n.textContent!.trim(),
    );

  const navButtons = (el: HTMLElement) =>
    [...el.querySelectorAll<HTMLButtonElement>('.mk-pagination__btn--nav')];

  afterEach(() => TestBed.resetTestingModule());

  it('derives the page count from total and pageSize', () => {
    const { el } = mount({ total: 45, pageSize: 10 });
    expect(cells(el)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('lets an explicit pageCount win over total/pageSize', () => {
    const { el } = mount({ total: 1000, pageSize: 10, pageCount: 3 });
    expect(cells(el)).toEqual(['1', '2', '3']);
  });

  it('always renders at least one page', () => {
    const { el } = mount({ total: 0 });
    expect(cells(el)).toEqual(['1']);
  });

  it('marks the current page with aria-current', () => {
    const { el } = mount({ total: 30, page: 2 });
    const active = el.querySelector('[aria-current="page"]');
    expect(active?.textContent?.trim()).toBe('2');
    // Exactly one cell is current.
    expect(el.querySelectorAll('[aria-current="page"]').length).toBe(1);
  });

  it('disables prev on the first page and next on the last', () => {
    const { fixture, el, host } = mount({ total: 30 });
    let [prev, next] = navButtons(el);
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    host.page.set(3);
    fixture.detectChanges();
    [prev, next] = navButtons(el);
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });

  it('steps with the prev/next controls', () => {
    const { fixture, el, host } = mount({ total: 30 });
    const [prev, next] = navButtons(el);

    next.click();
    fixture.detectChanges();
    expect(host.page()).toBe(2);

    prev.click();
    fixture.detectChanges();
    expect(host.page()).toBe(1);
  });

  it('jumps to a clicked page', () => {
    const { fixture, el, host } = mount({ total: 30 });
    const three = [...el.querySelectorAll<HTMLButtonElement>('.mk-pagination__btn')].find(
      (b) => b.textContent?.trim() === '3',
    )!;
    three.click();
    fixture.detectChanges();
    expect(host.page()).toBe(3);
  });

  it('collapses long ranges with ellipses around the current page', () => {
    const { fixture, el, host } = mount({ pageCount: 20, page: 10 });
    const rendered = cells(el);

    expect(rendered[0]).toBe('1');
    expect(rendered.at(-1)).toBe('20');
    expect(rendered).toContain('…');
    expect(rendered).toContain('10');
    // The window stays compact rather than listing all 20.
    expect(rendered.length).toBeLessThan(20);

    // Near the start there is no leading ellipsis.
    host.page.set(1);
    fixture.detectChanges();
    expect(cells(el)[1]).not.toBe('…');
  });

  it('clamps an out-of-range page onto a real one', () => {
    const { el } = mount({ total: 30, page: 99 });
    expect(el.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('3');
  });

  it('labels the nav landmark and every control', () => {
    const { el } = mount({ total: 30 });
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBeTruthy();
    const [prev, next] = navButtons(el);
    expect(prev.getAttribute('aria-label')).toBeTruthy();
    expect(next.getAttribute('aria-label')).toBeTruthy();
    expect(
      [...el.querySelectorAll('.mk-pagination__btn')].every((b) =>
        b.getAttribute('aria-label'),
      ),
    ).toBe(true);
  });
});
