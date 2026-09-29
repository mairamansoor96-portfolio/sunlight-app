/**
 * Core types for the conditions library. See SPEC.md → "Conditions library"
 * and "Honesty labels and limitations".
 */

/** RGBA pixels, row-major. Structurally compatible with the DOM's ImageData. */
export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export type Family = "environment" | "device" | "body" | "situation";

/**
 * How much a designer should trust a condition.
 * - measured: calculated from the screenshot's actual colours
 * - modelled: based on established research
 * - illustrative: a realistic impression, not a measurement
 */
export type Honesty = "measured" | "modelled" | "illustrative";

/**
 * One step of a condition expressed as a filter primitive, so the same model can
 * run live on page elements (the hero) via SVG filters.
 */
export type FilterStep =
  /** Gaussian blur in linear light. σ in points (≈ CSS px). */
  | { kind: "blur"; sigmaPt: number }
  /** Per-channel lookup on sRGB values 0–1, evenly sampled, linearly interpolated. */
  | { kind: "table"; values: number[] }
  /** Row-major 3×3 RGB matrix applied in linear light. */
  | { kind: "matrix"; values: number[] };

export interface Condition {
  id: string;
  name: string;
  family: Family;
  honesty: Honesty;
  /** Shown for the selected condition: one plain fact, then at most one dry line. */
  blurb: string;
  /** What the simulation actually does and where it comes from, shown to users. */
  method: string;
  strength: {
    label: string;
    /** 0–1 */
    default: number;
  };
  /** What this strength does, in real units, for the readout above the comparison. */
  reading(strength: number): string;
  /** Optional: the same model as filter steps. Must match `apply` (tested). */
  filter?(strength: number): FilterStep[];
  /** Pure: must not mutate `src`. `strength` is 0–1. */
  apply(src: PixelBuffer, strength: number): PixelBuffer;
}

/** One entry in a stack of conditions (a scenario applies several in order). */
export interface AppliedCondition {
  id: string;
  strength: number;
}
