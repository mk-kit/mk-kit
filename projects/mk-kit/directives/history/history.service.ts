import { Injectable, computed, signal, type Signal } from '@angular/core';

/**
 * A single undoable step recorded in an {@link MkHistoryStack}.
 *
 * The **first** execution of an action is the caller's job — `push()` records
 * an action that has *already happened*. `undo()` reverts it; `redo()` applies
 * it again after an undo.
 */
export interface MkHistoryEntry {
  /** Human label for menus/tooltips ("Delete row", "Move card"). */
  label: string;
  /** Revert the action. */
  undo(): void;
  /** Re-apply the action after an undo. */
  redo(): void;
}

/**
 * MkHistoryStack — a pure, signal-based, linear undo/redo command stack with
 * no Angular DI involved. Instantiate it directly for a local editing session
 * (a dialog, a canvas, a form wizard), or use the app-wide singleton
 * {@link MkHistoryService}.
 *
 * ```ts
 * const stack = new MkHistoryStack();
 * deleteRow(row);                                  // 1. do the work yourself
 * stack.push({                                     // 2. record how to revert/redo it
 *   label: 'Delete row',
 *   undo: () => insertRow(row),
 *   redo: () => deleteRow(row),
 * });
 * stack.undo();                                    // row is back
 * ```
 *
 * ### Linear history
 * `push()` clears the redo branch — after undoing twice and pushing a new
 * entry, the two undone entries are gone (the standard editor model).
 *
 * ### ⚠️ Re-entrancy guard — the classic footgun
 * Pushes made **while** `undo()` or `redo()` is executing are **silently
 * ignored**. Naive consumers often record history from a generic change
 * handler (`(cellEdit)`, `valueChanges`, …); when an undo replays the old
 * value, that same handler fires again and would push a mirror entry,
 * corrupting the stack into an undo/redo ping-pong. The guard makes that
 * pattern safe by construction. If you need to record something new in
 * response to an undo, do it after `undo()` returns.
 */
export class MkHistoryStack {
  private readonly undoStack = signal<readonly MkHistoryEntry[]>([]);
  private readonly redoStack = signal<readonly MkHistoryEntry[]>([]);

  /** True while an entry's `undo()`/`redo()` is running (re-entrancy guard). */
  private replaying = false;

  /** Depth of nested `batch()` calls; > 0 while a batch is collecting. */
  private batchDepth = 0;
  private batchLabel = '';
  private batchBuffer: MkHistoryEntry[] = [];

  private maxSize = 100;

  /** True when at least one entry can be undone. */
  readonly canUndo: Signal<boolean> = computed(() => this.undoStack().length > 0);
  /** True when at least one undone entry can be redone. */
  readonly canRedo: Signal<boolean> = computed(() => this.redoStack().length > 0);
  /** Label of the entry `undo()` would revert, or `null` ("Undo *Delete row*"). */
  readonly undoLabel: Signal<string | null> = computed(
    () => this.undoStack().at(-1)?.label ?? null,
  );
  /** Label of the entry `redo()` would re-apply, or `null`. */
  readonly redoLabel: Signal<string | null> = computed(
    () => this.redoStack().at(-1)?.label ?? null,
  );
  /** Number of undoable entries currently on the stack. */
  readonly size: Signal<number> = computed(() => this.undoStack().length);

  /**
   * Maximum number of undoable entries kept (default `100`). When exceeded the
   * **oldest** entries are dropped. Settable at any time; lowering it trims
   * the stack immediately. Values below 1 are clamped to 1.
   */
  get limit(): number {
    return this.maxSize;
  }
  set limit(value: number) {
    this.maxSize = Math.max(1, Math.floor(value));
    this.undoStack.update((stack) =>
      stack.length > this.maxSize ? stack.slice(stack.length - this.maxSize) : stack,
    );
  }

  /**
   * Record an already-performed action. Clears the redo branch and evicts the
   * oldest entry beyond {@link limit}. Ignored while `undo()`/`redo()` is
   * executing (see the re-entrancy note on the class) — inside a `batch()` the
   * entry is collected into the composite instead.
   */
  push(entry: MkHistoryEntry): void {
    if (this.replaying) return;
    if (this.batchDepth > 0) {
      this.batchBuffer.push(entry);
      return;
    }
    this.commit(entry);
  }

