import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkClickOutside } from './click-outside';
import { MkCopyToClipboard } from './copy-to-clipboard';

@Component({
  imports: [MkClickOutside],
  template: `<div mkClickOutside (mkClickOutside)="hits.set(hits() + 1)">
    <button id="inside">in</button>
  </div>`,
})
class ClickOutsideHost {
  readonly hits = signal(0);
}

@Component({
  imports: [MkCopyToClipboard],
  template: `<button [mkCopyToClipboard]="text" (copiedText)="last.set($event)">
    copy
  </button>`,
})
class CopyHost {
  readonly text = 'secret-token';
  readonly last = signal('');
}

describe('MkClickOutside', () => {
  let fixture: ComponentFixture<ClickOutsideHost>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ClickOutsideHost);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('emits when a pointerdown lands outside the host', () => {
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.hits()).toBe(1);
    outside.remove();
  });

  it('does not emit for a pointerdown inside the host', () => {
    const inside = fixture.nativeElement.querySelector('#inside') as HTMLElement;
    inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.hits()).toBe(0);
  });
});

describe('MkCopyToClipboard', () => {
  let fixture: ComponentFixture<CopyHost>;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    // The directive reads document.defaultView.navigator.clipboard.
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(CopyHost);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('copies the text on click and emits copiedText', async () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    button.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('secret-token');
    expect(fixture.componentInstance.last()).toBe('secret-token');
  });

  it('sets justCopied true after a successful copy', async () => {
    const dir = fixture.debugElement
      .query((n) => n.name === 'button')
      .injector.get(MkCopyToClipboard);
    await dir.copy();
    expect(dir.justCopied()).toBe(true);
  });
});
