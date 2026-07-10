/**
 * Dependency-free QR Code encoder.
 *
 * A from-scratch implementation of the QR encoding algorithm (ISO/IEC 18004):
 * byte-mode (UTF-8) data encoding, Reed–Solomon error correction over GF(256),
 * matrix construction with function patterns, all eight data masks scored by
 * the four penalty rules, and BCH format/version information.
 *
 * Scope: byte mode only, versions 1–10 (module counts 21…57), ECC levels
 * L/M/Q/H. That covers roughly 7–271 UTF-8 bytes depending on the ECC level.
 * Numeric/alphanumeric/kanji modes and versions ≥ 11 are intentionally out of
 * scope — everything is encoded as UTF-8 bytes, which is always valid.
 *
 * The single public entry point is {@link mkEncodeQr}, a pure function.
 */

export type MkQrEcc = 'L' | 'M' | 'Q' | 'H';

const ECC_INDEX: Record<MkQrEcc, number> = { L: 0, M: 1, Q: 2, H: 3 };

/** ECC-level bits used inside the 15-bit format string (L=01, M=00, Q=11, H=10). */
const ECC_FORMAT_BITS: Record<MkQrEcc, number> = { L: 1, M: 0, Q: 3, H: 2 };

/**
 * Error-correction block layout per version (1–10) and ECC level.
 *
 * Each entry is `[ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsPerBlockGroup1,
 * numBlocksGroup2, dataCodewordsPerBlockGroup2]`. Group-2 blocks (when present)
 * hold exactly one more data codeword than group-1 blocks. Indexed
 * `ECC_BLOCKS[version][ECC_INDEX[ecc]]`; index 0 is an unused placeholder.
 */
const ECC_BLOCKS: number[][][] = [
  [], // version 0 — unused
  // v1
  [
    [7, 1, 19, 0, 0],
    [10, 1, 16, 0, 0],
    [13, 1, 13, 0, 0],
    [17, 1, 9, 0, 0],
  ],
  // v2
  [
    [10, 1, 34, 0, 0],
    [16, 1, 28, 0, 0],
    [22, 1, 22, 0, 0],
    [28, 1, 16, 0, 0],
  ],
  // v3
  [
    [15, 1, 55, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 17, 0, 0],
    [22, 2, 13, 0, 0],
  ],
  // v4
  [
    [20, 1, 80, 0, 0],
    [18, 2, 32, 0, 0],
    [26, 2, 24, 0, 0],
    [16, 4, 9, 0, 0],
  ],
  // v5
  [
    [26, 1, 108, 0, 0],
    [24, 2, 43, 0, 0],
    [18, 2, 15, 2, 16],
    [22, 2, 11, 2, 12],
  ],
  // v6
  [
    [18, 2, 68, 0, 0],
    [16, 4, 27, 0, 0],
    [24, 4, 19, 0, 0],
    [28, 4, 15, 0, 0],
  ],
  // v7
  [
    [20, 2, 78, 0, 0],
    [18, 4, 31, 0, 0],
    [18, 2, 14, 4, 15],
    [26, 4, 13, 1, 14],
  ],
  // v8
  [
    [24, 2, 97, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 4, 18, 2, 19],
    [26, 4, 14, 2, 15],
  ],
  // v9
  [
    [30, 2, 116, 0, 0],
    [22, 3, 36, 2, 37],
    [20, 4, 16, 4, 17],
    [24, 4, 12, 4, 13],
  ],
  // v10
  [
    [18, 2, 68, 2, 69],
    [26, 4, 43, 1, 44],
    [24, 6, 19, 2, 20],
    [28, 6, 15, 2, 16],
  ],
];

/** Highest supported version. */
const MAX_VERSION = ECC_BLOCKS.length - 1;

/**
 * Alignment-pattern centre coordinates per version. Alignment patterns are
 * placed at every (row, col) pair drawn from this list, except the three that
 * would collide with the finder patterns (the three outer corners).
 */
const ALIGN_POSITIONS: number[][] = [
  [], // 0
  [], // 1 — none
  [6, 18], // 2
  [6, 22], // 3
  [6, 26], // 4
  [6, 30], // 5
  [6, 34], // 6
  [6, 22, 38], // 7
  [6, 24, 42], // 8
  [6, 26, 46], // 9
  [6, 28, 50], // 10
];

// ── GF(256) arithmetic ──────────────────────────────────────────────────────
// Galois field with primitive polynomial 0x11D (x^8 + x^4 + x^3 + x^2 + 1).

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/** Reed–Solomon generator polynomial (divisor) of the given degree. */
function rsGenerator(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1; // start with the monomial 1 (coefficients low→high position)
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

/** Reed–Solomon remainder (the ECC codewords) of `data` divided by `divisor`. */
function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    for (let i = 0; i < divisor.length; i++) result[i] ^= gfMul(divisor[i], factor);
  }
  return result;
}

// ── Bit helpers ─────────────────────────────────────────────────────────────

function getBit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}

