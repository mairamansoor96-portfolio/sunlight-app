/**
 * The conditions registry. Add new conditions here; the UI reads from it.
 * Keep the families and honesty labels in line with SPEC.md.
 */

import { blurredVision } from "./blur";
import { deuteranopia } from "./colorBlindness";
import { dimRoom } from "./dimRoom";
import type { AppliedCondition, Condition, Family, Honesty, PixelBuffer } from "./types";

export type { AppliedCondition, Condition, Family, FilterStep, Honesty, PixelBuffer } from "./types";

export const CONDITIONS: readonly Condition[] = [dimRoom, blurredVision, deuteranopia];

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
  return stack.reduce((img, { id, strength }) => getCondition(id).apply(img, strength), src);
}
