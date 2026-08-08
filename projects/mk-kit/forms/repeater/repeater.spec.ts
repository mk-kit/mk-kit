import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MK_DEFAULT_I18N, MkLiveAnnouncer } from '@mkornas/ui/core';
import { MkRepeater, MkRepeaterEmpty, MkRepeaterRow } from './repeater';

interface Row {
  name: string;
}

@Component({
  imports: [MkRepeater, MkRepeaterRow, MkRepeaterEmpty],
  template: `
    <mk-repeater
      [(items)]="rows"
      [min]="min()"
      [max]="max()"
      [reorderable]="reorderable()"
      [disabled]="disabled()"
      [factory]="factory"
      (added)="added.push($event)"
      (removed)="removedEvents.push($event)"
      (moved)="movedEvents.push($event)"
    >
      <ng-template mkRepeaterRow let-item let-i="index">
        <input class="row-input" [value]="$any(item).name" />
        <span class="row-index">{{ i }}</span>
      </ng-template>
      <ng-template mkRepeaterEmpty>
        <p class="empty-state">No rows yet.</p>
      </ng-template>
    </mk-repeater>
  `,
})
class Host {
  readonly rows = signal<Row[]>([{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
  readonly min = signal(0);
  readonly max = signal(0);
  readonly reorderable = signal(false);
  readonly disabled = signal(false);
  readonly factory = (): Row => ({ name: 'new' });
  readonly added: { item: Row; index: number }[] = [];
  readonly removedEvents: { item: Row; index: number }[] = [];
  readonly movedEvents: { from: number; to: number }[] = [];
}

describe('MkRepeater', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let repeater: MkRepeater<Row>;

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const addButton = (): HTMLButtonElement =>
    el().querySelector('.mk-repeater__add') as HTMLButtonElement;
  const removeButtons = (): HTMLButtonElement[] =>
    Array.from(el().querySelectorAll('.mk-repeater__remove'));
  const rowInputs = (): HTMLInputElement[] =>
    Array.from(el().querySelectorAll('.row-input'));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    repeater = fixture.debugElement.query(By.directive(MkRepeater))
      .componentInstance as MkRepeater<Row>;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    // The repeater announces via MkLiveAnnouncer, which appends a body-level
    // region; remove it so it can't pollute other specs sharing this jsdom.
    document.querySelectorAll('.mk-visually-hidden').forEach((n) => n.remove());
  });

  it('renders one row per item, passing item and index to the template', () => {
    expect(rowInputs().map((i) => i.value)).toEqual(['a', 'b', 'c']);
    const indices = Array.from(el().querySelectorAll('.row-index')).map(
      (s) => s.textContent?.trim(),
    );
    expect(indices).toEqual(['0', '1', '2']);
  });

  it('adds a factory-made item on a NEW array and emits added', async () => {
    const before = host.rows();
    addButton().click();
    await fixture.whenStable();

    expect(host.rows().map((r) => r.name)).toEqual(['a', 'b', 'c', 'new']);
    expect(host.rows()).not.toBe(before); // new array identity
    expect(host.added).toEqual([{ item: { name: 'new' }, index: 3 }]);
    expect(rowInputs()).toHaveLength(4);
  });

  it('removes a row on a NEW array and emits removed', async () => {
    const before = host.rows();
    removeButtons()[1].click();
    await fixture.whenStable();

    expect(host.rows().map((r) => r.name)).toEqual(['a', 'c']);
    expect(host.rows()).not.toBe(before);
    expect(host.removedEvents).toEqual([{ item: { name: 'b' }, index: 1 }]);
  });

  it('disables remove buttons at min and keeps the row on a forced call', async () => {
    host.rows.set([{ name: 'only' }]);
    host.min.set(1);
    await fixture.whenStable();

    expect(removeButtons()[0].disabled).toBe(true);
    (repeater as unknown as { removeAt(i: number): void }).removeAt(0);
    expect(host.rows()).toHaveLength(1);
  });

  it('disables the add button at max and ignores a forced add', async () => {
    host.max.set(3);
    await fixture.whenStable();

    expect(addButton().disabled).toBe(true);
    (repeater as unknown as { add(): void }).add();
    expect(host.rows()).toHaveLength(3);
  });

  it('implements CVA: writeValue replaces the rows, null clears them', async () => {
    repeater.writeValue([{ name: 'x' }]);
    await fixture.whenStable();
    expect(rowInputs().map((i) => i.value)).toEqual(['x']);

    repeater.writeValue(null);
    await fixture.whenStable();
    expect(repeater.items()).toEqual([]);
  });

  it('propagates mutations through onChange with a new array identity', async () => {
    const onChange = vi.fn();
    repeater.registerOnChange(onChange);
    const before = repeater.items();

    addButton().click();
    await fixture.whenStable();

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0] as Row[];
    expect(emitted).not.toBe(before);
    expect(emitted.map((r) => r.name)).toEqual(['a', 'b', 'c', 'new']);
  });

  it('reorders via the drop path on a NEW array, emits moved and announces it', async () => {
    host.reorderable.set(true);
    await fixture.whenStable();
    const spy = vi.spyOn(TestBed.inject(MkLiveAnnouncer), 'announce');
    const before = host.rows();

    (repeater as unknown as {
      onDrop(e: { previousIndex: number; currentIndex: number }): void;
    }).onDrop({ previousIndex: 0, currentIndex: 2 });
    await fixture.whenStable();

    expect(host.rows().map((r) => r.name)).toEqual(['b', 'c', 'a']);
    expect(host.rows()).not.toBe(before);
    expect(host.movedEvents).toEqual([{ from: 0, to: 2 }]);
    expect(spy).toHaveBeenCalledWith(MK_DEFAULT_I18N.repeaterRowMoved(1, 3));
  });

  it('renders labelled drag handles only when reorderable', async () => {
    expect(el().querySelector('.mk-repeater__handle')).toBeNull();

    host.reorderable.set(true);
    await fixture.whenStable();

    const handle = el().querySelector('.mk-repeater__handle') as HTMLButtonElement;
    expect(handle).toBeInstanceOf(HTMLButtonElement);
    expect(handle.getAttribute('aria-label')).toBe(
      MK_DEFAULT_I18N.repeaterReorderRow(1),
    );
  });

  it('keeps following rows\' DOM identity when a middle row is removed (track by item)', async () => {
    const third = rowInputs()[2];
    third.value = 'edited-c'; // in-progress input state to preserve

    removeButtons()[1].click();
    await fixture.whenStable();

    const inputs = rowInputs();
    expect(inputs).toHaveLength(2);
    expect(inputs[1]).toBe(third); // same DOM node, not a re-render
    expect(inputs[1].value).toBe('edited-c');
  });

  it('disables add, remove and handles when disabled (input or CVA)', async () => {
    host.reorderable.set(true);
    host.disabled.set(true);
    await fixture.whenStable();

    expect(addButton().disabled).toBe(true);
    expect(removeButtons().every((b) => b.disabled)).toBe(true);
    const handle = el().querySelector('.mk-repeater__handle') as HTMLButtonElement;
    expect(handle.disabled).toBe(true);

    host.disabled.set(false);
    repeater.setDisabledState(true);
    await fixture.whenStable();
    expect(addButton().disabled).toBe(true);
  });

  it('shows the projected empty state when there are no rows', async () => {
    host.rows.set([]);
    await fixture.whenStable();

    expect(el().querySelector('.mk-repeater__rows')).toBeNull();
    expect(el().querySelector('.empty-state')?.textContent).toContain(
      'No rows yet.',
    );
  });
});
