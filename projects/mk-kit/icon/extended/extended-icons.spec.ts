import { EnvironmentProviders, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MK_DEFAULT_ICONS, MkIconRegistry, provideMkIcons } from '@mk-kit/ui/icon';
import {
  MK_EXTENDED_ICON_GROUPS,
  MK_EXTENDED_ICONS,
  MK_EXTENDED_ICONS_FILES,
  MK_EXTENDED_ICONS_TIME,
} from './extended-icons';
import { provideMkExtendedIcons } from './provide-extended-icons';

describe('extended icons', () => {
  function setup(providers: EnvironmentProviders[] = []): MkIconRegistry {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ...providers],
    });
    return TestBed.inject(MkIconRegistry);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('is not registered without the provider', () => {
    const registry = setup();
    for (const name of ['ellipsis', 'layout-dashboard', 'file-spreadsheet', 'receipt', 'circle-help']) {
      expect(registry.has(name), name).toBe(false);
    }
  });

  it('provideMkExtendedIcons() registers the whole set on top of the defaults', () => {
    const registry = setup([provideMkExtendedIcons()]);
    for (const name of ['ellipsis', 'layout-dashboard', 'file-spreadsheet', 'receipt', 'circle-help']) {
      expect(registry.has(name), name).toBe(true);
    }
    expect(registry.has('trash')).toBe(true);
    expect(registry.names().length).toBe(
      Object.keys(MK_DEFAULT_ICONS).length + Object.keys(MK_EXTENDED_ICONS).length,
    );
    expect(Object.keys(MK_EXTENDED_ICONS).length).toBeGreaterThanOrEqual(300);
  });

  it('never shadows a default — the hand-made glyph keeps winning', () => {
    for (const name of Object.keys(MK_EXTENDED_ICONS)) {
      expect(MK_DEFAULT_ICONS[name], `"${name}" is both default and extended`).toBeUndefined();
    }
    const registry = setup([provideMkExtendedIcons()]);
    expect(registry.get('trash')).toBe(registry.get('trash'));
    expect(registry.get('search')).not.toBeNull();
  });

  it('themed subsets partition the full set', () => {
    const groups = Object.entries(MK_EXTENDED_ICON_GROUPS);
    expect(groups.length).toBeGreaterThanOrEqual(10);
    const seen = new Map<string, string>();
    for (const [group, icons] of groups) {
      expect(Object.keys(icons).length, group).toBeGreaterThan(0);
      for (const name of Object.keys(icons)) {
        expect(seen.get(name), `"${name}" is in both ${seen.get(name)} and ${group}`).toBeUndefined();
        seen.set(name, group);
        expect(MK_EXTENDED_ICONS[name]).toBe(icons[name]);
      }
    }
    expect(seen.size).toBe(Object.keys(MK_EXTENDED_ICONS).length);
    expect(MK_EXTENDED_ICON_GROUPS['files']).toBe(MK_EXTENDED_ICONS_FILES);
  });

  it('a subset registers only its own names', () => {
    const registry = setup([provideMkIcons(MK_EXTENDED_ICONS_FILES), provideMkIcons(MK_EXTENDED_ICONS_TIME)]);
    expect(registry.has('file-spreadsheet')).toBe(true);
    expect(registry.has('calendar-days')).toBe(true);
    expect(registry.has('ellipsis')).toBe(false);
    expect(registry.has('receipt')).toBe(false);
  });

  it('every extended glyph is a self-contained 24×24 stroke SVG', () => {
    for (const [name, svg] of Object.entries(MK_EXTENDED_ICONS)) {
      expect(svg, name).toMatch(/^<svg viewBox="0 0 24 24"[^>]*stroke="currentColor"/);
      expect(svg, name).toMatch(/<\/svg>$/);
    }
  });
});
