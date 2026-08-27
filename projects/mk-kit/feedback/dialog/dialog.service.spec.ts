import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkDialogService } from './dialog.service';

describe('MkDialogService — confirm / alert / prompt', () => {
  let service: MkDialogService;
  let appRef: ApplicationRef;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(MkDialogService);
    appRef = TestBed.inject(ApplicationRef);
  });

  afterEach(() => {
    // Tear down any overlay left open by a test.
    document
      .querySelectorAll('.mk-overlay-container')
      .forEach((n) => n.remove());
  });

  /** All buttons currently rendered in the overlay, by trimmed label. */
  function overlayButtons(): HTMLButtonElement[] {
    return Array.from(
      document.querySelectorAll<HTMLButtonElement>('.mk-overlay-panel button'),
    );
  }
  function clickButton(label: string): void {
    const btn = overlayButtons().find(
      (b) => b.textContent?.trim() === label,
    );
    btn?.click();
  }

  it('confirm resolves true on confirm and false on cancel', async () => {
    const confirmed = service.confirm({ title: 'Delete?', message: 'Sure?' });
    appRef.tick();
    expect(overlayButtons().map((b) => b.textContent?.trim())).toEqual([
      'Cancel',
      'Confirm',
    ]);
    clickButton('Confirm');
    expect(await confirmed).toBe(true);

    const cancelled = service.confirm({ title: 'Delete?', message: 'Sure?' });
    appRef.tick();
    clickButton('Cancel');
    expect(await cancelled).toBe(false);
  });

  it('alert shows a single button and resolves on dismiss', async () => {
    const done = service.alert({ title: 'Heads up', message: 'Saved.' });
    appRef.tick();
    const labels = overlayButtons().map((b) => b.textContent?.trim());
    expect(labels).toContain('OK');
    expect(labels).not.toContain('Cancel');
    clickButton('OK');
    await expect(done).resolves.toBeUndefined();
  });

  it('prompt resolves with the typed value', async () => {
    const result = service.prompt({
      title: 'Rename',
      label: 'Name',
      value: 'draft',
    });
    appRef.tick();
    const input = document.querySelector(
      '.mk-overlay-panel input',
    ) as HTMLInputElement;
    expect(input.value).toBe('draft');
    input.value = 'final';
    input.dispatchEvent(new Event('input'));
    appRef.tick();
    clickButton('OK');
    expect(await result).toBe('final');
  });

  it('prompt focuses its input once rendered', async () => {
    // jsdom has no layout, so the overlay's focus trap cannot see the input as
    // tabbable and parks focus on the panel afterwards; assert the prompt's own
    // focus call reached the input element (it used to throw: the template ref
    // resolved to the MkInput directive, not the element).
    const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
    service.prompt({ title: 'Rename', label: 'Name' });
    appRef.tick();
    await new Promise((r) => setTimeout(r));
    const input = document.querySelector('.mk-overlay-panel input') as HTMLInputElement;
    expect(focus.mock.instances).toContain(input);
    focus.mockRestore();
  });

  it('prompt resolves null on cancel', async () => {
    const result = service.prompt({ title: 'Rename' });
    appRef.tick();
    clickButton('Cancel');
    expect(await result).toBeNull();
  });

  it('a required prompt disables OK until a value is entered', async () => {
    service.prompt({ title: 'Rename', required: true });
    appRef.tick();
    const ok = overlayButtons().find((b) => b.textContent?.trim() === 'OK')!;
    expect(ok.disabled).toBe(true);

    const input = document.querySelector(
      '.mk-overlay-panel input',
    ) as HTMLInputElement;
    input.value = 'x';
    input.dispatchEvent(new Event('input'));
    appRef.tick();
    expect(ok.disabled).toBe(false);
  });
});