/** UTF-8 encode a string to a plain byte array (no runtime dependency). */
function utf8Bytes(text: string): number[] {
  if (typeof TextEncoder !== 'undefined') {
    return Array.from(new TextEncoder().encode(text));
  }
  // Minimal fallback for environments without TextEncoder.
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000)
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
  }
  return out;
}

// ── Capacity / version selection ────────────────────────────────────────────

/** Total data codewords available at a given version + ECC level. */
function dataCodewordCount(version: number, ecc: MkQrEcc): number {
  const [, g1n, g1d, g2n, g2d] = ECC_BLOCKS[version][ECC_INDEX[ecc]];
  return g1n * g1d + g2n * g2d;
}

/** Byte-mode character-count-indicator width: 8 bits for v1–9, 16 bits for v10+. */
function charCountBits(version: number): number {
  return version < 10 ? 8 : 16;
}

/** Smallest supporting version, or throw if the payload is too large. */
function selectVersion(byteLen: number, ecc: MkQrEcc): number {
  for (let v = 1; v <= MAX_VERSION; v++) {
    const needed = 4 + charCountBits(v) + byteLen * 8;
    if (needed <= dataCodewordCount(v, ecc) * 8) return v;
  }
  throw new Error(
    `mkEncodeQr: payload of ${byteLen} bytes is too large for QR versions 1–${MAX_VERSION} at ECC level ${ecc}.`,
  );
}

// ── Data codewords (encoding + padding + RS + interleaving) ──────────────────

function buildCodewords(bytes: number[], version: number, ecc: MkQrEcc): number[] {
  const totalData = dataCodewordCount(version, ecc);
  const capacityBits = totalData * 8;

  // Bit buffer.
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  push(0b0100, 4); // byte mode indicator
  push(bytes.length, charCountBits(version)); // character count
  for (const b of bytes) push(b, 8); // UTF-8 payload

  // Terminator: up to 4 zero bits, not exceeding capacity.
  push(0, Math.min(4, capacityBits - bits.length));
  // Pad to a byte boundary.
  while (bits.length % 8 !== 0) bits.push(0);

  // Convert to data codeword bytes.
  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataCodewords.push(b);
  }
  // Pad bytes 0xEC / 0x11 alternating until full.
  const pad = [0xec, 0x11];
  for (let i = 0; dataCodewords.length < totalData; i++) dataCodewords.push(pad[i % 2]);

  // Split into ECC blocks.
  const [ecPerBlock, g1n, g1d, g2n] = ECC_BLOCKS[version][ECC_INDEX[ecc]];
  const totalBlocks = g1n + g2n;
  const divisor = rsGenerator(ecPerBlock);

  const dataBlocks: number[][] = [];
  const eccBlocks: number[][] = [];
  let offset = 0;
  for (let b = 0; b < totalBlocks; b++) {
    const len = b < g1n ? g1d : g1d + 1;
    const block = dataCodewords.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    eccBlocks.push(rsRemainder(block, divisor));
  }

  // Interleave data codewords, then ECC codewords.
  const result: number[] = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) result.push(block[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of eccBlocks) result.push(block[i]);
  }
  return result;
}

// ── Matrix construction ─────────────────────────────────────────────────────

interface Grid {
  size: number;
  modules: boolean[][]; // true = dark
  fn: boolean[][]; // true = function module (not maskable, not data)
}

function makeGrid(version: number): Grid {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  return { size, modules, fn };
}

function setFn(g: Grid, r: number, c: number, dark: boolean): void {
  g.modules[r][c] = dark;
  g.fn[r][c] = true;
}

function drawFinder(g: Grid, cr: number, cc: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const r = cr + dy;
      const c = cc + dx;
      if (r < 0 || r >= g.size || c < 0 || c >= g.size) continue;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      // dark for the 3×3 centre (dist ≤ 1) and the outer ring (dist 3);
      // white for the inner ring (dist 2) and the separator (dist 4).
      setFn(g, r, c, dist !== 2 && dist !== 4);
    }
  }
}

function drawAlignment(g: Grid, cr: number, cc: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFn(g, cr + dy, cc + dx, dist !== 1);
    }
  }
}

function drawFunctionPatterns(g: Grid, version: number, ecc: MkQrEcc): void {
  const n = g.size;

  // Timing patterns (drawn first; overlaps with finders are overwritten below).
  for (let i = 0; i < n; i++) {
    setFn(g, 6, i, i % 2 === 0);
    setFn(g, i, 6, i % 2 === 0);
  }

  // Three finder patterns (+ their separators).
  drawFinder(g, 3, 3);
  drawFinder(g, 3, n - 4);
  drawFinder(g, n - 4, 3);

  // Alignment patterns — all pairs except the three finder corners.
  const pos = ALIGN_POSITIONS[version];
  const last = pos.length - 1;
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      drawAlignment(g, pos[i], pos[j]);
    }
  }

  // Dark module.
  setFn(g, n - 8, 8, true);

  // Reserve format-info area (placeholder) and draw version info (v ≥ 7).
  drawFormatBits(g, ecc, 0);
  drawVersion(g, version);
}

