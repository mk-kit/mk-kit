# Migrating from Angular Material to @mkornas/ui

A practical guide for moving an Angular Material (M3) app onto `@mkornas/ui`
(mk-kit). It is written against a real migration target — an admin app using
~30 Material modules — so every mapping below is one you will actually hit.

**The short version:** every Material module a typical admin app uses has an
mk-kit counterpart, both libraries are standalone-component based, and their
selectors/tokens don't collide — so you can migrate **incrementally, view by
view, with both libraries installed**. The work concentrates in four places:
dialogs, tables, form fields and theming.

---

## 1. Coexistence: migrate incrementally

- Selectors never clash (`mat-*`/`mdc-*` vs `mk-*`/`mkButton`), and theming
  is separate (`--mat-sys-*` vs `--mk-*`). Install `@mkornas/ui` next to
  Material and convert one route/feature at a time.
- mk-kit is signals-first (`input()`/`model()`/`output()`), zoneless-ready and
  NgModule-free. Every form control implements `ControlValueAccessor`, so
  your `formControlName`/`[(ngModel)]` bindings carry over unchanged.
- Import from the group entry points (`@mkornas/ui/forms`, `/feedback`,
  `/table`, …) or the root `@mkornas/ui` barrel.

## 2. Theming: `--mat-sys-*` → `--mk-*`

mk-kit is themed by plain CSS custom properties — no Sass API, no
`mat.theme()`. Import the stylesheet and override tokens:

```scss
@import '@mkornas/ui/styles.css';

:root {
  --mk-primary: #f4511e;          /* your mat.$orange-palette seed */
  --mk-font-sans: 'Inter', sans-serif;
}
```

| Material (M3) | mk-kit |
|---|---|
| `mat.theme((color: …))` seed palette | `--mk-primary` (+ `-hover`, `-active`, `-subtle`, `-contrast`) |
| `--mat-sys-surface` / `-container` | `--mk-bg`, `--mk-surface`, `--mk-surface-2/3` |
| `--mat-sys-on-surface` / `-variant` | `--mk-text`, `--mk-text-muted`, `--mk-text-subtle` |
| `--mat-sys-outline` / `-variant` | `--mk-border`, `--mk-border-strong`, `--mk-border-subtle` |
| `--mat-sys-error` | `--mk-danger*` (plus `--mk-success/warning/info` tone families) |
| `--mat-sys-corner-*` | `--mk-radius-xs…2xl/pill/circle` |
| typography levels | `--mk-font-size-xs…4xl`, `--mk-font-weight-*`, `--mk-line-height-*` |
| `density: -1` | `data-mk-density="compact"` (global attribute or `MkThemeService.toggleDensity()`) |
| `body.dark` + hand-written dark `--mat-sys-*` set | **built in** — `data-mk-theme="dark"` or `MkThemeService` (`light`/`dark`/`system`, persisted) |

Deep `.mat-mdc-*` / `::ng-deep` CSS overrides do not carry over — in most
cases the token you were fighting for is a first-class `--mk-*` token
(check the `/theming` docs and the `/theme-builder` token generator).

## 3. Component map

| Angular Material | mk-kit | Notes |
|---|---|---|
| `MatButton` (`mat-button`, `mat-raised-…`) | `MkButton` — `button[mkButton]` | `variant="solid\|soft\|outline\|ghost\|link"`, `tone`, `size`, `iconOnly`, `loading` |
| `MatIcon` (`<mat-icon>name</mat-icon>`) | `MkIcon` — `<mk-icon name="…" />` | see §4 — `provideMkMaterialIcons()` keeps your ligature names |
| `MatDialog` | `MkDialogService` | see §5 — near drop-in (`open(Component, { data })`, `MK_OVERLAY_DATA`, `MkOverlayRef`) |
| `MatFormField` + `MatInput` + `MatError` | `MkFormField` + `input[mkInput]` | see §8 — label/hint are inputs, not child elements; the error is derived from the bound control like `mat-error`; no `appearance` (one look) |
| `MatSelect` | `MkSelect` | options via `[options]="[{label, value}]"` input instead of `<mat-option>` children |
| `MatProgressSpinner` | `MkSpinner` | |
| `MatTooltip` | `MkTooltip` — `[mkTooltip]="text"` | same attribute style |
| `MatSlideToggle` | `MkSwitch` | |
| `MatCard` | `MkCard` (+ header/title/footer parts) | |
| `MatTable` + `MatSort` + `MatPaginator` | `MkTable` + `mkSort` + `MkPagination` | see §6 — plain arrays instead of `MatTableDataSource` |
| `MatCheckbox` / `MatRadio` | `MkCheckbox` / `MkRadioGroup`+`MkRadio` | |
| `MatTabs` | `MkTabs` + `MkTab` | |
| `MatSnackBar` | `MkSnackbarService` or `MkToastService` | see §7 |
| `MatMenu` | `MkMenu` + `MkMenuItem` + `[mkMenuTriggerFor]` | |
| `MatDatepicker` (+ native adapter) | `MkDatePicker` / `MkDateRangePicker` | no date adapters — native `Date`, locale names via `provideMkI18n` |
| `MatTimepicker` | `MkTimePicker` | |
| `MatButtonToggle` | `MkButtonToggleGroup` | |
| `MatProgressBar` | `MkProgressBar` | |
| `MatDivider` / `MatList` | `MkDivider` / `MkList`+`MkListItem` | |
| `MatBottomSheet` | `MkBottomSheetService` | `MK_OVERLAY_DATA` instead of `MAT_BOTTOM_SHEET_DATA` |
| `MatBadge` (`matBadge` attribute) | `MkBadge` (`<mk-badge>` element) | structural change: wrap/adjacent element, not an attribute |
| `MatAutocomplete` | `MkAutocomplete` | combined input+panel component; `[options]`, `search` output for async |
| `MatStepper` | `MkStepper` + `MkStep` | |
| `MatChips` | `MkChip` (display) / `MkTagInput` (editable set) | |
| CDK `Overlay` | `MkOverlayService` / `MkAnchoredPanel` | |
| CDK `DragDrop` | `@mkornas/ui/dnd` (`MkDropList`/`MkDrag`, `mkMoveItemInArray`) | keyboard drag built in |
| CDK `Clipboard` | `mkCopyToClipboard` directive | |
| CDK `A11y` (FocusTrap, LiveAnnouncer) | `MkFocusTrap`, `MkLiveAnnouncer` (`@mkornas/ui/core`) | |
| CDK `ScrollingModule` (virtual) | `MkVirtualScroll` | |

