import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { type MkBlock, mkBlockId, mkCloneBlock } from './block-model';
import type { MkBlockDefinition } from './block-registry';
import { MkBlockEditorContext } from './block-context';
import type { MkRichTextSplit } from './rich-text';
import { MkParagraphBlock } from './paragraph-block';
import { MkHeadingBlock } from './heading-block';
import { MkQuoteBlock } from './quote-block';
import { MkListBlock } from './list-block';
import { MkCodeBlock } from './code-block';
import { MkImageBlock } from './image-block';
import { MkEmbedBlock } from './embed-block';
import { MkButtonBlock } from './button-block';
import { MkBlockInserter } from './block-inserter';

/** Column ratio presets offered per column count. */
const RATIO_PRESETS: Record<number, { value: string; label: string }[]> = {
  2: [
    { value: '50-50', label: '50 / 50' },
    { value: '66-33', label: '66 / 33' },
    { value: '33-66', label: '33 / 66' },
    { value: '75-25', label: '75 / 25' },
    { value: '25-75', label: '25 / 75' },
  ],
  3: [
    { value: '33-33-33', label: 'Equal' },
    { value: '50-25-25', label: '50 / 25 / 25' },
    { value: '25-50-25', label: '25 / 50 / 25' },
  ],
  4: [{ value: '25-25-25-25', label: 'Equal' }],
};

/**
 * Recursive block list — renders an ordered array of blocks, each wrapped with
 * move/duplicate/delete/transform chrome and the type-specific editor, with
 * inserters between. Layout (columns) blocks recurse into nested
 * `mk-block-list`s. Owns all structural operations for its own array and emits
 * the new array via `blocksChange`; nested lists bubble their changes upward.
 */
@Component({
  selector: 'mk-block-list',
  imports: [
    MkParagraphBlock,
    MkHeadingBlock,
    MkQuoteBlock,
    MkListBlock,
    MkCodeBlock,
    MkImageBlock,
    MkEmbedBlock,
    MkButtonBlock,
    MkBlockInserter,
  ],
  templateUrl: './block-list.html',
  styleUrl: './block-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-block-list' },
})
export class MkBlockList {
  protected readonly ctx = inject(MkBlockEditorContext);

  /** The blocks to render. */
  readonly blocks = input.required<MkBlock[]>();
  /** Nesting depth (0 = top level). Used to forbid columns-in-columns. */
  readonly depth = input(0);
  /** Restrict the inserter to column-safe blocks. */
  readonly inColumn = input(false);

  /** Emitted with the full, updated array on any structural or content change. */
  readonly blocksChange = output<MkBlock[]>();

  /** Which block's toolbar menu is open (by index), or -1. */
  protected readonly menuOpen = signal(-1);

  protected readonly ratioPresets = RATIO_PRESETS;

  protected definition(type: string): MkBlockDefinition | undefined {
    return this.ctx.definitionFor(type);
  }

  // --- content updates ------------------------------------------------------

  protected update(index: number, block: MkBlock): void {
    const next = [...this.blocks()];
    next[index] = block;
    this.blocksChange.emit(next);
  }

  protected onColumnChange(blockIndex: number, colIndex: number, children: MkBlock[]): void {
    const block = this.blocks()[blockIndex];
    const columns = [...(block.children ?? [])];
    columns[colIndex] = { ...columns[colIndex], children };
    this.update(blockIndex, { ...block, children: columns });
  }

  // --- structural ops -------------------------------------------------------

  protected insertAt(index: number, def: MkBlockDefinition): void {
    const block = def.create();
    const next = [...this.blocks()];
    next.splice(index, 0, block);
    this.blocksChange.emit(next);
    this.ctx.announce(`${def.label} added`);
    this.ctx.focusBlock(block.id, 'start');
  }

  protected duplicate(index: number): void {
    const clone = mkCloneBlock(this.blocks()[index]);
    const next = [...this.blocks()];
    next.splice(index + 1, 0, clone);
    this.blocksChange.emit(next);
    this.menuOpen.set(-1);
    this.ctx.announce('Block duplicated');
  }

  protected remove(index: number): void {
    const removed = this.blocks()[index];
    const next = this.blocks().filter((_, i) => i !== index);
    this.blocksChange.emit(next);
    this.menuOpen.set(-1);
    this.ctx.announce(`${this.ctx.labelFor(removed.type)} deleted`);
    const focusTarget = next[index - 1] ?? next[index];
    if (focusTarget) this.ctx.focusBlock(focusTarget.id, 'end');
  }

