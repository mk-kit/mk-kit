import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkChip } from './chip';

@Component({
  imports: [MkChip],
  template: `<mk-chip
    [selectable]="selectable()"
    [removable]="removable()"
    [disabled]="disabled()"
    [(selected)]="selected"
    (removed)="removedCount = removedCount + 1"
    >Angular</mk-chip
  >`,
})
class Host {
  selectable = signal(false);
  removable = signal(false);
  disabled = signal(false);
  selected = signal(false);
  removedCount = 0;
}

@Component({
  imports: [MkChip],
  template: `<mk-chip removable removeLabel="Dismiss tag">Angular</mk-chip>`,
})
class ExplicitLabelHost {}

describe('MkChip', () => {
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
      chip: el.querySelector<HTMLElement>('mk-chip')!,
      host: fixture.componentInstance,
    };
  }

  function press(
    fixture: ReturnType<typeof mount>['fixture'],
    el: HTMLElement,
    key: string,
  ) {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('is inert markup by default — no role, no tab stop', () => {
    const { chip } = mount();
    expect(chip.textContent).toContain('Angular');
    expect(chip.getAttribute('role')).toBeNull();
    expect(chip.getAttribute('tabindex')).toBeNull();
    expect(chip.getAttribute('aria-pressed')).toBeNull();
  });

  it('becomes a toggle button when selectable', () => {
    const { fixture, chip, host } = mount();
    host.selectable.set(true);
    fixture.detectChanges();

    expect(chip.getAttribute('role')).toBe('button');
    expect(chip.getAttribute('tabindex')).toBe('0');
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggles selection on click and on Enter/Space', () => {
    const { fixture, chip, host } = mount();
    host.selectable.set(true);
    fixture.detectChanges();

    chip.click();
    fixture.detectChanges();
    expect(host.selected()).toBe(true);
    expect(chip.getAttribute('aria-pressed')).toBe('true');

    expect(press(fixture, chip, 'Enter').defaultPrevented).toBe(true);
    expect(host.selected()).toBe(false);

    press(fixture, chip, ' ');
    expect(host.selected()).toBe(true);
  });

  it('does not toggle when it is not selectable', () => {
    const { fixture, chip, host } = mount();
    chip.click();
    press(fixture, chip, 'Enter');
    expect(host.selected()).toBe(false);
  });

  it('renders a labelled remove button that emits removed', () => {
    const { fixture, el, host } = mount();
    host.removable.set(true);
    fixture.detectChanges();

    const remove = el.querySelector<HTMLButtonElement>('.mk-chip__remove')!;
    expect(remove.getAttribute('aria-labelledby')).toBeTruthy();

    remove.click();
    fixture.detectChanges();
    expect(host.removedCount).toBe(1);
  });

  it("names the remove button after the chip's text by default", () => {
    const { fixture, el, host } = mount();
    host.removable.set(true);
    fixture.detectChanges();

    const remove = el.querySelector<HTMLButtonElement>('.mk-chip__remove')!;
    // aria-labelledby beats aria-label in the accname algorithm, so the
    // default must not also set aria-label.
    expect(remove.getAttribute('aria-label')).toBeNull();

    const name = remove
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .join(' ');
    expect(name).toBe('Remove Angular');
  });

  it('lets an explicit removeLabel win over the composed default', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ExplicitLabelHost);
    fixture.detectChanges();

    const remove = (fixture.nativeElement as HTMLElement).querySelector(
      '.mk-chip__remove',
    )!;
    expect(remove.getAttribute('aria-label')).toBe('Dismiss tag');
    expect(remove.getAttribute('aria-labelledby')).toBeNull();
  });

  it('is focusable when removable but not selectable', () => {
    const { fixture, chip, host } = mount();
    host.removable.set(true);
    fixture.detectChanges();

    expect(chip.getAttribute('tabindex')).toBe('0');
    // Removal keys are advertised, so the host must be reachable — but it is
    // still not a toggle button.
    expect(chip.getAttribute('role')).toBeNull();

    host.disabled.set(true);
    fixture.detectChanges();
    expect(chip.getAttribute('tabindex')).toBeNull();
  });

  it('removes on Delete and Backspace', () => {
    const { fixture, chip, host } = mount();
    host.removable.set(true);
    fixture.detectChanges();

    expect(press(fixture, chip, 'Delete').defaultPrevented).toBe(true);
    press(fixture, chip, 'Backspace');
    expect(host.removedCount).toBe(2);
  });

  it('does not let the remove click also toggle selection', () => {
    const { fixture, el, chip, host } = mount();
    host.removable.set(true);
    host.selectable.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.mk-chip__remove')!.click();
    fixture.detectChanges();

    expect(host.removedCount).toBe(1);
    // stopPropagation keeps the host click handler from firing.
    expect(host.selected()).toBe(false);
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('ignores every interaction while disabled', () => {
    const { fixture, el, chip, host } = mount();
    host.selectable.set(true);
    host.removable.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    expect(chip.getAttribute('aria-disabled')).toBe('true');
    expect(chip.getAttribute('tabindex')).toBeNull();

    chip.click();
    press(fixture, chip, 'Enter');
    press(fixture, chip, 'Delete');
    el.querySelector<HTMLButtonElement>('.mk-chip__remove')!.click();
    fixture.detectChanges();

    expect(host.selected()).toBe(false);
    expect(host.removedCount).toBe(0);
  });
});
