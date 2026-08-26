import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkCommand, MkCommandPalette } from './command-palette';

@Component({
  imports: [MkCommandPalette],
  template: `<mk-command-palette [(open)]="open" [commands]="commands" />`,
})
class Host {
  open = signal(true);
  commands: MkCommand[] = [
    { id: 'new', label: 'New file', group: 'Files' },
    { id: 'open', label: 'Open file', group: 'Files' },
    { id: 'theme', label: 'Toggle theme', group: 'View' },
    { id: 'signout', label: 'Sign out' },
  ];
}

describe('MkCommandPalette', () => {
  // jsdom has no scrollIntoView — install a spy so the palette's optional
  // chain has something to call. HTMLElement.prototype (not Element): a
  // closer prototype wins the lookup, so a leaked own-property there from
  // another spec file would silently shadow a spy on Element.prototype —
  // the order-dependent CI failure the diagnostic below exists to name.
  let scrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollSpy = vi.fn();
    (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView =
      scrollSpy;
  });

  afterEach(() => {
    delete (HTMLElement.prototype as { scrollIntoView?: unknown })
      .scrollIntoView;
    document.body.style.removeProperty('overflow');
    TestBed.resetTestingModule();
  });

  async function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    // The open/sync + scroll effects run in queueMicrotask.
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      input: el.querySelector<HTMLInputElement>('.mk-cmdk__input')!,
      i18n: TestBed.inject(MK_I18N),
    };
  }

  async function type(
    fixture: Awaited<ReturnType<typeof mount>>['fixture'],
    input: HTMLInputElement,
    text: string,
  ) {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('labels the dialog with i18n.commandPaletteLabel', async () => {
    const { el, i18n } = await mount();
    const dialog = el.querySelector('[role=dialog]')!;
    expect(dialog.getAttribute('aria-label')).toBe(i18n.commandPaletteLabel);
  });

  it('exposes each named section as role=group labelled by its heading', async () => {
    const { el } = await mount();
    const groups = [...el.querySelectorAll<HTMLElement>('[role=group]')];
    expect(groups.length).toBe(2);

    const names = groups.map((g) => {
      const labelId = g.getAttribute('aria-labelledby')!;
      expect(labelId).toBeTruthy();
      const heading = document.getElementById(labelId);
      expect(heading).toBeTruthy();
      return heading!.textContent!.trim();
    });
    expect(names).toEqual(['Files', 'View']);

    // Grouping did not eat any options; ungrouped commands stay direct
    // children of the listbox.
    expect(el.querySelectorAll('[role=option]').length).toBe(4);
    const listbox = el.querySelector('[role=listbox]')!;
    const direct = [...listbox.children].map((c) => c.getAttribute('role'));
    expect(direct).toContain('option');
  });

  it('announces the filtered result count via a status region', async () => {
    const { fixture, el, input, i18n } = await mount();
    const status = el.querySelector('.mk-cmdk__sr')!;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent!.trim()).toBe(i18n.resultsCount(4));

    await type(fixture, input, 'new');
    expect(status.textContent!.trim()).toBe(i18n.resultsCount(1));

    await type(fixture, input, 'zzz');
    expect(status.textContent!.trim()).toBe(i18n.resultsCount(0));
  });

  it('shows an empty state that is not hidden from assistive tech', async () => {
    const { fixture, el, input } = await mount();
    await type(fixture, input, 'zzz');
    const empty = el.querySelector('.mk-cmdk__empty')!;
    expect(empty).toBeTruthy();
    expect(empty.getAttribute('role')).toBeNull();
    expect(empty.textContent!.trim().length).toBeGreaterThan(0);
  });

  it('scrolls the active option into view when the active index changes', async () => {
    const { fixture, input } = await mount();
    scrollSpy.mockClear();

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    // Diagnostic breadcrumb: if the scroll assertion below ever fails in an
    // environment we can't attach to (CI), this names the broken link —
    // palette closed, index not moved, option not findable by id, or the spy
    // not visible on the element's prototype chain (realm mismatch).
    const cmp = fixture.debugElement.children[0].componentInstance as {
      open: () => boolean;
      activeIndex: () => number;
      optionId: (i: number) => string;
    };
    const idx = cmp.activeIndex();
    const opt = document.getElementById(cmp.optionId(idx));
    expect({
      open: cmp.open(),
      idx,
      optFound: !!opt,
      optSeesSpy:
        !!opt &&
        (opt as { scrollIntoView?: unknown }).scrollIntoView === scrollSpy,
    }).toEqual({ open: true, idx: 1, optFound: true, optSeesSpy: true });

    expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest' });
  });
});
