mk-kit has a component gallery, and a gallery is a lie of omission: every component sits alone on a white page with tidy sample data. The parts a library gets wrong only show up when twenty of them share a screen with real files, real keyboard habits and a user who right-clicks. So I built one of those screens and kept it: [mk-drive](https://github.com/mkornas/mk-drive), a self-hosted web drive over whatever directories you mount into it. This post is about what that did to the library.

## The app in one paragraph

Point the container at directories, get a Google-Drive-like UI: list and grid views with thumbnails, a lightbox, previews for the usual file types, chunked resumable uploads, folders, rename, move, copy, a trash with undo, search, recent and starred, share links with expiry and password, accounts with per-location access, and earlier versions from ZFS snapshots when the storage has them. The filesystem is the truth; the app owns only its own metadata in a SQLite file. Fastify on Node 24, Angular 22, `@mk-kit/ui`, one image.

## What the library had to do

The browse page alone leans on `mk-app-shell`, `mk-tree`, `mk-splitter`, `mk-table` with selection and custom cells, `mk-breadcrumb`, `mk-menu` behind a context-menu trigger, the `dnd` entry point for dragging rows onto folders and breadcrumbs, `mk-drawer` for the preview, `mk-lightbox` for photos, `mk-command-palette`, the hotkeys service, `mk-switch`, `mk-empty-state`, `mk-skeleton`, toasts with an undo action, and the dialog service for prompts and confirmations. Settings add `mk-avatar`, `mk-tag`, `mk-select`, `mk-password-input`, `mk-description-list`, and a custom dialog with a per-location access matrix. All of it themed by overriding a dozen `--mk-*` tokens: one typeface, one accent, nothing else.

That is the good news. It held together, light and dark, keyboard first, in about four working days.

## What it found

Real use surfaces the seams a gallery hides. Every one of these is fixed in **0.59.0**:

- **A dialog confirmed with Enter reopened itself.** The focus trap handed focus back to the "New folder" button synchronously inside the closing `keydown`; the same key's `keypress` then hit that button. Focus now returns on the next animation frame.
- **Shortcuts died while a checkbox had focus.** The hotkeys service treated every `<input>` as a text field. Select a row with its checkbox, press Delete, nothing. Only text-like inputs block shortcuts now.
- **A horizontal scrollbar under every dialog form.** `overflow-y: auto` alone makes the browser compute `overflow-x: auto`, and an input one pixel wider than the body scrolled sideways. The body hides horizontal overflow now.
- **Tables could not keep folders first.** Sorting compared raw cell values with no way in. `MkTableColumn.compare` is that way in.
- **Tree nodes could only carry a text glyph.** `MkTreeNode.iconName` renders a real icon.

Two things I chose not to change: `mkDrag` and `mkDropZone` are both components, so one element cannot be draggable and a drop target at once (a wrapper element does it, and the alternative is a breaking change), and `mk-code` still highlights only JSON and plain text (a proper highlighter is a project of its own).

## Try it

`docker run -e DRIVE_DEMO=true -p 8810:8810 ghcr.io/mkornas/mk-drive` starts it with sample data and a demo account. The [README](https://github.com/mkornas/mk-drive#readme) has the real setup: mount your directories, create the admin on first visit, invite people, share links.

If you build something on mk-kit and it bends a component in a way the gallery never did, open an issue. That is exactly the feedback a gallery cannot give.
