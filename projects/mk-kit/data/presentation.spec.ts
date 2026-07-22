/**
 * Skeleton, timeline and avatar-group — the remaining presentational data
 * components. Skeletons and connectors are decorative by design, so the thing
 * worth pinning is that they stay out of the accessibility tree while the real
 * content (times, headings, overflow counts) stays in it.
 */
import { Component, provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MkSkeleton } from './skeleton/skeleton';
import { MkTimeline } from './timeline/timeline';
import { MkTimelineItem } from './timeline/timeline-item';
import { MkAvatar } from './avatar/avatar';
import { MkAvatarGroup } from './avatar/avatar-group';

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

describe('MkSkeleton', () => {
  it('is hidden from assistive tech', () => {
    const { el } = mount('<mk-skeleton />', [MkSkeleton]);
    // A placeholder must never be announced as content.
    expect(el.querySelector('mk-skeleton')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders one line by default and N lines on request', () => {
    const { el } = mount('<mk-skeleton />', [MkSkeleton]);
    expect(el.querySelectorAll('.mk-skeleton__line').length).toBe(1);

    TestBed.resetTestingModule();
    const many = mount('<mk-skeleton [lines]="3" />', [MkSkeleton]);
    expect(many.el.querySelectorAll('.mk-skeleton__line').length).toBe(3);
  });

  it('shortens only the last line of a multi-line block', () => {
    const { el } = mount('<mk-skeleton [lines]="3" />', [MkSkeleton]);
    const widths = [...el.querySelectorAll<HTMLElement>('.mk-skeleton__line')].map(
      (l) => l.style.width,
    );
    expect(widths).toEqual(['100%', '100%', '60%']);
  });

  it('keeps a single line full width', () => {
    const { el } = mount('<mk-skeleton [lines]="1" />', [MkSkeleton]);
    expect(el.querySelector<HTMLElement>('.mk-skeleton__line')!.style.width).toBe(
      '100%',
    );
  });

  it('coerces at least one line from a zero or negative count', () => {
    const { el } = mount('<mk-skeleton [lines]="0" />', [MkSkeleton]);
    expect(el.querySelectorAll('.mk-skeleton__line').length).toBe(1);
  });

  it('renders no lines for a non-text shape', () => {
    const { el } = mount('<mk-skeleton shape="circle" />', [MkSkeleton]);
    expect(el.querySelectorAll('.mk-skeleton__line').length).toBe(0);
  });
});

describe('MkTimeline', () => {
  const TEMPLATE = `
    <mk-timeline>
      <mk-timeline-item time="09:00" heading="Created" tone="success">
        Opened the ticket
      </mk-timeline-item>
      <mk-timeline-item heading="Closed">Done</mk-timeline-item>
    </mk-timeline>`;
  const IMPORTS = [MkTimeline, MkTimelineItem];

  it('builds a list of listitems', () => {
    const { el } = mount(TEMPLATE, IMPORTS);
    expect(el.querySelector('mk-timeline')?.getAttribute('role')).toBe('list');
    expect(el.querySelectorAll('[role=listitem]').length).toBe(2);
  });

  it('renders the time, heading and body', () => {
    const { el } = mount(TEMPLATE, IMPORTS);
    const first = el.querySelector('mk-timeline-item')!;
    expect(first.querySelector('.mk-timeline-item__time')?.textContent?.trim()).toBe(
      '09:00',
    );
    expect(first.textContent).toContain('Created');
    expect(first.textContent).toContain('Opened the ticket');
  });

  it('omits the time element when there is no time', () => {
    const { el } = mount(TEMPLATE, IMPORTS);
    const second = [...el.querySelectorAll('mk-timeline-item')][1];
    expect(second.querySelector('.mk-timeline-item__time')).toBeNull();
  });

  it('hides the connector rule from assistive tech', () => {
    const { el } = mount(TEMPLATE, IMPORTS);
    expect(
      [...el.querySelectorAll('.mk-timeline-item__connector')].every(
        (c) => c.getAttribute('aria-hidden') === 'true',
      ),
    ).toBe(true);
  });
});

describe('MkAvatarGroup', () => {
  const four = (max?: number) => `
    <mk-avatar-group ${max != null ? `[max]="${max}"` : ''}>
      <mk-avatar name="A A" />
      <mk-avatar name="B B" />
      <mk-avatar name="C C" />
      <mk-avatar name="D D" />
    </mk-avatar-group>`;
  const IMPORTS = [MkAvatarGroup, MkAvatar];

  it('is a group in the accessibility tree', () => {
    const { el } = mount(four(), IMPORTS);
    expect(el.querySelector('mk-avatar-group')?.getAttribute('role')).toBe('group');
  });

  it('shows every avatar and no overflow bubble without a max', () => {
    const { el } = mount(four(), IMPORTS);
    expect(el.querySelectorAll('mk-avatar').length).toBe(4);
    expect(el.querySelector('.mk-avatar-group__overflow')).toBeNull();
  });

  it('collapses the surplus into a labelled +N bubble', () => {
    const { el } = mount(four(2), IMPORTS);
    const overflow = el.querySelector('.mk-avatar-group__overflow')!;
    expect(overflow.textContent?.trim()).toBe('+2');
    expect(overflow.getAttribute('aria-label')).toBe('2 more');
  });

  it('hides exactly the avatars past the max', () => {
    const { el } = mount(four(2), IMPORTS);
    const hidden = [...el.querySelectorAll<HTMLElement>('mk-avatar')].map(
      (a) => a.style.display === 'none',
    );
    expect(hidden).toEqual([false, false, true, true]);
  });

  it('shows no bubble when the max is not exceeded', () => {
    const { el } = mount(four(4), IMPORTS);
    expect(el.querySelector('.mk-avatar-group__overflow')).toBeNull();
    expect(
      [...el.querySelectorAll<HTMLElement>('mk-avatar')].every(
        (a) => a.style.display !== 'none',
      ),
    ).toBe(true);
  });

  it('stacks the avatars in DOM order', () => {
    const { el } = mount(four(), IMPORTS);
    const items = [...el.querySelectorAll<HTMLElement>('mk-avatar')];
    // Earlier avatars sit on top; the first has no negative offset.
    // (The CSSOM normalises '0' to '0px', so compare numerically.)
    expect(parseFloat(items[0].style.marginInlineStart)).toBe(0);
    expect(items[1].style.marginInlineStart).toContain('calc(');
    expect(items.map((a) => Number(a.style.zIndex))).toEqual([4, 3, 2, 1]);
  });
});
