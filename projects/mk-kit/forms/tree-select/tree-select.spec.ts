import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTreeSelect } from './tree-select';
import type { MkTreeNode } from '@mkornas/ui/navigation';

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

  // --- Panel a11y (WCAG 2.1.1 / 4.1.2) --------------------------------------
  // The panel is teleported to document.body by MkAnchoredPanel, so host-level
  // handlers never see events inside it; Escape/focusout live on the panel.

  function panelEl(): HTMLElement | null {
    return document.querySelector('.mk-tree-select__panel');
  }

  async function openPanel(): Promise<HTMLElement> {
    (ts as any).openPanel();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = panelEl();
    expect(panel).toBeTruthy();
    return panel!;
  }

  it('the trigger advertises the dialog popup it actually opens', () => {
    // aria-haspopup="tree" contradicted the panel's role="dialog".
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.mk-tree-select__trigger',
    )!;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('Escape inside the panel closes it and returns focus to the trigger', async () => {
    const panel = await openPanel();
    const item = panel.querySelector<HTMLElement>('[role="treeitem"]')!;
    item.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect((ts as any).open()).toBe(false);
    expect(panelEl()).toBeNull();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.mk-tree-select__trigger',
    );
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab-out of the panel (focusout to an outside target) closes it', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      const panel = await openPanel();
      outside.focus();
      panel.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      expect((ts as any).open()).toBe(false);
      expect(panelEl()).toBeNull();
    } finally {
      outside.remove();
    }
  });

  it('focus moving from the panel back to the trigger keeps it open', async () => {
    const panel = await openPanel();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.mk-tree-select__trigger',
    )!;
    panel.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: trigger }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect((ts as any).open()).toBe(true);
  });
});
