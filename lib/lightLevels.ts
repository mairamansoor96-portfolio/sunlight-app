/**
 * Ambient light levels for the header's light meter. Pure, so it can be tested.
 * The meter is a log scale from 1 to 100,000 lux.
 */

import { LIGHTS } from "./simulations/sunlight";

export const METER_MIN_LUX = 1;
export const METER_MAX_LUX = 100_000;

export interface LightLevel {
  lux: number;
  label: string;
}

/** Where a designer usually works: 500 lux is the standard office lighting level (EN 12464-1). */
export const DESK: LightLevel = { lux: 500, label: "Your desk" };

/** Landmarks printed on the scale. */
export const LANDMARKS: readonly LightLevel[] = [
  { lux: 1, label: "Dark bedroom" },
  DESK,
  { lux: 10_000, label: "Overcast" },
  { lux: LIGHTS.sun.surroundLux + LIGHTS.sun.sunLux, label: "Direct sun" },
];

/**
 * The ambient light behind each condition. Conditions that don't change the
 * light (blur, colour vision) leave the needle at the desk.
 */
export function ambientFor(conditionId: string): LightLevel {
  switch (conditionId) {
    case "sunlight":
      return { lux: LIGHTS.sun.surroundLux + LIGHTS.sun.sunLux, label: "Direct sun" };
    case "dim-room":
      return { lux: 1, label: "Dark bedroom" };
    default:
      return DESK;
  }
}

/** Position on the meter, 0–100%. */
export function meterPosition(lux: number): number {
  const span = Math.log10(METER_MAX_LUX) - Math.log10(METER_MIN_LUX);
  const p = ((Math.log10(Math.max(lux, METER_MIN_LUX)) - Math.log10(METER_MIN_LUX)) / span) * 100;
  return Math.min(100, Math.max(0, p));
}

export function formatLux(lux: number): string {
  return `${lux.toLocaleString("en-GB")} lux`;
}
