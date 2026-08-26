import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MK_DEFAULT_I18N, MkLiveAnnouncer } from '@mk-kit/ui/core';
import { MkMultiSelect, MkMultiSelectOption } from './multi-select';

const OPTIONS: MkMultiSelectOption[] = [
  { label: 'Angular', value: 'ng' },
  { label: 'React', value: 'react' },
  { label: 'Svelte', value: 'svelte', disabled: true },
];

describe('MkMultiSelect', () => {
  let fixture: ComponentFixture<MkMultiSelect>;
  let ms: MkMultiSelect;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkMultiSelect);
    ms = fixture.componentInstance;
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    // MkMultiSelect announces via MkLiveAnnouncer, which appends a body-level
    // region; remove it so it can't pollute other specs sharing this jsdom.
    document.querySelectorAll('.mk-visually-hidden').forEach((el) => el.remove());
  });

  it('adds an option to the value and emits the change', () => {
    const onChange = vi.fn();
    ms.registerOnChange(onChange);
    (ms as any).toggleOption(0);
    expect(ms.value()).toEqual(['ng']);
    expect(onChange).toHaveBeenCalledWith(['ng']);
  });

  it('toggling a selected option removes it', () => {
    (ms as any).toggleOption(0);
    (ms as any).toggleOption(1);
    expect(ms.value()).toEqual(['ng', 'react']);
    (ms as any).toggleOption(0);
    expect(ms.value()).toEqual(['react']);
  });

  it('ignores a disabled option', () => {
    (ms as any).toggleOption(2);
    expect(ms.value()).toEqual([]);
  });

  it('respects the max selection cap', () => {
    fixture.componentRef.setInput('max', 1);
    fixture.detectChanges();
    (ms as any).toggleOption(0);
    (ms as any).toggleOption(1);
    expect(ms.value()).toEqual(['ng']);
    expect((ms as any).atMax()).toBe(true);
  });

  it('derives chips (with labels) from the value, remembering async options', () => {
    (ms as any).toggleOption(1);
    // Simulate the async source dropping the option out of the list.
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
    const chips = (ms as any).chips() as MkMultiSelectOption[];
    expect(chips).toEqual([{ label: 'React', value: 'react' }]);
  });

  it('removeChip drops the value', () => {
    (ms as any).toggleOption(0);
    (ms as any).toggleOption(1);
    (ms as any).removeChip('ng');
    expect(ms.value()).toEqual(['react']);
  });

  it('filters options against the query (contains)', () => {
    (ms as any).query.set('re');
    expect((ms as any).filtered().map((o: MkMultiSelectOption) => o.value)).toEqual([
      'react',
    ]);
  });

  it('writeValue accepts an array and normalises null to []', () => {
    ms.writeValue(['ng']);
    expect(ms.value()).toEqual(['ng']);
    ms.writeValue(null);
    expect(ms.value()).toEqual([]);
  });

  it('labels chip remove buttons through i18n.removeItem', () => {
    (ms as any).toggleOption(0);
    fixture.detectChanges();
    const remove = fixture.nativeElement.querySelector(
      '.mk-chip__remove',
    ) as HTMLButtonElement;
    expect(remove.getAttribute('aria-label')).toBe(
      MK_DEFAULT_I18N.removeItem('Angular'),
    );
  });

  it('announces chip adds and removes, including Backspace deletion', () => {
    const spy = vi.spyOn(TestBed.inject(MkLiveAnnouncer), 'announce');

    (ms as any).toggleOption(0);
    expect(spy).toHaveBeenLastCalledWith('Angular added');

    (ms as any).removeChip('ng');
    expect(spy).toHaveBeenLastCalledWith('Angular removed');

    (ms as any).toggleOption(1);
    (ms as any).onKeydown(
      new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }),
    );
    expect(spy).toHaveBeenLastCalledWith('React removed');
  });

  it('marks unselectable at-max options with aria-disabled and a title, keeping them focusable', async () => {
    fixture.componentRef.setInput('max', 1);
    fixture.detectChanges();
    (ms as any).toggleOption(0); // 'ng' selected — cap reached
    (ms as any).open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    // The panel teleports to the body.
    const options = [...document.querySelectorAll<HTMLElement>('[role=option]')];
    const hint = MK_DEFAULT_I18N.validation.mkMaxItems({ max: 1, actual: 1 });

    // The selected option stays actionable.
    expect(options[0].getAttribute('aria-disabled')).toBeNull();
    // The blocked one stays reachable (APG) but says why it is unavailable.
    expect(options[1].getAttribute('aria-disabled')).toBe('true');
    expect(options[1].getAttribute('title')).toBe(hint);

    // Enter on it explains instead of silently no-oping.
    const spy = vi.spyOn(TestBed.inject(MkLiveAnnouncer), 'announce');
    (ms as any).toggleOption(1);
    expect(ms.value()).toEqual(['ng']);
    expect(spy).toHaveBeenCalledWith(hint);
  });

  it('keyboard nav still reaches at-max options', () => {
    fixture.componentRef.setInput('max', 1);
    fixture.detectChanges();
    (ms as any).toggleOption(0);
    (ms as any).open.set(true);
    (ms as any).activeIndex.set(0);
    (ms as any).onKeydown(
      new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }),
    );
    expect((ms as any).activeIndex()).toBe(1);
  });

  it('announces the filtered result count on meaningful change only', async () => {
    const spy = vi.spyOn(TestBed.inject(MkLiveAnnouncer), 'announce');

    (ms as any).open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spy).toHaveBeenLastCalledWith('3 results');

    (ms as any).query.set('re');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spy).toHaveBeenLastCalledWith('1 result');
    const calls = spy.mock.calls.length;

    // Same count after another keystroke — no re-announcement.
    (ms as any).query.set('rea');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spy.mock.calls.length).toBe(calls);
  });

  it('announces async results arriving while open', async () => {
    const spy = vi.spyOn(TestBed.inject(MkLiveAnnouncer), 'announce');
    fixture.componentRef.setInput('filterMode', 'none');
    (ms as any).open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spy).toHaveBeenLastCalledWith('3 results');

    fixture.componentRef.setInput('options', [
      { label: 'Vue', value: 'vue' },
    ] satisfies MkMultiSelectOption[]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(spy).toHaveBeenLastCalledWith('1 result');
  });
});
