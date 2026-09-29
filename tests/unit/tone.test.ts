import { describe, expect, it } from "vitest";
import { TONE_STEPS, greyForLStar, lStarToY, toneStrip, yToLStar } from "@/lib/toneStrip";
import { downscale } from "@/lib/thumbnail";
import { CONDITIONS } from "@/lib/simulations";

describe("tone strip", () => {
  it("round-trips L* through luminance", () => {
    for (const L of TONE_STEPS) expect(yToLStar(lStarToY(L))).toBeCloseTo(L, 6);
  });

  it("uses 18% grey for L* 50 (mid-grey)", () => {
    expect(lStarToY(50)).toBeCloseTo(0.184, 3);
    expect(greyForLStar(50)).toBe(119);
  });

  it("reports no merged steps with no conditions", () => {
    const r = toneStrip([]);
    expect(r.merged.every((m) => !m)).toBe(true);
    r.after.forEach((L, i) => expect(L).toBeCloseTo(TONE_STEPS[i], 0));
  });

  it("finds the dark tones a dim room destroys", () => {
    const r = toneStrip([{ id: "dim-room", strength: 0.8 }]);
    expect(r.merged[1]).toBe(true); // L* 0 and 10 become indistinguishable
    expect(r.merged[10]).toBe(false); // highlights survive
  });

  it("leaves flat tones alone under blur and colour-vision conditions", () => {
    for (const id of ["blurred-vision", "deuteranopia"]) {
      const r = toneStrip([{ id, strength: 1 }]);
      expect(r.merged.some(Boolean)).toBe(false);
    }
  });
});

describe("readings", () => {
  it("every condition describes its strength in real units", () => {
    for (const c of CONDITIONS) expect(c.reading(c.strength.default)).toMatch(/\d/);
  });

  it("dim room reports the brightness it applies", () => {
    expect(CONDITIONS.find((c) => c.id === "dim-room")!.reading(1)).toBe("Brightness 25%");
  });
});

describe("downscale", () => {
  it("averages areas and keeps the aspect ratio", () => {
    const src = { width: 4, height: 2, data: new Uint8ClampedArray(4 * 2 * 4) };
    // Left half black, right half white.
    for (let y = 0; y < 2; y++) for (let x = 2; x < 4; x++) src.data.set([255, 255, 255, 255], (y * 4 + x) * 4);
    for (let i = 3; i < src.data.length; i += 4) src.data[i] = 255;
    const out = downscale(src, 2);
    expect([out.width, out.height]).toEqual([2, 1]);
    expect(Array.from(out.data)).toEqual([0, 0, 0, 255, 255, 255, 255, 255]);
  });

  it("never upscales", () => {
    const src = { width: 10, height: 20, data: new Uint8ClampedArray(10 * 20 * 4) };
    expect(downscale(src, 80).width).toBe(10);
  });
});

import { ambientFor, formatLux, meterPosition } from "@/lib/lightLevels";

describe("light meter", () => {
  it("maps 1 and 100,000 lux to the ends of a log scale", () => {
    expect(meterPosition(1)).toBe(0);
    expect(meterPosition(100_000)).toBe(100);
    expect(meterPosition(1_000)).toBeCloseTo(60, 6);
    expect(meterPosition(0)).toBe(0);
    expect(meterPosition(1e7)).toBe(100);
  });

  it("puts sunlight at the spec's direct-sun level and leaves non-light conditions at the desk", () => {
    expect(ambientFor("sunlight").lux).toBe(100_000);
    expect(ambientFor("dim-room").lux).toBe(1);
    expect(ambientFor("blurred-vision").lux).toBe(500);
    expect(ambientFor("monitor").label).toBe("Your desk");
  });

  it("formats lux with thousands separators", () => {
    expect(formatLux(100_000)).toBe("100,000 lux");
  });
});
