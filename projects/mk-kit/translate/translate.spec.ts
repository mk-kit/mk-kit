import { Component, PLATFORM_ID, signal, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  MkTranslate,
  MkTranslatePipe,
  mkFlattenTranslations,
  mkInterpolate,
  mkStaticTranslateLoader,
  mkUnflattenTranslations,
  provideMkTranslate,
} from './index';
import type { MkTranslateConfig, MkTranslationTree } from './translate.types';

const PL: MkTranslationTree = {
  menu: { title: 'Menu', items: '{{count}} pozycji' },
  cart: { total: 'Razem: {{amount}} zł', 'free-delivery': 'Darmowa dostawa' },
  guests: { one: '{{count}} osoba', few: '{{count}} osoby', many: '{{count}} osób', other: '{{count}} osoby' },
  onlyPl: 'tylko po polsku',
};
const EN: MkTranslationTree = {
  menu: { title: 'Menu', items: '{{count}} items' },
  cart: { total: 'Total: {{amount}} zł' },
  guests: { one: '{{count}} guest', other: '{{count}} guests' },
};

function setup(overrides: Partial<MkTranslateConfig> = {}, extraProviders: unknown[] = []) {
  TestBed.configureTestingModule({
    providers: [
      provideMkTranslate({
        lang: 'pl',
        fallbackLang: 'pl',
        loader: mkStaticTranslateLoader({ pl: PL, en: EN }),
        preload: false,
        ...overrides,
      }),
      ...(extraProviders as never[]),
    ],
  });
  return TestBed.inject(MkTranslate);
}

describe('mkFlattenTranslations / mkUnflattenTranslations / mkInterpolate', () => {
  it('flattens nested trees to dotted keys and back', () => {
    const flat = mkFlattenTranslations(PL);
    expect(flat['cart.total']).toBe('Razem: {{amount}} zł');
    expect(flat['cart.free-delivery']).toBe('Darmowa dostawa');
    expect(mkUnflattenTranslations({ 'a.b.c': 'x', 'a.d': 'y', e: 'z' })).toEqual({
      a: { b: { c: 'x' }, d: 'y' },
      e: 'z',
    });
  });

  it('interpolates {{name}} (with spaces, dotted paths) and leaves unknown names alone', () => {
    expect(mkInterpolate('Hi {{ name }}, {{user.city}} — {{missing}}', { name: 'Ala', user: { city: 'Wwa' } }))
      .toBe('Hi Ala, Wwa — {{missing}}');
    expect(mkInterpolate('{{n}}', { n: 0 })).toBe('0');
  });
});

