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

  afterEach(() => TestBed.resetTestingModule());

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

  it('resolves an alias to the aliased icon', () => {
    const { fixture, el, host, registry } = mount();
    registry.registerAliases({ hamburger: 'menu' });
    host.name.set('hamburger');
    fixture.detectChanges();

    expect(el.querySelector('.mk-icon__svg')?.innerHTML).toContain('<svg');
  });
});
