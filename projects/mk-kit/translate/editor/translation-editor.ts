import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkIcon } from '@mk-kit/ui/icon';
import { MkInlineEdit } from '@mk-kit/ui/data';
import { MkInput } from '@mk-kit/ui/forms';
import { MkTable, MkTableCell, type MkTableColumn, mkExportCsv } from '@mk-kit/ui/table';
import type { MkFlatTranslations } from '@mk-kit/ui/translate';

/** One edit made in the editor. `value: null` clears the override. */
export interface MkTranslationChange {
  locale: string;
  key: string;
  value: string | null;
  /** The text shown before the edit (override, or the base string). */
  previous: string | null;
}

/** A row of the editor: the key plus the effective text per locale. */
export interface MkTranslationRow {
  key: string;
  [locale: string]: string;
}

type Filter = 'all' | 'overridden' | `missing:${string}`;

/**
 * Translation editor — keys as rows, locales as columns, click a cell to
 * edit. The base strings are your bundled files; edits are **overrides**
 * kept apart from them, so a rebuild never loses them and a cell can be
 * restored to the file text. Search by key or text, filter to the keys a
 * locale is missing or the ones already edited, export the grid as CSV.
 * Persistence is yours: every edit is emitted as `changed`, feed the result
 * back through `overrides`.
 *
 * ```html
 * <mk-translation-editor
 *   [locales]="['pl', 'en', 'ru']"
 *   [base]="base()"
 *   [overrides]="overrides()"
 *   (changed)="save($event)" />
 * ```
 */
@Component({
  selector: 'mk-translation-editor',
  imports: [MkTable, MkTableCell, MkInlineEdit, MkInput, MkButton, MkIcon],
  templateUrl: './translation-editor.html',
  styleUrl: './translation-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-translation-editor' },
})
export class MkTranslationEditor {
  protected readonly i18n = inject(MK_I18N);

  /** Locale codes, in column order. The first one is the reference language. */
  readonly locales = input.required<string[]>();
  /** Bundled strings per locale, flat (`'a.b.c': 'text'`) or nested. */
  readonly base = input.required<Record<string, MkFlatTranslations>>();
  /** Edits per locale, flat. Missing locales are fine. */
  readonly overrides = input<Record<string, MkFlatTranslations>>({});
  /** Show but do not edit. */
  readonly readonly = input(false);
  /** File name of the CSV export. */
  readonly exportFilename = input('translations.csv');

  /** An edit or a restore; persist it and update `overrides`. */
  readonly changed = output<MkTranslationChange>();

  protected readonly query = signal('');
  protected readonly filter = signal<Filter>('all');

  /** Every key any locale knows, sorted. */
  protected readonly keys = computed(() => {
    const set = new Set<string>();
    for (const locale of this.locales()) {
      for (const k of Object.keys(this.base()[locale] ?? {})) set.add(k);
      for (const k of Object.keys(this.overrides()[locale] ?? {})) set.add(k);
    }
    return [...set].sort();
  });

  /** Per-locale counts shown as filter chips. */
  protected readonly stats = computed(() =>
    this.locales().map((locale) => {
      const b = this.base()[locale] ?? {};
      const o = this.overrides()[locale] ?? {};
      let missing = 0;
      for (const k of this.keys()) if (!(k in b) && !(k in o)) missing++;
      return { locale, missing, overridden: Object.keys(o).length };
    }),
  );

  protected readonly overriddenTotal = computed(() =>
    this.stats().reduce((n, s) => n + s.overridden, 0),
  );

  protected readonly rows = computed<MkTranslationRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    const filter = this.filter();
    const locales = this.locales();
    const out: MkTranslationRow[] = [];
    for (const key of this.keys()) {
      if (filter === 'overridden' && !locales.some((l) => this.hasOverride(l, key))) continue;
      if (filter.startsWith('missing:')) {
        const l = filter.slice('missing:'.length);
        if (this.effective(l, key) !== null) continue;
      }
      const row: MkTranslationRow = { key };
      for (const l of locales) row[l] = this.effective(l, key) ?? '';
      if (q && !key.toLowerCase().includes(q) && !locales.some((l) => row[l].toLowerCase().includes(q))) continue;
      out.push(row);
    }
    return out;
  });

  protected readonly columns = computed<MkTableColumn<MkTranslationRow>[]>(() => [
    { key: 'key', header: this.i18n.translationEditorKey, width: '32%', pinned: 'left' },
    ...this.locales().map((locale) => ({ key: locale, header: locale.toUpperCase() })),
  ]);

  protected effective(locale: string, key: string): string | null {
    const o = this.overrides()[locale]?.[key];
    if (o !== undefined) return o;
    const b = this.base()[locale]?.[key];
    return b === undefined ? null : b;
  }

  protected hasOverride(locale: string, key: string): boolean {
    return this.overrides()[locale]?.[key] !== undefined;
  }

  protected isMissing(locale: string, key: string): boolean {
    return this.effective(locale, key) === null;
  }

  protected onSaved(locale: string, key: string, value: string): void {
    if (this.readonly()) return;
    const previous = this.effective(locale, key);
    const next = value.trim();
    // Typing the file text back is a restore, not an override.
    if (next === (this.base()[locale]?.[key] ?? '')) {
      if (this.hasOverride(locale, key)) this.changed.emit({ locale, key, value: null, previous });
      return;
    }
    if (next === previous) return;
    this.changed.emit({ locale, key, value: next, previous });
  }

  protected reset(locale: string, key: string): void {
    if (this.readonly() || !this.hasOverride(locale, key)) return;
    this.changed.emit({ locale, key, value: null, previous: this.effective(locale, key) });
  }

  protected setFilter(next: string): void {
    const filter = next as Filter;
    this.filter.set(this.filter() === filter && filter !== 'all' ? 'all' : filter);
  }

  protected exportCsv(): void {
    const locales = this.locales();
    mkExportCsv(
      this.rows(),
      [{ key: 'key', header: 'key' }, ...locales.map((l) => ({ key: l, header: l }))],
      { filename: this.exportFilename() },
    );
  }
}
