import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkIconRegistry } from './icon-registry';
import { MK_DEFAULT_ICONS } from './default-icons';
import { MK_MATERIAL_ICON_ALIASES } from './material-aliases';

describe('MkIconRegistry', () => {
  let registry: MkIconRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    registry = TestBed.inject(MkIconRegistry);
  });

  it('registers the built-in set on construction', () => {
    expect(registry.has('trash')).toBe(true);
    expect(registry.has('shopping-cart')).toBe(true);
    expect(registry.get('utensils')).not.toBeNull();
    expect(registry.get('nope')).toBeNull();
  });

  it('resolves aliases to registered icons', () => {
    registry.registerAliases({ delete: 'trash', expand_more: 'chevron-down' });
    expect(registry.has('delete')).toBe(true);
    expect(registry.get('delete')).toBe(registry.get('trash'));
    expect(registry.get('expand_more')).toBe(registry.get('chevron-down'));
  });

  it('a real icon registered under an alias name wins over the alias', () => {
    registry.registerAliases({ delete: 'trash' });
    registry.register('delete', '<svg viewBox="0 0 24 24"><rect/></svg>');
    expect(registry.get('delete')).not.toBe(registry.get('trash'));
  });

  it('every Material alias points at an existing built-in icon', () => {
    for (const [alias, target] of Object.entries(MK_MATERIAL_ICON_ALIASES)) {
      expect(
        MK_DEFAULT_ICONS[target],
        `alias "${alias}" → missing icon "${target}"`,
      ).toBeDefined();
    }
  });

  it('the Material aliases resolve once registered', () => {
    registry.registerAliases(MK_MATERIAL_ICON_ALIASES);
    expect(registry.get('delete')).not.toBeNull();
    expect(registry.get('visibility_off')).not.toBeNull();
    expect(registry.get('qr_code_scanner')).not.toBeNull();
    expect(registry.get('restaurant')).not.toBeNull();
  });
});
