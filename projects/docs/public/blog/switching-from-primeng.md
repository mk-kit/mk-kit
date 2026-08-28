PrimeNG has been the default answer to "which Angular component library?" for a decade. On 28 June 2026 that answer got a price tag. If you are one of the teams now doing the maths, this post is the map: what actually changed, what your options are, and — if you pick the MIT route — exactly how far a schematic gets you and where you still have to think.

## What changed, in plain terms

- **PrimeNG 22 and later ship under the PrimeUI licence**, not MIT. The same applies to PrimeVue 5+ and PrimeReact 11+. The GitHub repository moved to security-fixes-only the same day.
- **PrimeNG 21 and everything before it stays MIT.** Nobody can take back a licence you already have.
- **The commercial licence is $599 per developer** (perpetual, with a year of updates) until the end of 2026 and **$799 from 2027**, plus $399 per developer per year to keep receiving updates after that.
- **A free community licence exists**, but only if your company meets *all* of: under $1M revenue, fewer than 5 developers, fewer than 10 employees, under $3M outside funding. It is renewed yearly and checked at runtime.
- **The parts most admin apps lean on hardest are sold separately** as PrimeUI PRO: Scheduler ($799), Text Editor ($499), Charts ($399), Task Board ($399). A data grid, spreadsheet, gantt and diagram are announced for later in 2026.

None of this is a criticism. Maintaining 90+ components for free for ten years is a gift, and a company is allowed to stop giving it. But it does change your plan.

## Your four options

