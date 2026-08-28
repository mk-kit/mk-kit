Angular Material is excellent at what it is: Google's design language, implemented carefully, maintained by the Angular team. If your product *should* look like Material, stay. This post is for the other case — an admin panel or internal tool where Material was the default, not the decision, and where you keep writing the same things around it: a table with sorting and paging that does not need `MatTableDataSource`, charts, a kanban board, a chat pane, a proper date-range picker, file upload, a rich-text field.

mk-kit covers that surface in one package, and the migration is incremental: both libraries install side by side, selectors and tokens never collide, and you move view by view.

## Why teams switch

- **Admin surface, not a design language.** 180 components including tables with tree rows and CSV export, twelve SVG chart types, kanban, chat, rich-text and block editors, query builder, file upload, signature pad, on-screen keyboard, dynamic forms from JSON.
- **Theming is CSS variables.** No `mat.theme()` Sass, no palette maps, no `.mat-mdc-*` overrides. Set `--mk-primary`, get a consistent light and dark theme across everything, globally or per subtree, at runtime.
- **Written for Angular 22.** Signal inputs everywhere, standalone, OnPush, zoneless, `resource()`-friendly services, harness-tested. No zone.js assumptions, no `ngModule` shims.
- **MIT, no strings.** No community edition, no runtime checks, nothing phones home.

## The component map

| Angular Material | mk-kit | Notes |
|---|---|---|
| `MatButton` | `button[mkButton]` | `variant` / `tone` / `size` / `iconOnly` / `loading` |
| `MatIcon` (ligatures) | `<mk-icon name>` | `provideMkMaterialIcons()` keeps your names — see below |
| `MatDialog` | `MkDialogService` | `open(Cmp, { data })`, `MK_OVERLAY_DATA`, `await ref.afterClosed` |
| `MatFormField` + `MatInput` + `MatError` | `mk-form-field` + `input[mkInput]` | label and hint are inputs; the error is derived from the bound control |
| `MatSelect` / `MatAutocomplete` | `mk-select` / `mk-autocomplete` | `[options]` input instead of `<mat-option>` children |
| `MatTable` + `MatSort` + `MatPaginator` | `mk-table` + `mkSort` + `mk-pagination` | plain arrays and signals instead of `MatTableDataSource` |
| `MatSnackBar` | `MkSnackbarService` / `MkToastService` | bottom snackbar with action, or stacked toasts |
| `MatSlideToggle` / `MatCheckbox` / `MatRadio` | `mk-switch` / `mk-checkbox` / `mk-radio-group` | same CVA bindings |
| `MatDatepicker` / `MatTimepicker` | `mk-date-picker` / `mk-time-picker` | native `Date`, no adapters; locale via `provideMkI18n` |
| `MatMenu` / `MatTabs` / `MatStepper` / `MatChips` | `mk-menu` / `mk-tabs` / `mk-stepper` / `mk-chip`, `mk-tag-input` | |
| `MatCard` / `MatDivider` / `MatList` / `MatProgressBar` / `MatSpinner` / `MatTooltip` / `MatBadge` | `mk-card` / `mk-divider` / `mk-list` / `mk-progress-bar` / `mk-spinner` / `[mkTooltip]` / `mk-badge` | `matBadge` attribute → `mk-badge` element |
| `MatButtonToggle` / `MatBottomSheet` / `MatSidenav` | `mk-button-toggle-group` / `MkBottomSheetService` / `mk-app-shell` + `mk-drawer` | |
| CDK Overlay / DragDrop / Clipboard / A11y / VirtualScroll | `MkOverlayService`, `MkAnchoredPanel` / `@mk-kit/ui/dnd` / `mkCopyToClipboard` / `MkFocusTrap`, `MkLiveAnnouncer` / `mk-virtual-scroll` | keyboard drag built in |

Things you get that Material does not ship: charts, kanban, chat, rich text, block editor, query builder, file upload, cropper, gallery and lightbox, event calendar, tree, timeline, command palette, notification centre, guided tour, JSON viewer, diff, log viewer, QR code, dynamic forms.

## Icons: keep your Material names

The built-in icon set is 426 SVG glyphs. `provideMkMaterialIcons()` adds Material Symbols aliases (`delete` → `trash`, `expand_more` → `chevron-down`, `visibility_off` → `eye-off`, …), so ligature names survive a find-and-replace of the tag and the Symbols font download disappears:

```html
<!-- before -->
<mat-icon>qr_code_scanner</mat-icon>
<!-- after -->
<mk-icon name="qr_code_scanner" />
```

## Errors and validation

There is no `<mat-error>` and no `ErrorStateMatcher`. `mk-form-field` reads the projected control's `NgControl` and renders the first error itself, worded from the `validation` i18n table — the per-field `@if` ladder disappears. `errorOn="touched"` reproduces Material's default timing; `errorMessages` rewords a single key.

```html
<mk-form-field label="Email" hint="Work address">
  <input mkInput type="email" [formControl]="email" />
</mk-form-field>
```

Constraint inputs behave like Material's validator directives: `[min]` / `[max]` on a date picker report `mkMinDate` / `mkMaxDate`, numeric controls report the standard `min` / `max` keys, and `required` on `mk-checkbox` behaves like `Validators.requiredTrue`.

## Theming

`mat.theme()` becomes custom properties. Import the stylesheet, set a handful of tokens, done:

```css
:root {
  --mk-primary: #4f46e5;
  --mk-radius: 10px;
  --mk-font-family: "Inter", system-ui, sans-serif;
}
```

Dark mode is built in via `data-mk-theme` and `MkThemeService`; the hand-rolled `body.dark` token set gets deleted. Density is `data-mk-density="compact"`. The [theme builder](/theme-builder) generates the sheet from your brand colour.

## Honest gaps

- No `MatTableDataSource` — you own sort, filter and page with signals (usually less code), or use `MkTableDataSource` for server-side paging.
- Select and autocomplete options are data inputs, not projected `<mat-option>` templates.
- One field look — `appearance="outline"` attributes just get deleted.
- Ripples are opt-in (`mkRipple`); service APIs are Promise- and signal-based, not Observable-based.
- It does not look like Material. That is the point, but say it out loud to your designer first.

## Suggested order

1. Theme tokens.
2. Icons (alias provider).
3. Buttons, tooltips, spinners — the low-risk sweep that touches every screen.
4. Form fields.
5. Dialogs and bottom sheets.
6. Tables.
7. Pickers, chips, snackbars, menus.
8. Drop `@angular/material` and prune the `.mat-*` override CSS.

The condensed map lives on the [migration page](/migration); the full guide with per-surface before/after snippets is `MIGRATION.md` in the repository. Coming from PrimeNG instead? [That post has a schematic.](/blog/switching-from-primeng)

---

*Stuck on a specific screen? [Open an issue](https://github.com/mk-kit/mk-kit/issues) with the template — mapping questions get answered, and real gaps get built.*
