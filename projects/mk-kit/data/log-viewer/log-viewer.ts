import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkCopyToClipboard } from '@mk-kit/ui/directives';
import { type MkAnsiSpan, mkParseAnsi, mkStripAnsi } from './ansi';

/** One render token of a log line: a styled run, optionally a search match. */
export interface MkLogToken {
  text: string;
  /** Space-joined `mk-ansi--*` classes ('' for plain text). */
  cls: string;
  /** True when the token is part of a search-query match. */
  mark: boolean;
}

interface MkLogLine {
  /** Absolute index within the (ring-buffered) lines. */
  index: number;
  tokens: MkLogToken[];
}

/** Rows rendered above/below the viewport to smooth fast scrolls. */
const OVERSCAN = 6;
/** Upper bound on the wrap-mode parse cache before it is reset. */
const PARSE_CACHE_MAX = 20_000;

/**
 * LogViewer — a virtualized, tail-following log / terminal pane. Renders only
 * the visible window of a (ring-buffered) line array, parses ANSI SGR colour
 * codes into theme-aware spans, follows new output at the bottom until the
 * user scrolls away, and highlights plain-string search matches.
 *
 * ```html
 * <mk-log-viewer
 *   [lines]="lines()"
 *   [(follow)]="follow"
 *   [query]="search()"
 *   (matches)="count.set($event)"
 * />
 * ```
 *
 * Wrap mode (`[wrap]="true"` or the toolbar toggle) soft-wraps long lines;
 * because wrapped rows have no fixed height, wrap mode renders **without**
 * virtualization — fine up to a few thousand lines, so keep `maxLines`
 * modest when wrapping is expected.
 *
 * `query` is matched as a case-insensitive plain string — no regex.
 */
@Component({
  selector: 'mk-log-viewer',
  templateUrl: './log-viewer.html',
  styleUrl: './log-viewer.scss',
  exportAs: 'mkLogViewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkCopyToClipboard],
  host: { class: 'mk-log-viewer' },
})
export class MkLogViewer {
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly viewportRef =
    viewChild<ElementRef<HTMLElement>>('viewport');

  /** The log lines (may contain ANSI SGR escape sequences). */
  readonly lines = input<readonly string[]>([]);
  /** Stick to the bottom as new lines arrive (two-way; detaches on scroll-up). */
  readonly follow = model(true);
  /** Soft-wrap long lines (two-way; disables virtualization — see class docs). */
  readonly wrap = model(false);
  /** Parse ANSI SGR colour codes; `false` renders lines verbatim. */
  readonly ansi = input(true, { transform: booleanAttribute });
  /** Case-insensitive plain-string search; matches are highlighted. */
  readonly query = input('');
  /** Ring buffer size: oldest lines are dropped beyond this. */
  readonly maxLines = input(10_000, { transform: numberAttribute });
  /** Fixed row height in px (drives virtualization; also sets line-height). */
  readonly itemHeight = input(20, { transform: numberAttribute });
  /** Hide the built-in toolbar row. */
  readonly hideToolbar = input(false, { transform: booleanAttribute });
  /** Accessible label of the log region. */
  readonly ariaLabel = input<string>(this.i18n.logViewerLabel, {
    alias: 'aria-label',
  });

  /** Emits the total number of `query` matches whenever it changes. */
  readonly matches = output<number>();

  // --- Ring buffer ----------------------------------------------------------

  /** The lines actually shown: the newest `maxLines` of `lines`. */
  protected readonly buffered = computed<readonly string[]>(() => {
    const lines = this.lines();
    const max = Math.max(1, this.maxLines());
    return lines.length > max ? lines.slice(lines.length - max) : lines;
  });

  // --- Virtual window (same technique as MkVirtualScroll) -------------------

  protected readonly scrollTop = signal(0);
  protected readonly viewportHeight = signal(0);

  protected readonly totalHeight = computed(
    () => this.buffered().length * this.itemHeight(),
  );

  private readonly range = computed(
    () => {
      const ih = this.itemHeight() || 1;
      const count = this.buffered().length;
      const visible = Math.ceil(this.viewportHeight() / ih);
      const start = Math.max(0, Math.floor(this.scrollTop() / ih) - OVERSCAN);
      const end = Math.min(count, start + visible + OVERSCAN * 2);
      return { start, end };
    },
    { equal: (a, b) => a.start === b.start && a.end === b.end },
  );

  protected readonly offset = computed(
    () => this.range().start * this.itemHeight(),
  );

  /** The virtualized window — only ~viewport+overscan lines are parsed. */
  protected readonly visibleLines = computed<MkLogLine[]>(() => {
    const { start, end } = this.range();
    const lines = this.buffered();
    const out: MkLogLine[] = [];
    for (let i = start; i < end; i++) out.push(this.renderLine(lines[i], i, false));
    return out;
  });

  /** Wrap mode: every line, non-virtualized (parse memoized per content). */
  protected readonly wrappedLines = computed<MkLogLine[]>(() =>
    this.buffered().map((line, i) => this.renderLine(line, i, true)),
  );

  // --- Search ---------------------------------------------------------------

