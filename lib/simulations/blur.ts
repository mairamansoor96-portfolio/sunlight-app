/**
 * Body → Blurred vision / missing reading glasses (Modelled).
 *
 * Uncorrected refractive error defocuses the image on the retina; a Gaussian
 * point-spread function is the standard first-order model. We approximate the
 * Gaussian with three separable box blurs (Kovesi's method) in linear light,
 * because defocus mixes light, not gamma-encoded values.
 */

import { SRGB_TO_LINEAR, clamp01, linearToSrgb } from "./color";
import type { Condition, PixelBuffer } from "./types";

/**
 * Blur is expressed relative to image width so a 3× phone screenshot and a
 * 1× export blur the same amount. At full strength σ ≈ 1.5 CSS px on a 390 pt
 * wide phone: body text is readable with effort, small grey text is not.
 */
export function sigmaForWidth(width: number, strength: number): number {
  return clamp01(strength) * (width / 390) * 1.5;
}

/** Box widths whose three passes approximate a Gaussian of the given σ. */
export function boxesForGauss(sigma: number, n = 3): number[] {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
  const m = Math.round(mIdeal);
  return Array.from({ length: n }, (_, i) => (i < m ? wl : wu));
}

/** One horizontal box pass over a single-channel float image, edges clamped. */
function boxH(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const norm = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[row + Math.min(w - 1, Math.max(0, k))];
    for (let x = 0; x < w; x++) {
      dst[row + x] = acc * norm;
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
}

function boxV(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const norm = 1 / (2 * r + 1);
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[Math.min(h - 1, Math.max(0, k)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = acc * norm;
      acc += src[Math.min(h - 1, y + r + 1) * w + x] - src[Math.max(0, y - r) * w + x];
    }
  }
}

export function gaussianBlur(src: PixelBuffer, sigma: number): PixelBuffer {
  const { width: w, height: h, data } = src;
  const out = new Uint8ClampedArray(data);
  if (sigma < 0.3 || w === 0 || h === 0) return { width: w, height: h, data: out };

  const radii = boxesForGauss(sigma).map((b) => (b - 1) / 2);
  const n = w * h;
  const chan = new Float32Array(n);
  const tmp = new Float32Array(n);

  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < n; i++) chan[i] = SRGB_TO_LINEAR[data[i * 4 + c]];
    for (const r of radii) {
      boxH(chan, tmp, w, h, r);
      boxV(tmp, chan, w, h, r);
    }
    for (let i = 0; i < n; i++) out[i * 4 + c] = linearToSrgb(chan[i]);
  }
  return { width: w, height: h, data: out };
}

export const blurredVision: Condition = {
  id: "blurred-vision",
  name: "Blurred vision",
  family: "body",
  honesty: "modelled",
  blurb: "Left the reading glasses at home. Happens to everyone over 45, eventually.",
  method:
    "Gaussian defocus in linear light, a standard first-order model of uncorrected long-sightedness. Real blur varies with the person, the distance and the lighting.",
  strength: { label: "How far off the prescription is", default: 0.6 },
  apply: (src, strength) => gaussianBlur(src, sigmaForWidth(src.width, strength)),
};
