/**
 * The conditions registry. Add new conditions here; the UI reads from it.
 * Keep the families and honesty labels in line with SPEC.md.
 */

import { blurredVision } from "./blur";
import { deuteranopia, protanopia, tritanopia } from "./colorBlindness";
import { dimRoom } from "./dimRoom";
import { sunlight } from "./sunlight";
import type { AppliedCondition, Condition, Family, Honesty, Params, PixelBuffer } from "./types";

export type { AppliedCondition, Condition, ConditionControl, Family, FilterStep, Honesty, Params, PixelBuffer } from "./types";

export const CONDITIONS: readonly Condition[] = [sunlight, dimRoom, blurredVision, deuteranopia, protanopia, tritanopia];

export const FAMILIES: readonly { id: Family; name: string }[] = [
  { id: "environment", name: "Environment" },
  { id: "device", name: "Device" },
  { id: "body", name: "Body" },
  { id: "situation", name: "Situation" },
];

export const HONESTY: Record<Honesty, { name: string; meaning: string }> = {
  measured: { name: "Measured", meaning: "Calculated from your screenshot's actual colours." },
  modelled: { name: "Modelled", meaning: "Based on established research. An approximation, not a diagnosis." },
  illustrative: { name: "Illustrative", meaning: "A realistic impression, not a measurement." },
};

export function getCondition(id: string): Condition {
  const c = CONDITIONS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown condition: ${id}`);
  return c;
}

/**
 * Apply a stack of conditions in order. Scenarios (SPEC.md → "Scenarios instead
 * of settings") are just stacks; a single condition is a stack of one.
 */
export function applyConditions(src: PixelBuffer, stack: readonly AppliedCondition[]): PixelBuffer {
  return stack.reduce((img, { id, strength, params }) => getCondition(id).apply(img, strength, params), src);
}

/** A condition's control values, with defaults filled in. */
export function paramsWithDefaults(condition: Condition, params?: Params): Params {
  return Object.fromEntries((condition.controls ?? []).map((c) => [c.id, params?.[c.id] ?? c.default]));
}
