/**
 * CSV export — turn rows into RFC 4180 text and hand it to the browser as a
 * download. Framework-free so it also serves data that never touched a table.
 */

/** A column to export: the row property, its header, and an optional formatter. */
export interface MkCsvColumn<T = Record<string, unknown>> {
  /** Property key on each row object supplying the cell value. */
  key: string;
  /** Header text; defaults to `key`. */
  header?: string;
  /** Formatter turning the raw value into cell text (same shape as `MkTableColumn.format`). */
  format?: (value: unknown, row: T) => string;
}

export interface MkCsvOptions {
  /** Field separator (default `,`; use `;` for locales whose Excel expects it). */
  delimiter?: string;
  /** Emit the header row first (default `true`). */
  header?: boolean;
  /** Line terminator (default `\r\n`, per RFC 4180). */
  newline?: string;
  /**
   * Prefix a UTF-8 byte-order mark (default `true`) so Excel reads accented
   * characters correctly. Only affects the downloaded file / returned text.
   */
  bom?: boolean;
  /**
   * Neutralise spreadsheet formula injection (default `true`): a text cell
   * starting with `=`, `+`, `-`, `@`, tab or CR is prefixed with `'` so a
   * malicious value cannot execute when opened in Excel / Sheets. Numbers
   * are never touched, so `-5` stays `-5`.
   */
  sanitize?: boolean;
  /** Property holding child rows; when set, trees are flattened depth-first. */
  childrenKey?: string;
}

/** Options for {@link mkExportCsv}. */
export interface MkCsvExportOptions extends MkCsvOptions {
  /** File name for the download (default `export.csv`; `.csv` is appended if missing). */
  filename?: string;
}

const NEEDS_QUOTES = /["\r\n]/;
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/** Escape one cell for CSV. */
function csvCell(value: unknown, delimiter: string, sanitize: boolean): string {
  if (value == null) return '';
  let text: string;
  if (typeof value === 'string') {
    text = sanitize && FORMULA_LEAD.test(value) ? `'${value}` : value;
  } else if (value instanceof Date) {
    text = value.toISOString();
  } else if (typeof value === 'object') {
    text = JSON.stringify(value);
  } else {
    text = String(value);
  }
  return NEEDS_QUOTES.test(text) || text.includes(delimiter) || /^\s|\s$/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

/**
 * Serialise `rows` as CSV text.
 *
 * Without `columns` every key of the first row is exported in its own order.
 * Column formatters are applied, so what the user saw in the table is what
 * lands in the file.
 */
export function mkToCsv<T>(
  rows: readonly T[],
  columns?: readonly MkCsvColumn<T>[],
  options: MkCsvOptions = {},
): string {
  const delimiter = options.delimiter ?? ',';
  const newline = options.newline ?? '\r\n';
  const sanitize = options.sanitize ?? true;
  const cols: readonly MkCsvColumn<T>[] =
    columns ??
    Object.keys((rows[0] ?? {}) as object)
      .filter((key) => key !== options.childrenKey)
      .map((key) => ({ key }));

  const flat: T[] = [];
  const walk = (list: readonly T[]): void => {
    for (const row of list) {
      flat.push(row);
      const children = options.childrenKey
        ? (row as Record<string, unknown>)[options.childrenKey]
        : null;
      if (Array.isArray(children)) walk(children as T[]);
    }
  };
  walk(rows);

  const lines: string[] = [];
  if (options.header ?? true) {
    lines.push(cols.map((c) => csvCell(c.header ?? c.key, delimiter, sanitize)).join(delimiter));
  }
  for (const row of flat) {
    lines.push(
      cols
        .map((c) => {
          const raw = (row as Record<string, unknown>)[c.key];
          const value = c.format ? c.format(raw, row) : raw;
          return csvCell(value, delimiter, sanitize);
        })
        .join(delimiter),
    );
  }
  return (options.bom ?? true ? '﻿' : '') + lines.join(newline) + newline;
}

/**
 * Trigger a browser download of `text` as a file. No-op outside a DOM
 * (server-side rendering); returns whether a download was started.
 */
export function mkDownloadText(
  text: string,
  filename: string,
  type = 'text/csv;charset=utf-8',
): boolean {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') return false;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the click a tick to grab the blob before the URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

/**
 * Serialise `rows` as CSV and download it. Returns the CSV text so callers
 * can also keep it (tests, previews, uploads).
 */
export function mkExportCsv<T>(
  rows: readonly T[],
  columns?: readonly MkCsvColumn<T>[],
  options: MkCsvExportOptions = {},
): string {
  const csv = mkToCsv(rows, columns, options);
  let filename = options.filename ?? 'export.csv';
  if (!/\.csv$/i.test(filename)) filename += '.csv';
  mkDownloadText(csv, filename);
  return csv;
}