  protected move(index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= this.blocks().length) return;
    const next = [...this.blocks()];
    [next[index], next[target]] = [next[target], next[index]];
    this.blocksChange.emit(next);
    this.ctx.announce(`Block moved ${delta < 0 ? 'up' : 'down'}`);
  }

  protected transform(index: number, type: string): void {
    const def = this.definition(type);
    if (!def) return;
    const source = this.blocks()[index];
    const created = def.create();
    // Carry rich-text HTML across text-type transforms where it makes sense.
    const carriesHtml = 'html' in created.data && typeof source.data['html'] === 'string';
    const data = carriesHtml ? { ...created.data, html: source.data['html'] } : created.data;
    const next = [...this.blocks()];
    next[index] = { ...created, id: source.id, data };
    this.blocksChange.emit(next);
    this.menuOpen.set(-1);
    this.ctx.announce(`Turned into ${def.label}`);
  }

  // --- text-block keyboard intents -----------------------------------------

  protected onSplit(index: number, split: MkRichTextSplit): void {
    const current = this.blocks()[index];
    const paragraphDef = this.definition('paragraph');
    const created = paragraphDef ? paragraphDef.create() : this.fallbackParagraph();
    const newBlock: MkBlock = { ...created, data: { ...created.data, html: split.after } };
    const next = [...this.blocks()];
    next[index] = { ...current, data: { ...current.data, html: split.before } };
    next.splice(index + 1, 0, newBlock);
    this.blocksChange.emit(next);
    this.ctx.focusBlock(newBlock.id, 'start');
  }

  protected onMergeBack(index: number): void {
    if (index <= 0) return;
    const prev = this.blocks()[index - 1];
    this.remove(index);
    this.ctx.focusBlock(prev.id, 'end');
  }

  protected onArrowOut(index: number, dir: 'up' | 'down'): void {
    const target = dir === 'up' ? index - 1 : index + 1;
    const block = this.blocks()[target];
    if (block) this.ctx.focusBlock(block.id, dir === 'up' ? 'end' : 'start');
  }

  // --- columns helpers ------------------------------------------------------

  protected setColumnCount(index: number, count: number): void {
    const block = this.blocks()[index];
    const current = [...(block.children ?? [])];
    while (current.length < count) current.push({ id: mkBlockId('column'), type: 'column', data: {}, children: [] });
    current.length = count;
    const presets = RATIO_PRESETS[count] ?? RATIO_PRESETS[2];
    this.update(index, {
      ...block,
      data: { ...block.data, count, ratio: presets[0].value },
      children: current,
    });
  }

  protected setColumnData(index: number, patch: Record<string, any>): void {
    const block = this.blocks()[index];
    this.update(index, { ...block, data: { ...block.data, ...patch } });
  }

  protected onRatioChange(index: number, event: Event): void {
    this.setColumnData(index, { ratio: (event.target as HTMLSelectElement).value });
  }
  protected onGapChange(index: number, event: Event): void {
    this.setColumnData(index, { gap: Number((event.target as HTMLInputElement).value) });
  }
  protected onAlignChange(index: number, event: Event): void {
    this.setColumnData(index, { align: (event.target as HTMLSelectElement).value });
  }
  protected onJustifyChange(index: number, event: Event): void {
    this.setColumnData(index, { justify: (event.target as HTMLSelectElement).value });
  }

  protected gridColumns(block: MkBlock): string {
    const ratio = String(block.data['ratio'] ?? '');
    const parts = ratio.split('-').map((n) => parseFloat(n)).filter((n) => n > 0);
    if (parts.length >= 2) return parts.map((n) => `${n}fr`).join(' ');
    return `repeat(${block.children?.length ?? 2}, 1fr)`;
  }
  protected gridGap(block: MkBlock): string {
    const g = Math.max(0, Math.min(8, Number(block.data['gap']) || 4));
    return `var(--mk-space-${g})`;
  }
  protected justifyValue(block: MkBlock): string {
    const map: Record<string, string> = {
      start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between',
    };
    return map[String(block.data['justify'] ?? 'start')] ?? 'flex-start';
  }

  // --- toolbar menu ---------------------------------------------------------

  protected toggleMenu(index: number): void {
    this.menuOpen.update((i) => (i === index ? -1 : index));
  }

  protected transformsFor(type: string): string[] {
    return this.definition(type)?.transforms ?? [];
  }

  private fallbackParagraph(): MkBlock {
    return { id: mkBlockId('paragraph'), type: 'paragraph', data: { html: '' } };
  }
}
