/**
 * Environment → Dim room at night, battery-saver dimming (Modelled).
 *
 * Two effects, in linear light:
 * 1. Gain: battery saver plus night auto-brightness drop the panel to roughly a
 *    quarter of its usual output.
 * 2. Shadow crush: at low luminance, contrast sensitivity falls (de Vries–Rose
 *    behaviour) and panels lose low-grey precision, so dark greys sink together.
 *    Modelled as a gamma above 1, which pulls dark tones down faster than light.
 *
 * Deliberately simple; the method text says so.
 */

import { SRGB_TO_LINEAR, clamp01, linearToSrgb } from "./color";
import type { Condition, PixelBuffer } from "./types";

export function dimParams(strength: number): { gain: number; gamma: number } {
  const s = clamp01(strength);
  return { gain: 1 - 0.75 * s, gamma: 1 + 0.6 * s };
}

export function dim(src: PixelBuffer, strength: number): PixelBuffer {
  const { gain, gamma } = dimParams(strength);
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = linearToSrgb(gain * SRGB_TO_LINEAR[i] ** gamma);

  const d = src.data;
  const out = new Uint8ClampedArray(d.length);
  for (let i = 0; i < d.length; i += 4) {
    out[i] = lut[d[i]];
    out[i + 1] = lut[d[i + 1]];
    out[i + 2] = lut[d[i + 2]];
    out[i + 3] = d[i + 3];
  }
  return { width: src.width, height: src.height, data: out };
}

export const dimRoom: Condition = {
  id: "dim-room",
  name: "Dim room, battery saver",
  family: "environment",
  honesty: "modelled",
  blurb: "The screen dims to as little as a quarter. Dark greys go first.",
  method:
    "Brightness cut to as little as 25% in linear light, plus a shadow crush for the eye's lower contrast sensitivity in dim light. A simplified model, not a photometric measurement.",
  strength: { label: "How dim", default: 0.8 },
  reading: (strength) => `Brightness ${Math.round(dimParams(strength).gain * 100)}%`,
  apply: dim,
};
