import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MK_I18N } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';

/** Upload lifecycle state for a single file. */
export type MkUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

/** A file tracked by {@link MkFileUpload}. */
export interface MkUploadFile {
  /** Stable id for tracking + removal. */
  id: string;
  /** The underlying browser `File`. */
  file: File;
  /** File name. */
  name: string;
  /** Size in bytes. */
  size: number;
  /** Upload lifecycle state. */
  status: MkUploadStatus;
  /** Upload progress, 0–100. */
  progress: number;
  /** Failure reason (validation or upload error). */
  error?: string;
  /** Object URL for an image preview, when the file is an image. */
  previewUrl?: string;
}

/** Why a dropped/selected file was rejected. */
export interface MkUploadRejection {
  file: File;
  reason: 'type' | 'size' | 'maxFiles';
  message: string;
}

/**
 * Uploads the given file, reporting progress via `onProgress` (0–100) and
 * resolving on success / rejecting (optionally with an `Error`) on failure.
 */
export type MkUploadFn = (
  file: File,
  onProgress: (percent: number) => void,
) => Promise<void>;

let uploadSeq = 0;

/**
 * FileUpload — an accessible click-or-drag dropzone with multi-file support,
 * type/size/count validation, image thumbnails and per-file progress.
 *
 * Provide an `uploadFn` to stream each accepted file to your backend (it
 * reports progress and resolves/rejects); with `autoUpload` (on by default when
 * an `uploadFn` is set) files upload as soon as they are accepted. Without one,
 * the component just validates + tracks files and emits `filesSelected` for you
 * to handle. The tracked list is a two-way `files` model so you can reset it.
 *
 * Keyboard: the dropzone is a button — Enter/Space opens the native picker.
 * Rejections are announced through a polite live region.
 *
 * ```html
 * <mk-file-upload accept="image/*" multiple [maxSize]="5_000_000"
 *   [uploadFn]="upload" (filesSelected)="onFiles($event)" [(files)]="files" />
 * ```
 */
