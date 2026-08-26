import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  MkBottomSheet,
  MkBottomSheetService,
  MkButton,
  MkCalendar,
  MkDialog,
  MkDialogService,
  MkDialogTitle,
  MkDrag,
  MkDragHandle,
  MkDropList,
  MkFab,
  MkInput,
  MkOverlayRef,
  MkPagination,
  MkSignaturePad,
  MkTable,
  mkMoveItemInArray,
  type MkDropEvent,
  type MkTableColumn,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/** A row in the stacked-table demos. */
interface OrderRow {
  order: string;
  customer: string;
  total: string;
  status: string;
  ref: string;
}

/** A sortable checklist item in the gestures demo. */
interface ChecklistItem {
  id: number;
  label: string;
}

const SORT_OPTIONS = [
  'Newest first',
  'Price: low to high',
  'Price: high to low',
  'Top rated',
] as const;

/**
 * "Sort orders" content opened as a centered dialog via `MkDialogService`.
 * Same choices as {@link TouchSortSheet} — only the surface differs.
 */
@Component({
  selector: 'docs-touch-sort-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkDialog, MkDialogTitle, MkButton],
  template: `
    <mk-dialog>
      <mk-dialog-title>Sort orders</mk-dialog-title>
      <div style="display: flex; flex-direction: column; gap: var(--mk-space-1);">
        @for (option of options; track option) {
          <button mkButton variant="ghost" fullWidth (click)="ref.close(option)">
            {{ option }}
          </button>
        }
      </div>
      <div mkDialogFooter>
        <button mkButton variant="ghost" tone="neutral" (click)="ref.close()">
          Cancel
        </button>
      </div>
    </mk-dialog>
  `,
})
export class TouchSortDialog {
  protected readonly options = SORT_OPTIONS;
  protected readonly ref = inject<MkOverlayRef<string>>(MkOverlayRef);
}

/**
 * The same "Sort orders" content opened as a bottom sheet via
 * `MkBottomSheetService` — the sheet adds the swipe-down-to-dismiss handle.
 */
@Component({
  selector: 'docs-touch-sort-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkBottomSheet, MkButton],
  template: `
    <mk-bottom-sheet sheetTitle="Sort orders">
      <div style="display: flex; flex-direction: column; gap: var(--mk-space-1);">
        @for (option of options; track option) {
          <button mkButton variant="ghost" fullWidth (click)="ref.close(option)">
            {{ option }}
          </button>
        }
      </div>
    </mk-bottom-sheet>
  `,
})
export class TouchSortSheet {
  protected readonly options = SORT_OPTIONS;
  protected readonly ref = inject<MkOverlayRef<string>>(MkOverlayRef);
}

/**
 * Touch & mobile showcase — how `@mk-kit/ui` adapts to fingers and small
 * viewports: the `touch` density, stacked tables, bottom sheets, gesture
 * components, and coarse-pointer guidance.
 */
