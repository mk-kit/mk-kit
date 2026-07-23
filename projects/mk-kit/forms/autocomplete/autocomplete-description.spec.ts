import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkAutocomplete } from './autocomplete';

describe('MkAutocomplete option descriptions', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  function make() {
    const f = TestBed.createComponent(MkAutocomplete);
    f.componentRef.setInput('options', [
      { label: 'Jan Kowalski', value: 'u1', description: 'jan@a.pl · 600100200' },
      { label: 'Jan Kowalski', value: 'u2' },
    ]);
    f.componentRef.setInput('filterMode', 'none');
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.value = 'jan';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();
    return f;
  }

  it('renders the description as a second line, only when present', () => {
    make();
    // The popup is teleported to document.body (anchored-panel portal).
    const descs = document.querySelectorAll('.mk-autocomplete__option-desc');
    expect(descs).toHaveLength(1);
    expect(descs[0].textContent.trim()).toBe('jan@a.pl · 600100200');
  });
});
