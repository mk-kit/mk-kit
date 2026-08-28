import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMkI18n } from '@mk-kit/ui/core';
import { MkSortableList } from './sortable-list';

@Component({
  imports: [MkSortableList],
  template: `
    <h2 id="steps-heading">Steps</h2>
    <mk-sortable-list [items]="rows()" [label]="label()" [labelledBy]="labelledBy()">
      <ng-template let-item let-i="index">{{ i + 1 }}. {{ item }}</ng-template>
    </mk-sortable-list>
  `,
})
class Host {
  readonly rows = signal(['Mix', 'Bake', 'Serve']);
  readonly label = signal<string | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
}

describe('MkSortableList accessible name', () => {
  let fixture: ComponentFixture<Host>;
  let list: HTMLElement;

  async function setup(...providers: unknown[]): Promise<void> {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ...(providers as never[])],
    });
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    list = fixture.nativeElement.querySelector('[mkDropList]') as HTMLElement;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('names the group with the i18n default when no label is given', async () => {
    await setup();
    expect(list.getAttribute('role')).toBe('group');
    expect(list.getAttribute('aria-label')).toBe('Sortable list');
    expect(list.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('honours a provideMkI18n override of sortableListLabel', async () => {
    await setup(provideMkI18n({ sortableListLabel: 'Lista do sortowania' }));
    expect(list.getAttribute('aria-label')).toBe('Lista do sortowania');
  });

  it('uses the label input as the accessible name', async () => {
    await setup();
    fixture.componentInstance.label.set('Recipe steps');
    await fixture.whenStable();
    expect(list.getAttribute('aria-label')).toBe('Recipe steps');
  });

  it('prefers labelledBy and drops aria-label so the heading is the single name', async () => {
    await setup();
    fixture.componentInstance.label.set('Recipe steps');
    fixture.componentInstance.labelledBy.set('steps-heading');
    await fixture.whenStable();
    expect(list.getAttribute('aria-labelledby')).toBe('steps-heading');
    expect(list.hasAttribute('aria-label')).toBe(false);

    fixture.componentInstance.labelledBy.set(undefined);
    await fixture.whenStable();
    expect(list.hasAttribute('aria-labelledby')).toBe(false);
    expect(list.getAttribute('aria-label')).toBe('Recipe steps');
  });

  it('renders every item as a draggable button inside the named group', async () => {
    await setup();
    const items = list.querySelectorAll('[mkDrag]');
    expect(items.length).toBe(3);
    expect(items[0].getAttribute('role')).toBe('button');
    expect(items[0].textContent?.trim()).toBe('1. Mix');
  });
});
