import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { MK_OVERLAY_DATA, MkOverlayRef } from '@mk-kit/ui/core';
import { MkBarcodeScanner } from './barcode-scanner';
import { MkBarcodeScannerDialog } from './barcode-scanner-dialog';

const start = vi.fn();
const stop = vi.fn(async () => undefined);
const clear = vi.fn(async () => undefined);
vi.mock('html5-qrcode', () => ({
  Html5QrcodeSupportedFormats: { QR_CODE: 0, EAN_13: 1, EAN_8: 2, CODE_128: 3, CODE_39: 4, UPC_A: 5, UPC_E: 6 },
  Html5Qrcode: class {
    isScanning = true;
    constructor(public id: string, public config: unknown) {}
    start = start;
    stop = stop;
    clear = clear;
  },
}));

@Component({
  imports: [MkBarcodeScanner],
  template: `<mk-barcode-scanner [formats]="formats()" (scanned)="hits.push($event)" (failed)="errors.push($event)" />`,
})
class Host {
  formats = signal<('QR_CODE' | 'EAN_13')[]>(['QR_CODE', 'EAN_13']);
  hits: string[] = [];
  errors: string[] = [];
}

async function flush() {
  // The decoder arrives through a dynamic import (a macrotask under Vite).
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
}

describe('MkBarcodeScanner', () => {
  it('starts the rear camera with the chosen formats and emits the first hit, then stops', async () => {
    start.mockReset().mockImplementation(async () => undefined);
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await flush();
    expect(start).toHaveBeenCalledTimes(1);
    const [camera, opts, onHit] = start.mock.calls[0] as [unknown, { fps: number }, (t: string) => void];
    expect(camera).toEqual({ facingMode: 'environment' });
    expect(opts.fps).toBe(10);
    onHit('5901234123457');
    await flush();
    expect(fixture.componentInstance.hits).toEqual(['5901234123457']);
    expect(stop).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
  });

  it('reports a camera failure through failed and the built-in message', async () => {
    start.mockReset().mockImplementation(async () => {
      throw new Error('NotAllowedError');
    });
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await flush();
    expect(fixture.componentInstance.errors).toEqual(['NotAllowedError']);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')!.textContent).toContain('NotAllowedError');
  });
});

describe('MkBarcodeScannerDialog', () => {
  it('closes with the scanned text and with null on cancel', async () => {
    start.mockReset().mockImplementation(async () => undefined);
    const close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: MkOverlayRef, useValue: { close } },
        { provide: MK_OVERLAY_DATA, useValue: { title: 'Zeskanuj' } },
      ],
    });
    const fixture = TestBed.createComponent(MkBarcodeScannerDialog);
    fixture.detectChanges();
    await flush();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Zeskanuj');
    const onHit = start.mock.calls[0][2] as (t: string) => void;
    onHit('ABC');
    await flush();
    expect(close).toHaveBeenCalledWith('ABC');
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(close).toHaveBeenCalledWith(null);
  });
});
