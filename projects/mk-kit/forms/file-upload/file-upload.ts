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
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { MK_I18N } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { mkValidatorChange } from '@mkornas/ui/core';

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

/**
 * What {@link MkFileUpload} publishes as its form value: the raw browser
 * `File`s (the default, and what you would send in a `FormData`), or the full
 * tracked items including upload status and progress.
 */
export type MkUploadValueFormat = 'file' | 'item';

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
 * Implements `ControlValueAccessor` and `Validator`, so it drops into a
 * reactive form like any other control. The form value is `File[]` by default
 * (`[valueFormat]="'item'"` publishes the tracked `MkUploadFile[]` instead),
 * and `accept` / `maxSize` / `maxFiles` are enforced as validation errors as
 * well as at pick time — a list written in from the model side is checked too.
 *
 * ```html
 * <mk-file-upload accept="image/*" multiple [maxSize]="5_000_000"
 *   [uploadFn]="upload" (filesSelected)="onFiles($event)" [(files)]="files" />
 *
 * <mk-file-upload formControlName="attachments" accept=".pdf" [maxFiles]="3" />
 * ```
 */
@Component({
  selector: 'mk-file-upload',
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-file-upload',
    '[class.mk-file-upload--disabled]': 'isDisabled()',
    '[class.mk-file-upload--dragging]': 'dragging()',
    '[class.mk-file-upload--invalid]': 'invalid()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkFileUpload),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkFileUpload),
      multi: true,
    },
  ],
})
export class MkFileUpload implements ControlValueAccessor, Validator {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
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
  /** Shape of the value published to a bound form control. */
  readonly valueFormat = input<MkUploadValueFormat>('file');

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

  /** Set by reactive forms through `setDisabledState`. */
  private readonly cvaDisabled = signal(false);
  /** Disabled either by the `disabled` input or by the bound form control. */
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  private onChange: (value: File[] | MkUploadFile[]) => void = () => {};
  private onTouched: () => void = () => {};
  /** Guards `writeValue` from echoing back through `onChange`. */
  private writing = false;

  protected readonly shouldAutoUpload = computed(
    () => this.autoUpload() ?? !!this.uploadFn(),
  );

  protected openPicker(): void {
    if (this.isDisabled()) return;
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
    if (this.isDisabled()) return;
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (this.isDisabled()) return;
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
        rejections.push({ file, reason: 'type', message: this.i18n.fileRejectedType(file.name) });
        continue;
      }
      if (this.maxSize() > 0 && file.size > this.maxSize()) {
        rejections.push({
          file,
          reason: 'size',
          message: this.i18n.fileRejectedSize(file.name, this.formatBytes(this.maxSize())),
        });
        continue;
      }
      if (max > 0 && count >= max) {
        rejections.push({ file, reason: 'maxFiles', message: this.i18n.fileRejectedCount(file.name, max) });
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

  /** Marks the control touched once focus leaves the dropzone and its list. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    this.onTouched();
  }

  // --- ControlValueAccessor ---------------------------------------------------

  /** The value published to a bound form control, in the requested shape. */
  private readonly formValue = computed<File[] | MkUploadFile[]>(() =>
    this.valueFormat() === 'item'
      ? this.files()
      : this.files().map((i) => i.file),
  );

  /**
   * Last value handed to `onChange`, for change detection against `formValue`.
   * `null` suppresses the next emission — used for the initial render and for
   * every `writeValue`, so writing from the model side never dirties the
   * control or loops back.
   */
  private lastEmitted: readonly unknown[] | null = null;

  private readonly emitOnChange = effect(() => {
    const value = this.formValue();
    const previous = this.lastEmitted;
    this.lastEmitted = value;
    if (previous === null) return;
    // Upload progress replaces item objects without changing the file set, so
    // in `file` format those ticks compare equal and stay off the form value.
    const same =
      previous.length === value.length &&
      previous.every((entry, i) => entry === value[i]);
    if (!same) this.onChange(value);
  });

  writeValue(value: unknown): void {
    this.lastEmitted = null;
    const list = Array.isArray(value) ? value : [];
    this.files.set(
      list
        .map((entry) => this.adopt(entry))
        .filter((item): item is MkUploadFile => item !== null),
    );
  }
  registerOnChange(fn: (value: File[] | MkUploadFile[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  /** Accepts either shape of written value; drops anything unrecognisable. */
  private adopt(entry: unknown): MkUploadFile | null {
    if (entry instanceof File) return this.toItem(entry);
    const item = entry as MkUploadFile | null;
    return item?.file instanceof File ? item : null;
  }

  // --- Validator --------------------------------------------------------------

  private readonly validatorChange = mkValidatorChange(() => {
    this.accept();
    this.maxSize();
    this.maxFiles();
  });

  /**
   * Applies the same `accept` / `maxSize` / `maxFiles` rules the dropzone
   * enforces at pick time, so a list written in from the model side — which
   * never goes through that path — is checked too. An empty list passes;
   * compose with `Validators.required` to reject it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!Array.isArray(value) || !value.length) return null;
    const files = value
      .map((entry) => (entry instanceof File ? entry : (entry?.file as File)))
      .filter((f): f is File => f instanceof File);

    const max = this.maxFiles();
    if (max > 0 && files.length > max) {
      return { mkMaxItems: { max, actual: files.length } };
    }

    const maxSize = this.maxSize();
    if (maxSize > 0) {
      const tooBig = files.find((f) => f.size > maxSize);
      if (tooBig) {
        return {
          mkFileSize: {
            max: maxSize,
            maxLabel: this.formatBytes(maxSize),
            name: tooBig.name,
          },
        };
      }
    }

    const wrongType = files.find((f) => !this.matchesAccept(f));
    if (wrongType) {
      return { mkFileType: { accept: this.accept(), name: wrongType.name } };
    }
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
