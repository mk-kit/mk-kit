# Block Editor (`@mkornas/ui`)

A configurable, Gutenberg-style **block content editor** for authoring blog
posts and content pages, plus a read-only **renderer** for displaying the saved
document. Dependency-free: built on native `contenteditable` + the Selection API
(`document.execCommand` is used for inline formatting — deprecated but
universally supported and the only practical way to do inline formatting without
a heavyweight editor engine).

Everything is themed through `--mk-*` tokens (light/dark aware), keyboard
operable, and WCAG 2.1 AA minded.

```ts
import {
  MkBlockEditor,
  MkBlockRenderer,
  mkBlocksToHtml,
  type MkBlockDocument,
} from '@mkornas/ui'; // (barrel: block-editor.barrel.ts)
```

---

## 1. The document model

The value is a small, 100% JSON-serialisable document — persist it as-is.

```ts
interface MkBlock {
  id: string;                  // stable unique id
  type: string;                // registry key: 'paragraph', 'columns', …
  data: Record<string, any>;   // per-block state, e.g. { html } or { src, alt }
  children?: MkBlock[];         // nested blocks (layout/columns)
}

interface MkBlockDocument {
  version: number;             // schema version (MK_BLOCK_DOCUMENT_VERSION)
  blocks: MkBlock[];           // top-level blocks, in order
}
```

Built-in block `data` shapes:

| type        | `data`                                                           | `children`         |
| ----------- | ---------------------------------------------------------------- | ------------------ |
| `paragraph` | `{ html }`                                                       | —                  |
| `heading`   | `{ html, level: 1..4 }`                                          | —                  |
| `list`      | `{ ordered: boolean, items: string[] }`                         | —                  |
| `quote`     | `{ html, citation }`                                             | —                  |
| `code`      | `{ code, language }`                                             | —                  |
| `image`     | `{ src, alt, caption, align, width }`                            | —                  |
| `embed`     | `{ url, embedUrl, provider, aspectRatio }`                      | —                  |
| `button`    | `{ label, href, tone, variant, align }`                         | —                  |
| `divider`   | `{}`                                                             | —                  |
| `columns`   | `{ count, ratio, gap, align, justify }`                          | `column[]`         |
| `column`    | `{}`                                                             | any block[]        |

---

## 2. Wiring the editor with `[(value)]`

```ts
import { Component, signal } from '@angular/core';
import { MkBlockEditor, mkEmptyDocument, type MkBlockDocument } from '@mkornas/ui';

@Component({
  selector: 'app-post-editor',
  imports: [MkBlockEditor],
  template: `<mk-block-editor [(value)]="doc" placeholder="Write your post…" />`,
})
export class PostEditor {
  readonly doc = signal<MkBlockDocument>(mkEmptyDocument());
}
```

Because the editor implements `ControlValueAccessor`, it also works with forms:

```html
<mk-block-editor [(ngModel)]="doc" />
<mk-block-editor [formControl]="control" />
```

### Editor inputs / outputs

| input            | type                            | notes                                            |
| ---------------- | ------------------------------- | ------------------------------------------------ |
| `value`          | `model<MkBlockDocument>`        | two-way document binding                         |
| `blocks`         | `MkBlockDefinition[] \| null`   | custom/extended palette (merged over defaults)   |
| `placeholder`    | `string`                        | empty text-block prompt                          |
| `readonly`       | `boolean`                       | hides editing chrome                             |
| `disabled`       | `boolean`                       | form-level disable                               |
| `uploadHandler`  | `(f: File) => Promise<string>`  | image upload (see §4)                            |
| `embedProviders` | `MkEmbedProvider[] \| null`     | extra embed providers (see §5)                   |
| `ariaLabel`      | `string`                        | region label                                     |
| **output**       |                                 |                                                  |
| `change`         | `MkBlockDocument`               | fires on every edit (alongside the `value` model)|

### Keyboard

- **Enter** in a text block splits at the caret and starts a new paragraph.
- **Backspace** at the start of an empty block deletes it and focuses the previous.
- **Arrow Up/Down** at a block edge move the caret to the adjacent block.
- **Select text** to reveal the floating toolbar (Bold, Italic, Underline,
  Strikethrough, Inline code, Link, Clear).
- The inserter is a combobox → listbox: type to filter, Arrow keys to move,
  Enter to insert, Esc to close.

---

## 3. Providing a custom block (registerBlockType-style)

A block is described by an `MkBlockDefinition`. Supply extras via the `blocks`
input or, app-wide, via the `MK_BLOCK_DEFINITIONS` multi-token.