  /** Undo the most recent entry. Returns `false` when there is nothing to undo. */
  undo(): boolean {
    const entry = this.undoStack().at(-1);
    if (!entry) return false;
    this.undoStack.update((stack) => stack.slice(0, -1));
    this.replaying = true;
    try {
      entry.undo();
    } finally {
      this.replaying = false;
    }
    this.redoStack.update((stack) => [...stack, entry]);
    return true;
  }

  /** Redo the most recently undone entry. Returns `false` when there is nothing to redo. */
  redo(): boolean {
    const entry = this.redoStack().at(-1);
    if (!entry) return false;
    this.redoStack.update((stack) => stack.slice(0, -1));
    this.replaying = true;
    try {
      entry.redo();
    } finally {
      this.replaying = false;
    }
    this.undoStack.update((stack) => [...stack, entry]);
    return true;
  }

  /** Drop all entries (both branches) and any in-flight batch collection. */
  clear(): void {
    this.undoStack.set([]);
    this.redoStack.set([]);
    this.batchBuffer = [];
  }

  /**
   * Group every `push()` made during `work()` into **one** undoable step.
   * Undo runs the children in reverse order; redo runs them forward. Nested
   * `batch()` calls flatten into the outermost batch (its label wins). An
   * empty batch records nothing. Returns `work()`'s result; if `work()`
   * throws, entries pushed before the throw are still committed.
   */
  batch<T>(label: string, work: () => T): T {
    if (this.replaying) return work();
    this.batchDepth++;
    if (this.batchDepth === 1) {
      this.batchLabel = label;
      this.batchBuffer = [];
    }
    try {
      return work();
    } finally {
      this.batchDepth--;
      if (this.batchDepth === 0 && this.batchBuffer.length > 0) {
        const children = this.batchBuffer;
        this.batchBuffer = [];
        this.commit({
          label: this.batchLabel,
          undo: () => {
            for (let i = children.length - 1; i >= 0; i--) children[i].undo();
          },
          redo: () => {
            for (const child of children) child.redo();
          },
        });
      }
    }
  }

  /**
   * Create an **independent** stack with the same API — e.g. for a dialog's
   * local editing session that should not pollute the app-wide history.
   * Discard it (or `clear()` it) when the session ends.
   */
  createScope(): MkHistoryStack {
    return new MkHistoryStack();
  }

  /** Append to the undo stack: clear the redo branch, evict beyond the limit. */
  private commit(entry: MkHistoryEntry): void {
    this.redoStack.set([]);
    this.undoStack.update((stack) => {
      const next = [...stack, entry];
      return next.length > this.maxSize ? next.slice(next.length - this.maxSize) : next;
    });
  }
}

/**
 * MkHistoryService — the app-wide {@link MkHistoryStack} singleton. Inject it
 * anywhere; call {@link MkHistoryStack.createScope} for an isolated local
 * stack, or wire `mod+z` / `mod+shift+z` / `mod+y` with
 * {@link registerHistoryHotkeys}.
 *
 * ### Recipe — undoable `mk-table` cell edits
 * Wire the table's `(cellEdit)` output so each saved cell becomes one
 * undoable step. Apply the edit yourself first (`push()` records an action
 * that already happened), and match rows by a stable id — the row object is
 * replaced by the immutable update:
 *
 * ```ts
 * // <mk-table [rows]="rows()" [columns]="columns" (cellEdit)="onCellEdit($event)" />
 * private readonly history = inject(MkHistoryService);
 * readonly rows = signal<Order[]>([...]);
 *
 * onCellEdit(edit: MkCellEdit<Order>): void {
 *   const previous = edit.row[edit.key as keyof Order];
 *   const apply = (value: unknown) =>
 *     this.rows.update((rows) =>
 *       rows.map((r) => (r.id === edit.row.id ? { ...r, [edit.key]: value } : r)),
 *     );
 *   apply(edit.value); // first execution is the caller's job
 *   this.history.push({
 *     label: `Edit ${edit.key}`,
 *     undo: () => apply(previous),
 *     redo: () => apply(edit.value),
 *   });
 * }
 * ```
 *
 * Undoing replays the old value through the same `apply` function; if your
 * change pipeline re-emits into `onCellEdit` during that replay, the
 * re-entrancy guard drops the spurious `push()` (see {@link MkHistoryStack}).
 */
@Injectable({ providedIn: 'root' })
export class MkHistoryService extends MkHistoryStack {}
