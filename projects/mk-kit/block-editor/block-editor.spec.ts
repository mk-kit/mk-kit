import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkBlockEditor } from './block-editor';
import { MkBlockEditorContext } from './block-context';
import { MkBlockInserter } from './block-inserter';
import {
  MK_BLOCK_DOCUMENT_VERSION,
  type MkBlock,
  type MkBlockDocument,
} from './block-model';
import type { MkBlockDefinition } from './block-registry';
import { mkBlocksToHtml } from './block-serializer';

const paragraphs = (count: number): MkBlockDocument => ({
  version: MK_BLOCK_DOCUMENT_VERSION,
  blocks: Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    type: 'paragraph',
    data: { html: `Paragraph ${i}` },
  })),
});

describe('MkBlockEditor', () => {
  let fixture: ComponentFixture<MkBlockEditor>;
  let ed: MkBlockEditor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkBlockEditor);
    ed = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  const ctx = () => fixture.debugElement.injector.get(MkBlockEditorContext);

  describe('context wiring (no mirror effects)', () => {
    it('definitionFor is map-backed and returns the registry instances', () => {
      fixture.detectChanges();
      const paragraph = ctx().definitionFor('paragraph');
      expect(paragraph).toBeTruthy();
      // Same instance as in the definitions array, and stable across calls.
      expect(paragraph).toBe(ctx().definitions().find((d) => d.type === 'paragraph'));
      expect(ctx().definitionFor('paragraph')).toBe(paragraph);
      expect(ctx().definitionFor('nope')).toBeUndefined();
      expect(ctx().labelFor('paragraph')).toBe(paragraph!.label);
    });

    it('reflects input changes without any copy step', () => {
      fixture.detectChanges();
      expect(ctx().readonly()).toBe(false);
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      expect(ctx().readonly()).toBe(true);

      expect(ctx().disabled()).toBe(false);
      ed.setDisabledState(true);
      expect(ctx().disabled()).toBe(true);

      fixture.componentRef.setInput('placeholder', 'Write…');
      fixture.detectChanges();
      expect(ctx().placeholder()).toBe('Write…');
    });
  });

  describe('HTML serialization', () => {
    it('html mode round-trips: writeValue parses, onChange emits serialized HTML', () => {
      fixture.componentRef.setInput('valueFormat', 'html');
      fixture.detectChanges();
      const changes: unknown[] = [];
      ed.registerOnChange((v) => changes.push(v));

      ed.writeValue('<p>Hello</p>');
      expect(ed.value().blocks.length).toBe(1);
      expect(ed.value().blocks[0].type).toBe('paragraph');

      (ed as any).onBlocksChange(ed.value().blocks);
      const emitted = changes.at(-1);
      expect(typeof emitted).toBe('string');
      expect(emitted).toBe(mkBlocksToHtml(ed.value()));
    });

    it('document mode passes the document to onChange', () => {
      fixture.detectChanges();
      const changes: unknown[] = [];
      ed.registerOnChange((v) => changes.push(v));
      const blocks: MkBlock[] = paragraphs(1).blocks;

      (ed as any).onBlocksChange(blocks);
      expect(changes.at(-1)).toEqual({
        version: MK_BLOCK_DOCUMENT_VERSION,
        blocks,
      });
    });

    it('htmlChange emits serialized HTML when subscribed, even in document mode', () => {
      fixture.detectChanges();
      const htmls: string[] = [];
      ed.htmlChange.subscribe((h) => htmls.push(h));
      const docs: MkBlockDocument[] = [];
      ed.change.subscribe((d) => docs.push(d));
      const blocks: MkBlock[] = paragraphs(1).blocks;

      (ed as any).onBlocksChange(blocks);
      expect(docs.length).toBe(1);
      expect(htmls).toEqual([
        mkBlocksToHtml({ version: MK_BLOCK_DOCUMENT_VERSION, blocks }),
      ]);
    });
  });

  describe('shared document pointerdown listener', () => {
    it('attaches ONE document listener no matter how many inserters render', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      const removeSpy = vi.spyOn(document, 'removeEventListener');

      fixture.componentRef.setInput('value', paragraphs(2));
      fixture.detectChanges();
      // Two slim between-block inserters + the trailing add button.
      const inserters = fixture.nativeElement.querySelectorAll('mk-block-inserter');
      expect(inserters.length).toBeGreaterThanOrEqual(2);

      const added = addSpy.mock.calls.filter(([type]) => type === 'pointerdown');
      expect(added.length).toBe(1);

      fixture.destroy();
      const removed = removeSpy.mock.calls.filter(([type]) => type === 'pointerdown');
      expect(removed.length).toBe(1);
    });

    it('closes an open inserter panel on an outside pointerdown', async () => {
      fixture.componentRef.setInput('value', paragraphs(1));
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector(
        '.mk-block-inserter__trigger',
      ) as HTMLButtonElement;
      trigger.click();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.mk-block-inserter__panel')).toBeTruthy();

      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.mk-block-inserter__panel')).toBeNull();
    });
  });
});

describe('MkBlockInserter indexed options', () => {
  let fixture: ComponentFixture<MkBlockInserter>;

  const def = (type: string, label: string, group: string): MkBlockDefinition => ({
    type,
    label,
    group,
    create: () => ({ id: type, type, data: {} }),
  });
  // Flat order: One(0), Two(1), Three(2) — but grouping renders A: [One, Three], B: [Two].
  const defs = [def('one', 'One', 'A'), def('two', 'Two', 'B'), def('three', 'Three', 'A')];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkBlockInserter);
    fixture.componentRef.setInput('definitions', defs);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const open = async () => {
    (fixture.nativeElement.querySelector('.mk-block-inserter__trigger') as HTMLElement).click();
    await fixture.whenStable();
  };
  const options = (): HTMLButtonElement[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.mk-block-inserter__option',
      ),
    );
  const flatIndex = (option: HTMLElement) => Number(option.id.split('-opt-')[1]);
  const nameOf = (option: HTMLElement) =>
    option.querySelector('.mk-block-inserter__name')!.textContent!.trim();

  it('renders each option with its flat filtered index across groups', async () => {
    await open();
    // DOM order follows grouping; ids keep the flat (keyboard) indices.
    expect(options().map(nameOf)).toEqual(['One', 'Three', 'Two']);
    expect(options().map(flatIndex)).toEqual([0, 2, 1]);
    // Active option is flat index 0 regardless of render position.
    const active = options().find((o) => flatIndex(o) === 0)!;
    expect(active.classList.contains('mk-block-inserter__option--active')).toBe(true);
    expect(active.getAttribute('aria-selected')).toBe('true');
  });

  it('re-indexes from zero when filtering', async () => {
    await open();
    const search = fixture.nativeElement.querySelector(
      '.mk-block-inserter__search',
    ) as HTMLInputElement;
    search.value = 'thr';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(options().map(nameOf)).toEqual(['Three']);
    expect(options().map(flatIndex)).toEqual([0]);
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
  });
});
