/**
 * Environment → Direct sunlight glare (Measured, with stated assumptions).
 * SPEC.md → "Sunlight model" is the source of truth for every number here.
 *
 * Reflected light adds the same luminance R (relative to the phone's white) to
 * every colour on screen. WCAG contrast outdoors becomes
 *   C = (L_light + 0.05 + R) / (L_dark + 0.05 + R).
 * The viewer is assumed to tilt the phone so the sun's mirror image is out of
 * view; the screen then mirrors the sky and surroundings (specular) and scatters
 * a little direct sun (diffuse).
 */

import { SRGB_TO_LINEAR, linearToSrgb } from "./color";
import type { Condition, FilterStep, Params, PixelBuffer } from "./types";

/** Lowest average screen reflectance DisplayMate has measured on a phone (iPhone X). */
export const SPECULAR_REFLECTANCE = 0.045;
/** Assumption, not yet sourced: scattering of direct sun by the display stack. */
export const DIFFUSE_REFLECTANCE = 0.005;

export const LIGHTS = {
  overcast: { label: "Overcast", surroundLux: 10_000, sunLux: 0 },
  shade: { label: "Open shade", surroundLux: 15_000, sunLux: 0 },
  sun: { label: "Direct sun", surroundLux: 20_000, sunLux: 80_000 },
} as const;

export const PHONES = {
  budget: { label: "Budget phone", nits: 500 },
  mid: { label: "Mid-range phone", nits: 1000 },
  flagship: { label: "Flagship phone", nits: 1600 },
} as const;

export type LightId = keyof typeof LIGHTS;
export type PhoneId = keyof typeof PHONES;

export const DEFAULT_LIGHT: LightId = "sun";
export const DEFAULT_PHONE: PhoneId = "mid";

export const SOURCES = [
  {
    label: "Microsoft Learn, Understanding and Interpreting Lux Values",
    url: "https://learn.microsoft.com/en-us/windows/win32/sensorsapi/understanding-and-interpreting-lux-values",
  },
  { label: "CineD, Shedding Light on Lumens, Lux and Latitude", url: "https://www.cined.com/shedding-light-lumens-lux-latitude/" },
  { label: "DisplayMate via 9to5Mac, iPhone X screen reflectance 4.5%", url: "https://9to5mac.com/2017/11/06/displaymate-iphone-x-display-rating/" },
  {
    label: "Lambda Research, Sunlight Readable Display Design",
    url: "https://lambdares.com/news/sunlight-readable-display-ambient-contrast-tracepro",
  },
  { label: "Yahoo Tech, phone display tests", url: "https://tech.yahoo.com/phones/articles/phone-display-best-ran-5-043000010.html" },
] as const;

const asLight = (id?: string): LightId => (id && id in LIGHTS ? (id as LightId) : DEFAULT_LIGHT);
const asPhone = (id?: string): PhoneId => (id && id in PHONES ? (id as PhoneId) : DEFAULT_PHONE);

/** Luminance reflected towards the viewer, in cd/m² (nits). Lambertian approximation. */
export function reflectedNits(light: LightId): number {
  const { surroundLux, sunLux } = LIGHTS[light];
  return (SPECULAR_REFLECTANCE * surroundLux + DIFFUSE_REFLECTANCE * sunLux) / Math.PI;
}

/** Reflected light relative to the phone's white. */
export function reflectedR(light: LightId, phone: PhoneId): number {
  return reflectedNits(light) / PHONES[phone].nits;
}

/** WCAG contrast of two relative luminances with reflected light R added to both. */
export function outdoorContrast(y1: number, y2: number, R: number): number {
  const [hi, lo] = y1 >= y2 ? [y1, y2] : [y2, y1];
  return (hi + 0.05 + R) / (lo + 0.05 + R);
}

/**
 * The glare image in linear light: Y' = a·Y + b. White stays white, and the
 * WCAG ratio of any two rendered colours equals outdoorContrast for that pair.
 */
export function glareMap(R: number): { slope: number; intercept: number } {
  const slope = 1.05 / (1.05 + R);
  return { slope, intercept: slope * (0.05 + R) - 0.05 };
}

export function glare(src: PixelBuffer, R: number): PixelBuffer {
  const { slope, intercept } = glareMap(R);
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = linearToSrgb(slope * SRGB_TO_LINEAR[i] + intercept);
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

/** The resolved light, phone and R for a set of params. */
export function sunlightSettings(params?: Params) {
  const light = asLight(params?.light);
  const phone = asPhone(params?.phone);
  return { light, phone, R: reflectedR(light, phone) };
}

const nits = (n: number) => `${Math.round(n).toLocaleString("en-GB")}`;
const lux = (n: number) => `${n.toLocaleString("en-GB")} lux`;

/** The stated assumptions behind a result, in one line. */
export function assumptions(params?: Params): string {
  const { light, phone } = sunlightSettings(params);
  const L = LIGHTS[light];
  const total = L.surroundLux + L.sunLux;
  const split = L.sunLux ? ` (${lux(L.sunLux)} direct, ${lux(L.surroundLux)} sky and surroundings)` : "";
  return (
    `${lux(total)}${split} · screen tilted away from the sun's reflection · ` +
    `${SPECULAR_REFLECTANCE * 100}% mirror reflectance, ${DIFFUSE_REFLECTANCE * 100}% diffuse · ` +
    `${nits(PHONES[phone].nits)}-nit phone · ${nits(reflectedNits(light))} nits reflected`
  );
}

export const sunlight: Condition = {
  id: "sunlight",
  name: "Direct sunlight glare",
  family: "environment",
  honesty: "measured",
  blurb: "Reflected light lifts every colour, so contrast collapses. Pale grey goes first.",
  method:
    "Contrast is measured from your screenshot's colours with the WCAG formula, adding the light the screen reflects. The light levels, screen reflectance and phone brightness are published averages and stated assumptions, listed below with their sources.",
  strength: { label: "Strength", default: 1 },
  controls: [
    {
      id: "light",
      label: "Light",
      options: Object.entries(LIGHTS).map(([id, l]) => ({ id, label: l.label })),
      default: DEFAULT_LIGHT,
    },
    {
      id: "phone",
      label: "Phone",
      options: Object.entries(PHONES).map(([id, p]) => ({ id, label: p.label })),
      default: DEFAULT_PHONE,
    },
  ],
  reading: (_strength, params) => {
    const { light, phone, R } = sunlightSettings(params);
    return `${LIGHTS[light].label} · ${nits(PHONES[phone].nits)} nits · R ${R.toFixed(2)}`;
  },
  assumptions: (_strength, params) => assumptions(params),
  sources: SOURCES,
  filter: (_strength, params): FilterStep[] => [{ kind: "linear", ...glareMap(sunlightSettings(params).R) }],
  apply: (src, _strength, params) => glare(src, sunlightSettings(params).R),
};
