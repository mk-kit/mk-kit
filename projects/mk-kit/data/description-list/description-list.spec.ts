import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkDescItem, MkDescriptionList } from './description-list';

@Component({
  imports: [MkDescriptionList, MkDescItem],
  template: `<mk-description-list [layout]="layout()">
    <mk-desc-item term="Status">Active</mk-desc-item>
    <mk-desc-item term="Owner">Ada</mk-desc-item>
  </mk-description-list>`,
})
class Host {
  readonly layout = signal<'grid' | 'stacked'>('grid');
}

describe('MkDescriptionList', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders a dl with dt/dd pairs', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('dl')).toBeTruthy();
    expect(el.querySelectorAll('dt').length).toBe(2);
    expect(el.querySelectorAll('dd').length).toBe(2);
    expect(el.querySelector('dt')?.textContent?.trim()).toBe('Status');
  });

  it('reflects the layout on the dl', async () => {
    fixture.componentInstance.layout.set('stacked');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('dl')?.getAttribute('data-layout'),
    ).toBe('stacked');
  });
});
