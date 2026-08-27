/**
 * Structural/navigational chrome: list, breadcrumb, toolbar and page-header.
 * These are mostly landmark and semantics contracts — the thing that silently
 * regresses is the accessibility tree, not the pixels.
 */
import { Component, provideZonelessChangeDetection, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MkList } from '../data/list/list';
import { MkListItem } from '../data/list/list-item';
import { MkBreadcrumb } from './breadcrumb/breadcrumb';
import { MkBreadcrumbItem } from './breadcrumb/breadcrumb-item';
import { MkToolbar } from './toolbar/toolbar';
import { MkPageHeader } from './page-header/page-header';

function mount(template: string, imports: Type<unknown>[]) {
  @Component({ template: '' })
  class Shell {}

  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  TestBed.overrideComponent(Shell, { set: { imports, template } });
  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

afterEach(() => TestBed.resetTestingModule());

describe('MkList', () => {
  @Component({
    imports: [MkList, MkListItem],
    template: `<mk-list>
      <mk-list-item>Plain</mk-list-item>
      <mk-list-item
        [interactive]="true"
        [selected]="selected()"
        [disabled]="disabled()"
        (activated)="hits = hits + 1"
        >Interactive</mk-list-item
      >
    </mk-list>`,
  })
  class Host {
    selected = signal(false);
    disabled = signal(false);
    hits = 0;
  }

  function list() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      items: [...el.querySelectorAll<HTMLElement>('[role=listitem]')],
      host: fixture.componentInstance,
    };
  }

  const press = (
    fixture: ReturnType<typeof list>['fixture'],
    el: HTMLElement,
    key: string,
  ) => {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  };

  it('builds a list/listitem structure', () => {
    const { el, items } = list();
    expect(el.querySelector('mk-list')?.getAttribute('role')).toBe('list');
    expect(items.length).toBe(2);
  });

  it('leaves a plain row out of the tab order and unselectable', () => {
    const { items } = list();
    expect(items[0].getAttribute('tabindex')).toBeNull();
    expect(items[0].getAttribute('aria-current')).toBeNull();
  });

  it('makes an interactive row focusable and selectable', () => {
    const { fixture, items, host } = list();
    expect(items[1].getAttribute('tabindex')).toBe('0');
    expect(items[1].getAttribute('aria-current')).toBeNull();

    host.selected.set(true);
    fixture.detectChanges();
    expect(items[1].getAttribute('aria-current')).toBe('true');
  });

  it('activates an interactive row on click and Enter/Space', () => {
    const { fixture, items, host } = list();
    items[1].click();
    fixture.detectChanges();
    expect(host.hits).toBe(1);

    expect(press(fixture, items[1], 'Enter').defaultPrevented).toBe(true);
    press(fixture, items[1], ' ');
    expect(host.hits).toBe(3);
  });

  it('ignores activation on a plain row', () => {
    const { fixture, items, host } = list();
    items[0].click();
    press(fixture, items[0], 'Enter');
    expect(host.hits).toBe(0);
  });

  it('ignores a disabled row and drops it from the tab order', () => {
    const { fixture, items, host } = list();
    host.disabled.set(true);
    fixture.detectChanges();

    expect(items[1].getAttribute('aria-disabled')).toBe('true');
    expect(items[1].getAttribute('tabindex')).toBeNull();

    items[1].click();
    press(fixture, items[1], 'Enter');
    expect(host.hits).toBe(0);
  });
});

describe('MkBreadcrumb', () => {
  const TEMPLATE = `
    <mk-breadcrumb>
      <mk-breadcrumb-item href="/">Home</mk-breadcrumb-item>
      <mk-breadcrumb-item href="/docs">Docs</mk-breadcrumb-item>
      <mk-breadcrumb-item>Forms</mk-breadcrumb-item>
    </mk-breadcrumb>`;
  const IMPORTS = [MkBreadcrumb, MkBreadcrumbItem];

  it('is a labelled nav landmark wrapping an ordered list', () => {
    const { el } = mount(TEMPLATE, IMPORTS);
    const nav = el.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBeTruthy();
    expect(nav.querySelector('ol')?.getAttribute('role')).toBe('list');
    expect(el.querySelectorAll('[role=listitem]').length).toBe(3);
  });

  it('renders every crumb but the last as a link', () => {
    const { el } = mount(TEMPLATE, IMPORTS);
    const links = [...el.querySelectorAll<HTMLAnchorElement>('a')];
    expect(links.map((a) => a.textContent!.trim())).toEqual(['Home', 'Docs']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/docs']);
  });

  it('marks the final crumb as the current page rather than a link', () => {
    const { el } = mount(TEMPLATE, IMPORTS);
    const current = el.querySelector('[aria-current="page"]')!;
    expect(current.textContent?.trim()).toBe('Forms');
    expect(el.querySelectorAll('[aria-current="page"]').length).toBe(1);
  });

  it('does not linkify a trailing crumb even when it has an href', () => {
    const { el } = mount(
      `<mk-breadcrumb>
         <mk-breadcrumb-item href="/">Home</mk-breadcrumb-item>
         <mk-breadcrumb-item href="/here">Here</mk-breadcrumb-item>
       </mk-breadcrumb>`,
      IMPORTS,
    );
    // The current page should not be a link to itself.
    expect([...el.querySelectorAll('a')].map((a) => a.textContent!.trim())).toEqual([
      'Home',
    ]);
    expect(el.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Here');
  });
});

describe('MkToolbar', () => {
  it('stays out of the a11y tree when unlabelled', () => {
    const { el } = mount('<mk-toolbar>content</mk-toolbar>', [MkToolbar]);
    const bar = el.querySelector('mk-toolbar')!;
    // An unnamed group adds nothing for a screen-reader user.
    expect(bar.getAttribute('role')).toBeNull();
    expect(bar.getAttribute('aria-label')).toBeNull();
  });

  it('becomes a labelled group once named', () => {
    const { el } = mount('<mk-toolbar aria-label="Table actions">x</mk-toolbar>', [
      MkToolbar,
    ]);
    const bar = el.querySelector('mk-toolbar')!;
    expect(bar.getAttribute('role')).toBe('group');
    expect(bar.getAttribute('aria-label')).toBe('Table actions');
  });

  it('projects into the start and end slots', () => {
    const { el } = mount(
      '<mk-toolbar>Start<span mkToolbarEnd>End</span></mk-toolbar>',
      [MkToolbar],
    );
    expect(el.querySelector('.mk-toolbar__start')?.textContent).toContain('Start');
    expect(el.querySelector('.mk-toolbar__end')?.textContent).toContain('End');
  });
});

describe('MkPageHeader', () => {
  it('renders the heading and description', () => {
    const { el } = mount(
      '<mk-page-header heading="Forms" description="Inputs and fields" />',
      [MkPageHeader],
    );
    expect(el.textContent).toContain('Forms');
    expect(el.textContent).toContain('Inputs and fields');
  });

  it('renders a real heading element for the document outline', () => {
    const { el } = mount('<mk-page-header heading="Forms" />', [MkPageHeader]);
    const heading = el.querySelector('h1, h2, h3');
    expect(heading).toBeTruthy();
    expect(heading!.textContent).toContain('Forms');
  });
});
