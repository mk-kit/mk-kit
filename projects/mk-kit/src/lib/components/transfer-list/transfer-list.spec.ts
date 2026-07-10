import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTransferList, MkTransferItem } from './transfer-list';

const ITEMS: MkTransferItem[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Owner', value: 'owner', disabled: true },
];

describe('MkTransferList', () => {
  let fixture: ComponentFixture<MkTransferList>;
  let cmp: MkTransferList;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkTransferList);
    cmp = fixture.componentInstance;
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('checks an available item and moves it into the value', () => {
    const onChange = vi.fn();
    const change = vi.fn();
    cmp.registerOnChange(onChange);
    cmp.change.subscribe(change);

    (cmp as any).toggleCheck('available', ITEMS[0]);
    expect((cmp as any).isChecked('available', 'admin')).toBe(true);
    expect((cmp as any).canMoveRight()).toBe(true);

    (cmp as any).moveRight();
    expect(cmp.value()).toEqual(['admin']);
    expect(onChange).toHaveBeenCalledWith(['admin']);
    expect(change).toHaveBeenCalledWith(['admin']);
    // Check state cleared after the move.
    expect((cmp as any).isChecked('available', 'admin')).toBe(false);
  });

  it('moves a checked selected item back to available', () => {
    cmp.value.set(['admin', 'editor']);
    fixture.detectChanges();

    (cmp as any).toggleCheck('selected', ITEMS[0]);
    (cmp as any).moveLeft();
    expect(cmp.value()).toEqual(['editor']);
  });

  it('partitions available and selected computeds', () => {
    cmp.value.set(['editor']);
    fixture.detectChanges();

    const available = (cmp as any).available() as MkTransferItem[];
    const selected = (cmp as any).selected() as MkTransferItem[];
    expect(available.map((i) => i.value)).toEqual(['admin', 'viewer', 'owner']);
    expect(selected.map((i) => i.value)).toEqual(['editor']);
  });

  it('selected preserves the value array order', () => {
    cmp.value.set(['viewer', 'admin']);
    fixture.detectChanges();
    const selected = (cmp as any).selected() as MkTransferItem[];
    expect(selected.map((i) => i.value)).toEqual(['viewer', 'admin']);
  });

  it('does not check or move a disabled item', () => {
    (cmp as any).toggleCheck('available', ITEMS[3]); // Owner, disabled
    expect((cmp as any).isChecked('available', 'owner')).toBe(false);
    (cmp as any).moveAllRight();
    expect(cmp.value()).not.toContain('owner');
  });

  it('moveAllRight moves every movable available item', () => {
    (cmp as any).moveAllRight();
    expect(cmp.value()).toEqual(['admin', 'editor', 'viewer']);
  });

  it('Enter on a row moves that single item', () => {
    const event = { key: 'Enter', preventDefault: vi.fn() } as any;
    (cmp as any).onRowKeydown('available', ITEMS[1], event);
    expect(cmp.value()).toEqual(['editor']);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('Space on a row toggles its check', () => {
    const event = { key: ' ', preventDefault: vi.fn() } as any;
    (cmp as any).onRowKeydown('available', ITEMS[0], event);
    expect((cmp as any).isChecked('available', 'admin')).toBe(true);
  });

  it('filters each list by its own query', () => {
    fixture.componentRef.setInput('filterable', true);
    cmp.value.set(['editor']);
    fixture.detectChanges();

    (cmp as any).availableQuery.set('view');
    const available = (cmp as any).filteredAvailable() as MkTransferItem[];
    expect(available.map((i) => i.value)).toEqual(['viewer']);

    const selected = (cmp as any).filteredSelected() as MkTransferItem[];
    expect(selected.map((i) => i.value)).toEqual(['editor']);
  });

  it('ArrowDown/End/Home move the roving active index', () => {
    const event = (key: string) => ({ key, preventDefault: vi.fn() }) as any;

    (cmp as any).onRowKeydown('available', ITEMS[0], event('ArrowDown'));
    expect((cmp as any).activeIdx('available')).toBe(1);

    (cmp as any).onRowKeydown('available', ITEMS[1], event('End'));
    expect((cmp as any).activeIdx('available')).toBe(ITEMS.length - 1);

    (cmp as any).onRowKeydown('available', ITEMS[3], event('Home'));
    expect((cmp as any).activeIdx('available')).toBe(0);
  });

  it('reflects the invalid input on the listboxes', () => {
    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();
    const list: HTMLElement = fixture.nativeElement.querySelector(
      '.mk-transfer-list__list',
    );
    expect(list.getAttribute('aria-invalid')).toBe('true');
    expect((cmp as any).isInvalid()).toBe(true);
  });

  it('writeValue sets the selected values and normalises null to []', () => {
    cmp.writeValue(['viewer']);
    expect(cmp.value()).toEqual(['viewer']);
    cmp.writeValue(null);
    expect(cmp.value()).toEqual([]);
  });
});
