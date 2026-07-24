import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MkInput } from './input';

@Component({
  imports: [MkInput, FormsModule],
  template: `<input mkInput [(ngModel)]="value" />`,
})
class NgModelHost {
  value = '';
}

@Component({
  imports: [MkInput, ReactiveFormsModule],
  template: `<input mkInput [formControl]="control" />`,
})
class ReactiveHost {
  control = new FormControl('');
}

describe('MkInput (ControlValueAccessor)', () => {
  afterEach(() => TestBed.resetTestingModule());

  function mountNgModel() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.componentInstance,
      input: fixture.nativeElement.querySelector('input') as HTMLInputElement,
    };
  }

  function mountReactive() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.componentInstance,
      input: fixture.nativeElement.querySelector('input') as HTMLInputElement,
    };
  }

  it('propagates typing to the model (view → model)', async () => {
    const { fixture, host, input } = mountNgModel();
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(host.value).toBe('hello');
  });

  it('writes the model back to the DOM, including a programmatic reset (model → view)', async () => {
    // This is the regression the CVA fixes: clearing the bound model must clear
    // the visible input, not leave stale text behind.
    const { fixture, input } = mountReactive();
    const host = fixture.componentInstance;

    host.control.setValue('example.com');
    fixture.detectChanges();
    expect(input.value).toBe('example.com');

    host.control.setValue('');
    fixture.detectChanges();
    expect(input.value).toBe('');
  });

  it('buffers onChange during IME composition and flushes on compositionend', async () => {
    const { fixture, host, input } = mountNgModel();

    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = 'し';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    // still composing → model not updated yet
    expect(host.value).toBe('');

    input.value = '知';
    input.dispatchEvent(new CompositionEvent('compositionend'));
    await fixture.whenStable();
    expect(host.value).toBe('知');
  });

  it('reflects the disabled state from a reactive control', () => {
    const { fixture, host, input } = mountReactive();
    host.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);

    host.control.enable();
    fixture.detectChanges();
    expect(input.disabled).toBe(false);
  });
});