@Component({
  selector: 'docs-touch-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkButton,
    MkCalendar,
    MkDrag,
    MkDragHandle,
    MkDropList,
    MkFab,
    MkInput,
    MkPagination,
    MkSignaturePad,
    MkTable,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Touch &amp; mobile</h1>
      <p class="docs-lead">
        One theme, every pointer. The library sizes for fingers with the
        <code class="docs-inline">touch</code> density, stacks tables into
        cards on narrow screens, swaps dialogs for bottom sheets, and ships
        touch-first gesture components.
      </p>

      <!-- ======================== TOUCH DENSITY ======================== -->
      <h2>Touch density</h2>
      <p>
        <code class="docs-inline">MkThemeService.setDensity('touch')</code>
        enlarges every control to a finger-sized hit target (48px default)
        globally — the header's density button on this site cycles through it.
        More often you want it <em>per subtree</em>: put
        <code class="docs-inline">data-mk-density="touch"</code> on one screen,
        dialog, or kiosk view and the tokens inherit — the rest of the app
        stays cursor-sized. Toggle the right-hand panel below and compare.
      </p>
      <docs-example [code]="densityCode" column>
        <button mkButton variant="outline" (click)="touchSubtree.set(!touchSubtree())">
          {{ touchSubtree() ? 'Remove' : 'Apply' }} data-mk-density="touch"
        </button>
        <div class="density-compare">
          <section class="density-panel">
            <p class="density-panel__label">Default density</p>
            <button mkButton>Add to cart</button>
            <input mkInput placeholder="Search orders" />
            <mk-pagination [total]="42" [pageSize]="10" [(page)]="pageDefault" />
            <mk-calendar [(value)]="calDefault" fullWidth />
          </section>
          <section
            class="density-panel"
            [class.density-panel--touch]="touchSubtree()"
            [attr.data-mk-density]="touchSubtree() ? 'touch' : null"
          >
            <p class="density-panel__label">
              {{ touchSubtree() ? 'Touch subtree' : 'Default (toggle above)' }}
            </p>
            <button mkButton>Add to cart</button>
            <input mkInput placeholder="Search orders" />
            <mk-pagination [total]="42" [pageSize]="10" [(page)]="pageTouch" />
            <mk-calendar [(value)]="calTouch" fullWidth />
          </section>
        </div>
      </docs-example>

      <!-- ======================== STACKED TABLE ======================== -->
      <h2>Stacked table</h2>
      <p>
        A grid of columns does not survive a phone. Give
        <code class="docs-inline">mk-table</code> a
        <code class="docs-inline">stackAt</code> width and below it each row
        re-renders as a card: columns marked
        <code class="docs-inline">stack: 'title'</code> become the heading,
        <code class="docs-inline">'footer'</code> pins to the bottom,
        <code class="docs-inline">'hide'</code> is not rendered at all, and the
        rest become labelled fields. The demo table sits in a 360px container,
        so it stacks regardless of your window.
      </p>
      <docs-example [code]="stackCode" column>
        <div class="stack-demo">
          <mk-table [columns]="orderColumns" [data]="orderRows" [stackAt]="480" />
        </div>
      </docs-example>

      <!-- ==================== BOTTOM SHEET VS DIALOG =================== -->
      <h2>Bottom sheet vs dialog</h2>
      <p>
        The same content can open as a centered dialog or as a bottom sheet —
        both promise-based, both returning the pick through
        <code class="docs-inline">afterClosed</code>. On phones prefer the
        sheet: it rises from the bottom into thumb reach, and its drag handle
        gives a swipe-down-to-dismiss gesture, where a dialog's close affordance
        is a small ✕ at the top of the screen.
      </p>
      <docs-example [code]="sheetVsDialogCode" column>
        <div class="surface-buttons">
          <button mkButton variant="outline" (click)="openAsDialog()">
            Open as dialog
          </button>
          <button mkButton (click)="openAsSheet()">Open as bottom sheet</button>
        </div>
        <p class="echo">Last choice: {{ lastSort() || '—' }}</p>
      </docs-example>

      <!-- ========================== GESTURES =========================== -->
      <h2>Gestures</h2>
      <p>
        <code class="docs-inline">&lt;mk-signature-pad&gt;</code> captures a
        freehand signature from finger, stylus, or mouse and exposes it as a
        PNG data URL:
      </p>
      <docs-example [code]="signatureCode" column>
        <mk-signature-pad [(value)]="signature" />
        <p class="echo">
          {{ signature() ? 'Captured (' + signature()!.length + ' chars of data URL).' : 'Sign above — clear with the ✕.' }}
        </p>
      </docs-example>
      <p>
        Drag &amp; drop works on touch too, but a whole draggable row swallows
        the swipe you need for scrolling. The touch-safe configuration is a
        dedicated <code class="docs-inline">[mkDragHandle]</code> grip: drags
        may only start on the handle, so the rest of the row scrolls, selects,
        and clicks normally.
      </p>
      <docs-example [code]="sortableCode" column>
        <ul
          mkDropList
          class="touch-list"
          [mkDropListData]="checklist()"
          (mkDropListDropped)="onChecklistReorder($event)"
        >
          @for (item of checklist(); track item.id) {
            <li mkDrag [mkDragData]="item" class="touch-list__item">
              <button type="button" mkDragHandle class="touch-list__handle" aria-label="Drag to reorder">
                ⠿
              </button>
              <span>{{ item.label }}</span>
            </li>
          }
        </ul>
      </docs-example>

      <!-- ======================== PHONE FRAME ========================== -->
      <h2>Phone-frame demo</h2>
      <p>
        A 375px frame — the classic phone viewport — holding a mini order
        screen. The table stacks into cards because the <em>container</em> is
        narrow (<code class="docs-inline">stackAt</code> measures the table,
        not the window), and the FAB keeps the primary action in thumb reach.
      </p>
      <div class="phone">
        <header class="phone__bar">Orders</header>
        <div class="phone__body" data-mk-density="touch">
          <mk-table [columns]="orderColumns" [data]="orderRows" [stackAt]="480" />
        </div>
        <div class="phone__fab">
          <mk-fab position="static" label="New order" (action)="fabClicks.set(fabClicks() + 1)">＋</mk-fab>
        </div>
      </div>
      <p class="echo">FAB pressed {{ fabClicks() }} time(s).</p>

      <!-- ==================== COARSE-POINTER NOTES ===================== -->
      <h2>Designing for coarse pointers</h2>
      <p>
        The library enlarges hit targets and input font sizes on coarse-pointer
        devices automatically — a
        <code class="docs-inline">(pointer: coarse)</code> media query grows
        interactive areas and keeps inputs at a 16px font so iOS does not zoom
        the page on focus. A few things still belong to you:
      </p>
      <ul>
        <li>
          <strong>Hover does not exist.</strong> Tooltips and hovercards never
          show on a touch screen — anything they carry needs a visible-label
          fallback (an <code class="docs-inline">aria-label</code> alone is not
          a visible label).
        </li>
        <li>
          <strong>Prefer tap-opened surfaces.</strong> For touch-first UIs
          reach for popovers and bottom sheets — explicitly opened, explicitly
          dismissed — instead of hover-revealed menus.
        </li>
        <li>
          <strong>Scope the touch density.</strong> One app often has a
          mouse-driven admin and a finger-driven floor screen; apply
          <code class="docs-inline">data-mk-density="touch"</code> to the
          subtree that needs it rather than globally.
        </li>
        <li>
          <strong>Keep drags on handles.</strong> A fully draggable surface
          steals the scroll gesture; a
          <code class="docs-inline">[mkDragHandle]</code> grip leaves the page
          scrollable.
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .echo {
        margin: var(--mk-space-2) 0 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .density-compare {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: var(--mk-space-4);
        width: 100%;
        margin-top: var(--mk-space-3);
      }
      .density-panel {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--mk-space-3);
        padding: var(--mk-space-4);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
      }
      .density-panel--touch {
        border-color: var(--mk-primary);
      }
      .density-panel__label {
        margin: 0;
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-semibold);
        color: var(--mk-text-muted);
      }
      .density-panel input[mkInput] {
        width: 100%;
      }
      .stack-demo {
        width: 100%;
        max-width: 360px;
      }
      .surface-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-3);
      }
      .touch-list {
        margin: 0;
        padding: 0;
        list-style: none;
        width: 100%;
        max-width: 22rem;
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
        overflow: hidden;
      }
      .touch-list__item {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        padding: var(--mk-space-2) var(--mk-space-3);
        border-bottom: var(--mk-border-width) solid var(--mk-border-subtle);
        background: var(--mk-surface);
      }
      .touch-list__item:last-child {
        border-bottom: 0;
      }
      .touch-list__handle {
        display: grid;
        place-items: center;
        width: 2.25rem;
        height: 2.25rem;
        border: 0;
        border-radius: var(--mk-radius-sm);
        background: transparent;
        color: var(--mk-text-subtle);
        font-size: var(--mk-font-size-md);
        cursor: grab;
        touch-action: none;
      }
      .touch-list__handle:hover {
        background: var(--mk-surface-2);
        color: var(--mk-text);
      }
      .phone {
        position: relative;
        width: 375px;
        max-width: 100%;
        height: 30rem;
        margin-top: var(--mk-space-4);
        display: flex;
        flex-direction: column;
        border: 3px solid var(--mk-border);
        border-radius: var(--mk-radius-xl);
        background: var(--mk-bg);
        overflow: hidden;
        box-shadow: var(--mk-shadow-md);
      }
      .phone__bar {
        flex: none;
        padding: var(--mk-space-3) var(--mk-space-4);
        font-weight: var(--mk-font-weight-semibold);
        border-bottom: var(--mk-border-width) solid var(--mk-border);
        background: var(--mk-surface);
      }
      .phone__body {
        flex: 1;
        overflow-y: auto;
        padding: var(--mk-space-3);
      }
      .phone__fab {
        position: absolute;
        right: var(--mk-space-4);
        bottom: var(--mk-space-4);
      }
    `,
  ],
})
export class TouchPage {
  private readonly dialog = inject(MkDialogService);
  private readonly bottomSheet = inject(MkBottomSheetService);

  // --- Touch density --------------------------------------------------------
  protected readonly touchSubtree = signal(true);
  protected readonly pageDefault = signal(1);
  protected readonly pageTouch = signal(1);
  protected readonly calDefault = signal<Date | null>(null);
  protected readonly calTouch = signal<Date | null>(null);

  protected readonly densityCode = `<!-- Global: theme.setDensity('touch') writes data-mk-density on <html>. -->
