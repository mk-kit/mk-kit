import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkSort, MkSortState } from './sort';
import { MkSortHeader } from './sort-header';

@Component({
  imports: [MkSort, MkSortHeader],
  template: `<table mkSort (mkSortChange)="last = $event">
    <thead>
      <tr>
        <th mkSortHeader="name">Name</th>
        <th mkSortHeader="size" mkSortHeaderStart="desc">Size</th>
      </tr>
    </thead>
  </table>`,
})
class Host {
  last: MkSortState | null = null;
}

describe('MkSort / MkSortHeader', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let headers: HTMLElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    headers = Array.from(fixture.nativeElement.querySelectorAll('th'));
  });

  afterEach(() => {
    fixture.destroy();
    // MkSort announces via MkLiveAnnouncer, which appends a body-level region;
    // remove it so it can't pollute other specs sharing this jsdom.
    document.querySelectorAll('.mk-visually-hidden').forEach((el) => el.remove());
  });

  it('starts unsorted with aria-sort="none"', () => {
    expect(headers[0].getAttribute('aria-sort')).toBe('none');
  });

  it('cycles asc → desc → none on repeated clicks', () => {
    const name = headers[0];

    name.click();
    fixture.detectChanges();
    expect(host.last).toEqual({ active: 'name', direction: 'asc' });
    expect(name.getAttribute('aria-sort')).toBe('ascending');

    name.click();
    fixture.detectChanges();
    expect(host.last?.direction).toBe('desc');
    expect(name.getAttribute('aria-sort')).toBe('descending');

    name.click();
    fixture.detectChanges();
    expect(host.last).toEqual({ active: '', direction: 'none' });
    expect(name.getAttribute('aria-sort')).toBe('none');
  });

  it('honours a per-header start direction', () => {
    headers[1].click();
    fixture.detectChanges();
    expect(host.last).toEqual({ active: 'size', direction: 'desc' });
  });

  it('switching columns activates the new one ascending', () => {
    headers[0].click();
    headers[0].click(); // name is now desc
    fixture.detectChanges();
    headers[1].click(); // switch to size
    fixture.detectChanges();
    expect(host.last).toEqual({ active: 'size', direction: 'desc' });
    expect(headers[0].getAttribute('aria-sort')).toBe('none');
  });
});
