/**
 * Body → Colour blindness (Modelled).
 *
 * Machado, Oliveira & Fernandes (2009), "A Physiologically-based Model for
 * Simulation of Color Vision Deficiency", IEEE TVCG 15(6). Matrices apply to
 * linear RGB. Severity between 0 and 1 is linearly interpolated with identity,
 * which closely tracks the paper's per-severity tables.
 *
 * The spec asks for 2–3 types; this slice ships deuteranopia (the most common,
 * ~5% of men of Northern European descent). Protanopia and tritanopia are one
 * matrix each in a later slice.
 */

import { SRGB_TO_LINEAR, clamp01, linearToSrgb } from "./color";
import type { Condition, PixelBuffer } from "./types";

export type Matrix3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

/** Machado et al. 2009, deuteranomaly at severity 1.0 (i.e. deuteranopia). */
export const DEUTERANOPIA: Matrix3 = [
  0.367322, 0.860646, -0.227968,
  0.280085, 0.672501, 0.047413,
  -0.01182, 0.04294, 0.968881,
];

const IDENTITY: Matrix3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mixMatrix(m: Matrix3, t: number): Matrix3 {
  return m.map((v, i) => IDENTITY[i] + (v - IDENTITY[i]) * t) as unknown as Matrix3;
}

export function applyLinearMatrix(src: PixelBuffer, m: Matrix3): PixelBuffer {
  const d = src.data;
  const out = new Uint8ClampedArray(d.length);
  for (let i = 0; i < d.length; i += 4) {
    const r = SRGB_TO_LINEAR[d[i]];
    const g = SRGB_TO_LINEAR[d[i + 1]];
    const b = SRGB_TO_LINEAR[d[i + 2]];
    out[i] = linearToSrgb(m[0] * r + m[1] * g + m[2] * b);
    out[i + 1] = linearToSrgb(m[3] * r + m[4] * g + m[5] * b);
    out[i + 2] = linearToSrgb(m[6] * r + m[7] * g + m[8] * b);
    out[i + 3] = d[i + 3];
  }
  return { width: src.width, height: src.height, data: out };
}

export const deuteranopia: Condition = {
  id: "deuteranopia",
  name: "Deuteranopia (red–green)",
  family: "body",
  honesty: "modelled",
  blurb: "The most common colour blindness. Your red error and green success are now the same mustard.",
  method:
    "Machado et al. (2009) physiological model, applied in linear RGB. A good average; individual colour vision varies.",
  strength: { label: "Severity", default: 1 },
  apply: (src, strength) => applyLinearMatrix(src, mixMatrix(DEUTERANOPIA, clamp01(strength))),
};
