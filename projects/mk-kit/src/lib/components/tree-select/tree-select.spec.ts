import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTreeSelect } from './tree-select';
import type { MkTreeNode } from '../tree';

const NODES: MkTreeNode[] = [
  {
    label: 'Fruit',
    value: 'fruit',
    expanded: true,
    children: [
      { label: 'Apple', value: 'apple' },
      { label: 'Berries', value: 'berries', children: [{ label: 'Strawberry', value: 'strawberry' }] },
    ],
  },
  { label: 'Vegetable', value: 'vegetable' },
];

describe('MkTreeSelect', () => {
  let fixture: ComponentFixture<MkTreeSelect>;
  let ts: MkTreeSelect;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkTreeSelect);
    ts = fixture.componentInstance;
    fixture.componentRef.setInput('nodes', NODES);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('picking a node sets the value, notifies the form and closes', () => {
    const onChange = vi.fn();
    ts.registerOnChange(onChange);
    (ts as any).open.set(true);
    (ts as any).onPick(NODES[0].children![0]); // Apple
    expect(ts.value()).toBe('apple');
    expect(onChange).toHaveBeenCalledWith('apple');
    expect((ts as any).open()).toBe(false);
  });

  it('selectedLabel finds a deeply nested node by value', () => {
    ts.value.set('strawberry');
    expect((ts as any).selectedLabel()).toBe('Strawberry');
  });

  it('selectedLabel is empty when nothing is selected', () => {
    expect((ts as any).selectedLabel()).toBe('');
  });

  it('clear resets the value and notifies the form', () => {
    const onChange = vi.fn();
    ts.registerOnChange(onChange);
    ts.value.set('apple');
    (ts as any).clear(new Event('click'));
    expect(ts.value()).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('writeValue reflects the model value', () => {
    ts.writeValue('vegetable');
    expect(ts.value()).toBe('vegetable');
    expect((ts as any).selectedLabel()).toBe('Vegetable');
    ts.writeValue(null);
    expect(ts.value()).toBeNull();
  });
});
