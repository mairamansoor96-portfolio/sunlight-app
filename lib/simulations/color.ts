/**
 * sRGB ↔ linear-light conversion (IEC 61966-2-1), as used by WCAG relative
 * luminance. Simulations that model light (blur, dimming, colour vision) work in
 * linear light; the UI shows sRGB.
 */

import type { PixelBuffer } from "./types";

export function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(v: number): number {
  const c = v <= 0 ? 0 : v >= 1 ? 1 : v;
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

/** 8-bit sRGB → linear lookup, built once. */
export const SRGB_TO_LINEAR = new Float32Array(256).map((_, i) => srgbToLinear(i));

/** WCAG 2.x relative luminance of an 8-bit sRGB colour. */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * SRGB_TO_LINEAR[r] + 0.7152 * SRGB_TO_LINEAR[g] + 0.0722 * SRGB_TO_LINEAR[b];
}

/** WCAG 2.x contrast ratio between two relative luminances. */
export function contrastRatio(l1: number, l2: number): number {
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function clonePixels(src: PixelBuffer): PixelBuffer {
  return { width: src.width, height: src.height, data: new Uint8ClampedArray(src.data) };
}

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
