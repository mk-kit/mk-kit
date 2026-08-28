import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MkOrgChart,
  MkOrgChartNodeDef,
  type MkOrgChartNode,
  type MkOrgChartToggleEvent,
  mkOrgChartFromFlat,
} from './org-chart';

interface Person {
  title?: string;
  avatar?: string;
}

const company: MkOrgChartNode<Person>[] = [
  {
    id: 'ceo',
    label: 'Ada Lovelace',
    data: { title: 'CEO' },
    children: [
      {
        id: 'cto',
        label: 'Grace Hopper',
        data: { title: 'CTO' },
        children: [
          { id: 'eng1', label: 'Linus Torvalds', data: { title: 'Engineer' } },
          { id: 'eng2', label: 'Margaret Hamilton', data: { title: 'Engineer' } },
        ],
      },
      {
        id: 'cfo',
        label: 'Katherine Johnson',
        data: { title: 'CFO' },
        expanded: false,
        children: [{ id: 'acc', label: 'Accountant' }],
      },
      { id: 'coo', label: 'Mary Jackson', data: { title: 'COO' } },
    ],
  },
];

function items(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>('.mk-org-chart__item'));
}
function itemOf(el: HTMLElement, id: string): HTMLElement {
  return items(el).find((li) => li.dataset['mkId'] === id)!;
}
function cardOf(el: HTMLElement, id: string): HTMLElement {
  return itemOf(el, id).querySelector<HTMLElement>(':scope > .mk-org-chart__node')!;
}
function key(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('mkOrgChartFromFlat', () => {
  it('nests rows by parentId, keeps order, orphans become roots', () => {
    const tree = mkOrgChartFromFlat([
      { id: 'b', label: 'B', parentId: 'a' },
      { id: 'a', label: 'A' },
      { id: 'c', label: 'C', parentId: 'a', data: { title: 'x' }, expanded: false },
      { id: 'd', label: 'D', parentId: 'missing' },
      { id: 'e', parentId: null },
    ]);
    expect(tree.map((n) => n.id)).toEqual(['a', 'd', 'e']);
    expect(tree[0].children?.map((n) => n.id)).toEqual(['b', 'c']);
    expect(tree[0].children?.[1]).toEqual({ id: 'c', label: 'C', data: { title: 'x' }, expanded: false });
    expect(tree[0].children?.[0].children).toBeUndefined();
  });
});

describe('MkOrgChart', () => {
  let fixture: ComponentFixture<MkOrgChart<Person>>;
  let chart: MkOrgChart<Person>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(MkOrgChart<Person>);
    chart = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('nodes', company);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders the whole hierarchy as nested lists with tree semantics', () => {
    const tree = el.querySelector('ul[role="tree"]')!;
    expect(tree).not.toBeNull();
    expect(tree.getAttribute('aria-label')).toBe('Organisation chart');
    // Non-collapsible: every node is visible, `expanded: false` is ignored.
    expect(items(el).map((li) => li.dataset['mkId'])).toEqual([
      'ceo', 'cto', 'eng1', 'eng2', 'cfo', 'acc', 'coo',
    ]);
    expect(itemOf(el, 'ceo').getAttribute('role')).toBe('treeitem');
    expect(itemOf(el, 'ceo').getAttribute('aria-level')).toBe('1');
    expect(itemOf(el, 'eng1').getAttribute('aria-level')).toBe('3');
    expect(itemOf(el, 'ceo').getAttribute('aria-expanded')).toBe('true');
    expect(itemOf(el, 'coo').getAttribute('aria-expanded')).toBeNull();
    expect(itemOf(el, 'ceo').querySelector(':scope > ul[role="group"]')).not.toBeNull();
    // Not selectable → no aria-selected, no toggles.
    expect(itemOf(el, 'ceo').getAttribute('aria-selected')).toBeNull();
    expect(el.querySelector('.mk-org-chart__toggle')).toBeNull();
  });

  it('default card shows label, data.title and an avatar', () => {
    const card = cardOf(el, 'cto');
    expect(card.querySelector('.mk-org-chart__label')?.textContent).toBe('Grace Hopper');
    expect(card.querySelector('.mk-org-chart__title')?.textContent).toBe('CTO');
    expect(card.querySelector('mk-avatar')?.getAttribute('aria-hidden')).toBe('true');
    expect(cardOf(el, 'acc').querySelector('.mk-org-chart__title')).toBeNull();
  });

  it('has one roving tab stop (the first node) and reflects orientation classes', () => {
    expect(itemOf(el, 'ceo').tabIndex).toBe(0);
    expect(items(el).filter((li) => li.tabIndex === 0)).toHaveLength(1);
    expect(el.classList.contains('mk-org-chart--top')).toBe(true);

    fixture.componentRef.setInput('orientation', 'left');
    fixture.detectChanges();
    expect(el.classList.contains('mk-org-chart--left')).toBe(true);
    expect(el.classList.contains('mk-org-chart--top')).toBe(false);
  });

  it('applies a clamped zoom to the canvas', () => {
    const canvas = el.querySelector<HTMLElement>('.mk-org-chart__canvas')!;
    fixture.componentRef.setInput('zoom', 0.75);
    fixture.detectChanges();
    expect(canvas.style.zoom).toBe('0.75');
    fixture.componentRef.setInput('zoom', 5);
    fixture.detectChanges();
    expect(canvas.style.zoom).toBe('2');
  });

  describe('collapsible', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('collapsible', true);
      fixture.detectChanges();
    });

    it('seeds expansion from node.expanded (default expanded) and renders toggles', () => {
      expect(items(el).map((li) => li.dataset['mkId'])).toEqual(['ceo', 'cto', 'eng1', 'eng2', 'cfo', 'coo']);
      expect(itemOf(el, 'cfo').getAttribute('aria-expanded')).toBe('false');
      const toggle = itemOf(el, 'cfo').querySelector<HTMLButtonElement>('.mk-org-chart__toggle')!;
      expect(toggle.getAttribute('aria-label')).toBe('Expand Katherine Johnson');
      expect(toggle.tabIndex).toBe(-1);
      expect(itemOf(el, 'coo').querySelector('.mk-org-chart__toggle')).toBeNull();
    });

    it('toggle click expands / collapses, emits nodeToggle and the expanded model', () => {
      const toggles: MkOrgChartToggleEvent<Person>[] = [];
      chart.nodeToggle.subscribe((e) => toggles.push(e));
      const expandedValues: (readonly string[] | undefined)[] = [];
      chart.expanded.subscribe((v) => expandedValues.push(v));
      const clicks: unknown[] = [];
      chart.nodeClick.subscribe((n) => clicks.push(n));

      itemOf(el, 'cfo').querySelector<HTMLButtonElement>('.mk-org-chart__toggle')!.click();
      fixture.detectChanges();
      expect(itemOf(el, 'acc')).toBeDefined();
      expect(itemOf(el, 'cfo').getAttribute('aria-expanded')).toBe('true');
      expect(itemOf(el, 'cfo').querySelector('.mk-org-chart__toggle')!.getAttribute('aria-label'))
        .toBe('Collapse Katherine Johnson');
      expect(toggles).toEqual([{ node: company[0].children![1], expanded: true }]);
      expect(expandedValues.at(-1)).toEqual(['ceo', 'cto', 'cfo']);
      expect(clicks).toHaveLength(0);

      itemOf(el, 'cto').querySelector<HTMLButtonElement>('.mk-org-chart__toggle')!.click();
      fixture.detectChanges();
      expect(items(el).map((li) => li.dataset['mkId'])).toEqual(['ceo', 'cto', 'cfo', 'acc', 'coo']);
      expect(expandedValues.at(-1)).toEqual(['ceo', 'cfo']);
    });

    it('a bound expanded set is the source of truth', () => {
      fixture.componentRef.setInput('expanded', ['ceo']);
      fixture.detectChanges();
      expect(items(el).map((li) => li.dataset['mkId'])).toEqual(['ceo', 'cto', 'cfo', 'coo']);
      fixture.componentRef.setInput('expanded', []);
      fixture.detectChanges();
      expect(items(el).map((li) => li.dataset['mkId'])).toEqual(['ceo']);
    });

    it('keeps the user state for known nodes when the array is rebuilt', () => {
      chart.setExpanded(company[0].children![0], false); // collapse cto
      fixture.detectChanges();
      fixture.componentRef.setInput('nodes', structuredClone(company));
      fixture.detectChanges();
      expect(itemOf(el, 'cto').getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('selection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('selectable', true);
      fixture.detectChanges();
    });

    it('card click selects by id, emits nodeClick and marks aria-selected', () => {
      const clicks: MkOrgChartNode<Person>[] = [];
      chart.nodeClick.subscribe((n) => clicks.push(n));
      expect(itemOf(el, 'cto').getAttribute('aria-selected')).toBe('false');

      cardOf(el, 'cto').click();
      fixture.detectChanges();
      expect(chart.selected()).toBe('cto');
      expect(itemOf(el, 'cto').getAttribute('aria-selected')).toBe('true');
      expect(cardOf(el, 'cto').classList.contains('mk-org-chart__node--selected')).toBe(true);
      expect(itemOf(el, 'ceo').getAttribute('aria-selected')).toBe('false');
      expect(clicks).toEqual([company[0].children![0]]);
      // The click must not bubble up and select the parent.
      expect(chart.selected()).toBe('cto');
    });

    it('[(selected)] drives the highlight from outside', () => {
      fixture.componentRef.setInput('selected', 'coo');
      fixture.detectChanges();
      expect(itemOf(el, 'coo').getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('keyboard', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('selectable', true);
      fixture.componentRef.setInput('collapsible', true);
      fixture.detectChanges();
    });

    it('Down = first child, Up = parent, Left/Right = siblings, Home/End', () => {
      const ceo = itemOf(el, 'ceo');
      ceo.focus();
      expect(key(ceo, 'ArrowDown').defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(itemOf(el, 'cto'));
      fixture.detectChanges();
      expect(itemOf(el, 'cto').tabIndex).toBe(0);
      expect(itemOf(el, 'ceo').tabIndex).toBe(-1);

      key(itemOf(el, 'cto'), 'ArrowRight');
      expect(document.activeElement).toBe(itemOf(el, 'cfo'));
      key(itemOf(el, 'cfo'), 'ArrowRight');
      expect(document.activeElement).toBe(itemOf(el, 'coo'));
      key(itemOf(el, 'coo'), 'ArrowRight'); // last sibling: stays
      expect(document.activeElement).toBe(itemOf(el, 'coo'));
      key(itemOf(el, 'coo'), 'ArrowLeft');
      expect(document.activeElement).toBe(itemOf(el, 'cfo'));
      key(itemOf(el, 'cfo'), 'ArrowUp');
      expect(document.activeElement).toBe(itemOf(el, 'ceo'));

      key(itemOf(el, 'ceo'), 'End');
      expect(document.activeElement).toBe(itemOf(el, 'coo'));
      key(itemOf(el, 'coo'), 'Home');
      expect(document.activeElement).toBe(itemOf(el, 'ceo'));
    });

    it('Down on a collapsed parent expands it first; -/+ collapse/expand; * expands siblings', () => {
      const cfo = itemOf(el, 'cfo');
      cfo.focus();
      key(cfo, 'ArrowDown');
      fixture.detectChanges();
      expect(itemOf(el, 'cfo').getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(itemOf(el, 'cfo'));
      key(itemOf(el, 'cfo'), 'ArrowDown');
      expect(document.activeElement).toBe(itemOf(el, 'acc'));

      key(itemOf(el, 'acc'), 'ArrowUp');
      key(itemOf(el, 'cfo'), '-');
      fixture.detectChanges();
      expect(itemOf(el, 'cfo').getAttribute('aria-expanded')).toBe('false');
      key(itemOf(el, 'cfo'), '+');
      fixture.detectChanges();
      expect(itemOf(el, 'cfo').getAttribute('aria-expanded')).toBe('true');

      fixture.componentRef.setInput('expanded', ['ceo']);
      fixture.detectChanges();
      key(itemOf(el, 'coo'), '*');
      fixture.detectChanges();
      expect(chart.expanded()).toEqual(['ceo', 'cto', 'cfo']);
    });

    it('Enter / Space select (and emit nodeClick); toggle instead when not selectable', () => {
      const clicks: string[] = [];
      chart.nodeClick.subscribe((n) => clicks.push(n.id));
      key(itemOf(el, 'cto'), 'Enter');
      fixture.detectChanges();
      expect(chart.selected()).toBe('cto');
      expect(itemOf(el, 'cto').getAttribute('aria-expanded')).toBe('true');
      key(itemOf(el, 'coo'), ' ');
      expect(chart.selected()).toBe('coo');
      expect(clicks).toEqual(['cto', 'coo']);

      fixture.componentRef.setInput('selectable', false);
      fixture.detectChanges();
      key(itemOf(el, 'cto'), 'Enter');
      fixture.detectChanges();
      expect(itemOf(el, 'cto').getAttribute('aria-expanded')).toBe('false');
      expect(chart.selected()).toBe('coo');
    });

    it('swaps the axes for orientation="left" and in RTL', () => {
      fixture.componentRef.setInput('orientation', 'left');
      fixture.detectChanges();
      key(itemOf(el, 'ceo'), 'ArrowRight');
      expect(document.activeElement).toBe(itemOf(el, 'cto'));
      key(itemOf(el, 'cto'), 'ArrowDown');
      expect(document.activeElement).toBe(itemOf(el, 'cfo'));
      key(itemOf(el, 'cfo'), 'ArrowUp');
      expect(document.activeElement).toBe(itemOf(el, 'cto'));
      key(itemOf(el, 'cto'), 'ArrowLeft');
      expect(document.activeElement).toBe(itemOf(el, 'ceo'));

      el.setAttribute('dir', 'rtl');
      key(itemOf(el, 'ceo'), 'ArrowLeft');
      expect(document.activeElement).toBe(itemOf(el, 'cto'));
      key(itemOf(el, 'cto'), 'ArrowRight');
      expect(document.activeElement).toBe(itemOf(el, 'ceo'));

      fixture.componentRef.setInput('orientation', 'top');
      fixture.detectChanges();
      key(itemOf(el, 'ceo'), 'ArrowDown');
      key(itemOf(el, 'cto'), 'ArrowLeft'); // RTL: Left = next sibling
      expect(document.activeElement).toBe(itemOf(el, 'cfo'));
      key(itemOf(el, 'cfo'), 'ArrowRight');
      expect(document.activeElement).toBe(itemOf(el, 'cto'));
    });
  });
});

@Component({
  imports: [MkOrgChart, MkOrgChartNodeDef],
  template: `
    <mk-org-chart [nodes]="nodes" selectable [(selected)]="picked" aria-label="Team">
      <ng-template mkOrgChartNodeDef let-node let-depth="depth" let-selected="selected">
        <span class="custom" [attr.data-depth]="depth" [attr.data-selected]="selected">{{ node.label }}!</span>
      </ng-template>
    </mk-org-chart>
  `,
})
class TemplateHost {
  readonly nodes = company;
  readonly picked = signal<string | null>('cto');
}

describe('MkOrgChart custom node template', () => {
  it('renders mkOrgChartNodeDef with node, depth and selected in context', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('ul[role="tree"]')?.getAttribute('aria-label')).toBe('Team');
    expect(el.querySelector('mk-avatar')).toBeNull();
    const custom = Array.from(el.querySelectorAll<HTMLElement>('.custom'));
    expect(custom.map((c) => c.textContent)).toContain('Grace Hopper!');
    const cto = custom.find((c) => c.textContent === 'Grace Hopper!')!;
    expect(cto.dataset['depth']).toBe('2');
    expect(cto.dataset['selected']).toBe('true');
    expect(custom.find((c) => c.textContent === 'Ada Lovelace!')!.dataset['selected']).toBe('false');
    fixture.destroy();
  });
});
