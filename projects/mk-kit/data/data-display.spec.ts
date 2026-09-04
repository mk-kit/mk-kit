/**
 * Presentational data-display components: avatar, badge, tag, divider, spinner
 * and stat-card. These render rather than interact, so the contract worth
 * pinning is what they put in the accessibility tree and what they choose to
 * show — not keyboard behaviour.
 */
import { Component, provideZonelessChangeDetection, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MkAvatar } from './avatar/avatar';
import { MkBadge } from '@mk-kit/ui/status';
import { MkTag } from './tag/tag';
import { MkDivider } from './divider/divider';
import { MkSpinner } from '@mk-kit/ui/status';
import { MkStatCard } from './stat-card/stat-card';

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

describe('MkAvatar', () => {
  @Component({
    imports: [MkAvatar],
    template: `<mk-avatar
      [src]="src()"
      [name]="name()"
      [alt]="alt()"
      [status]="status()"
    />`,
  })
  class Host {
    src = signal<string | undefined>(undefined);
    name = signal<string | undefined>(undefined);
    alt = signal<string | undefined>(undefined);
    status = signal<'online' | 'offline' | undefined>(undefined);
  }

  function avatar() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, host: fixture.componentInstance, root: el.querySelector('mk-avatar')! };
  }

  it('is an img in the accessibility tree', () => {
    const { root } = avatar();
    expect(root.getAttribute('role')).toBe('img');
  });

  it('falls back to "Avatar" with no name or alt', () => {
    const { root } = avatar();
    expect(root.getAttribute('aria-label')).toBe('Avatar');
  });

  it('derives two-letter initials from a full name', () => {
    const { fixture, el, host } = avatar();
    host.name.set('Ada Lovelace');
    fixture.detectChanges();
    expect(el.querySelector('.mk-avatar__initials')?.textContent?.trim()).toBe('AL');
  });

  it('takes the first two letters of a single-word name', () => {
    const { fixture, el, host } = avatar();
    host.name.set('prince');
    fixture.detectChanges();
    expect(el.querySelector('.mk-avatar__initials')?.textContent?.trim()).toBe('PR');
  });

  it('uses the first and last of a three-part name', () => {
    const { fixture, el, host } = avatar();
    host.name.set('Ada King Lovelace');
    fixture.detectChanges();
    expect(el.querySelector('.mk-avatar__initials')?.textContent?.trim()).toBe('AL');
  });

  it('labels itself from name, and prefers an explicit alt', () => {
    const { fixture, root, host } = avatar();
    host.name.set('Ada Lovelace');
    fixture.detectChanges();
    expect(root.getAttribute('aria-label')).toBe('Ada Lovelace');

    host.alt.set('Portrait of Ada');
    fixture.detectChanges();
    expect(root.getAttribute('aria-label')).toBe('Portrait of Ada');
  });

  it('folds the status into the label rather than leaving it visual-only', () => {
    const { fixture, el, root, host } = avatar();
    host.name.set('Ada');
    host.status.set('online');
    fixture.detectChanges();

    expect(root.getAttribute('aria-label')).toBe('Ada (online)');
    expect(root.getAttribute('data-status')).toBe('online');
    expect(el.querySelector('.mk-avatar__status')).toBeTruthy();
  });

  it('renders the image with an empty alt (the host carries the label)', () => {
    const { fixture, el, host } = avatar();
    host.src.set('/ada.png');
    host.name.set('Ada');
    fixture.detectChanges();

    const img = el.querySelector<HTMLImageElement>('.mk-avatar__img')!;
    expect(img).toBeTruthy();
    expect(img.getAttribute('alt')).toBe('');
    expect(el.querySelector('.mk-avatar__initials')).toBeNull();
  });

  it('falls back to initials when the image fails to load', () => {
    const { fixture, el, host } = avatar();
    host.src.set('/broken.png');
    host.name.set('Ada Lovelace');
    fixture.detectChanges();

    el.querySelector('.mk-avatar__img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(el.querySelector('.mk-avatar__img')).toBeNull();
    expect(el.querySelector('.mk-avatar__initials')?.textContent?.trim()).toBe('AL');
  });
});