Beyond parity, mk-kit adds things Material doesn't have — command palette,
block editor, charts, QR, kanban, diff viewer, phone/postal/currency/card/
IBAN inputs, signature pad, media gallery + lightbox + cropper, tour,
notification center — so some hand-rolled corners of a Material app can be
deleted rather than migrated.

## 4. Icons

Material Symbols ligatures (`<mat-icon>delete</mat-icon>`) become named SVGs
(`<mk-icon name="delete" />`). The built-in set is ~95 Feather-style glyphs,
and `provideMkMaterialIcons()` installs ~185 Material-name aliases
(`delete→trash`, `expand_more→chevron-down`, `visibility_off→eye-off`,
all `calendar_*→calendar`, …) so **your existing icon names keep working**:

```ts
bootstrapApplication(App, {
  providers: [provideMkMaterialIcons()],
});
```

```html
<!-- before -->  <mat-icon>qr_code_scanner</mat-icon>
<!-- after  -->  <mk-icon name="qr_code_scanner" />
```

App-specific SVGs move from `MatIconRegistry.addSvgIcon(name, url)` to
`MkIconRegistry.register(name, svgMarkup)` (markup, not URL — inline your
assets or fetch them yourself). Unmapped exotic names: register your own SVG
under the Material name and nothing else changes.

Bonus: the ~300 KB Material Symbols font download disappears — mk icons are
tree-shaken inline SVG.

## 5. Dialogs (the biggest surface)

The APIs are intentionally close:

```ts
// before
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
const ref = this.dialog.open(EditUserDialog, { data: user, width: '480px' });
ref.afterClosed().subscribe(result => …);
// inside: data = inject(MAT_DIALOG_DATA); ref = inject(MatDialogRef);

// after
import { MkDialogService } from '@mkornas/ui';
import { MK_OVERLAY_DATA, MkOverlayRef } from '@mkornas/ui/core';
const ref = this.dialog.open(EditUserDialog, { data: user });
const result = await ref.afterClosed;  // Promise, not Observable
// inside: data = inject(MK_OVERLAY_DATA); ref = inject(MkOverlayRef); ref.close(result);
```

Mechanical renames per dialog component: `MAT_DIALOG_DATA → MK_OVERLAY_DATA`,
`MatDialogRef → MkOverlayRef`, `afterClosed().subscribe(fn) → afterClosed.then(fn)`,
`mat-dialog-title/content/actions` → `mk-dialog` parts. `confirm()`,
`alert()` and `prompt()` exist as one-liners on `MkDialogService` — many
small confirmation dialog components can be deleted outright.

## 6. Tables

`MatTableDataSource` has no equivalent — mk-table takes a plain array and
you own the pipeline (which in a signals app is usually *less* code):

```ts
// before: dataSource = new MatTableDataSource(rows); dataSource.sort = sort; …
// after:
readonly rows = signal<Order[]>([]);
readonly sort = signal<MkSortChange | null>(null);
readonly page = signal(1);
readonly view = computed(() => paginate(sortBy(this.rows(), this.sort()), this.page()));
```

```html
<mk-table [data]="view()" [columns]="columns" (sortChange)="sort.set($event)" />
<mk-pagination [total]="rows().length" [pageSize]="20" [(page)]="page" />
```

