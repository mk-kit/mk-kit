import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  MK_OVERLAY_DATA,
  MkBottomSheet,
  MkBottomSheetService,
  MkButton,
  MkOverlayRef,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/** Data passed into the share sheet. */
interface ShareData {
  title: string;
}

/**
 * A custom bottom-sheet content component opened via
 * `MkBottomSheetService.open`. It lays out with `mk-bottom-sheet` (drag handle,
 * titled header, scrollable body) and closes through the injected
 * {@link MkOverlayRef}, returning the chosen option.
 */
@Component({
  selector: 'docs-share-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkBottomSheet, MkButton],
  template: `
    <mk-bottom-sheet [sheetTitle]="data.title">
      <div style="display: flex; flex-direction: column; gap: var(--mk-space-1);">
        <button mkButton variant="ghost" fullWidth (click)="pick('Copy link')">Copy link</button>
        <button mkButton variant="ghost" fullWidth (click)="pick('Email')">Email</button>
        <button mkButton variant="ghost" fullWidth (click)="pick('Messages')">Messages</button>
        <button mkButton variant="ghost" fullWidth (click)="pick('Download')">Download</button>
      </div>
      <div mkBottomSheetFooter>
        <button mkButton variant="outline" (click)="ref.close()">Cancel</button>
      </div>
    </mk-bottom-sheet>
  `,
})
export class ShareSheet {
  protected readonly data = inject<ShareData>(MK_OVERLAY_DATA);
  protected readonly ref = inject<MkOverlayRef<string>>(MkOverlayRef);

  protected pick(choice: string): void {
    this.ref.close(choice);
  }
}

/**
 * Documentation + live demo page for the `MkBottomSheetService` /
 * `mk-bottom-sheet` of `@mk-kit/ui`.
 */
@Component({
  selector: 'docs-bottom-sheet-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton],
  template: `
    <div class="docs-page docs-container">
      <h1>Bottom sheet</h1>
      <p class="docs-lead">
        <code class="docs-inline">MkBottomSheetService</code> renders a component
        in a panel anchored to the bottom edge — full width on small screens, a
        centred card capped at ~42rem on large ones. It slides up on open, traps
        focus, closes on backdrop / Escape, and can be
        <strong>swiped down</strong> to dismiss via its drag handle. For a
        centred modal use <code class="docs-inline">MkDialogService</code>.
      </p>

      <!-- ============================================================ -->
      <h2>Open a sheet</h2>
      <p>
        Pass a standalone component to
        <code class="docs-inline">open()</code>; it lays out its content with
        <code class="docs-inline">&lt;mk-bottom-sheet&gt;</code> and closes
        through the injected <code class="docs-inline">MkOverlayRef</code>,
        optionally returning a result via
        <code class="docs-inline">afterClosed</code>.
      </p>
      <docs-example [code]="openCode">
        <div style="display: flex; gap: var(--mk-space-3); align-items: center; flex-wrap: wrap;">
          <button mkButton (click)="openShare()">Share…</button>
          <span class="echo">Last choice: {{ choice() }}</span>
        </div>
      </docs-example>

      <p>The projected <code class="docs-inline">mk-bottom-sheet</code> markup:</p>
      <docs-example [code]="markupCode"></docs-example>

      <!-- ============================================================ -->
      <h2>Configuration</h2>
      <table class="docs-props">
        <thead>
          <tr><th>MkBottomSheetConfig</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>data</td><td>T</td><td>—</td><td>Injected into the component via <code class="docs-inline">MK_OVERLAY_DATA</code>.</td></tr>
          <tr><td>hasBackdrop</td><td>boolean</td><td><code class="docs-inline">true</code></td><td>Dimmed scrim behind the sheet.</td></tr>
          <tr><td>closeOnBackdropClick</td><td>boolean</td><td><code class="docs-inline">true</code></td><td>Dismiss when the scrim is clicked.</td></tr>
          <tr><td>closeOnEscape</td><td>boolean</td><td><code class="docs-inline">true</code></td><td>Dismiss on the Escape key.</td></tr>
          <tr><td>trapFocus</td><td>boolean</td><td><code class="docs-inline">true</code></td><td>Trap Tab focus inside; restore on close.</td></tr>
          <tr><td>panelClass</td><td>string | string[]</td><td>—</td><td>Extra classes on the panel host.</td></tr>
        </tbody>
      </table>
      <p>
        The <code class="docs-inline">mk-bottom-sheet</code> layout accepts
        <code class="docs-inline">sheetTitle</code>,
        <code class="docs-inline">hideHandle</code> and
        <code class="docs-inline">hideClose</code> inputs, plus
        <code class="docs-inline">[mkBottomSheetFooter]</code> for a sticky footer.
      </p>
    </div>
  `,
})
export class BottomSheetPage {
  private readonly bottomSheet = inject(MkBottomSheetService);
  protected readonly choice = signal('—');

  protected async openShare(): Promise<void> {
    const ref = this.bottomSheet.open<ShareSheet, string, ShareData>(ShareSheet, {
      data: { title: 'Share this page' },
    });
    const result = await ref.afterClosed;
    this.choice.set(result ?? 'cancelled');
  }

  protected readonly openCode = `private readonly bottomSheet = inject(MkBottomSheetService);

async openShare() {
  const ref = this.bottomSheet.open(ShareSheet, { data: { title: 'Share' } });
  const choice = await ref.afterClosed; // the value passed to ref.close(x)
}`;

  protected readonly markupCode = `<mk-bottom-sheet [sheetTitle]="data.title">
  <button mkButton variant="ghost" fullWidth (click)="pick('Copy link')">Copy link</button>
  <button mkButton variant="ghost" fullWidth (click)="pick('Email')">Email</button>

  <div mkBottomSheetFooter>
    <button mkButton variant="outline" (click)="ref.close()">Cancel</button>
  </div>
</mk-bottom-sheet>

// in the component:
ref = inject<MkOverlayRef<string>>(MkOverlayRef);
pick(choice: string) { this.ref.close(choice); }`;
}
