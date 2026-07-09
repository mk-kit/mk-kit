import { mkHtmlToBlocks } from './block-parser';
import { mkBlocksToHtml } from './block-serializer';
import type { MkBlock, MkBlockDocument } from './block-model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = (b: MkBlock): any => b.data;

describe('mkHtmlToBlocks', () => {
  it('returns an empty document for blank input', () => {
    expect(mkHtmlToBlocks('').blocks).toEqual([]);
    expect(mkHtmlToBlocks('   \n ').blocks).toEqual([]);
  });

  it('parses the core block types', () => {
    const doc = mkHtmlToBlocks(
      '<h2>Title</h2>' +
        '<p>Hello <strong>world</strong></p>' +
        '<ul><li>one</li><li>two</li></ul>' +
        '<blockquote><p>Quote</p><cite>Ada</cite></blockquote>' +
        '<pre><code class="language-js">const x = 1;</code></pre>' +
        '<hr>',
    );
    expect(doc.blocks.map((b) => b.type)).toEqual([
      'heading', 'paragraph', 'list', 'quote', 'code', 'divider',
    ]);
    expect(data(doc.blocks[0])).toMatchObject({ level: 2, html: 'Title' });
    expect(data(doc.blocks[1]).html).toBe('Hello <strong>world</strong>');
    expect(data(doc.blocks[2])).toMatchObject({ ordered: false, items: ['one', 'two'] });
    expect(data(doc.blocks[3])).toMatchObject({ html: 'Quote', citation: 'Ada' });
    expect(data(doc.blocks[4])).toMatchObject({ code: 'const x = 1;', language: 'js' });
  });

  it('parses a figure into an image block', () => {
    const doc = mkHtmlToBlocks(
      '<figure style="text-align:right;"><img src="/a.png" alt="A" style="max-width:80%;"><figcaption>Cap</figcaption></figure>',
    );
    expect(doc.blocks[0].type).toBe('image');
    expect(data(doc.blocks[0])).toMatchObject({
      src: '/a.png', alt: 'A', caption: 'Cap', align: 'right', width: 80,
    });
  });

  it('groups loose inline content into a paragraph', () => {
    const doc = mkHtmlToBlocks('plain <em>text</em> here');
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0].type).toBe('paragraph');
    expect(data(doc.blocks[0]).html).toBe('plain <em>text</em> here');
  });

  it('recurses into unknown container elements', () => {
    const doc = mkHtmlToBlocks('<section><p>a</p><p>b</p></section>');
    expect(doc.blocks.map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
  });

  it('round-trips a document through HTML and back', () => {
    const original: MkBlockDocument = {
      version: 1,
      blocks: [
        { id: 'a', type: 'heading', data: { level: 3, html: 'Docs' } },
        { id: 'b', type: 'paragraph', data: { html: 'A <a>link</a> & more' } },
        { id: 'c', type: 'list', data: { ordered: true, items: ['x', 'y'] } },
        { id: 'd', type: 'code', data: { code: 'a < b', language: '' } },
        { id: 'e', type: 'divider', data: {} },
      ],
    };
    const reparsed = mkHtmlToBlocks(mkBlocksToHtml(original));
    expect(reparsed.blocks.map((b) => b.type)).toEqual(
      original.blocks.map((b) => b.type),
    );
    expect(data(reparsed.blocks[0])).toMatchObject({ level: 3, html: 'Docs' });
    expect(data(reparsed.blocks[2])).toMatchObject({ ordered: true, items: ['x', 'y'] });
    // HTML-significant characters survive the round-trip.
    expect(data(reparsed.blocks[3]).code).toBe('a < b');
  });

  it('strips scripts and unsafe markup', () => {
    const doc = mkHtmlToBlocks('<p>ok<script>alert(1)</script></p>');
    expect(data(doc.blocks[0]).html).toBe('ok');
  });
});
