import { describe, expect, it } from "vitest";
import { relativeLuminance, srgbToLinear } from "@/lib/simulations/color";
import {
  DIFFUSE_REFLECTANCE,
  SPECULAR_REFLECTANCE,
  glare,
  glareMap,
  outdoorContrast,
  reflectedNits,
  reflectedR,
  sunlight,
  sunlightSettings,
} from "@/lib/simulations/sunlight";
import { findPairs, fromHex, pairContrast, toHex } from "@/lib/contrastPairs";
import type { PixelBuffer } from "@/lib/simulations";

const grey = (v: number) => relativeLuminance(v, v, v);

describe("sunlight model (SPEC.md → Sunlight model)", () => {
  it("uses the spec's reflectances", () => {
    expect(SPECULAR_REFLECTANCE).toBe(0.045);
    expect(DIFFUSE_REFLECTANCE).toBe(0.005);
  });

  it.each([
    ["overcast", 143],
    ["shade", 215],
    ["sun", 414],
  ] as const)("reflects about %s → %i nits", (light, nits) => {
    expect(Math.round(reflectedNits(light))).toBe(nits);
  });

  it.each([
    ["overcast", "budget", 0.29],
    ["shade", "mid", 0.21],
    ["sun", "mid", 0.41],
    ["sun", "flagship", 0.26],
  ] as const)("R for %s on a %s phone matches the spec table", (light, phone, R) => {
    expect(reflectedR(light, phone)).toBeCloseTo(R, 2);
  });

  it("reproduces the spec's worked example for #767676 on white", () => {
    const y = grey(0x76);
    expect(outdoorContrast(1, y, 0)).toBeCloseTo(4.54, 2);
    expect(outdoorContrast(1, y, reflectedR("overcast", "mid"))).toBeCloseTo(3.19, 2);
    expect(outdoorContrast(1, y, reflectedR("shade", "mid"))).toBeCloseTo(2.84, 2);
    expect(outdoorContrast(1, y, reflectedR("sun", "mid"))).toBeCloseTo(2.27, 2);
    expect(outdoorContrast(1, 0, reflectedR("sun", "mid"))).toBeCloseTo(3.16, 2);
  });

  it("defaults to direct sun on a mid-range phone", () => {
    expect(sunlightSettings()).toMatchObject({ light: "sun", phone: "mid" });
    expect(sunlightSettings({ light: "nonsense" }).light).toBe("sun");
  });
});

describe("glare image", () => {
  it("keeps white white", () => {
    const { slope, intercept } = glareMap(0.41);
    expect(slope + intercept).toBeCloseTo(1, 10);
  });

  it("renders colours whose WCAG ratio equals the reported outdoor contrast", () => {
    for (const R of [0.09, 0.41, 0.83]) {
      const { slope, intercept } = glareMap(R);
      for (const [a, b] of [
        [255, 0x76],
        [255, 0],
        [0xc3, 0xf6],
        [0x55, 0x14],
      ]) {
        const ya = slope * srgbToLinear(a) + intercept;
        const yb = slope * srgbToLinear(b) + intercept;
        const rendered = (Math.max(ya, yb) + 0.05) / (Math.min(ya, yb) + 0.05);
        expect(rendered).toBeCloseTo(outdoorContrast(grey(a), grey(b), R), 6);
      }
    }
  });

  it("lifts black and leaves white alone in pixels", () => {
    const src: PixelBuffer = { width: 2, height: 1, data: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]) };
    const out = glare(src, 0.41);
    expect(out.data[0]).toBeGreaterThan(100);
    expect(Array.from(out.data.slice(4))).toEqual([255, 255, 255, 255]);
  });

  it("is labelled Measured and states its assumptions and sources", () => {
    expect(sunlight.honesty).toBe("measured");
    const text = sunlight.assumptions!(1, { light: "sun", phone: "mid" });
    expect(text).toContain("100,000 lux");
    expect(text).toContain("tilted away");
    expect(text).toContain("1,000-nit phone");
    expect(sunlight.sources!.length).toBeGreaterThan(0);
  });
});

/** White page with blocks of "text": solid colour strokes with anti-aliased edges. */
function page(strokes: { colour: [number, number, number]; x: number; y: number }[]): PixelBuffer {
  const w = 200;
  const h = 120;
  const data = new Uint8ClampedArray(w * h * 4).fill(255);
  for (const { colour, x, y } of strokes) {
    for (let s = 0; s < 8; s++) {
      const x0 = x + s * 8;
      for (let yy = y; yy < y + 20; yy++) {
        for (let xx = x0; xx < x0 + 4; xx++) data.set([...colour, 255], (yy * w + xx) * 4);
        // One anti-aliased pixel either side, halfway to white.
        const mid = colour.map((c) => Math.round((c + 255) / 2)) as [number, number, number];
        data.set([...mid, 255], (yy * w + x0 - 1) * 4);
        data.set([...mid, 255], (yy * w + x0 + 4) * 4);
      }
    }
  }
  return { width: w, height: h, data };
}

describe("colour pairs", () => {
  it("finds text-on-background pairs, weakest first, and ignores anti-aliasing", () => {
    const pairs = findPairs(
      page([
        { colour: [20, 20, 30], x: 10, y: 10 },
        { colour: [180, 180, 185], x: 10, y: 60 },
      ]),
    );
    expect(pairs).toHaveLength(2);
    expect(toHex(pairs[0].background)).toBe("#FFFFFF");
    expect(pairs[0].text).toEqual([180, 180, 185]);
    expect(pairs[1].text).toEqual([20, 20, 30]);
    expect(pairs[0].indoor).toBeLessThan(pairs[1].indoor);
    expect(pairs[0].indoor).toBeCloseTo(pairContrast([180, 180, 185], [255, 255, 255]), 6);
  });

  it("skips near-identical neighbours such as hairline dividers", () => {
    expect(findPairs(page([{ colour: [240, 240, 240], x: 10, y: 10 }]))).toHaveLength(0);
  });

  it("parses and prints hex colours", () => {
    expect(fromHex("#767676")).toEqual([118, 118, 118]);
    expect(fromHex("nope")).toBeNull();
    expect(toHex([196, 35, 26])).toBe("#C4231A");
  });
});
