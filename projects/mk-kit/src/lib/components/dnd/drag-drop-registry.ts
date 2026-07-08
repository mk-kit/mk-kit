/* eslint-disable @typescript-eslint/no-explicit-any -- lists hold heterogeneous
   item types; `any` here avoids generic-variance friction across the registry. */
import { Injectable } from '@angular/core';
import type { MkDropList } from './drop-list';

/**
 * Central registry of every live `[mkDropList]` on the page, keyed by id.
 *
 * Connected lists (kanban "buckets") use it to resolve the sibling lists named
 * in `mkDropListConnectedTo`, and both pointer and keyboard dragging use it to
 * find the group of lists an item may travel between.
 *
 * Registration is automatic — you never call this service directly; it is
 * documented so tooling/tests can inspect the wiring.
 */
@Injectable({ providedIn: 'root' })
export class MkDragDropRegistry {
  private readonly lists = new Map<string, MkDropList<any>>();

  /** Register (or replace) the list published under `id`. */
  register(id: string, list: MkDropList<any>): void {
    this.lists.set(id, list);
  }

  /** Remove `list` from the registry if it is still the holder of `id`. */
  unregister(id: string, list: MkDropList<any>): void {
    if (this.lists.get(id) === list) this.lists.delete(id);
  }

  /** Look up a list by its `mkDropListId`. */
  get(id: string): MkDropList<any> | undefined {
    return this.lists.get(id);
  }

  /** All registered lists, in registration order. */
  all(): MkDropList<any>[] {
    return [...this.lists.values()];
  }

  /**
   * The ordered travel group for `list`: `list` itself plus every enabled list
   * it is `mkDropListConnectedTo`, in registration (roughly DOM) order. Used to
   * resolve "adjacent" lists for keyboard column-to-column movement and to
   * hit-test the pointer against candidate targets.
   */
  connectedGroup(list: MkDropList<any>): MkDropList<any>[] {
    const connected = list.connectedTo();
    return this.all().filter(
      (l) =>
        l === list || (connected.includes(l.id()) && !l.mkDropListDisabled()),
    );
  }
}
