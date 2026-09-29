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
  | { kind: "matrix"; values: number[] }
  /** Per-channel Y' = slope·Y + intercept in linear light. */
  | { kind: "linear"; slope: number; intercept: number };

/** Named settings for conditions that use presets instead of a strength slider. */
export type Params = Readonly<Record<string, string>>;

export interface ConditionControl {
  id: string;
  label: string;
  options: readonly { id: string; label: string }[];
  default: string;
}

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
  /**
   * Optional preset controls. A condition with controls shows them instead of
   * the strength slider and is applied at full strength.
   */
  controls?: readonly ConditionControl[];
  /** What this strength does, in real units, for the readout above the comparison. */
  reading(strength: number, params?: Params): string;
  /** Optional: every assumption behind a result, in one line, shown beside the method. */
  assumptions?(strength: number, params?: Params): string;
  /** Optional: published sources for the model's figures, shown in the product. */
  sources?: readonly { label: string; url: string }[];
  /** Optional: the same model as filter steps. Must match `apply` (tested). */
  filter?(strength: number, params?: Params): FilterStep[];
  /** Pure: must not mutate `src`. `strength` is 0–1. Missing params mean the control defaults. */
  apply(src: PixelBuffer, strength: number, params?: Params): PixelBuffer;
}

/** One entry in a stack of conditions (a scenario applies several in order). */
export interface AppliedCondition {
  id: string;
  strength: number;
  params?: Params;
}