function drawFormatBits(g: Grid, ecc: MkQrEcc, mask: number): void {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412; // 15-bit format string
  const n = g.size;

  // First copy — around the top-left finder.
  for (let i = 0; i <= 5; i++) setFn(g, 8, i, getBit(bits, i));
  setFn(g, 8, 7, getBit(bits, 6));
  setFn(g, 8, 8, getBit(bits, 7));
  setFn(g, 7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i++) setFn(g, 14 - i, 8, getBit(bits, i));

  // Second copy — split across the top-right and bottom-left finders.
  for (let i = 0; i < 8; i++) setFn(g, n - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i++) setFn(g, 8, n - 15 + i, getBit(bits, i));
}

function drawVersion(g: Grid, version: number): void {
  if (version < 7) return;
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = (version << 12) | rem; // 18-bit version string
  const n = g.size;
  for (let i = 0; i < 18; i++) {
    const bit = getBit(bits, i);
    const a = n - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFn(g, a, b, bit);
    setFn(g, b, a, bit);
  }
}

/** Place the interleaved codeword bit stream in the zig-zag pattern. */
function placeData(g: Grid, codewords: number[]): void {
  const n = g.size;
  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  const nextBit = (): boolean => {
    if (bitIndex >= totalBits) return false; // remainder bits are 0
    const bit = getBit(codewords[bitIndex >> 3], 7 - (bitIndex & 7));
    bitIndex++;
    return bit;
  };

  let upward = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip the vertical timing column
    for (let i = 0; i < n; i++) {
      const row = upward ? n - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (!g.fn[row][cc]) g.modules[row][cc] = nextBit();
      }
    }
    upward = !upward;
  }
}

// ── Masking ─────────────────────────────────────────────────────────────────

function maskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return false;
  }
}

/** XOR the mask onto every non-function module (self-inverse). */
function applyMask(g: Grid, mask: number): void {
  for (let r = 0; r < g.size; r++) {
    for (let c = 0; c < g.size; c++) {
      if (!g.fn[r][c] && maskCondition(mask, r, c)) g.modules[r][c] = !g.modules[r][c];
    }
  }
}

const FINDER_LINE = [true, false, true, true, true, false, true, false, false, false, false];
const FINDER_LINE_REV = [...FINDER_LINE].reverse();

function matchesAt(get: (i: number) => boolean, pattern: boolean[], start: number): boolean {
  for (let i = 0; i < pattern.length; i++) if (get(start + i) !== pattern[i]) return false;
  return true;
}

/** The four penalty rules; lower is better. */
function penaltyScore(g: Grid): number {
  const n = g.size;
  const m = g.modules;
  let score = 0;

  // Rule 1 — runs of ≥ 5 same-colour modules in each row and column.
  for (let r = 0; r < n; r++) {
    let color = m[r][0];
    let run = 1;
    for (let c = 1; c < n; c++) {
      if (m[r][c] === color) run++;
      else {
        if (run >= 5) score += run - 2;
        color = m[r][c];
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }
  for (let c = 0; c < n; c++) {
    let color = m[0][c];
    let run = 1;
    for (let r = 1; r < n; r++) {
      if (m[r][c] === color) run++;
      else {
        if (run >= 5) score += run - 2;
        color = m[r][c];
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }

  // Rule 2 — 2×2 blocks of the same colour.
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }

  // Rule 3 — finder-like 1:1:3:1:1 pattern with 4 light modules on one side.
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= n - 11; c++) {
      const get = (i: number) => m[r][i];
      if (matchesAt(get, FINDER_LINE, c) || matchesAt(get, FINDER_LINE_REV, c)) score += 40;
    }
  }
  for (let c = 0; c < n; c++) {
    for (let r = 0; r <= n - 11; r++) {
      const get = (i: number) => m[i][c];
      if (matchesAt(get, FINDER_LINE, r) || matchesAt(get, FINDER_LINE_REV, r)) score += 40;
    }
  }

  // Rule 4 — deviation of the dark-module ratio from 50%.
  let dark = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) dark++;
  const percent = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Encode `text` (UTF-8, byte mode) as a QR code module matrix.
 *
 * @param text The payload. May be empty.
 * @param ecc  Error-correction level: `L` (~7%), `M` (~15%), `Q` (~25%), `H` (~30%).
 * @returns A square `boolean[][]` where `true` marks a dark module. The side
 *          length is `17 + 4 * version` (21 for v1 … 57 for v10).
 * @throws If the payload does not fit in versions 1–10 at the chosen ECC level.
 */
export function mkEncodeQr(text: string, ecc: MkQrEcc): boolean[][] {
  const bytes = utf8Bytes(text);
  const version = selectVersion(bytes.length, ecc);
  const codewords = buildCodewords(bytes, version, ecc);

  const g = makeGrid(version);
  drawFunctionPatterns(g, version, ecc);
  placeData(g, codewords);

  // Choose the mask with the lowest penalty.
  let bestMask = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(g, mask);
    drawFormatBits(g, ecc, mask);
    const score = penaltyScore(g);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
    }
    applyMask(g, mask); // undo (XOR is self-inverse)
  }
  applyMask(g, bestMask);
  drawFormatBits(g, ecc, bestMask);

  return g.modules;
}