describe('MkTranslate', () => {
  it('loads the initial language on use() and translates nested keys with params', async () => {
    const t = setup();
    expect(t.ready()).toBe(false);
    await t.use('pl');
    expect(t.ready()).toBe(true);
    expect(t.instant('menu.title')).toBe('Menu');
    expect(t.instant('cart.total', { amount: 12.5 })).toBe('Razem: 12.5 zł');
    expect(t.has('cart.free-delivery')).toBe(true);
  });

  it('falls back to fallbackLang per key and records what is missing everywhere', async () => {
    const onMissing = vi.fn();
    const t = setup({ onMissing });
    await t.use('en');
    expect(t.lang()).toBe('en');
    expect(t.instant('menu.items', { count: 3 })).toBe('3 items');
    // Present only in the fallback.
    expect(t.instant('onlyPl')).toBe('tylko po polsku');
    // Present nowhere: the key itself, reported once.
    expect(t.instant('nope.nothing')).toBe('nope.nothing');
    expect(t.instant('nope.nothing')).toBe('nope.nothing');
    expect(t.missingKeys()).toEqual(['nope.nothing']);
    expect(onMissing).toHaveBeenCalledWith('nope.nothing', 'en');
  });

  it('onMissing may supply a replacement string', async () => {
    const t = setup({ onMissing: (key) => `⟨${key}⟩` });
    await t.use('pl');
    expect(t.instant('x.y')).toBe('⟨x.y⟩');
  });

  it('picks CLDR plural forms and falls back to "other"', async () => {
    const t = setup();
    await t.use('pl');
    expect(t.plural('guests', 1)).toBe('1 osoba');
    expect(t.plural('guests', 3)).toBe('3 osoby');
    expect(t.plural('guests', 5)).toBe('5 osób');
    await t.use('en');
    expect(t.plural('guests', 1)).toBe('1 guest');
    expect(t.plural('guests', 5)).toBe('5 guests');
  });

  it('merges an overrides loader over the base and survives its failure', async () => {
    const t = setup({
      overrides: () => ({
        load: async (lang: string) => {
          if (lang === 'en') throw new Error('db down');
          return { menu: { title: 'Karta' }, extra: { key: 'z bazy' } };
        },
      }),
    });
    await t.use('pl');
    expect(t.instant('menu.title')).toBe('Karta');
    expect(t.instant('extra.key')).toBe('z bazy');
    expect(t.instant('cart.free-delivery')).toBe('Darmowa dostawa');
    await t.use('en');
    expect(t.instant('menu.title')).toBe('Menu');
  });

  it('patch() and set() change strings at runtime and bump readers', async () => {
    const t = setup();
    await t.use('pl');
    t.patch('pl', { menu: { title: 'Nowe menu' } });
    expect(t.instant('menu.title')).toBe('Nowe menu');
    expect(t.instant('cart.total', { amount: 1 })).toBe('Razem: 1 zł');
    t.set('pl', { 'menu.title': 'Tylko to' });
    expect(t.instant('cart.total')).toBe('cart.total');
    expect(t.loadedLangs()).toContain('pl');
  });

  it('loads each language once even when asked concurrently', async () => {
    const load = vi.fn(async (lang: string) => (lang === 'pl' ? PL : EN));
    const t = setup({ loader: () => ({ load }) });
    await Promise.all([t.use('pl'), t.load('pl'), t.use('pl')]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps the previous language when a load fails', async () => {
    const t = setup({
      loader: () => ({
        load: async (lang: string) => {
          if (lang === 'de') throw new Error('404');
          return PL;
        },
      }),
    });
    await t.use('pl');
    await expect(t.use('de')).rejects.toThrow('404');
    expect(t.lang()).toBe('pl');
    expect(t.instant('menu.title')).toBe('Menu');
  });

  it('serialises loaded strings on the server and reuses them in the browser', async () => {
    // Server: load → TransferState.
    const server = setup({}, [{ provide: PLATFORM_ID, useValue: 'server' }]);
    await server.use('pl');
    const state = TestBed.inject(TransferState);
    const key = makeStateKey<Record<string, string>>('mk-translate:pl');
    expect(state.hasKey(key)).toBe(true);
    const payload = state.toJson();
    TestBed.resetTestingModule();

    // Browser: seeded state → no loader call.
    const load = vi.fn(async () => PL);
    const browser = setup({ loader: () => ({ load }) }, [{ provide: PLATFORM_ID, useValue: 'browser' }]);
    const browserState = TestBed.inject(TransferState);
    browserState.onSerialize = undefined as never;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (browserState as any).store = JSON.parse(payload);
    await browser.use('pl');
    expect(load).not.toHaveBeenCalled();
    expect(browser.instant('menu.title')).toBe('Menu');
    expect(browserState.hasKey(key)).toBe(false);
  });
});

describe('translate pipe', () => {
  @Component({
    imports: [MkTranslatePipe],
    template: `<p>{{ 'menu.items' | translate: { count: count() } }}</p><span>{{ missing | translate }}</span>`,
  })
  class Host {
    count = signal(2);
    missing: string | null = null;
  }

  it('renders, follows params, and re-renders on a language switch', async () => {
    const t = setup();
    await t.use('pl');
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const text = () => (fixture.nativeElement as HTMLElement).querySelector('p')!.textContent;
    expect(text()).toBe('2 pozycji');
    expect((fixture.nativeElement as HTMLElement).querySelector('span')!.textContent).toBe('');

    fixture.componentInstance.count.set(5);
    await fixture.whenStable();
    expect(text()).toBe('5 pozycji');

    await t.use('en');
    await fixture.whenStable();
    expect(text()).toBe('5 items');
  });
});