<!-- Per subtree: the attribute scopes to one screen — tokens inherit. -->
<div data-mk-density="touch">
  <button mkButton>Add to cart</button>
  <input mkInput placeholder="Search orders" />
  <mk-pagination [total]="42" [pageSize]="10" [(page)]="page" />
  <mk-calendar [(value)]="date" />
</div>`;

  // --- Stacked table --------------------------------------------------------
  protected readonly orderColumns: MkTableColumn<OrderRow>[] = [
    { key: 'order', header: 'Order', stack: 'title' },
    { key: 'customer', header: 'Customer' },
    { key: 'total', header: 'Total', align: 'end' },
    { key: 'status', header: 'Status', stack: 'footer' },
    { key: 'ref', header: 'Internal ref', stack: 'hide' },
  ];

  protected readonly orderRows: OrderRow[] = [
    { order: '#1042', customer: 'Ada Lovelace', total: '$128.00', status: 'Shipped', ref: 'wh-9/A' },
    { order: '#1043', customer: 'Grace Hopper', total: '$54.50', status: 'Packing', ref: 'wh-2/C' },
    { order: '#1044', customer: 'Alan Turing', total: '$310.99', status: 'Paid', ref: 'wh-4/B' },
  ];

  protected readonly stackCode = `<mk-table [columns]="columns" [data]="orders" [stackAt]="480" />

