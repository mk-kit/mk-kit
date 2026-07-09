import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkTourService } from './tour.service';
import type { MkTourStep } from './tour-popup';

describe('MkTourService', () => {
  let targetA: HTMLElement;
  let targetB: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });

    targetA = document.createElement('div');
    targetA.id = 'tour-a';
    targetA.textContent = 'Target A';
    targetB = document.createElement('div');
    targetB.id = 'tour-b';
    targetB.textContent = 'Target B';
    document.body.append(targetA, targetB);
  });

  afterEach(() => {
    // End any running tour, then scrub any stray DOM the tour rendered.
    TestBed.inject(MkTourService).end();
    targetA.remove();
    targetB.remove();
    document
      .querySelectorAll('.mk-tour__popup, .mk-tour-scrim, mk-tour-popup')
      .forEach((el) => el.remove());
  });

  const steps: MkTourStep[] = [
    { target: '#tour-a', title: 'First', body: 'This is the first step body.' },
    { target: '#tour-b', body: 'This is the second step body.' },
  ];

  function popup(): HTMLElement | null {
    return document.body.querySelector<HTMLElement>('.mk-tour__popup');
  }

  it('renders the first step popup in the body', () => {
    const service = TestBed.inject(MkTourService);
    service.start(steps);
    TestBed.inject(ApplicationRef).tick();

    expect(service.running()).toBe(true);
    expect(service.index()).toBe(0);
    const el = popup();
    expect(el).toBeTruthy();
    expect(el!.textContent).toContain('This is the first step body.');
    expect(el!.textContent).toContain('Step 1 of 2');
    expect(targetA.classList.contains('mk-tour-target')).toBe(true);
  });

  it('next() advances the step index and updates the popup', () => {
    const service = TestBed.inject(MkTourService);
    const app = TestBed.inject(ApplicationRef);
    service.start(steps);
    app.tick();

    service.next();
    app.tick();

    expect(service.index()).toBe(1);
    const el = popup();
    expect(el!.textContent).toContain('This is the second step body.');
    expect(el!.textContent).toContain('Step 2 of 2');
    // Highlight moved off the first target and onto the second.
    expect(targetA.classList.contains('mk-tour-target')).toBe(false);
    expect(targetB.classList.contains('mk-tour-target')).toBe(true);
  });

  it('end() removes the popup, scrim, and target highlight', () => {
    const service = TestBed.inject(MkTourService);
    const app = TestBed.inject(ApplicationRef);
    service.start(steps);
    app.tick();
    expect(popup()).toBeTruthy();

    service.end();
    app.tick();

    expect(service.running()).toBe(false);
    expect(service.index()).toBe(-1);
    expect(popup()).toBeNull();
    expect(document.querySelector('.mk-tour-scrim')).toBeNull();
    expect(targetA.classList.contains('mk-tour-target')).toBe(false);
  });

  it('start() resolves its promise when the tour ends', async () => {
    const service = TestBed.inject(MkTourService);
    const done = service.start(steps);
    TestBed.inject(ApplicationRef).tick();
    service.end();
    await expect(done).resolves.toBeUndefined();
  });

  it('skips a step whose target is missing', () => {
    const service = TestBed.inject(MkTourService);
    const app = TestBed.inject(ApplicationRef);
    service.start([
      { target: '#does-not-exist', body: 'Skipped step.' },
      { target: '#tour-b', body: 'Reached step.' },
    ]);
    app.tick();

    expect(service.index()).toBe(1);
    expect(popup()!.textContent).toContain('Reached step.');
  });
});