```ts
import { type MkBlockDefinition, MK_DEFAULT_BLOCKS, mkBlockId } from '@mkornas/ui';

const calloutBlock: MkBlockDefinition = {
  type: 'callout',
  label: 'Callout',
  icon: '💡',
  group: 'Text',
  description: 'A highlighted note.',
  keywords: ['note', 'tip', 'info'],
  create: () => ({ id: mkBlockId('callout'), type: 'callout', data: { html: '', tone: 'info' } }),
};

// Per-editor:
@Component({
  template: `<mk-block-editor [(value)]="doc" [blocks]="palette" />`,
})
class Editor {
  readonly palette = [...MK_DEFAULT_BLOCKS, calloutBlock];
}
```

App-wide via the token (merged over `MK_DEFAULT_BLOCKS`, then the input wins):

```ts
import { MK_BLOCK_DEFINITIONS } from '@mkornas/ui';

providers: [
  { provide: MK_BLOCK_DEFINITIONS, multi: true, useValue: [calloutBlock] },
];
```

> The editor renders a built-in edit UI per known `type`. A brand-new `type`
> appears in the inserter and serialises through your `create()` data, but the
> editor shows an "Unknown block" placeholder unless the type matches a built-in
> (extend the switch by contributing to the library, or model your custom block
> on an existing `data` shape such as `{ html }`).

---

## 4. Image upload handler

If an `uploadHandler` is provided (editor input **or** the
`MK_BLOCK_UPLOAD_HANDLER` token), it is called with the chosen `File` and must
resolve to a URL. Otherwise the image falls back to an inline `data:` URL via
`FileReader`.

```ts
import { MK_BLOCK_UPLOAD_HANDLER } from '@mkornas/ui';

async function uploadToCdn(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body });
  return (await res.json()).url;
}

// Per editor:
// <mk-block-editor [(value)]="doc" [uploadHandler]="uploadToCdn" />

// Or app-wide:
providers: [{ provide: MK_BLOCK_UPLOAD_HANDLER, useValue: uploadToCdn }];
```

The image block also accepts a pasted URL and drag-and-drop, and exposes alt
text, caption, alignment and width settings.

---

## 5. Adding an embed provider

Embeds render a **sandboxed** iframe for allow-listed providers (YouTube and
Vimeo out of the box). Add your own:

```ts
import { type MkEmbedProvider } from '@mkornas/ui';

const codepen: MkEmbedProvider = {
  name: 'CodePen',
  test: /codepen\.io\/([\w-]+)\/pen\/([\w-]+)/i,
  aspectRatio: 16 / 9,
  toEmbedUrl(url) {
    const m = url.match(/codepen\.io\/([\w-]+)\/pen\/([\w-]+)/i);
    return m ? `https://codepen.io/${m[1]}/embed/${m[2]}` : null;
  },
};

// <mk-block-editor [(value)]="doc" [embedProviders]="[codepen]" />
// or app-wide: { provide: MK_BLOCK_EMBED_PROVIDERS, multi: true, useValue: [codepen] }
```

Non-matching URLs render a safe link card instead of an iframe.

**Security model:** rich-text is stored as HTML but always sanitised — through
`sanitizeInlineHtml` (an allow-list cleaner) on serialise, and Angular's
`DomSanitizer` via `[innerHTML]` on render. The **only** value ever passed to
`bypassSecurityTrustResourceUrl` is a provider-transformed `embedUrl`, never a
raw pasted string.

---

## 6. Rendering saved content

### Component (themed, interactive iframes)

```ts
import { MkBlockRenderer } from '@mkornas/ui';

@Component({
  imports: [MkBlockRenderer],
  template: `<mk-block-renderer [value]="doc()" />`,
})
class PublishedPost { /* doc() is a stored MkBlockDocument */ }
```

`mk-block-renderer` re-uses the editor's layout CSS, so authored columns look
identical when published, and renders embeds as sandboxed iframes.

### Static HTML string (SSG/SSR, emails, feeds)

```ts
import { mkBlocksToHtml, mkBlocksToText } from '@mkornas/ui';

const html = mkBlocksToHtml(doc);   // clean, self-contained semantic HTML
const text = mkBlocksToText(doc);   // plain text for excerpts / meta descriptions
```

Serializer signatures:

```ts
function mkBlocksToHtml(doc: MkBlockDocument | null | undefined): string;
function mkBlocksToText(doc: MkBlockDocument | null | undefined): string;
```

`mkBlocksToHtml` emits layout blocks as responsive grid wrappers with inline
styles, so the output is portable to any page. It is dependency-free and safe to
run on a server. Because it returns a string, always let a sanitiser (or the
`mk-block-renderer`) handle final display — never feed it back into `innerHTML`
without sanitising again.
```
