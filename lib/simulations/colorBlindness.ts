/**
 * Body → Colour blindness (Modelled).
 *
 * Machado, Oliveira & Fernandes (2009), "A Physiologically-based Model for
 * Simulation of Color Vision Deficiency", IEEE TVCG 15(6). Matrices apply to
 * linear RGB. Severity between 0 and 1 is linearly interpolated with identity,
 * which closely tracks the paper's per-severity tables.
 *
 * Three types, as the spec asks: deuteranopia (the most common, ~5% of men of
 * Northern European descent), protanopia (~1% of men) and tritanopia (rare,
 * affects everyone equally). The paper notes its model is least reliable for
 * tritanopia; the method text says so.
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

/** Machado et al. 2009, protanomaly at severity 1.0 (i.e. protanopia). */
export const PROTANOPIA: Matrix3 = [
  0.152286, 1.052583, -0.204868,
  0.114503, 0.786281, 0.099216,
  -0.003882, -0.048116, 1.051998,
];

/** Machado et al. 2009, tritanomaly at severity 1.0 (i.e. tritanopia). */
export const TRITANOPIA: Matrix3 = [
  1.255528, -0.076749, -0.178779,
  -0.078411, 0.930809, 0.147602,
  0.004733, 0.691367, 0.3039,
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

const MACHADO = "Machado et al. (2009) physiological model, applied in linear RGB.";

/** One colour-vision condition from a Machado severity-1.0 matrix. */
function colourVision(
  c: Pick<Condition, "id" | "name" | "blurb"> & { matrix: Matrix3; caveat: string },
): Condition {
  const at = (strength: number) => mixMatrix(c.matrix, clamp01(strength));
  return {
    id: c.id,
    name: c.name,
    family: "body",
    honesty: "modelled",
    blurb: c.blurb,
    method: `${MACHADO} ${c.caveat}`,
    strength: { label: "Severity", default: 1 },
    reading: (strength) => `Machado 2009 · severity ${clamp01(strength).toFixed(2)}`,
    filter: (strength) => [{ kind: "matrix", values: [...at(strength)] }],
    apply: (src, strength) => applyLinearMatrix(src, at(strength)),
  };
}

export const deuteranopia = colourVision({
  id: "deuteranopia",
  name: "Deuteranopia (red–green)",
  blurb: "Red and green read as the same olive. So do your status chips.",
  matrix: DEUTERANOPIA,
  caveat: "A good average; individual colour vision varies.",
});

export const protanopia = colourVision({
  id: "protanopia",
  name: "Protanopia (red–green)",
  blurb: "Red loses its brightness and sinks towards dark olive. Your red warning now looks like body text.",
  matrix: PROTANOPIA,
  caveat: "Unlike deuteranopia, reds also look darker. A good average; individual colour vision varies.",
});

export const tritanopia = colourVision({
  id: "tritanopia",
  name: "Tritanopia (blue–yellow)",
  blurb: "Blue and green merge, and yellow drifts towards pink. Rare, but your blue links notice.",
  matrix: TRITANOPIA,
  caveat: "The paper notes this is its least reliable simulation, so treat it as a strong hint rather than a match.",
});
