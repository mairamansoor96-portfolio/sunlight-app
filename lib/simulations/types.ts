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

export interface Condition {
  id: string;
  name: string;
  family: Family;
  honesty: Honesty;
  /** One wry, plain-language line shown in the picker. */
  blurb: string;
  /** What the simulation actually does and where it comes from, shown to users. */
  method: string;
  strength: {
    label: string;
    /** 0–1 */
    default: number;
  };
  /** Pure: must not mutate `src`. `strength` is 0–1. */
  apply(src: PixelBuffer, strength: number): PixelBuffer;
}

/** One entry in a stack of conditions (a scenario applies several in order). */
export interface AppliedCondition {
  id: string;
  strength: number;
}
