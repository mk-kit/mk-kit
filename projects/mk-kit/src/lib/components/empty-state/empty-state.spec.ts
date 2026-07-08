import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkEmptyState } from './empty-state';

describe('MkEmptyState', () => {
  let fixture: ComponentFixture<MkEmptyState>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkEmptyState);
    el = fixture.nativeElement;
  });

  it('renders the title and description', () => {
    fixture.componentRef.setInput('title', 'No results');
    fixture.componentRef.setInput('description', 'Try another search.');
    fixture.detectChanges();
    expect(el.querySelector('.mk-empty-state__title')?.textContent).toContain(
      'No results',
    );
    expect(
      el.querySelector('.mk-empty-state__description')?.textContent,
    ).toContain('Try another search.');
  });

  it('renders an icon when provided', () => {
    fixture.componentRef.setInput('icon', 'search');
    fixture.detectChanges();
    expect(el.querySelector('.mk-empty-state__icon mk-icon')).toBeTruthy();
  });

  it('omits the title element when no title is set', () => {
    fixture.detectChanges();
    expect(el.querySelector('.mk-empty-state__title')).toBeNull();
  });

  it('scales the icon with the size input', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect((fixture.componentInstance as any).iconSize()).toBe(48);
  });
});
