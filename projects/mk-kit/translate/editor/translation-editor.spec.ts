import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { MkTranslationEditor, type MkTranslationChange } from './translation-editor';

@Component({
  imports: [MkTranslationEditor],
  template: `
    <mk-translation-editor
      [locales]="['pl', 'en']"
      [base]="base"
      [overrides]="overrides()"
      [readonly]="readonly()"
      (changed)="changes.push($event)"
    />
  `,
})
class Host {
  base = {
    pl: { 'menu.title': 'Menu', 'cart.total': 'Razem', onlyPl: 'tylko pl' },
    en: { 'menu.title': 'Menu', 'cart.total': 'Total' },
  };
  overrides = signal<Record<string, Record<string, string>>>({ en: { 'cart.total': 'Sum' } });
  readonly = signal(false);
  changes: MkTranslationChange[] = [];
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const editor = fixture.debugElement.children[0].componentInstance as MkTranslationEditor;
  return { fixture, el, editor, host: fixture.componentInstance };
}

// The protected API is exercised through `any` — the template is what
// wires it, and the rendered table is virtualised (jsdom has no layout).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = (e: MkTranslationEditor) => e as any;

describe('MkTranslationEditor', () => {
  it('lists every key of every locale, shows the effective text and counts', () => {
    const { editor } = setup();
    expect(api(editor).keys()).toEqual(['cart.total', 'menu.title', 'onlyPl']);
    const rows = api(editor).rows();
    expect(rows.find((r: { key: string }) => r.key === 'cart.total')).toEqual({ key: 'cart.total', pl: 'Razem', en: 'Sum' });
    expect(rows.find((r: { key: string }) => r.key === 'onlyPl')).toEqual({ key: 'onlyPl', pl: 'tylko pl', en: '' });
    expect(api(editor).stats()).toEqual([
      { locale: 'pl', missing: 0, overridden: 0 },
      { locale: 'en', missing: 1, overridden: 1 },
    ]);
  });

  it('filters by text, by "edited" and by "missing in <locale>"', () => {
    const { editor } = setup();
    api(editor).query.set('raz');
    expect(api(editor).rows().map((r: { key: string }) => r.key)).toEqual(['cart.total']);
    api(editor).query.set('');
    api(editor).setFilter('overridden');
    expect(api(editor).rows().map((r: { key: string }) => r.key)).toEqual(['cart.total']);
    api(editor).setFilter('missing:en');
    expect(api(editor).rows().map((r: { key: string }) => r.key)).toEqual(['onlyPl']);
    // Clicking the active chip again goes back to all.
    api(editor).setFilter('missing:en');
    expect(api(editor).filter()).toBe('all');
  });

  it('emits an override on edit, a restore when the file text is typed back, nothing on no-ops', () => {
    const { editor, host } = setup();
    api(editor).onSaved('pl', 'menu.title', ' Karta ');
    expect(host.changes.at(-1)).toEqual({ locale: 'pl', key: 'menu.title', value: 'Karta', previous: 'Menu' });
    api(editor).onSaved('en', 'cart.total', 'Total');
    expect(host.changes.at(-1)).toEqual({ locale: 'en', key: 'cart.total', value: null, previous: 'Sum' });
    const n = host.changes.length;
    api(editor).onSaved('en', 'cart.total', 'Sum');
    api(editor).onSaved('pl', 'cart.total', 'Razem');
    expect(host.changes.length).toBe(n);
    api(editor).reset('en', 'cart.total');
    expect(host.changes.at(-1)).toEqual({ locale: 'en', key: 'cart.total', value: null, previous: 'Sum' });
  });

  it('fills a missing cell as a new override', () => {
    const { editor, host } = setup();
    api(editor).onSaved('en', 'onlyPl', 'only pl');
    expect(host.changes.at(-1)).toEqual({ locale: 'en', key: 'onlyPl', value: 'only pl', previous: null });
  });

  it('is inert when readonly', () => {
    const { editor, host, fixture } = setup();
    host.readonly.set(true);
    fixture.detectChanges();
    api(editor).onSaved('pl', 'menu.title', 'X');
    api(editor).reset('en', 'cart.total');
    expect(host.changes).toEqual([]);
  });

  it('renders the toolbar with the chips and the count', () => {
    const { el } = setup();
    const text = el.querySelector('.mk-translation-editor__toolbar')!.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('All · 3');
    expect(text).toContain('Edited · 1');
    expect(text).toContain('Missing EN · 1');
    expect(text).toContain('3 keys');
  });
});
