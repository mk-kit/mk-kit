import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkFormField } from '../form-field/form-field';
import { MkInput } from '../input/input';
import { MkInputGroup } from './input-group';

@Component({
  imports: [MkInputGroup, MkInput],
  template: `
    <mk-input-group [size]="size()" [invalid]="invalid()">
      <span mkInputPrefix data-test="prefix">🔍</span>
      <input mkInput placeholder="Search" />
      <span mkInputSuffix data-test="suffix">⌘K</span>
    </mk-input-group>
  `,
})
class Host {
  size = signal<'sm' | 'md' | 'lg'>('md');
  invalid = signal(false);
}

@Component({
  imports: [MkFormField, MkInputGroup, MkInput],
  template: `
    <mk-form-field label="Search" size="lg">
      <mk-input-group>
        <input mkInput />
      </mk-input-group>
    </mk-form-field>
  `,
})
class FieldHost {}

describe('MkInputGroup', () => {
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
      group: el.querySelector<HTMLElement>('mk-input-group')!,
      input: el.querySelector<HTMLInputElement>('input')!,
      host: fixture.componentInstance,
    };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('projects prefix and suffix around the input', () => {
    const { group } = mount();
    const prefix = group.querySelector('[data-test=prefix]')!;
    const suffix = group.querySelector('[data-test=suffix]')!;
    const input = group.querySelector('input')!;
    expect(prefix.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(input.compareDocumentPosition(suffix) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('marks the nested input as grouped so it drops its own frame', () => {
    const { input } = mount();
    expect(input.classList).toContain('mk-input--grouped');
  });

  it('propagates size to the group and the nested input', () => {
    const { fixture, group, input, host } = mount();
    host.size.set('sm');
    fixture.detectChanges();
    expect(group.classList).toContain('mk-input-group--sm');
    expect(input.classList).toContain('mk-input--sm');
  });

  it('propagates invalid to the group frame and the input aria state', () => {
    const { fixture, group, input, host } = mount();
    host.invalid.set(true);
    fixture.detectChanges();
    expect(group.classList).toContain('mk-input-group--invalid');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('inherits size from a wrapping mk-form-field', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(
      el.querySelector('mk-input-group')!.classList,
    ).toContain('mk-input-group--lg');
    // The field's label still associates with the inner input.
    const label = el.querySelector('label')!;
    expect(el.querySelector('input')!.id).toBe(label.getAttribute('for'));
  });
});
