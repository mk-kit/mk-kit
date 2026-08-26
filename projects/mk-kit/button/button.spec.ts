import { Component, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkButton } from './button';
import type { MkTone } from '@mk-kit/ui/core';

@Component({
  imports: [MkButton],
  template: `<button
    mkButton
    [tone]="tone()"
    [disabled]="disabled()"
    [loading]="loading()"
    (click)="clicks = clicks + 1"
  >
    Save
  </button>`,
})
class Host {
  readonly tone = signal<MkTone>('primary');
  readonly disabled = signal(false);
  readonly loading = signal(false);
  clicks = 0;
}

describe('MkButton', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let btn: HTMLButtonElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    btn = fixture.nativeElement.querySelector('button');
  });

  it('enhances the native button with the mk-button class', () => {
    expect(btn.classList.contains('mk-button')).toBe(true);
  });

  it('reflects the tone as a data attribute', async () => {
    expect(btn.getAttribute('data-tone')).toBe('primary');
    host.tone.set('danger');
    await fixture.whenStable();
    expect(btn.getAttribute('data-tone')).toBe('danger');
  });

  it('sets native disabled and blocks clicks when disabled', async () => {
    host.disabled.set(true);
    await fixture.whenStable();
    expect(btn.disabled).toBe(true);
    btn.click();
    expect(host.clicks).toBe(0);
  });

  it('marks aria-busy while loading', async () => {
    host.loading.set(true);
    await fixture.whenStable();
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('fires clicks when enabled', () => {
    btn.click();
    expect(host.clicks).toBe(1);
  });
});
