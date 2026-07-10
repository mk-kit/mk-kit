import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MK_I18N } from '../../core/i18n/mk-i18n';
import type { MkBlock } from './block-model';
import { MkBlockEditorContext } from './block-context';

type ImageAlign = 'left' | 'center' | 'right';

/**
 * Image block — upload (file picker or drag-drop) or paste a URL. If an
 * `uploadHandler` is configured (editor input or {@link MK_BLOCK_UPLOAD_HANDLER}
 * token) it is used to persist the file and get back a URL; otherwise the file
 * is read as an inline `data:` URL via `FileReader`. Supports alt text,
 * caption, width and alignment.
 */
@Component({
  selector: 'mk-image-block',
  templateUrl: './image-block.html',
  styleUrl: './image-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MkImageBlock {
  private readonly ctx = inject(MkBlockEditorContext);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  protected readonly i18n = inject(MK_I18N);

  readonly block = input.required<MkBlock>();
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly blockChange = output<MkBlock>();

  protected readonly aligns: ImageAlign[] = ['left', 'center', 'right'];
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dragActive = signal(false);

  protected src(): string {
    return this.block().data['src'] ?? '';
  }

  protected openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    if (this.readonly()) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    if (this.readonly()) return;
    event.preventDefault();
    this.dragActive.set(true);
  }

  protected onDragLeave(): void {
    this.dragActive.set(false);
  }

  protected onUrl(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.patch({ src: value });
  }

  protected onAlt(event: Event): void {
    this.patch({ alt: (event.target as HTMLInputElement).value });
  }

  protected onCaption(event: Event): void {
    this.patch({ caption: (event.target as HTMLInputElement).value });
  }

  protected setAlign(align: ImageAlign): void {
    this.patch({ align });
  }

  protected onWidth(event: Event): void {
    this.patch({ width: Number((event.target as HTMLInputElement).value) });
  }

  protected clear(): void {
    this.patch({ src: '' });
  }

  private async handleFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.error.set('Please choose an image file.');
      return;
    }
    this.error.set(null);
    this.uploading.set(true);
    try {
      const handler = this.ctx.uploadHandler();
      const url = handler ? await handler(file) : await this.readAsDataUrl(file);
      this.patch({ src: url, alt: this.block().data['alt'] || file.name });
      this.ctx.announce('Image added');
    } catch {
      this.error.set('Upload failed. Try again or paste a URL.');
    } finally {
      this.uploading.set(false);
    }
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private patch(data: Record<string, any>): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, ...data } });
  }
}
