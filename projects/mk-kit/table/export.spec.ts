import { mkDownloadText, mkExportCsv, mkToCsv } from './export';

interface Row {
  name: string;
  amount: number;
  note?: string | null;
  when?: Date;
  children?: Row[];
}

const ROWS: Row[] = [
  { name: 'Ada', amount: 12.5, note: 'plain' },
  { name: 'Grace, Hopper', amount: -3, note: 'says "hi"\nand bye' },
];

describe('mkToCsv', () => {
  const plain = (rows: Row[], cols?: Parameters<typeof mkToCsv<Row>>[1], opts = {}) =>
    mkToCsv(rows, cols, { bom: false, ...opts });

  it('writes a header from column headers and quotes only what needs it', () => {
    const csv = plain(ROWS, [
      { key: 'name', header: 'Name' },
      { key: 'amount', header: 'Amount' },
      { key: 'note' },
    ]);
    expect(csv).toBe(
      'Name,Amount,note\r\n' +
        'Ada,12.5,plain\r\n' +
        '"Grace, Hopper",-3,"says ""hi""\nand bye"\r\n',
    );
  });

  it('infers columns from the first row when none are given', () => {
    expect(plain([{ name: 'A', amount: 1 }])).toBe('name,amount\r\nA,1\r\n');
  });

  it('applies column formatters and empties null / undefined', () => {
    const csv = plain(
      [{ name: 'A', amount: 2, note: null }, { name: 'B', amount: 3 }],
      [
        { key: 'amount', format: (v) => `${v as number}.00 €` },
        { key: 'note' },
      ],
      { header: false },
    );
    expect(csv).toBe('2.00 €,\r\n3.00 €,\r\n');
  });

  it('prefixes a BOM by default and honours delimiter / newline', () => {
    const csv = mkToCsv([{ name: 'A', amount: 1 }], undefined, { delimiter: ';', newline: '\n' });
    expect(csv).toBe('﻿name;amount\nA;1\n');
    expect(mkToCsv([{ name: 'A;B', amount: 1 }], undefined, { delimiter: ';', bom: false })).toContain(
      '"A;B"',
    );
  });

  it('neutralises formula injection in text but leaves numbers alone', () => {
    const csv = plain([{ name: '=HYPERLINK("x")', amount: -5, note: '+1' }], undefined, {
      header: false,
    });
    expect(csv).toBe(`"'=HYPERLINK(""x"")",-5,'+1\r\n`);
    expect(plain([{ name: '=1', amount: 1 }], undefined, { header: false, sanitize: false })).toBe(
      '=1,1\r\n',
    );
  });

  it('serialises dates as ISO and objects as JSON', () => {
    const when = new Date(Date.UTC(2026, 7, 26, 10, 0, 0));
    const csv = plain([{ name: 'A', amount: 1, when }], [{ key: 'when' }, { key: 'children' }], {
      header: false,
    });
    expect(csv).toBe('2026-08-26T10:00:00.000Z,\r\n');
    expect(plain([{ name: 'A', amount: 1, children: [] }], [{ key: 'children' }], { header: false })).toBe(
      '[]\r\n',
    );
  });

  it('flattens trees depth-first with childrenKey, skipping that column when inferring', () => {
    const rows: Row[] = [
      { name: 'Eng', amount: 40, children: [{ name: 'Web', amount: 15, children: [{ name: 'Ada', amount: 1 }] }] },
      { name: 'Ops', amount: 8 },
    ];
    expect(plain(rows, undefined, { childrenKey: 'children' })).toBe(
      'name,amount\r\nEng,40\r\nWeb,15\r\nAda,1\r\nOps,8\r\n',
    );
  });

  it('quotes cells with leading or trailing whitespace', () => {
    expect(plain([{ name: ' padded ', amount: 1 }], undefined, { header: false })).toBe(
      '" padded ",1\r\n',
    );
  });
});

describe('mkDownloadText / mkExportCsv', () => {
  it('creates an object URL, clicks a hidden anchor and revokes the URL', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mk');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      const csv = mkExportCsv([{ a: 1 }], undefined, { filename: 'report' });
      expect(csv).toBe('﻿a\r\n1\r\n');
      expect(createObjectURL).toHaveBeenCalledOnce();
      const blob = createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe('text/csv;charset=utf-8');
      expect(click).toHaveBeenCalledOnce();
      const anchor = click.mock.instances[0] as HTMLAnchorElement;
      expect(anchor.download).toBe('report.csv');
      expect(anchor.isConnected).toBe(false);
      expect(revokeObjectURL).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mk');
    } finally {
      click.mockRestore();
      vi.useRealTimers();
    }
  });

  it('returns false when no object-URL API is available', () => {
    const original = URL.createObjectURL;
    Object.assign(URL, { createObjectURL: undefined });
    try {
      expect(mkDownloadText('x', 'x.csv')).toBe(false);
    } finally {
      Object.assign(URL, { createObjectURL: original });
    }
  });
});
