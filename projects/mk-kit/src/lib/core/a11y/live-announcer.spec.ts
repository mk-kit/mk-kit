import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MkLiveAnnouncer } from './live-announcer.service';

describe('MkLiveAnnouncer', () => {
  let announcer: MkLiveAnnouncer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    announcer = TestBed.inject(MkLiveAnnouncer);
  });

  afterEach(() => {
    document
      .querySelectorAll('.mk-visually-hidden')
      .forEach((el) => el.remove());
  });

  it('creates a single live region on first announce', () => {
    announcer.announce('hello');
    const regions = document.querySelectorAll('.mk-visually-hidden');
    expect(regions.length).toBe(1);
  });

  it('reflects the requested politeness', () => {
    announcer.announce('urgent', 'assertive');
    const region = document.querySelector('.mk-visually-hidden');
    expect(region?.getAttribute('aria-live')).toBe('assertive');
  });

  it('reuses the same region across announcements', () => {
    announcer.announce('one');
    announcer.announce('two', 'polite');
    expect(document.querySelectorAll('.mk-visually-hidden').length).toBe(1);
  });
});
