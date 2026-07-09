import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkFileUpload, MkUploadRejection } from './file-upload';

function file(name: string, type: string, size: number): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('MkFileUpload', () => {
  let fixture: ComponentFixture<MkFileUpload>;
  let fu: MkFileUpload;

  beforeEach(() => {
    (globalThis.URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    (globalThis.URL as any).revokeObjectURL = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkFileUpload);
    fu = fixture.componentInstance;
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const add = (files: File[]) => (fu as any).addFiles(files as unknown as FileList);

  it('accepts a valid file and emits filesSelected', () => {
    const selected = vi.fn();
    fu.filesSelected.subscribe(selected);
    add([file('a.png', 'image/png', 1000)]);
    expect(fu.files().length).toBe(1);
    expect(fu.files()[0].name).toBe('a.png');
    expect(selected).toHaveBeenCalledOnce();
  });

  it('rejects a file over maxSize', () => {
    fixture.componentRef.setInput('maxSize', 500);
    fixture.detectChanges();
    let rejections: MkUploadRejection[] = [];
    fu.rejected.subscribe((r) => (rejections = r));
    add([file('big.png', 'image/png', 1000)]);
    expect(fu.files().length).toBe(0);
    expect(rejections[0].reason).toBe('size');
  });

  it('rejects a file that does not match accept', () => {
    fixture.componentRef.setInput('accept', 'image/*');
    fixture.detectChanges();
    let rejections: MkUploadRejection[] = [];
    fu.rejected.subscribe((r) => (rejections = r));
    add([file('notes.txt', 'text/plain', 100)]);
    expect(fu.files().length).toBe(0);
    expect(rejections[0].reason).toBe('type');
  });

  it('matches an extension-based accept', () => {
    fixture.componentRef.setInput('accept', '.pdf,.doc');
    fixture.detectChanges();
    add([file('report.pdf', 'application/pdf', 100), file('x.png', 'image/png', 100)]);
    expect(fu.files().map((f) => f.name)).toEqual(['report.pdf']);
  });

  it('enforces maxFiles', () => {
    fixture.componentRef.setInput('maxFiles', 2);
    fixture.detectChanges();
    add([
      file('1.png', 'image/png', 10),
      file('2.png', 'image/png', 10),
      file('3.png', 'image/png', 10),
    ]);
    expect(fu.files().length).toBe(2);
  });

  it('single mode replaces the previous file', () => {
    fixture.componentRef.setInput('multiple', false);
    fixture.detectChanges();
    add([file('first.png', 'image/png', 10)]);
    add([file('second.png', 'image/png', 10)]);
    expect(fu.files().length).toBe(1);
    expect(fu.files()[0].name).toBe('second.png');
  });

  it('creates a preview URL for image files only', () => {
    add([file('pic.png', 'image/png', 10), file('doc.txt', 'text/plain', 10)]);
    const [img, txt] = fu.files();
    expect(img.previewUrl).toBe('blob:mock');
    expect(txt.previewUrl).toBeUndefined();
  });

  it('runs uploadFn and marks the file successful', async () => {
    const uploadFn = vi.fn(async (_f: File, onProgress: (p: number) => void) => {
      onProgress(50);
      onProgress(100);
    });
    fixture.componentRef.setInput('uploadFn', uploadFn);
    fixture.detectChanges();
    add([file('a.png', 'image/png', 10)]);
    await Promise.resolve();
    await Promise.resolve();
    expect(uploadFn).toHaveBeenCalledOnce();
    expect(fu.files()[0].status).toBe('success');
    expect(fu.files()[0].progress).toBe(100);
  });

  it('marks the file errored when uploadFn rejects', async () => {
    const uploadFn = vi.fn(async () => {
      throw new Error('boom');
    });
    fixture.componentRef.setInput('uploadFn', uploadFn);
    fixture.detectChanges();
    add([file('a.png', 'image/png', 10)]);
    await Promise.resolve();
    await Promise.resolve();
    expect(fu.files()[0].status).toBe('error');
    expect(fu.files()[0].error).toBe('boom');
  });

  it('removes a tracked file', () => {
    add([file('a.png', 'image/png', 10)]);
    (fu as any).remove(fu.files()[0]);
    expect(fu.files().length).toBe(0);
  });

  it('formats byte sizes', () => {
    const fmt = (n: number) => (fu as any).formatBytes(n);
    expect(fmt(512)).toBe('512 B');
    expect(fmt(1536)).toBe('1.5 KB');
    expect(fmt(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
