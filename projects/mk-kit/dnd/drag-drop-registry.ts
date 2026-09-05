/* eslint-disable @typescript-eslint/no-explicit-any -- lists hold heterogeneous
   item types; `any` here avoids generic-variance friction across the registry. */
import { Injectable } from '@angular/core';
import type { MkDropList } from './drop-list';
import type { MkDropZone } from './drop-zone';

/** A keyboard-reachable drop target: a connected list or a connected zone. */
export type MkDropTarget = MkDropList<any> | MkDropZone<any>;

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
  private readonly zones = new Map<string, MkDropZone<any>>();

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

  /** Register (or replace) the zone published under `id`. */
  registerZone(id: string, zone: MkDropZone<any>): void {
    this.zones.set(id, zone);
  }

  /** Remove `zone` from the registry if it is still the holder of `id`. */
  unregisterZone(id: string, zone: MkDropZone<any>): void {
    if (this.zones.get(id) === zone) this.zones.delete(id);
  }

  /** Look up a zone by its `mkDropZoneId`. */
  getZone(id: string): MkDropZone<any> | undefined {
    return this.zones.get(id);
  }

  /** Every enabled zone named in `list`'s `mkDropListConnectedTo`, in registration order. */
  connectedZones(list: MkDropList<any>): MkDropZone<any>[] {
    const connected = list.connectedTo();
    return [...this.zones.values()].filter(
      (z) => connected.includes(z.id()) && !z.mkDropZoneDisabled(),
    );
  }

  /**
   * The keyboard travel group for `list`: its connected lists **and** zones,
   * in document order, so arrow keys walk targets the way they appear on
   * screen regardless of when each registered.
   */
  travelGroup(list: MkDropList<any>): MkDropTarget[] {
    const targets: MkDropTarget[] = [...this.connectedGroup(list), ...this.connectedZones(list)];
    return targets.sort((a, b) => {
      if (a.element === b.element) return 0;
      const pos = a.element.compareDocumentPosition(b.element);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }
}
