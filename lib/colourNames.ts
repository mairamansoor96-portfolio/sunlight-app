/**
 * Plain-English names for colours, so the contrast report can say
 * "light grey text on off-white" instead of only hex codes.
 * Lightness comes from CIE L*; hue from HSL. Deliberately coarse.
 */

import { relativeLuminance } from "./simulations/color";
import { yToLStar } from "./toneStrip";
import type { RGB } from "./contrastPairs";

const HUES: [number, string][] = [
  [15, "red"],
  [45, "orange"],
  [65, "yellow"],
  [160, "green"],
  [195, "teal"],
  [255, "blue"],
  [290, "purple"],
  [340, "pink"],
  [360, "red"],
];

export function colourName([r, g, b]: RGB): string {
  const L = yToLStar(relativeLuminance(r, g, b));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = (max - min) / 255;

  if (chroma < 0.08) {
    if (L < 4) return "black";
    if (L < 15) return "near-black";
    if (L < 35) return "dark grey";
    if (L < 60) return "mid grey";
    if (L < 85) return "light grey";
    if (L < 99) return "off-white";
    return "white";
  }

  let hue: number;
  if (max === r) hue = ((g - b) / (max - min)) * 60;
  else if (max === g) hue = ((b - r) / (max - min)) * 60 + 120;
  else hue = ((r - g) / (max - min)) * 60 + 240;
  if (hue < 0) hue += 360;
  const name = HUES.find(([limit]) => hue < limit)?.[1] ?? "red";
  if (L < 35) return `dark ${name}`;
  if (L > 70) return `pale ${name}`;
  return name;
}

/** "Light grey text on off-white". */
export function describePair(text: RGB, background: RGB): string {
  const s = `${colourName(text)} text on ${colourName(background)}`;
  return s[0].toUpperCase() + s.slice(1);
}
