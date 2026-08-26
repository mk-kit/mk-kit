import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mkCreateQueryGroup, type MkQueryField, type MkQueryGroup, type MkQueryRule } from '@mk-kit/ui/core';
import { MkQueryBuilder } from './query-builder';

const FIELDS: MkQueryField[] = [
  { key: 'name', label: 'Name' },
  { key: 'orders', label: 'Orders', type: 'number' },
  { key: 'role', label: 'Role', type: 'select', options: [{ label: 'Admin', value: 'admin' }, { label: 'Editor', value: 'editor' }] },
  { key: 'vip', label: 'VIP', type: 'boolean' },
  { key: 'since', label: 'Since', type: 'date' },
];

@Component({
  imports: [MkQueryBuilder],
  template: `<mk-query-builder [fields]="fields" [(query)]="query" [allowNot]="allowNot()" [maxDepth]="maxDepth()" [disabled]="disabled()" />`,
})
class Host {
  readonly fields = FIELDS;
  readonly query = signal<MkQueryGroup>(mkCreateQueryGroup());
  readonly allowNot = signal(true);
  readonly maxDepth = signal(2);
  readonly disabled = signal(false);
}

describe('MkQueryBuilder', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const buttonByText = (text: string, scope: ParentNode = root()) =>
    [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.trim() === text)!;
  const rules = () => host.query().rules;
  const rule = (i = 0) => rules()[i] as MkQueryRule;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('starts empty, adds a rule on the first field with its first operator, and removes it', async () => {
    expect(root().querySelector('.mk-query-group__empty')).toBeTruthy();
    buttonByText('Add rule').click();
    await settle();
    expect(rules()).toHaveLength(1);
    expect(rule()).toMatchObject({ field: 'name', operator: 'contains' });
    expect(root().querySelectorAll('.mk-query-group__rule')).toHaveLength(1);
    expect(root().querySelector('input[type=text]')).toBeTruthy();

    root().querySelector<HTMLButtonElement>('.mk-query-group__rule .mk-query-group__remove')!.click();
    await settle();
    expect(rules()).toHaveLength(0);
  });

  it('switches editors by field type and resets operator / value when the field changes', async () => {
    host.query.set({ ...mkCreateQueryGroup(), rules: [{ id: 'r', field: 'name', operator: 'contains', value: 'ada' }] });
    await settle();
    const input = root().querySelector<HTMLInputElement>('input[type=text]')!;
    expect(input.value).toBe('ada');
    input.value = 'grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(rule().value).toBe('grace');

    // Change the field through the component API (mk-select is covered by its own spec).
    const group = fixture.debugElement.query((d) => d.name === 'mk-query-group').componentInstance as {
      setField(i: number, r: MkQueryRule, key: unknown): void;
      setOperator(i: number, r: MkQueryRule, op: unknown): void;
    };
    group.setField(0, rule(), 'orders');
    await settle();
    expect(rule()).toMatchObject({ field: 'orders', operator: 'eq' });
    expect(rule().value).toBeUndefined();
    expect(root().querySelector('mk-number-input')).toBeTruthy();

    group.setOperator(0, rule(), 'between');
    await settle();
    expect(root().querySelectorAll('mk-number-input')).toHaveLength(2);

    group.setOperator(0, rule(), 'empty');
    await settle();
    expect(root().querySelector('mk-number-input')).toBeNull();

    group.setField(0, rule(), 'role');
    await settle();
    expect(rule().operator).toBe('empty'); // still valid for a select → kept
    group.setOperator(0, rule(), 'eq');
    await settle();
    expect(root().querySelector('mk-select.mk-query-group__value')).toBeTruthy();
    group.setOperator(0, rule(), 'in');
    await settle();
    expect(root().querySelector('mk-multi-select')).toBeTruthy();

    group.setField(0, rule(), 'since');
    await settle();
    expect(root().querySelector('mk-date-picker')).toBeTruthy();
    group.setField(0, rule(), 'vip');
    await settle();
    expect(root().querySelectorAll('mk-select')).toHaveLength(3); // field, operator, true/false
  });

  it('toggles combinator and not, nests groups up to maxDepth, and removes a group', async () => {
    buttonByText('Or').click();
    await settle();
    expect(host.query().combinator).toBe('or');
    expect(buttonByText('Or').getAttribute('aria-pressed')).toBe('true');
    buttonByText('Not').click();
    await settle();
    expect(host.query().not).toBe(true);

    buttonByText('Add group').click();
    await settle();
    const nested = root().querySelector<HTMLElement>('mk-query-group mk-query-group')!;
    expect(nested).toBeTruthy();
    buttonByText('Add group', nested).click();
    await settle();
    const deeper = nested.querySelector<HTMLElement>('mk-query-group')!;
    expect(deeper).toBeTruthy();
    expect(buttonByText('Add group', deeper)).toBeUndefined(); // maxDepth reached
    buttonByText('Add rule', deeper).click();
    await settle();
    const inner = (host.query().rules[0] as MkQueryGroup).rules[0] as MkQueryGroup;
    expect(inner.rules).toHaveLength(1);

    nested.querySelector<HTMLButtonElement>(':scope > .mk-query-group__bar .mk-query-group__remove')!.click();
    await settle();
    expect(host.query().rules).toHaveLength(0);
  });

  it('disables every control when disabled', async () => {
    buttonByText('Add rule').click();
    await settle();
    host.disabled.set(true);
    await settle();
    const buttons = [...root().querySelectorAll<HTMLButtonElement>('button')];
    expect(buttons.length).toBeGreaterThan(3);
    expect(buttons.every((b) => b.disabled)).toBe(true);
    expect(root().querySelector<HTMLInputElement>('input[type=text]')!.disabled).toBe(true);
  });
});
