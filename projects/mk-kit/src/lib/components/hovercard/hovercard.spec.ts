import { Component, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkHovercard } from './hovercard';
import { MkHovercardTrigger } from './hovercard-trigger';

@Component({
  standalone: true,
  imports: [MkHovercard, MkHovercardTrigger],
  template: `
    <a href="#" [mkHovercardFor]="card">@ada</a>
    <mk-hovercard #card [openDelay]="300" [closeDelay]="200">
      <strong>Ada Lovelace</strong>
    </mk-hovercard>
  `,
})
class HostComponent {
  readonly card = viewChild.required(MkHovercard);
}

describe('MkHovercard', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let trigger: HTMLAnchorElement;
  let card: MkHovercard;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    card = host.card();
    trigger = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('opens the card on mouseenter after openDelay', () => {
    expect(card.opened()).toBe(false);
    trigger.dispatchEvent(new MouseEvent('mouseenter'));

    // Not yet — still within the open delay.
    vi.advanceTimersByTime(299);
    expect(card.opened()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(card.opened()).toBe(true);
  });

  it('closes the card on mouseleave after closeDelay', () => {
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);
    expect(card.opened()).toBe(true);

    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(199);
    expect(card.opened()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(card.opened()).toBe(false);
  });

  it('cancels the pending close when the pointer enters the card', () => {
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);
    expect(card.opened()).toBe(true);

    // Pointer leaves the trigger — close is scheduled...
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(100);
    // ...but then enters the card, which must cancel the close.
    (card as any).onCardEnter();

    vi.advanceTimersByTime(500);
    expect(card.opened()).toBe(true);
  });

  it('closing the card via mouseleave schedules a close', () => {
    card.open(trigger);
    expect(card.opened()).toBe(true);

    (card as any).onCardLeave();
    vi.advanceTimersByTime(200);
    expect(card.opened()).toBe(false);
  });

  it('Escape closes an open card immediately', () => {
    card.open(trigger);
    expect(card.opened()).toBe(true);

    (card as any).onEscape(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(card.opened()).toBe(false);
  });
});