Column defs are data (`[{ key, header, sortable }]`) instead of
`<ng-container matColumnDef>` markup; cell templates project via
`<ng-template mkTableCell="key">`. Selection, sticky headers, resize,
reorder, pinning, inline edit, grouping and expandable rows are built in —
check before porting custom code.

## 7. Snackbars

`MatSnackBar.open(msg, action)` → `MkSnackbarService.open(message, { action })`
(bottom, single, with action) or `MkToastService.success/error/info(message)`
(stacked corner toasts). Both return refs with dismissal.

## 8. Errors & validation

There is no `<mat-error>` element and no `ErrorStateMatcher`. `mk-form-field`
picks up the projected control's `NgControl` and renders the first error
itself, wording it from the `validation` i18n table — so the common case loses
the per-field `@if` ladder entirely:

```html
<!-- Material -->
<mat-form-field>
  <mat-label>Email</mat-label>
  <input matInput formControlName="email" />
  @if (form.controls.email.hasError('required')) {
    <mat-error>Email is required</mat-error>
  }
  @if (form.controls.email.hasError('email')) {
    <mat-error>Enter a valid email address</mat-error>
  }
</mat-form-field>

<!-- mk-kit -->
<mk-form-field label="Email">
  <input mkInput formControlName="email" />
</mk-form-field>
```

The required indicator and the disabled styling come from the control too
(`Validators.required` / `control.disable()`), so those attributes disappear
as well.

| Material | mk-kit |
|---|---|
| `<mat-error>` per error key | automatic; `[errorMessages]` rewords one key for one field |
| `ErrorStateMatcher` | `errorOn` — `'touched'` (Material's default behaviour), `'dirty'`, `'always'` |
| global `ErrorStateMatcher` provider | `provideMkI18n({ validation: … })` for wording; `errorOn` per field |
| hand-written `<mat-error>` strings | `validation` i18n group — localise every field once |

Constraint inputs behave like Material's validator directives: `[min]`/`[max]`
on a date picker report `mkMinDate`/`mkMaxDate` (Material's
`matDatepickerMin`/`matDatepickerMax`), numeric controls report the standard
`min`/`max` keys, `required` on `mk-checkbox` behaves like
`Validators.requiredTrue`, and `mk-card-number-input` / `mk-iban-input` /
`mk-postal-code-input` validate their own format.

For a submit-time list, point `mk-form-error-summary` at the `FormGroup`
(`[form]` + `[labels]`) instead of building the entries by hand.

## 9. Honest gaps & differences

- **No `MatTableDataSource`** — see §6.
- **Select/autocomplete options are inputs, not projected `<mat-option>`s** —
  templates get shorter but option-level custom templates are limited today.
- **Validation errors are worded by the library**, not by `<mat-error>`
  children — see §8. Per-field wording is `[errorMessages]`; an explicit
  `[error]` still overrides everything.
- **`mat-form-field` appearance variants** (`outline`/`fill`) don't exist —
  mk has one field look; 234 `appearance="outline"` attributes just get
  deleted.
- **`matBadge` attribute → `mk-badge` element** — small structural edits.
- **Ripples** are opt-in (`mkRipple`), not automatic.
- **Observables → Promises/signals/outputs** in service APIs (dialog
  `closed`, etc.).
- **No date adapters** — pickers speak native `Date`; if you use Moment/Luxon
  adapters, convert at the edges.
- CDK niches (portal, layout/breakpoint observer, text-field autosize →
  `mkAutosize` exists) — check per usage.

## 10. Suggested migration order (per app)

1. Install, import the stylesheet, map brand tokens, wire `MkThemeService`
   (delete the hand-rolled dark-mode token sheet).
2. `provideMkMaterialIcons()` + swap `mat-icon` → `mk-icon` (mechanical).
3. Buttons, tooltips, spinners, cards, dividers (mechanical).
4. Form fields + inputs/selects/toggles per feature — delete the
   `<mat-error>` blocks and the `ErrorStateMatcher`s as you go (§8).
5. Dialogs + bottom sheets (rename injection tokens, then per-dialog markup).
6. Tables + paginators/sort.
7. Datepickers, steppers, chips, autocomplete, snackbars, menus, tabs.
8. Drop `@angular/material`/`@angular/cdk` and the Symbols font, prune the
   `.mat-*` override CSS.

## 11. Possible future compat helpers (not built yet)

If repeat migrations justify them, the cheapest levers to build in mk-kit:

- **`MkTableDataSource`** — a `MatTableDataSource`-shaped adapter (data +
  sort + paginator + filter) to make table migrations mechanical.
- **Dialog compat aliases** — `MAT_DIALOG_DATA`/`MatDialogRef`-named
  re-exports of the mk tokens, so dialog components migrate import-only.
- **Projected `<mk-option>` support** on select/autocomplete for
  template-rich options.
- **A codemod** (ts-morph) for the mechanical renames in §3/§5.
