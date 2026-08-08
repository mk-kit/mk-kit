import {
  mkParseMarkdown,
  mkRenderMarkdown,
  type MkMarkdownBlock,
  type MkMarkdownParseOptions,
  type MkMarkdownRenderOptions,
} from './markdown-parse';

/** Parse + render in one go — most cases assert on the final HTML. */
function md(
  src: string,
  popts: MkMarkdownParseOptions = {},
  ropts: MkMarkdownRenderOptions = {},
): string {
  return mkRenderMarkdown(mkParseMarkdown(src, popts), ropts);
}

describe('mkParseMarkdown / mkRenderMarkdown', () => {
  describe('headings', () => {
    it('parses all six ATX levels', () => {
      for (let level = 1; level <= 6; level++) {
        expect(md(`${'#'.repeat(level)} Title`)).toBe(`<h${level}>Title</h${level}>`);
      }
    });

    it('parses inline formatting inside a heading', () => {
      expect(md('## Release **1.2**')).toBe('<h2>Release <strong>1.2</strong></h2>');
    });

    it('strips optional closing hashes', () => {
      expect(md('## Title ##')).toBe('<h2>Title</h2>');
    });

    it('requires a space after the hashes (#bad is a paragraph)', () => {
      expect(md('#bad')).toBe('<p>#bad</p>');
    });

    it('treats seven hashes as a paragraph', () => {
      expect(md('####### nope')).toBe('<p>####### nope</p>');
    });
  });

  describe('paragraphs and line breaks', () => {
    it('joins consecutive lines into one paragraph with a soft break', () => {
      expect(md('one\ntwo')).toBe('<p>one\ntwo</p>');
    });

    it('separates paragraphs on blank lines', () => {
      expect(md('one\n\ntwo')).toBe('<p>one</p><p>two</p>');
    });

    it('renders a hard break for two trailing spaces', () => {
      expect(md('one  \ntwo')).toBe('<p>one<br>two</p>');
    });

    it('does not hard-break on a single trailing space', () => {
      expect(md('one \ntwo')).toBe('<p>one\ntwo</p>');
    });

    it('normalises CRLF line endings', () => {
      expect(md('one\r\n\r\ntwo')).toBe('<p>one</p><p>two</p>');
    });

    it('renders empty source as an empty string', () => {
      expect(md('')).toBe('');
      expect(md('   \n\n  ')).toBe('');
    });
  });

  describe('HTML in source is escaped (sanitization story)', () => {
    it('shows <script> as text, never as a tag', () => {
      const html = md('hello <script>alert(1)</script>');
      expect(html).toBe('<p>hello &lt;script&gt;alert(1)&lt;/script&gt;</p>');
      expect(html).not.toContain('<script>');
    });

    it('escapes benign inline HTML too (no passthrough)', () => {
      expect(md('a <b>bold</b> move')).toBe('<p>a &lt;b&gt;bold&lt;/b&gt; move</p>');
    });

    it('escapes ampersands and quotes', () => {
      expect(md('salt & "pepper"')).toBe('<p>salt &amp; &quot;pepper&quot;</p>');
    });

    it('escapes an img onerror injection attempt', () => {
      const html = md('<img src=x onerror=alert(1)>');
      expect(html).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    });
  });

  describe('emphasis', () => {
    it('renders **bold** as <strong>', () => {
      expect(md('a **bold** word')).toBe('<p>a <strong>bold</strong> word</p>');
    });

    it('renders *italic* and _italic_ as <em>', () => {
      expect(md('*one* and _two_')).toBe('<p><em>one</em> and <em>two</em></p>');
    });

    it('renders ~~gone~~ as <del>', () => {
      expect(md('~~gone~~')).toBe('<p><del>gone</del></p>');
    });

    it('renders ***both*** as strong>em', () => {
      expect(md('***both***')).toBe('<p><strong><em>both</em></strong></p>');
    });

    it('nests emphasis inside strong', () => {
      expect(md('**bold _in_ here**')).toBe('<p><strong>bold <em>in</em> here</strong></p>');
    });

    it('leaves intra-word underscores alone (snake_case)', () => {
      expect(md('use snake_case_names here')).toBe('<p>use snake_case_names here</p>');
    });

    it('leaves unmatched or space-padded delimiters as literals', () => {
      expect(md('2 * 3 * 4')).toBe('<p>2 * 3 * 4</p>');
      expect(md('*alone')).toBe('<p>*alone</p>');
    });
  });

  describe('inline code', () => {
    it('renders a code span and keeps markdown inert inside it', () => {
      expect(md('run `npm **install**`')).toBe(
        '<p>run <code>npm **install**</code></p>',
      );
    });

    it('escapes HTML inside a code span', () => {
      expect(md('`<div>`')).toBe('<p><code>&lt;div&gt;</code></p>');
    });

    it('allows literal backticks via double-backtick fences', () => {
      expect(md('`` a`b ``')).toBe('<p><code>a`b</code></p>');
    });
  });

  describe('links', () => {
    it('renders http/https links', () => {
      expect(md('[site](https://example.com)')).toBe(
        '<p><a href="https://example.com">site</a></p>',
      );
    });

    it('renders mailto and relative links', () => {
      expect(md('[mail](mailto:a@b.c)')).toBe('<p><a href="mailto:a@b.c">mail</a></p>');
      expect(md('[docs](/docs/intro)')).toBe('<p><a href="/docs/intro">docs</a></p>');
    });

    it('drops a javascript: href but keeps the text', () => {
      const html = md('[click](javascript:alert(1))');
      expect(html).toBe('<p>click</p>');
      expect(html).not.toContain('javascript');
    });

    it('drops other non-allow-listed schemes (data:, vbscript:)', () => {
      expect(md('[x](data:text/html,hi)')).toBe('<p>x</p>');
      expect(md('[x](vbscript:evil)')).toBe('<p>x</p>');
    });

    it('never stores an unsafe URL in the AST', () => {
      const blocks = mkParseMarkdown('[click](javascript:alert(1))');
      expect(JSON.stringify(blocks)).not.toContain('javascript');
    });

    it('ignores a link title', () => {
      expect(md('[t](https://x.dev "title")')).toBe('<p><a href="https://x.dev">t</a></p>');
    });

    it('parses inline formatting inside the label', () => {
      expect(md('[**bold** link](/a)')).toBe(
        '<p><a href="/a"><strong>bold</strong> link</a></p>',
      );
    });

    it('escapes quotes in the href attribute', () => {
      expect(md('[x](/a"b)')).toBe('<p><a href="/a&quot;b">x</a></p>');
    });

    it('adds target and rel when rendered with linkTarget _blank', () => {
      expect(md('[t](https://x.dev)', {}, { linkTarget: '_blank' })).toBe(
        '<p><a href="https://x.dev" target="_blank" rel="noopener noreferrer">t</a></p>',
      );
    });
  });

  describe('images', () => {
    it('renders an image with alt text', () => {
      expect(md('![logo](https://x.dev/logo.png)')).toBe(
        '<p><img src="https://x.dev/logo.png" alt="logo"></p>',
      );
    });

    it('renders relative image sources', () => {
      expect(md('![a](assets/a.png)')).toBe('<p><img src="assets/a.png" alt="a"></p>');
    });

    it('falls back to alt text for an unsafe image source', () => {
      expect(md('![evil](javascript:alert(1))')).toBe('<p>evil</p>');
    });
  });

  describe('autolinking', () => {
    it('is off by default — bare URLs stay text', () => {
      expect(md('see https://example.com now')).toBe('<p>see https://example.com now</p>');
    });

    it('links bare http(s) URLs when enabled', () => {
      expect(md('see https://example.com now', { autolink: true })).toBe(
        '<p>see <a href="https://example.com">https://example.com</a> now</p>',
      );
    });

    it('trims trailing sentence punctuation from autolinks', () => {
      expect(md('go to https://example.com.', { autolink: true })).toBe(
        '<p>go to <a href="https://example.com">https://example.com</a>.</p>',
      );
    });
  });

  describe('backslash escapes', () => {
    it('escapes emphasis and pipe characters', () => {
      expect(md('\\*not em\\*')).toBe('<p>*not em*</p>');
    });
  });

  describe('fenced code blocks', () => {
    it('highlights known languages via mkHighlight', () => {
      const html = md('```json\n{"a": 1}\n```');
      expect(html).toContain('<pre class="mk-markdown__code"><code class="language-json">');
      expect(html).toContain('mk-tok-key');
      expect(html).toContain('mk-tok-num');
    });

    it('renders an unknown fence language as plain escaped code', () => {
      const html = md('```rust\nlet x = 1;\n```');
      expect(html).toBe(
        '<pre class="mk-markdown__code"><code class="language-rust">let x = 1;</code></pre>',
      );
      expect(html).not.toContain('mk-tok');
    });

    it('renders a bare fence without a language class', () => {
      expect(md('```\nplain\n```')).toBe(
        '<pre class="mk-markdown__code"><code>plain</code></pre>',
      );
    });

    it('keeps markdown and HTML inert inside a fence', () => {
      const html = md('```\n# not a heading\n<script>x</script>\n**nope**\n```');
      expect(html).toBe(
        '<pre class="mk-markdown__code"><code># not a heading\n&lt;script&gt;x&lt;/script&gt;\n**nope**</code></pre>',
      );
    });

    it('runs an unclosed fence to the end of input', () => {
      expect(md('```\na\nb')).toBe('<pre class="mk-markdown__code"><code>a\nb</code></pre>');
    });

    it('keeps shorter backtick runs inside a longer fence', () => {
      expect(md('````\n```\n````')).toBe(
        '<pre class="mk-markdown__code"><code>```</code></pre>',
      );
    });
  });

  describe('lists', () => {
    it('parses an unordered list', () => {
      expect(md('- a\n- b\n- c')).toBe('<ul><li>a</li><li>b</li><li>c</li></ul>');
    });

    it('accepts *, + and - bullets', () => {
      expect(md('* a\n+ b\n- c')).toBe('<ul><li>a</li><li>b</li><li>c</li></ul>');
    });

    it('parses an ordered list and honours its start number', () => {
      expect(md('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>');
      expect(md('3. a\n4. b')).toBe('<ol start="3"><li>a</li><li>b</li></ol>');
      expect(md('1) a')).toBe('<ol><li>a</li></ol>');
    });

    it('nests lists by 2-space indent', () => {
      expect(md('- a\n  - a1\n  - a2\n- b')).toBe(
        '<ul><li>a<ul><li>a1</li><li>a2</li></ul></li><li>b</li></ul>',
      );
    });

    it('nests ordered inside unordered', () => {
      expect(md('- a\n  1. one\n  2. two')).toBe(
        '<ul><li>a<ol><li>one</li><li>two</li></ol></li></ul>',
      );
    });

    it('parses inline code and links inside list items', () => {
      expect(md('- run `build`\n- see [docs](/d)')).toBe(
        '<ul><li>run <code>build</code></li><li>see <a href="/d">docs</a></li></ul>',
      );
    });

    it('ends a tight list at a blank line', () => {
      expect(md('- a\n\ntext')).toBe('<ul><li>a</li></ul><p>text</p>');
    });

    it('exposes list structure in the AST', () => {
      const blocks = mkParseMarkdown('1. a\n  - sub');
      expect(blocks).toHaveLength(1);
      const list = blocks[0] as Extract<MkMarkdownBlock, { kind: 'list' }>;
      expect(list.kind).toBe('list');
      expect(list.ordered).toBe(true);
      expect(list.items).toHaveLength(1);
      expect(list.items[0].sublist?.ordered).toBe(false);
    });
  });

  describe('blockquotes', () => {
    it('parses a simple blockquote', () => {
      expect(md('> hello')).toBe('<blockquote><p>hello</p></blockquote>');
    });

    it('merges consecutive quote lines', () => {
      expect(md('> a\n> b')).toBe('<blockquote><p>a\nb</p></blockquote>');
    });

    it('nests blockquotes', () => {
      expect(md('> outer\n> > inner')).toBe(
        '<blockquote><p>outer</p><blockquote><p>inner</p></blockquote></blockquote>',
      );
    });

    it('parses a list inside a blockquote', () => {
      expect(md('> - a\n> - b')).toBe(
        '<blockquote><ul><li>a</li><li>b</li></ul></blockquote>',
      );
    });

    it('parses a heading inside a blockquote', () => {
      expect(md('> ## Note')).toBe('<blockquote><h2>Note</h2></blockquote>');
    });
  });

  describe('horizontal rules', () => {
    it('renders ---, *** and ___ as <hr>', () => {
      expect(md('---')).toBe('<hr>');
      expect(md('***')).toBe('<hr>');
      expect(md('___')).toBe('<hr>');
      expect(md('- - -')).toBe('<hr>');
    });

    it('treats --- after a paragraph as an hr, not a setext heading', () => {
      expect(md('title\n---')).toBe('<p>title</p><hr>');
    });
  });

  describe('tables', () => {
    it('parses a pipe table with header and body', () => {
      expect(md('| Name | Age |\n| --- | --- |\n| Ada | 36 |')).toBe(
        '<table><thead><tr><th>Name</th><th>Age</th></tr></thead>' +
          '<tbody><tr><td>Ada</td><td>36</td></tr></tbody></table>',
      );
    });

    it('applies alignment colons per column', () => {
      const html = md('| L | C | R |\n| :-- | :--: | --: |\n| a | b | c |');
      expect(html).toBe(
        '<table><thead><tr><th>L</th><th class="mk-markdown--center">C</th><th class="mk-markdown--right">R</th></tr></thead>' +
          '<tbody><tr><td>a</td><td class="mk-markdown--center">b</td><td class="mk-markdown--right">c</td></tr></tbody></table>',
      );
    });

    it('records alignment in the AST', () => {
      const [table] = mkParseMarkdown('| a | b | c | d |\n| :-- | :--: | --: | -- |\n');
      expect((table as Extract<MkMarkdownBlock, { kind: 'table' }>).align).toEqual([
        'left',
        'center',
        'right',
        null,
      ]);
    });

    it('honours escaped pipes inside cells', () => {
      expect(md('| a |\n| --- |\n| x \\| y |')).toBe(
        '<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>x | y</td></tr></tbody></table>',
      );
    });

    it('pads missing cells and truncates extra ones', () => {
      expect(md('| a | b |\n| --- | --- |\n| only |\n| 1 | 2 | 3 |')).toBe(
        '<table><thead><tr><th>a</th><th>b</th></tr></thead>' +
          '<tbody><tr><td>only</td><td></td></tr><tr><td>1</td><td>2</td></tr></tbody></table>',
      );
    });

    it('parses inline formatting inside cells', () => {
      expect(md('| h |\n| --- |\n| **b** |')).toBe(
        '<table><thead><tr><th>h</th></tr></thead><tbody><tr><td><strong>b</strong></td></tr></tbody></table>',
      );
    });

    it('does not treat a pipe line without a delimiter row as a table', () => {
      expect(md('a | b\nc | d')).toBe('<p>a | b\nc | d</p>');
    });

    it('ends the table at a blank line', () => {
      expect(md('| a |\n| --- |\n| 1 |\n\nafter')).toBe(
        '<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table><p>after</p>',
      );
    });
  });

  describe('nesting across constructs', () => {
    it('renders a code fence between lists and quotes in one document', () => {
      const src = [
        '# Changelog',
        '',
        '- **fix**: escape `<html>`',
        '',
        '> note with [link](/a)',
      ].join('\n');
      expect(md(src)).toBe(
        '<h1>Changelog</h1>' +
          '<ul><li><strong>fix</strong>: escape <code>&lt;html&gt;</code></li></ul>' +
          '<blockquote><p>note with <a href="/a">link</a></p></blockquote>',
      );
    });
  });
});
