import { EnvironmentProviders, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MK_EXTENDED_ICONS, MK_EXTENDED_ICONS_NAVIGATION } from '@mk-kit/ui/icon/extended';
import { MkIconMap, MkIconRegistry } from './icon-registry';
import { MK_DEFAULT_ICONS } from './default-icons';
import { MK_MATERIAL_ICON_ALIASES } from './material-aliases';
import { provideMkIcons } from './provide-icons';

/** Glyphs the library's own components render — promoted from Lucide into the default set. */
const LIBRARY_GLYPHS = ['circle-alert', 'file', 'layers', 'loader', 'message-circle', 'paperclip', 'refresh-cw'];

describe('MkIconRegistry', () => {
  function setup(providers: EnvironmentProviders[] = []): MkIconRegistry {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ...providers],
    });
    return TestBed.inject(MkIconRegistry);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('registers the default set on construction — and nothing else', () => {
    const registry = setup();
    expect(registry.has('trash')).toBe(true);
    expect(registry.has('shopping-cart')).toBe(true);
    expect(registry.get('utensils')).not.toBeNull();
    expect(registry.get('nope')).toBeNull();
    // The extended set is opt-in.
    expect(registry.has('layout-dashboard')).toBe(false);
    expect(registry.has('ellipsis')).toBe(false);
    expect(registry.names().length).toBe(Object.keys(MK_DEFAULT_ICONS).length);
  });

  it('ships the Lucide glyphs that library components render in the default set', () => {
    const registry = setup();
    for (const name of LIBRARY_GLYPHS) {
      expect(registry.has(name), name).toBe(true);
      expect(MK_DEFAULT_ICONS[name], name).toBeDefined();
      expect(MK_EXTENDED_ICONS[name], `${name} must not also be in the extended set`).toBeUndefined();
    }
  });

  it('every default glyph is a self-contained 24×24 stroke SVG', () => {
    const names = Object.keys(MK_DEFAULT_ICONS);
    expect(names.length).toBeGreaterThanOrEqual(114 + LIBRARY_GLYPHS.length);
    for (const [name, svg] of Object.entries(MK_DEFAULT_ICONS)) {
      expect(svg, name).toMatch(/^<svg viewBox="0 0 24 24"[^>]*stroke="currentColor"/);
      expect(svg, name).toMatch(/<\/svg>$/);
    }
  });

  it('resolves aliases to registered icons', () => {
    const registry = setup();
    registry.registerAliases({ delete: 'trash', expand_more: 'chevron-down' });
    expect(registry.has('delete')).toBe(true);
    expect(registry.get('delete')).toBe(registry.get('trash'));
    expect(registry.get('expand_more')).toBe(registry.get('chevron-down'));
  });

  it('a real icon registered under an alias name wins over the alias', () => {
    const registry = setup();
    registry.registerAliases({ delete: 'trash' });
    registry.register('delete', '<svg viewBox="0 0 24 24"><rect/></svg>');
    expect(registry.get('delete')).not.toBe(registry.get('trash'));
  });

  it('every Material alias points at a default icon, so aliases work without the extended set', () => {
    for (const [alias, target] of Object.entries(MK_MATERIAL_ICON_ALIASES)) {
      expect(
        MK_DEFAULT_ICONS[target],
        `alias "${alias}" → missing default icon "${target}"`,
      ).toBeDefined();
    }
  });

  it('the Material aliases resolve once registered', () => {
    const registry = setup();
    registry.registerAliases(MK_MATERIAL_ICON_ALIASES);
    expect(registry.get('delete')).not.toBeNull();
    expect(registry.get('visibility_off')).not.toBeNull();
    expect(registry.get('qr_code_scanner')).not.toBeNull();
    expect(registry.get('restaurant')).not.toBeNull();
  });

  it('an alias onto an extended name degrades to nothing until the set is provided', () => {
    const registry = setup();
    registry.registerAliases({ space_dashboard: 'layout-dashboard' });
    expect(registry.has('space_dashboard')).toBe(false);
    expect(registry.get('space_dashboard')).toBeNull();

    registry.registerIcons({ 'layout-dashboard': MK_EXTENDED_ICONS['layout-dashboard'] });
    expect(registry.has('space_dashboard')).toBe(true);
    expect(registry.get('space_dashboard')).toBe(registry.get('layout-dashboard'));
  });

  it('provideMkIcons(map) registers a partial map at bootstrap', () => {
    const registry = setup([
      provideMkIcons({ 'bar-chart': MK_EXTENDED_ICONS['chart-column'] }),
      provideMkIcons({ logo: '<svg viewBox="0 0 24 24"><circle r="9"/></svg>' }),
    ]);
    expect(registry.has('bar-chart')).toBe(true);
    expect(registry.has('logo')).toBe(true);
    expect(registry.has('chart-column')).toBe(false);
    // Defaults are untouched.
    expect(registry.has('trash')).toBe(true);
  });

  it('provideMkIcons(loader) loads lazily, reports pending and bumps changes', async () => {
    let resolve!: (icons: MkIconMap) => void;
    const chunk = new Promise<MkIconMap>((r) => (resolve = r));
    const loader = vi.fn(() => chunk);
    const registry = setup([provideMkIcons(loader)]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(registry.pending()).toBe(true);
    expect(registry.has('ellipsis')).toBe(false);
    const before = registry.changes();

    resolve(MK_EXTENDED_ICONS_NAVIGATION);
    await chunk;
    await new Promise((r) => setTimeout(r));

    expect(registry.pending()).toBe(false);
    expect(registry.has('ellipsis')).toBe(true);
    expect(registry.has('chevrons-left')).toBe(true);
    expect(registry.has('file-spreadsheet')).toBe(false);
    expect(registry.changes()).toBeGreaterThan(before);
  });

  it('registering bumps `changes` so late icons can re-render', () => {
    const registry = setup();
    const v0 = registry.changes();
    registry.register('logo', '<svg viewBox="0 0 24 24"/>');
    const v1 = registry.changes();
    registry.registerAliases({ brand: 'logo' });
    expect(v1).toBeGreaterThan(v0);
    expect(registry.changes()).toBeGreaterThan(v1);
  });

  it('warns once per unknown name in dev mode, pointing at provideMkExtendedIcons()', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registry = setup();

    registry.warnMissing('layout-dashboard');
    registry.warnMissing('layout-dashboard');
    registry.warnMissing('layout-dashboard');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"layout-dashboard"');
    expect(warn.mock.calls[0][0]).toContain('provideMkExtendedIcons()');
    expect(warn.mock.calls[0][0]).toContain('@mk-kit/ui/icon/extended');

    registry.warnMissing('receipt');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('names the missing target when an alias is what failed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registry = setup();
    registry.registerAliases({ space_dashboard: 'layout-dashboard' });
    registry.warnMissing('space_dashboard');
    expect(warn.mock.calls[0][0]).toContain('alias of "layout-dashboard"');
  });

  it('stays quiet while a lazy load is pending', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let resolve!: (icons: MkIconMap) => void;
    const chunk = new Promise<MkIconMap>((r) => (resolve = r));
    const registry = setup([provideMkIcons(() => chunk)]);

    registry.warnMissing('ellipsis');
    expect(warn).not.toHaveBeenCalled();

    resolve({});
    await chunk;
    await new Promise((r) => setTimeout(r));
    registry.warnMissing('ellipsis');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
