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
  let buttons: HTMLButtonElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    headers = Array.from(fixture.nativeElement.querySelectorAll('th'));
    buttons = Array.from(fixture.nativeElement.querySelectorAll('th button'));
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

  it('renders a real button as the operable control, not a clickable th', () => {
    // WCAG 4.1.2: a th with tabindex is announced as text, not as a control.
    // The button carries the semantics; the th keeps aria-sort.
    const btn = headers[0].querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute('type')).toBe('button');
    expect(headers[0].hasAttribute('tabindex')).toBe(false);
    expect(btn!.textContent).toContain('Name');
  });

  it('cycles asc → desc → none on repeated clicks, toggling aria-sort', () => {
    const name = headers[0];
    const btn = buttons[0];

    btn.click();
    fixture.detectChanges();
    expect(host.last).toEqual({ active: 'name', direction: 'asc' });
    expect(name.getAttribute('aria-sort')).toBe('ascending');

    btn.click();
    fixture.detectChanges();
    expect(host.last?.direction).toBe('desc');
    expect(name.getAttribute('aria-sort')).toBe('descending');

    btn.click();
    fixture.detectChanges();
    expect(host.last).toEqual({ active: '', direction: 'none' });
    expect(name.getAttribute('aria-sort')).toBe('none');
  });

  it('honours a per-header start direction', () => {
    buttons[1].click();
    fixture.detectChanges();
    expect(host.last).toEqual({ active: 'size', direction: 'desc' });
  });

  it('switching columns activates the new one ascending', () => {
    buttons[0].click();
    buttons[0].click(); // name is now desc
    fixture.detectChanges();
    buttons[1].click(); // switch to size
    fixture.detectChanges();
    expect(host.last).toEqual({ active: 'size', direction: 'desc' });
    expect(headers[0].getAttribute('aria-sort')).toBe('none');
  });

  it('disables the button (and drops the arrow) when the header is disabled', async () => {
    @Component({
      imports: [MkSort, MkSortHeader],
      template: `<table mkSort>
        <thead>
          <tr>
            <th mkSortHeader="name" mkSortHeaderDisabled>Name</th>
          </tr>
        </thead>
      </table>`,
    })
    class DisabledHost {}
    const f = TestBed.createComponent(DisabledHost);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector('th button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(f.nativeElement.querySelector('.mk-sort-header__arrow')).toBeNull();
    f.destroy();
  });
});
