import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccessibilityPage } from './accessibility-page';

describe('AccessibilityPage', () => {
  it('renders the statement with its verified-coverage figures, gaps and report link', async () => {
    await TestBed.configureTestingModule({
      imports: [AccessibilityPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(AccessibilityPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent).toContain('Accessibility statement');
    expect(el.textContent).toContain('WCAG');
    expect(el.textContent).toContain('a11y-smoke.spec.ts');
    expect(el.textContent).toContain('contrast-smoke.spec.ts');

    const headings = [...el.querySelectorAll('h2')].map((h) => h.textContent?.trim());
    expect(headings).toContain('Known gaps');
    expect(headings).toContain('Keyboard model by component family');
    expect(el.querySelectorAll('ol.a11y-list li').length).toBeGreaterThan(3);
    expect(el.querySelectorAll('table tbody tr').length).toBeGreaterThan(5);

    const issues = el.querySelector<HTMLAnchorElement>(
      'a[href="https://github.com/mk-kit/mk-kit/issues"]',
    );
    expect(issues).not.toBeNull();
  });
});
