/**
 * Finds the colour pairs a screenshot actually uses (text on its background,
 * a label on its button) so outdoor contrast can be measured on real colours.
 * SPEC.md → "Sunlight model" → "Colour pairs".
 *
 * 1. Quantise to 5 bits per channel and keep each bucket's mean colour.
 * 2. Rank buckets by solid pixels: pixels whose right neighbour is in the same
 *    bucket. Anti-aliased edges are one-offs, so this ignores them.
 * 3. Count how often two top colours meet along rows and columns (allowing a
 *    few anti-aliased pixels between them).
 * 4. Keep pairs that meet often, skip near-identical neighbours, and return the
 *    lowest contrast first.
 * 5. Remember where each pair meets on a coarse grid, so the UI can show where
 *    on the screen that combination is used.
 */

import { contrastRatio, relativeLuminance } from "./simulations/color";
import type { PixelBuffer } from "./simulations";

export type RGB = readonly [number, number, number];

export interface ColourPair {
  text: RGB;
  background: RGB;
  /** WCAG contrast indoors. */
  indoor: number;
  /** How often the two colours meet; a rough measure of how much text uses this pair. */
  edges: number;
  /** Where on the screenshot the pair appears. */
  where: PairLocation;
}

/** Grid cells (row-major) where a pair meets, on a grid WHERE_COLS wide with square cells. */
export interface PairLocation {
  cols: number;
  rows: number;
  cells: number[];
}

/** Columns in the location grid; about 16 px per cell on a 390 pt screen. */
export const WHERE_COLS = 24;
/** Meetings a cell needs before it counts, so stray pixels don't light it up. */
const MIN_CELL_HITS = 2;

const BUCKETS = 1 << 15;
/** Most colours worth considering. */
const TOP_COLOURS = 32;
/** Pixels of anti-aliasing allowed between two colours that still count as neighbours. */
const MAX_GAP = 3;
/** Below this, neighbours are dividers and tints, not text. */
export const MIN_PAIR_CONTRAST = 1.25;

const key = (r: number, g: number, b: number) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);

export function luminance([r, g, b]: RGB): number {
  return relativeLuminance(r, g, b);
}

export function pairContrast(a: RGB, b: RGB): number {
  return contrastRatio(luminance(a), luminance(b));
}

export function findPairs(img: PixelBuffer, maxPairs = 12): ColourPair[] {
  const { width: w, height: h, data } = img;
  const n = w * h;
  if (n === 0) return [];

  const keys = new Uint16Array(n);
  const count = new Uint32Array(BUCKETS);
  const solid = new Uint32Array(BUCKETS);
  const sum = new Float64Array(BUCKETS * 3);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const k = key(data[o], data[o + 1], data[o + 2]);
    keys[i] = k;
    count[k]++;
    sum[k * 3] += data[o];
    sum[k * 3 + 1] += data[o + 1];
    sum[k * 3 + 2] += data[o + 2];
  }
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w - 1; x++) if (keys[row + x] === keys[row + x + 1]) solid[keys[row + x]]++;
  }

  const minSolid = Math.max(12, Math.floor(n * 0.0001));
  const top: number[] = [];
  for (let k = 0; k < BUCKETS; k++) if (solid[k] >= minSolid) top.push(k);
  top.sort((a, b) => solid[b] - solid[a]);
  top.length = Math.min(top.length, TOP_COLOURS);

  const rank = new Int16Array(BUCKETS).fill(-1);
  top.forEach((k, i) => (rank[k] = i));
  const t = top.length;
  const edges = new Uint32Array(t * t);
  const cellSize = w / WHERE_COLS;
  const gridRows = Math.max(1, Math.ceil(h / cellSize));
  const gridCells = WHERE_COLS * gridRows;
  // Only pairs that end up in the report need their grid, so allocate lazily.
  const hits = new Map<number, Uint16Array>();
  const hit = (pair: number, x: number, y: number) => {
    let grid = hits.get(pair);
    if (!grid) hits.set(pair, (grid = new Uint16Array(gridCells)));
    const c = Math.min(gridRows - 1, Math.floor(y / cellSize)) * WHERE_COLS + Math.min(WHERE_COLS - 1, Math.floor(x / cellSize));
    if (grid[c] < 65535) grid[c]++;
  };

  // Walk a line of pixels; count a meeting whenever a top colour follows a different one closely.
  // `fixed` is the row (horizontal walk) or column (vertical walk) being walked.
  const walk = (start: number, step: number, length: number, fixed: number, horizontal: boolean) => {
    let last = -1;
    let lastAt = -MAX_GAP - 2;
    for (let j = 0; j < length; j++) {
      const r = rank[keys[start + j * step]];
      if (r < 0) continue;
      if (last >= 0 && r !== last && j - lastAt <= MAX_GAP + 1) {
        const [a, b] = r < last ? [r, last] : [last, r];
        edges[a * t + b]++;
        if (horizontal) hit(a * t + b, j, fixed);
        else hit(a * t + b, fixed, j);
      }
      last = r;
      lastAt = j;
    }
  };
  for (let y = 0; y < h; y++) walk(y * w, 1, w, y, true);
  for (let x = 0; x < w; x++) walk(x, w, h, x, false);

  const mean = (k: number): RGB => [
    Math.round(sum[k * 3] / count[k]),
    Math.round(sum[k * 3 + 1] / count[k]),
    Math.round(sum[k * 3 + 2] / count[k]),
  ];

  const minEdges = Math.max(8, Math.floor((w + h) * 0.01));
  const pairs: ColourPair[] = [];
  for (let a = 0; a < t; a++) {
    for (let b = a + 1; b < t; b++) {
      const e = edges[a * t + b];
      if (e < minEdges) continue;
      // The colour with more pixels is the background.
      const [bg, fg] = count[top[a]] >= count[top[b]] ? [top[a], top[b]] : [top[b], top[a]];
      const background = mean(bg);
      const text = mean(fg);
      const indoor = pairContrast(text, background);
      if (indoor < MIN_PAIR_CONTRAST) continue;
      const grid = hits.get(a * t + b)!;
      const cells: number[] = [];
      for (let c = 0; c < gridCells; c++) if (grid[c] >= MIN_CELL_HITS) cells.push(c);
      pairs.push({ text, background, indoor, edges: e, where: { cols: WHERE_COLS, rows: gridRows, cells } });
    }
  }

  // The most-used pairs, weakest first.
  pairs.sort((p, q) => q.edges - p.edges);
  return pairs.slice(0, maxPairs).sort((p, q) => p.indoor - q.indoor);
}

export function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function fromHex(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