  /** Total number of case-insensitive plain-string matches of `query`. */
  readonly matchCount = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return 0;
    const useAnsi = this.ansi();
    let count = 0;
    for (const raw of this.buffered()) {
      const text = (useAnsi ? mkStripAnsi(raw) : raw).toLowerCase();
      for (let i = text.indexOf(q); i !== -1; i = text.indexOf(q, i + q.length)) {
        count++;
      }
    }
    return count;
  });

  // --- Copy -----------------------------------------------------------------

  /** The full buffer as plain text (escapes stripped) for copy-all. */
  protected readonly allText = computed(() => {
    const useAnsi = this.ansi();
    return this.buffered()
      .map((line) => (useAnsi ? mkStripAnsi(line) : line))
      .join('\n');
  });

  /**
   * Wrap-mode parse cache, keyed by line content: appending N lines re-parses
   * only the N new ones (duplicate lines share one entry — harmless, spans
   * are immutable render data). Virtual mode skips it: parsing the ~30-row
   * window per render is cheaper than any bookkeeping.
   */
  private readonly parseCache = new Map<string, MkAnsiSpan[]>();

  /** Guards against treating our own scrollTop writes as user scrolling. */
  private programmaticScroll = false;
  private resizeObserver?: ResizeObserver;

  constructor() {
    afterNextRender(() => {
      this.measure();
      const view = this.viewportRef()?.nativeElement;
      if (view && this.isBrowser && 'ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => {
          this.measure();
          // Keep the tail pinned when the pane itself resizes.
          if (this.follow()) this.scrollToBottom();
        });
        this.resizeObserver.observe(view);
      }
    });

    // Follow mode: pin to the bottom after any render that changed the
    // content (new lines, wrap toggle) or re-enabled follow.
    afterRenderEffect(() => {
      this.buffered();
      this.wrap();
      if (this.follow()) untracked(() => this.scrollToBottom());
    });

    // Surface the match count as an output.
    effect(() => this.matches.emit(this.matchCount()));
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  /** Re-enable follow mode and jump to the newest line. */
  protected resumeFollow(): void {
    this.follow.set(true);
    this.scrollToBottom();
  }

  protected onScroll(event: Event): void {
    const view = event.target as HTMLElement;
    this.scrollTop.set(view.scrollTop);
    if (this.programmaticScroll) {
      this.programmaticScroll = false;
      return;
    }
    const distance = view.scrollHeight - view.clientHeight - view.scrollTop;
    const threshold = Math.max(this.itemHeight() * 2, 32);
    if (distance > threshold) {
      if (this.follow()) this.follow.set(false);
    } else if (!this.follow()) {
      // Scrolled back to the tail — re-stick, like every log UI.
      this.follow.set(true);
    }
  }

  private scrollToBottom(): void {
    const view = this.viewportRef()?.nativeElement;
    if (!view) return;
    const target = view.scrollHeight - view.clientHeight;
    if (view.scrollTop >= target) return; // already at the bottom
    this.programmaticScroll = true;
    view.scrollTop = target;
    this.scrollTop.set(view.scrollTop);
  }

  private measure(): void {
    const view = this.viewportRef()?.nativeElement;
    if (view) this.viewportHeight.set(view.clientHeight);
  }

  // --- Line rendering -------------------------------------------------------

  private parse(raw: string, cached: boolean): MkAnsiSpan[] {
    if (!cached) return mkParseAnsi(raw);
    let spans = this.parseCache.get(raw);
    if (!spans) {
      if (this.parseCache.size >= PARSE_CACHE_MAX) this.parseCache.clear();
      spans = mkParseAnsi(raw);
      this.parseCache.set(raw, spans);
    }
    return spans;
  }

  /** Turn one raw line into render tokens (ANSI spans split at matches). */
  private renderLine(raw: string, index: number, cached: boolean): MkLogLine {
    const spans: readonly MkAnsiSpan[] = this.ansi()
      ? this.parse(raw, cached)
      : raw
        ? [{ text: raw, classes: [] }]
        : [];

    const q = this.query().toLowerCase();
    const tokens: MkLogToken[] = [];

    if (!q) {
      for (const s of spans) {
        if (s.text) tokens.push({ text: s.text, cls: s.classes.join(' '), mark: false });
      }
    } else {
      // Match ranges over the line's plain text…
      const plain = spans.map((s) => s.text).join('');
      const lower = plain.toLowerCase();
      const ranges: [number, number][] = [];
      for (let i = lower.indexOf(q); i !== -1; i = lower.indexOf(q, i + q.length)) {
        ranges.push([i, i + q.length]);
      }
      // …then split each styled span at the range boundaries.
      let offset = 0;
      for (const s of spans) {
        const cls = s.classes.join(' ');
        const start = offset;
        const end = offset + s.text.length;
        let pos = start;
        for (const [rs, re] of ranges) {
          if (re <= start) continue;
          if (rs >= end) break;
          const from = Math.max(rs, start);
          const to = Math.min(re, end);
          if (from > pos) {
            tokens.push({ text: s.text.slice(pos - start, from - start), cls, mark: false });
          }
          tokens.push({ text: s.text.slice(from - start, to - start), cls, mark: true });
          pos = to;
        }
        if (pos < end) {
          tokens.push({ text: s.text.slice(pos - start), cls, mark: false });
        }
        offset = end;
      }
    }

    // A blank line still occupies a row (white-space: pre keeps the space).
    if (tokens.length === 0) tokens.push({ text: ' ', cls: '', mark: false });
    return { index, tokens };
  }
}
