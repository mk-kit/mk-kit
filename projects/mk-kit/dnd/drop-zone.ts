import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MkDragDropRegistry } from './drag-drop-registry';
import type { MkDrag } from './drag';
import type { MkDropZoneEvent, MkDropZoneHover } from './drag-drop.types';

/**
 * A drop **target** that is not a list: an item dragged out of a connected
 * `[mkDropList]` can be released anywhere on it, and the zone reports *where*
 * — client coordinates, the offset inside the zone and the 0–1 fraction along
 * each axis — so the consumer can turn a position into meaning: a time on a
 * timeline, a priority band, a "focus on this" pane, a trash can.
 *
 * Nothing reorders and no placeholder is shown while an item hovers a zone;
 * the zone gets the `mk-drop-zone--receiving` class and a stream of
 * {@link mkDropZoneMoved} events instead. Zones and lists can overlap — the
 * innermost target under the pointer wins, so a column can hold three
 * priority bands and still accept plain drops between the bands.
 *
 * Wire a zone exactly like another list: give it an id and name that id in
 * the source list's `mkDropListConnectedTo`.
 *
 * Keyboard: a lifted item reaches zones with the arrow keys that cross lists
 * (Left/Right in a vertical list, Up/Down in a horizontal one) — zones sit in
 * the same DOM-ordered travel group as connected lists; Space/Enter drops at
 * the zone's centre. Every step is announced.
 *
 * ```html
 * <ul mkDropList mkDropListId="backlog" [mkDropListConnectedTo]="['now', 'rail']" …>
 * <section mkDropZone mkDropZoneId="now" mkDropZoneLabel="Focus now"
 *          (mkDropZoneDropped)="focus($event.item.mkDragData())">
 * <div mkDropZone mkDropZoneId="rail" mkDropZoneLabel="Today"
 *      (mkDropZoneMoved)="preview($event.fractionY)"
 *      (mkDropZoneDropped)="schedule($event.item.mkDragData(), $event.fractionY)">
 * ```
 *
 * @typeParam Z the zone's own payload type (`mkDropZoneData`).
 * @typeParam T the dragged item's data type. A zone cannot infer it from a
 *   binding the way a list does from `mkDropListData`, so it defaults to
 *   `any` — a handler typed `(e: MkDropZoneEvent<Task>) => …` binds directly.
 */
@Component({
  selector: '[mkDropZone]',
  exportAs: 'mkDropZone',
  template: '<ng-content />',
  styleUrl: './drop-zone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-drop-zone',
    '[attr.role]': 'role',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'mkDropZoneLabelledBy() || null',
    '[attr.aria-disabled]': 'mkDropZoneDisabled() || null',
    '[class.mk-drop-zone--receiving]': '_receiving()',
    '[class.mk-drop-zone--disabled]': 'mkDropZoneDisabled()',
  },
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the class doc
export class MkDropZone<Z = unknown, T = any> {
  private readonly registry = inject(MkDragDropRegistry);

  /** The zone's host element (drop target bounds). */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Stable id source lists name in `mkDropListConnectedTo`. Auto-generated when omitted. */
  readonly mkDropZoneId = input<string>();

  /**
   * Human-readable name, used in screen-reader announcements when a lifted
   * item reaches the zone ("Moved to Focus now") and as the zone's accessible
   * name. Set it: the fallback is the id, which may be generated gibberish.
   */
  readonly mkDropZoneLabel = input<string>('');

  /** Id of a visible element that names the zone (`aria-labelledby`); wins over the label as the accessible name. */
  readonly mkDropZoneLabelledBy = input<string>('');

  /** Arbitrary payload handed back on every hover and drop event. */
  readonly mkDropZoneData = input<Z>();

  /** Disable dropping onto this zone (it leaves the travel group too). */
  readonly mkDropZoneDisabled = input(false, { transform: booleanAttribute });

  /** An item entered the zone (pointer or keyboard). */
  readonly mkDropZoneEntered = output<MkDropZoneHover<T, Z>>();
  /** The pointer moved while over the zone (one per frame, pointer only). */
  readonly mkDropZoneMoved = output<MkDropZoneHover<T, Z>>();
  /** The item left the zone without dropping (moved on, or the drag was cancelled). */
  readonly mkDropZoneLeft = output<MkDrag<T>>();
  /** The item was released on the zone. */
  readonly mkDropZoneDropped = output<MkDropZoneEvent<T, Z>>();

  /** Resolved id (input or generated). */
  readonly id = computed(() => this.mkDropZoneId() ?? this.autoId);
  private readonly autoId = mkUniqueId('mk-drop-zone');

  /** Announceable name: the label when set, otherwise the resolved id. */
  readonly label = computed(() => this.mkDropZoneLabel() || this.id());

  /** A `role` written in the template is kept; a zone is otherwise a named `group`. */
  protected readonly role = this.element.getAttribute('role') ?? 'group';

  private readonly staticAriaLabel = this.element.getAttribute('aria-label');

  protected readonly ariaLabel = computed(() =>
    this.mkDropZoneLabelledBy() ? null : this.mkDropZoneLabel() || this.staticAriaLabel || null,
  );

  /** Highlight while a drag is hovering (or a keyboard-lifted item sits on) the zone. */
  protected readonly _receiving = signal(false);

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      this.registry.registerZone(id, this);
      onCleanup(() => this.registry.unregisterZone(id, this));
    });
  }

  /** Toggle the "receiving" highlight (called by the active drag). */
  setReceiving(value: boolean): void {
    this._receiving.set(value);
  }

  /** Called by the active `MkDrag` — not part of the consumer API. */
  emitEntered(event: MkDropZoneHover<T, Z>): void {
    this.mkDropZoneEntered.emit(event);
  }
  emitMoved(event: MkDropZoneHover<T, Z>): void {
    this.mkDropZoneMoved.emit(event);
  }
  emitLeft(item: MkDrag<T>): void {
    this.mkDropZoneLeft.emit(item);
  }
  emitDrop(event: MkDropZoneEvent<T, Z>): void {
    this.mkDropZoneDropped.emit(event);
  }
}