columns: MkTableColumn<OrderRow>[] = [
  { key: 'order', header: 'Order', stack: 'title' },   // card heading
  { key: 'customer', header: 'Customer' },             // labelled field
  { key: 'total', header: 'Total', align: 'end' },     // labelled field
  { key: 'status', header: 'Status', stack: 'footer' },// pinned to the bottom
  { key: 'ref', header: 'Internal ref', stack: 'hide' } // not rendered
];`;

  // --- Bottom sheet vs dialog -----------------------------------------------
  protected readonly lastSort = signal('');

  protected async openAsDialog(): Promise<void> {
    const ref = this.dialog.open<TouchSortDialog, string>(TouchSortDialog);
    const choice = await ref.afterClosed;
    if (choice) this.lastSort.set(`${choice} (via dialog)`);
  }

  protected async openAsSheet(): Promise<void> {
    const ref = this.bottomSheet.open<TouchSortSheet, string>(TouchSortSheet);
    const choice = await ref.afterClosed;
    if (choice) this.lastSort.set(`${choice} (via bottom sheet)`);
  }

  protected readonly sheetVsDialogCode = `// The same options, two surfaces — pick per pointer / viewport:
const ref = this.dialog.open<SortDialog, string>(SortDialog);      // desktop
const ref = this.bottomSheet.open<SortSheet, string>(SortSheet);   // phone

const choice = await ref.afterClosed; // string | undefined`;

  // --- Gestures -------------------------------------------------------------
  protected readonly signature = signal<string | null>(null);
  protected readonly signatureCode = `<mk-signature-pad [(value)]="signature" />`;

  protected readonly checklist = signal<ChecklistItem[]>([
    { id: 1, label: 'Confirm the delivery address' },
    { id: 2, label: 'Scan every parcel' },
    { id: 3, label: 'Collect the signature' },
    { id: 4, label: 'Mark the order complete' },
  ]);

  protected onChecklistReorder(event: MkDropEvent<ChecklistItem>): void {
    const next = [...this.checklist()];
    mkMoveItemInArray(next, event.previousIndex, event.currentIndex);
    this.checklist.set(next);
  }

  protected readonly sortableCode = `<ul mkDropList [mkDropListData]="items()" (mkDropListDropped)="onReorder($event)">
  @for (item of items(); track item.id) {
    <li mkDrag [mkDragData]="item">
      <!-- drags start only on the grip — the row still scrolls on touch -->
      <button type="button" mkDragHandle aria-label="Drag to reorder">⠿</button>
      {{ item.label }}
    </li>
  }
</ul>`;

  // --- Phone frame ----------------------------------------------------------
  protected readonly fabClicks = signal(0);
}