@Component({
  selector: 'mk-file-upload',
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-file-upload',
    '[class.mk-file-upload--disabled]': 'disabled()',
    '[class.mk-file-upload--dragging]': 'dragging()',
    '[class.mk-file-upload--invalid]': 'invalid()',
  },
})
export class MkFileUpload {
  protected readonly i18n = inject(MK_I18N);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  /** Native `accept` filter, e.g. `image/*` or `.pdf,.doc`. */
  readonly accept = input<string>('');
  /** Allow selecting more than one file. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Maximum size per file in bytes (0 = unlimited). */
  readonly maxSize = input(0, { transform: numberAttribute });
  /** Maximum number of files kept (0 = unlimited). */
  readonly maxFiles = input(0, { transform: numberAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force invalid styling when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Primary dropzone prompt. */
  readonly label = input(this.i18n.dropzoneLabel);
  /** Secondary hint under the prompt (e.g. accepted types / size). */
  readonly hint = input('');
  /** Hide the built-in file list (render your own from `files`). */
  readonly hideList = input(false, { transform: booleanAttribute });
  /** Async upload handler. When set, files upload automatically. */
  readonly uploadFn = input<MkUploadFn | null>(null);
  /** Upload accepted files immediately. Defaults to true when `uploadFn` set. */
  readonly autoUpload = input<boolean | undefined>(undefined);

  /** The tracked files (two-way, so consumers can reset the list). */
  readonly files = model<MkUploadFile[]>([]);

  /** Emits the accepted `File`s each time files are added. */
  readonly filesSelected = output<File[]>();
  /** Emits rejected files with a reason. */
  readonly rejected = output<MkUploadRejection[]>();
  /** Emits a file once its upload succeeds. */
  readonly uploaded = output<MkUploadFile>();
  /** Emits a file when it is removed from the list. */
  readonly removed = output<MkUploadFile>();

  protected readonly dragging = signal(false);
  /** Latest rejection messages, surfaced in a polite live region. */
  protected readonly announcement = signal('');

  readonly inputId = mkUniqueId('mk-file-upload');

  protected readonly shouldAutoUpload = computed(
    () => this.autoUpload() ?? !!this.uploadFn(),
  );

  protected openPicker(): void {
    if (this.disabled()) return;
    this.inputRef()?.nativeElement.click();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openPicker();
    }
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(input.files);
    // Reset so re-selecting the same file fires `change` again.
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.dragging.set(false);
    if (event.dataTransfer?.files) this.addFiles(event.dataTransfer.files);
  }

  /** Validate + track a batch of files, uploading them when configured. */
  private addFiles(list: FileList): void {
    const incoming = this.multiple() ? Array.from(list) : list[0] ? [list[0]] : [];
    const accepted: MkUploadFile[] = [];
    const rejections: MkUploadRejection[] = [];
    const max = this.maxFiles();
    let count = this.multiple() ? this.files().length : 0;

    for (const file of incoming) {
      if (!this.matchesAccept(file)) {
        rejections.push({ file, reason: 'type', message: `${file.name}: unsupported type` });
        continue;
      }
      if (this.maxSize() > 0 && file.size > this.maxSize()) {
        rejections.push({
          file,
          reason: 'size',
          message: `${file.name}: exceeds ${this.formatBytes(this.maxSize())}`,
        });
        continue;
      }
      if (max > 0 && count >= max) {
        rejections.push({ file, reason: 'maxFiles', message: `${file.name}: over the ${max}-file limit` });
        continue;
      }
      accepted.push(this.toItem(file));
      count++;
    }

    if (accepted.length) {
      // In single mode a new file replaces the previous one.
      const base = this.multiple() ? this.files() : [];
      if (!this.multiple()) this.files().forEach((i) => this.revoke(i));
      this.files.set([...base, ...accepted]);
      this.filesSelected.emit(accepted.map((i) => i.file));
      if (this.shouldAutoUpload() && this.uploadFn()) {
        accepted.forEach((i) => this.upload(i));
      }
    }
    if (rejections.length) {
      this.rejected.emit(rejections);
      this.announcement.set(rejections.map((r) => r.message).join('. '));
    }
  }

  /** Remove a tracked file. */
  protected remove(item: MkUploadFile): void {
    this.revoke(item);
    this.files.set(this.files().filter((i) => i.id !== item.id));
    this.removed.emit(item);
  }

  /** Retry a failed upload. */
  protected retry(item: MkUploadFile): void {
    if (this.uploadFn()) this.upload(item);
  }

  private async upload(item: MkUploadFile): Promise<void> {
    const fn = this.uploadFn();
    if (!fn) return;
    this.patch(item.id, { status: 'uploading', progress: 0, error: undefined });
    try {
      await fn(item.file, (pct) =>
        this.patch(item.id, { progress: Math.max(0, Math.min(100, Math.round(pct))) }),
      );
      this.patch(item.id, { status: 'success', progress: 100 });
      const done = this.files().find((i) => i.id === item.id);
      if (done) this.uploaded.emit(done);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : this.i18n.uploadFailed;
      this.patch(item.id, { status: 'error', error: message });
    }
  }

  /** Immutably update one tracked file by id. */
  private patch(id: string, partial: Partial<MkUploadFile>): void {
    this.files.set(
      this.files().map((i) => (i.id === id ? { ...i, ...partial } : i)),
    );
  }

  private toItem(file: File): MkUploadFile {
    const isImage = file.type.startsWith('image/');
    return {
      id: `mk-upload-${uploadSeq++}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      previewUrl:
        isImage && this.isBrowser
          ? this.document.defaultView?.URL.createObjectURL(file)
          : undefined,
    };
  }

  private revoke(item: MkUploadFile): void {
    if (item.previewUrl && this.isBrowser) {
      this.document.defaultView?.URL.revokeObjectURL(item.previewUrl);
    }
  }

  private matchesAccept(file: File): boolean {
    const accept = this.accept().trim();
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept.split(',').some((raw) => {
      const token = raw.trim().toLowerCase();
      if (!token) return false;
      if (token.startsWith('.')) return name.endsWith(token);
      if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
      return type === token;
    });
  }

  protected formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
  }

  /**
   * Revoke preview object-URLs for items that leave the two-way `files` model
   * externally (e.g. a consumer resetting the list), not just via `remove()`.
   */
  private readonly trackedPreviews = new Map<string, string>();
  private readonly trackPreviews = effect(() => {
    const current = this.files();
    const liveIds = new Set(current.map((i) => i.id));
    for (const [id, url] of this.trackedPreviews) {
      if (!liveIds.has(id)) {
        if (this.isBrowser) this.document.defaultView?.URL.revokeObjectURL(url);
        this.trackedPreviews.delete(id);
      }
    }
    for (const item of current) {
      if (item.previewUrl) this.trackedPreviews.set(item.id, item.previewUrl);
    }
  });

  ngOnDestroy(): void {
    if (this.isBrowser) {
      for (const url of this.trackedPreviews.values()) {
        this.document.defaultView?.URL.revokeObjectURL(url);
      }
      this.trackedPreviews.clear();
    }
  }
}
