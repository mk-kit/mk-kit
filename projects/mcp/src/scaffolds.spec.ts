import { describe, expect, it } from 'vitest';
import { SCAFFOLD_RECIPES, parseFields, scaffold } from './scaffolds.js';

describe('parseFields', () => {
  it('parses keys, required markers, select options and camelizes', () => {
    const fields = parseFields('name!:string, price:currency ,status:select=draft|published,created_at:date');
    expect(fields.map((f) => f.key)).toEqual(['name', 'price', 'status', 'createdAt']);
    expect(fields[0].required).toBe(true);
    expect(fields[2].options).toEqual(['draft', 'published']);
    expect(fields[3].label).toBe('Created at');
  });

  it('rejects unknown types and optionless selects with correctable messages', () => {
    expect(() => parseFields('name:blob')).toThrowError(/Unknown field type "blob"/);
    expect(() => parseFields('status:select')).toThrowError(/lists no options/);
    expect(() => parseFields('  ')).toThrowError(/At least one field/);
  });
});

describe('scaffold', () => {
  it('every recipe renders for a multi-word entity without leaking placeholders', () => {
    for (const recipe of SCAFFOLD_RECIPES) {
      const out = scaffold({ recipe, entity: 'OrderLine', fields: 'title!:string,total:currency,paid:boolean' });
      expect(out.startsWith('## '), recipe).toBe(true);
      expect(out, recipe).not.toContain('undefined');
      expect(out, recipe).toContain('mk-kit.dev');
    }
  });

  it('table-page derives interface, columns and datasource from the fields', () => {
    const out = scaffold({ recipe: 'table-page', entity: 'invoice', fields: 'number!:string,total:currency,paid:boolean,dueAt:date' });
    expect(out).toContain('interface Invoice {');
    expect(out).toContain('  total: number;');
    expect(out).toContain('  dueAt: Date | null;');
    expect(out).toContain("format: (v) => (v ? 'Yes' : 'No')");
    expect(out).toContain("this.http.get<MkDataPage<Invoice>>('/api/invoices'");
  });

  it('dynamic-form maps field types to mk-dynamic-form control types', () => {
    const out = scaffold({ recipe: 'dynamic-form', entity: 'user', fields: 'name!:string,active:boolean,role:select=admin|editor' });
    expect(out).toContain("{ key: 'name', type: 'text', label: 'Name', required: true },");
    expect(out).toContain("type: 'switch'");
    expect(out).toContain("options: [{ label: 'Admin', value: 'admin' }, { label: 'Editor', value: 'editor' }]");
  });

  it('crud-schematic passes the field spec through verbatim', () => {
    const out = scaffold({ recipe: 'crud-schematic', entity: 'product', fields: 'name!:string,status:select=a|b' });
    expect(out).toContain('ng g @mk-kit/ui:crud product --fields "name!:string,status:select=a|b"');
    expect(out).toContain('product-list-page.ts');
  });

  it('rejects invalid entity names', () => {
    expect(() => scaffold({ recipe: 'dialog', entity: '1bad' })).toThrowError(/not a valid entity name/);
  });
});
