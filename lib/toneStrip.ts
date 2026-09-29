/**
 * The tone strip: eleven greys, evenly spaced in CIE L* from black to white,
 * run through a condition stack. Neighbouring steps that end up closer than
 * MERGE_THRESHOLD apart are reported as merged, meaning the condition has
 * destroyed the difference between them.
 */

import { linearToSrgb, relativeLuminance } from "./simulations/color";
import { applyConditions, type AppliedCondition, type PixelBuffer } from "./simulations";

export const TONE_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
/** ΔL* below which two neighbouring tones count as merged. A ΔE of about 2.3 is one just-noticeable difference; 3 adds a small margin. */
export const MERGE_THRESHOLD = 3;
/** Each tone is a wide flat patch so edge effects like blur never reach the sampled centre. */
const PATCH = 32;

const EPSILON = 216 / 24389;
const KAPPA = 24389 / 27;

export function lStarToY(L: number): number {
  return L > 8 ? ((L + 16) / 116) ** 3 : L / KAPPA;
}

export function yToLStar(Y: number): number {
  return Y > EPSILON ? 116 * Math.cbrt(Y) - 16 : KAPPA * Y;
}

/** 8-bit sRGB grey for an L* value. */
export function greyForLStar(L: number): number {
  return linearToSrgb(lStarToY(L));
}

export interface ToneResult {
  /** L* of each step before the condition (the TONE_STEPS, after 8-bit rounding). */
  before: number[];
  /** L* of each step after the condition. */
  after: number[];
  /** merged[i] is true when step i became indistinguishable from step i − 1. */
  merged: boolean[];
}

export function toneStrip(stack: readonly AppliedCondition[]): ToneResult {
  const greys = TONE_STEPS.map(greyForLStar);
  const width = greys.length * PATCH;
  const data = new Uint8ClampedArray(width * 4);
  greys.forEach((g, i) => {
    for (let x = i * PATCH; x < (i + 1) * PATCH; x++) data.set([g, g, g, 255], x * 4);
  });
  const src: PixelBuffer = { width, height: 1, data };
  const out = applyConditions(src, stack);

  const lAt = (buf: PixelBuffer, i: number) => {
    const o = (i * PATCH + PATCH / 2) * 4;
    return yToLStar(relativeLuminance(buf.data[o], buf.data[o + 1], buf.data[o + 2]));
  };
  const before = greys.map((_, i) => lAt(src, i));
  const after = greys.map((_, i) => lAt(out, i));
  const merged = after.map((L, i) => i > 0 && Math.abs(L - after[i - 1]) < MERGE_THRESHOLD);
  return { before, after, merged };
}
