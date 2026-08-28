import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkIcon } from './icon';
import { MkIconRegistry } from './icon-registry';

@Component({
  imports: [MkIcon],
  template: `<mk-icon [name]="name()" [size]="size()" [label]="label()">
    <span class="fallback">fallback</span>
  </mk-icon>`,
})
class Host {
  name = signal('menu');
  size = signal<'sm' | 'md' | 'lg' | number>('md');
  label = signal('');
}

describe('MkIcon', () => {
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
      icon: el.querySelector<HTMLElement>('mk-icon')!,
      host: fixture.componentInstance,
      registry: TestBed.inject(MkIconRegistry),
    };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('is decorative by default — hidden from assistive tech', () => {
    const { icon } = mount();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.getAttribute('role')).toBeNull();
    expect(icon.getAttribute('aria-label')).toBeNull();
  });

  it('becomes a labelled image once given a label', () => {
    const { fixture, icon, host } = mount();
    host.label.set('Open menu');
    fixture.detectChanges();

    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('Open menu');
    // A named icon must not also be hidden.
    expect(icon.getAttribute('aria-hidden')).toBeNull();
  });

  it('renders the registered SVG for a known name', () => {
    const { el } = mount();
    const svg = el.querySelector('.mk-icon__svg');
    expect(svg).toBeTruthy();
    expect(svg!.innerHTML).toContain('<svg');
  });

  it('falls back to projected content for an unknown name', () => {
    const { fixture, el, host } = mount();
    host.name.set('definitely-not-an-icon');
    fixture.detectChanges();

    expect(el.querySelector('.mk-icon__svg')).toBeNull();
    expect(el.querySelector('.fallback')).toBeTruthy();
  });

  it('falls back to projected content when no name is given', () => {
    const { fixture, el, host } = mount();
    host.name.set('');
    fixture.detectChanges();
    expect(el.querySelector('.fallback')).toBeTruthy();
  });

  it('maps the size scale to a CSS length', () => {
    const { fixture, icon, host } = mount();
    expect(icon.style.width).toBe('1.25rem');

    host.size.set('sm');
    fixture.detectChanges();
    expect(icon.style.width).toBe('1rem');

    host.size.set('lg');
    fixture.detectChanges();
    expect(icon.style.width).toBe('1.5rem');
  });

  it('accepts a numeric size as pixels, squarely', () => {
    const { fixture, icon, host } = mount();
    host.size.set(40);
    fixture.detectChanges();

    expect(icon.style.width).toBe('40px');
    expect(icon.style.height).toBe('40px');
    // font-size follows so `em`-based glyphs scale with the box.
    expect(icon.style.fontSize).toBe('40px');
  });

  it('picks up an icon registered at runtime', () => {
    const { fixture, el, host, registry } = mount();
    registry.register('logo', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>');
    host.name.set('logo');
    fixture.detectChanges();

    expect(el.querySelector('.mk-icon__svg')?.innerHTML).toContain('<circle');
  });

  it('fills in when the icon is registered after first render', () => {
    const { fixture, el, host, registry } = mount();
    host.name.set('late');
    fixture.detectChanges();
    expect(el.querySelector('.mk-icon__svg')).toBeNull();

    registry.register('late', '<svg viewBox="0 0 24 24"><rect width="4" height="4"/></svg>');
    fixture.detectChanges();
    expect(el.querySelector('.mk-icon__svg')?.innerHTML).toContain('<rect');
  });

  it('warns once per unknown name in dev mode and hints at the extended set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fixture, host } = mount();
    host.name.set('layout-dashboard');
    fixture.detectChanges();
    host.size.set('lg');
    fixture.detectChanges();
    host.name.set('receipt');
    fixture.detectChanges();
    host.name.set('layout-dashboard');
    fixture.detectChanges();

    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.filter((m) => m.includes('"layout-dashboard"'))).toHaveLength(1);
    expect(messages.filter((m) => m.includes('"receipt"'))).toHaveLength(1);
    expect(messages[0]).toContain('provideMkExtendedIcons()');
  });

  it('does not warn for a registered name or an empty one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fixture, host } = mount();
    host.name.set('');
    fixture.detectChanges();
    host.name.set('trash');
    fixture.detectChanges();
    expect(warn).not.toHaveBeenCalled();
  });

  it('resolves an alias to the aliased icon', () => {
    const { fixture, el, host, registry } = mount();
    registry.registerAliases({ hamburger: 'menu' });
    host.name.set('hamburger');
    fixture.detectChanges();

    expect(el.querySelector('.mk-icon__svg')?.innerHTML).toContain('<svg');
  });
});
