import { mkUniqueId } from './unique-id';

describe('mkUniqueId', () => {
  it('generates unique ids', () => {
    const a = mkUniqueId();
    const b = mkUniqueId();
    expect(a).not.toBe(b);
  });

  it('applies the given prefix', () => {
    expect(mkUniqueId('mk-input')).toMatch(/^mk-input-\d+$/);
  });

  it('defaults the prefix to "mk"', () => {
    expect(mkUniqueId()).toMatch(/^mk-\d+$/);
  });
});