describe('MkBadge', () => {
  it('renders its content and exposes the tone', () => {
    const { el } = mount('<mk-badge tone="danger">7</mk-badge>', [MkBadge]);
    const badge = el.querySelector('mk-badge')!;
    expect(badge.textContent?.trim()).toBe('7');
    expect(badge.getAttribute('data-tone')).toBe('danger');
  });

  it('suppresses content in dot mode', () => {
    const { el } = mount('<mk-badge dot>7</mk-badge>', [MkBadge]);
    // A dot is a pure indicator — the count must not leak into the a11y tree.
    expect(el.querySelector('mk-badge')!.textContent?.trim()).toBe('');
  });
});

describe('MkTag', () => {
  it('renders its content and exposes the tone', () => {
    const { el } = mount('<mk-tag tone="success">Draft</mk-tag>', [MkTag]);
    const tag = el.querySelector('mk-tag')!;
    expect(tag.textContent?.trim()).toBe('Draft');
    expect(tag.getAttribute('data-tone')).toBe('success');
  });
});

describe('MkDivider', () => {
  it('is a horizontal separator by default', () => {
    const { el } = mount('<mk-divider />', [MkDivider]);
    const d = el.querySelector('mk-divider')!;
    expect(d.getAttribute('role')).toBe('separator');
    expect(d.getAttribute('aria-orientation')).toBe('horizontal');
    expect(d.classList.contains('mk-divider--vertical')).toBe(false);
  });

  it('reports a vertical orientation to assistive tech', () => {
    const { el } = mount('<mk-divider orientation="vertical" />', [MkDivider]);
    const d = el.querySelector('mk-divider')!;
    expect(d.getAttribute('aria-orientation')).toBe('vertical');
    expect(d.classList.contains('mk-divider--vertical')).toBe(true);
  });
});

describe('MkSpinner', () => {
  it('is a status region with a visually-hidden label', () => {
    const { el } = mount('<mk-spinner />', [MkSpinner]);
    const s = el.querySelector('mk-spinner')!;
    expect(s.getAttribute('role')).toBe('status');
    expect(s.querySelector('.mk-spinner__sr')?.textContent?.trim()).toBeTruthy();
    // The animated ring itself is decorative.
    expect(s.querySelector('.mk-spinner__circle')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('takes a custom label', () => {
    const { el } = mount('<mk-spinner label="Saving" />', [MkSpinner]);
    expect(el.querySelector('.mk-spinner__sr')?.textContent?.trim()).toBe('Saving');
  });
});

describe('MkStatCard', () => {
  @Component({
    imports: [MkStatCard],
    template: `<mk-stat-card
      label="Revenue"
      [value]="value()"
      [delta]="delta()"
      [deltaTrend]="trend()"
    />`,
  })
  class Host {
    value = signal<string | number>('$1,204');
    delta = signal<string | number | undefined>(undefined);
    trend = signal<'up' | 'down' | 'neutral'>('neutral');
  }

  function card() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  it('renders the label and value', () => {
    const { el } = card();
    expect(el.querySelector('.mk-stat-card__label')?.textContent?.trim()).toBe('Revenue');
    expect(el.querySelector('.mk-stat-card__value')?.textContent?.trim()).toBe('$1,204');
  });

  it('hides the delta row when there is no delta', () => {
    const { el } = card();
    expect(el.querySelector('.mk-stat-card__delta')).toBeNull();
  });

  it('shows a zero delta rather than treating it as absent', () => {
    const { fixture, el, host } = card();
    host.delta.set(0);
    fixture.detectChanges();
    // 0 is a real measurement; only undefined/null/'' hide the row.
    expect(el.querySelector('.mk-stat-card__delta')).toBeTruthy();
    expect(el.querySelector('.mk-stat-card__delta-value')?.textContent?.trim()).toBe('0');
  });

  it('picks the arrow and the spoken phrase per trend', () => {
    const { fixture, el, host } = card();
    host.delta.set('+12%');

    for (const [trend, arrow, phrase] of [
      ['up', '↑', 'Trending up'],
      ['down', '↓', 'Trending down'],
      ['neutral', '→', 'No change'],
    ] as const) {
      host.trend.set(trend);
      fixture.detectChanges();

      expect(el.querySelector('.mk-stat-card__arrow')?.textContent?.trim(), trend).toBe(
        arrow,
      );
      // The arrow is decorative, so the trend must also be stated in text.
      expect(el.querySelector('.mk-stat-card__sr')?.textContent?.trim(), trend).toBe(
        phrase,
      );
      expect(el.querySelector('.mk-stat-card__delta')?.getAttribute('data-trend')).toBe(
        trend,
      );
    }
  });
});