1. **Freeze on PrimeNG 21.** It is MIT and it works. It will not follow Angular past the versions it supports, so you are buying time, not a solution. Fine for an app in maintenance mode.
2. **Pay.** For a 20-developer team that is $12k now, $16k from January, and ~$8k a year after that to stay current — before any PRO widgets. Entirely reasonable if PrimeNG is deeply woven into a product that makes money.
3. **Move to the community fork.** [Optimus UI](https://github.com/openng-org/optimus-ui) by the OpenNG Foundation keeps the selectors and class names identical, so it is the least disruptive move. It also inherits PrimeNG's open issues and is run by volunteers. Worth a look if you need zero template changes today.
4. **Migrate to a library that was MIT from the start and says so in writing.** This is the mk-kit route, and the rest of this post is about it.

## What mk-kit is (and is not)

mk-kit is an Angular 22 component library built for admin panels and internal tools: **180 components, MIT, no runtime licence checks, no revenue thresholds, no community edition.** Every input is a signal, every component is standalone and OnPush, it runs zoneless, it is WCAG 2.1 AA, and the whole theme is `--mk-*` CSS custom properties with light and dark out of the box.

It is deliberately narrower than PrimeNG. There is no PDF viewer, no spreadsheet, no diagram editor, no terminal, no dock. There *is* everything an admin app needs — and the categories PrimeUI sells as PRO are in the free package:

| PrimeNG | mk-kit | Note |
|---|---|---|
| `p-table` | `mk-table` | `MkTableDataSource`, tree rows, CSV export, print |
| `p-select` / `p-dropdown` | `mk-select` | `[options]` of `{ label, value }` |
| `p-multiSelect` | `mk-multi-select` | |
| `p-datePicker` / `p-calendar` | `mk-date-picker` | plus range, time, datetime, month, week pickers |
| `p-dialog` / `DialogService` | `MkDialogService` | `confirm()` and `prompt()` built in |
| `p-toast` / `MessageService` | `MkToastService` | `toast.success(detail, { title })` |
| `p-menu` / `p-contextMenu` | `mk-menu` / `mkContextMenuTriggerFor` | nested submenus |
| `p-chart` **(PRO)** | `mk-line-chart`, `mk-bar-chart`, `mk-donut-chart`, … | SVG, themed by tokens, no Chart.js |
| `p-editor` **(PRO)** | `mk-rich-text` / `mk-block-editor` | |
| Scheduler **(PRO)** | `mk-event-calendar` | resource timeline lives in [Pro](/pro) |
| Task Board **(PRO)** | `mk-kanban` | |
| `p-cascadeSelect` / `p-listbox` / `p-treeSelect` | `mk-cascader` / `mk-listbox` / `mk-tree-select` | |
| `p-fileUpload` | `mk-file-upload` | |
| `p-blockUI` | `mkBlockUi` | |
| `p-picklist` / `p-orderlist` | `mk-transfer-list` / `mk-sortable-list` | |

The [full component index](/components-index) has all 180; the [API reference](/api) is generated from the source, and there is an `llms.txt` if you would rather ask your editor.

## The schematic does the boring part

Install mk-kit next to PrimeNG (both can live in one app — the selectors and CSS never collide) and run the migration in report mode first:

```bash
ng add @mk-kit/ui
ng g @mk-kit/ui:migrate-primeng --dry-run
```

You get a `primeng-migration.md` report before anything is touched. Then apply it:

```bash
ng g @mk-kit/ui:migrate-primeng
```

**What it rewrites for you**

- `primeng/*` imports and class names → `@mk-kit/ui` (`ButtonModule` → `MkButton`, `MessageService` → `MkToastService`, …), deduping the `imports: []` arrays.
- Selectors that map 1:1, in `.html` files *and* inline templates: `pButton` → `mkButton`, `pInputText` → `mkInput`, `p-select` → `mk-select`, `p-checkbox`, `p-toggleswitch`, `p-table`, `p-tabView`, `p-accordion`, `p-tag`, `p-chip`, `p-avatar`, `p-skeleton`, `p-drawer`, `pTooltip` → `mkTooltip` — about 150 rules in total.
- Mechanical inputs: `[value]` → `[data]` on tables, `severity` → `tone`, `[(activeIndex)]` → `[(selectedIndex)]`, `[(visible)]` → `[(open)]` on drawers, `tooltipPosition` → `mkTooltipPlacement`.
- `angular.json` styles (PrimeNG theme and primeicons out, the mk-kit stylesheet in) and `package.json` (the PrimeNG packages are removed once nothing unmapped is left).

**What it leaves a note for** — a `<!-- mk-kit: … -->` comment in the template plus a line in the report with a docs link:

- `p-dialog [(visible)]` → `MkDialogService.open(Component)`; `p-confirmDialog` → `await dialog.confirm(…)`.
- The `p-toast` host and `MessageService.add({ severity, summary, detail })` → `toast.success(detail, { title })`.
- Menus, breadcrumbs and steppers driven by `[model]` → child elements; `p-chart` → the matching SVG chart; `pTemplate` → content slots.
- Anything with no counterpart — it is listed, not guessed.

The rule is simple: **the schematic never rewrites something it cannot make compile.** Handle the notes and the build goes green.

## Honest gaps

You should know these before you start, not halfway through:

- No organisation chart, dock, terminal, meter group or float-label variant. The first is on the roadmap; the others are not planned.
- No PDF viewer, spreadsheet or diagram editor — each is a product on its own, and PrimeUI sells them separately too.
- Options for selects are data (`[options]`), not projected option elements. The schematic converts the common `{ label, value }` shape; custom option templates move to the component's option template slot.
- Services are Promise- and signal-based, not Observable-based. `await dialog.confirm()` instead of `.subscribe()`.

If your report lists something that is not in this list, [open an issue](https://github.com/mk-kit/mk-kit/issues) with the report attached. I read every one, and gaps that block a migration go to the top of the queue.

## A sane order of work

1. Run the dry run. Read the report. Count the notes — that is your real effort.
2. Swap the theme: delete the PrimeNG theme and `primeicons`, set `--mk-primary` and friends (the [theme builder](/theme-builder) writes the file).
3. Apply the schematic. Fix the notes, one screen at a time, with both libraries installed.
4. Drop `primeng` from `package.json` when the report is empty.

The notes cluster around dialogs, toasts and menus — once you have converted one of each, the rest is repetition.

## Timing

The price step to $799 happens on 1 January 2027, and PrimeNG 21 will not follow Angular forever. If you are going to move, the cheapest moment is while PrimeNG 21 still builds cleanly against your Angular version and both libraries can coexist.

And if you are not going to move — genuinely, that is fine. Pay the people who built the thing you use. Just make it a decision rather than a default.

---

*Want a second pair of eyes on your report? Attach it to an issue, or say hello via the [Pro waitlist form](/pro) if you would like the resource scheduler, gantt and the rest of the paid widgets on the same theme.*
