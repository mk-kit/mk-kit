import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkHotkey } from './hotkey.directive';
import {
  MkHotkeysService,
  mkMatchesHotkey,
  mkParseHotkey,
} from './hotkeys.service';

/** Dispatch a synthetic keydown on `target` (defaults to document). */
function keydown(
  init: KeyboardEventInit,
  target: EventTarget = document,
): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
}

describe('mkParseHotkey', () => {
  it('parses modifiers and the trigger key', () => {
    expect(mkParseHotkey('ctrl+shift+p')).toEqual({
      key: 'p',
      mod: false,
      ctrl: true,
      meta: false,
      alt: false,
      shift: true,
    });
  });

  it('parses the mod alias and a bare key', () => {
    expect(mkParseHotkey('mod+k').mod).toBe(true);
    expect(mkParseHotkey('mod+k').key).toBe('k');
    expect(mkParseHotkey('?').key).toBe('?');
  });

  it('normalizes aliases (esc, space)', () => {
    expect(mkParseHotkey('esc').key).toBe('escape');
    expect(mkParseHotkey('space').key).toBe(' ');
  });
});

describe('mkMatchesHotkey', () => {
  it('matches a KeyboardEvent with key "k" + ctrlKey against "ctrl+k"', () => {
    const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    expect(mkMatchesHotkey(e, 'ctrl+k')).toBe(true);
  });

  it('is case-insensitive on the key', () => {
    const e = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true, shiftKey: true });
    expect(mkMatchesHotkey(e, 'ctrl+shift+k')).toBe(true);
  });

  it('requires exact modifier flags', () => {
    const e = new KeyboardEvent('keydown', { key: 'k' });
    expect(mkMatchesHotkey(e, 'ctrl+k')).toBe(false);
  });

  it('maps mod to ctrlKey on non-mac platforms', () => {
    const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    // jsdom navigator.platform is not "Mac", so mod === ctrl here.
    expect(mkMatchesHotkey(e, 'mod+k')).toBe(true);
  });

  it('ignores shift for symbol keys like "?"', () => {
    const e = new KeyboardEvent('keydown', { key: '?', shiftKey: true });
    expect(mkMatchesHotkey(e, '?')).toBe(true);
  });
});

describe('MkHotkeysService', () => {
  let service: MkHotkeysService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(MkHotkeysService);
  });

  afterEach(() => service.unregisterAll());

  it('dispatches a registered combo to its handler', () => {
    const handler = vi.fn();
    service.register('ctrl+k', handler);
    keydown({ key: 'k', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('stops calling the handler after the disposer runs', () => {
    const handler = vi.fn();
    const off = service.register('ctrl+k', handler);
    keydown({ key: 'k', ctrlKey: true });
    off();
    keydown({ key: 'k', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('preventDefault is applied only when requested', () => {
    service.register('ctrl+k', () => {}, { preventDefault: true });
    const e = keydown({ key: 'k', ctrlKey: true });
    expect(e.defaultPrevented).toBe(true);
  });

  it('ignores hotkeys while an input is focused', () => {
    const handler = vi.fn();
    service.register('ctrl+k', handler);
    const input = document.createElement('input');
    document.body.appendChild(input);
    keydown({ key: 'k', ctrlKey: true }, input);
    expect(handler).not.toHaveBeenCalled();
    input.remove();
  });

  it('fires inside an input when allowInInput is set', () => {
    const handler = vi.fn();
    service.register('ctrl+k', handler, { allowInInput: true });
    const input = document.createElement('input');
    document.body.appendChild(input);
    keydown({ key: 'k', ctrlKey: true }, input);
    expect(handler).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it('supports a two-step chord ("g i")', () => {
    const handler = vi.fn();
    service.register('g i', handler);
    keydown({ key: 'g' });
    keydown({ key: 'i' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('drops a pending chord after the timeout', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    service.register('g i', handler);
    keydown({ key: 'g' });
    vi.advanceTimersByTime(1100);
    keydown({ key: 'i' });
    expect(handler).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

@Component({
  imports: [MkHotkey],
  template: `
    <button mkHotkey="ctrl+b" (click)="clicks.set(clicks() + 1)">Bold</button>
    <div mkHotkey="?" (mkHotkeyPressed)="help.set(help() + 1)"></div>
  `,
})
class HotkeyHost {
  readonly clicks = signal(0);
  readonly help = signal(0);
}

describe('MkHotkey directive', () => {
  let fixture: ComponentFixture<HotkeyHost>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(HotkeyHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.inject(MkHotkeysService).unregisterAll();
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('clicks the host button when the hotkey fires', () => {
    keydown({ key: 'b', ctrlKey: true });
    expect(fixture.componentInstance.clicks()).toBe(1);
  });

  it('emits mkHotkeyPressed for a non-button host', () => {
    keydown({ key: '?', shiftKey: true });
    expect(fixture.componentInstance.help()).toBe(1);
  });

  it('unregisters on destroy', () => {
    fixture.destroy();
    keydown({ key: 'b', ctrlKey: true });
    expect(fixture.componentInstance.clicks()).toBe(0);
  });
});
