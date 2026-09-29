import { describe, expect, it } from "vitest";
import { boxesForGauss, gaussianBlur, sigmaForWidth } from "@/lib/simulations/blur";
import { contrastRatio, linearToSrgb, relativeLuminance, srgbToLinear } from "@/lib/simulations/color";
import { DEUTERANOPIA, applyLinearMatrix, mixMatrix } from "@/lib/simulations/colorBlindness";
import { dim } from "@/lib/simulations/dimRoom";
import { CONDITIONS, applyConditions, getCondition } from "@/lib/simulations";
import type { PixelBuffer } from "@/lib/simulations/types";

function solid(w: number, h: number, [r, g, b, a = 255]: number[]): PixelBuffer {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) data.set([r, g, b, a], i);
  return { width: w, height: h, data };
}

function px(img: PixelBuffer, x: number, y: number) {
  const i = (y * img.width + x) * 4;
  return Array.from(img.data.slice(i, i + 4));
}

describe("colour maths", () => {
  it("round-trips sRGB through linear light", () => {
    for (let c = 0; c < 256; c++) expect(linearToSrgb(srgbToLinear(c))).toBe(c);
  });

  it("matches WCAG reference contrast values", () => {
    const white = relativeLuminance(255, 255, 255);
    const black = relativeLuminance(0, 0, 0);
    expect(contrastRatio(white, black)).toBeCloseTo(21, 5);
    // #767676 on white is the classic 4.54:1 AA borderline grey.
    expect(contrastRatio(relativeLuminance(0x76, 0x76, 0x76), white)).toBeCloseTo(4.54, 2);
  });
});

describe("deuteranopia", () => {
  it("leaves greys untouched (matrix rows sum to 1)", () => {
    const out = applyLinearMatrix(solid(1, 1, [128, 128, 128]), DEUTERANOPIA);
    for (const c of px(out, 0, 0).slice(0, 3)) expect(Math.abs(c - 128)).toBeLessThanOrEqual(1);
  });

  it("makes pure red and pure green much closer", () => {
    const red = applyLinearMatrix(solid(1, 1, [255, 0, 0]), DEUTERANOPIA);
    const green = applyLinearMatrix(solid(1, 1, [0, 128, 0]), DEUTERANOPIA);
    const [r1, g1] = px(red, 0, 0);
    const [r2, g2] = px(green, 0, 0);
    // In the simulated image, both are yellowish: R and G channels comparable.
    expect(Math.abs(r1 - g1)).toBeLessThan(40);
    expect(Math.abs(r2 - g2)).toBeLessThan(40);
  });

  it("is identity at severity 0", () => {
    expect(mixMatrix(DEUTERANOPIA, 0)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("preserves alpha", () => {
    const out = applyLinearMatrix(solid(1, 1, [200, 10, 10, 77]), DEUTERANOPIA);
    expect(px(out, 0, 0)[3]).toBe(77);
  });
});

describe("blur", () => {
  it("scales sigma with image width", () => {
    expect(sigmaForWidth(1170, 1)).toBeCloseTo(4.5);
    expect(sigmaForWidth(390, 1)).toBeCloseTo(1.5);
    expect(sigmaForWidth(1170, 0)).toBe(0);
  });

  it("produces odd box widths", () => {
    for (const b of boxesForGauss(4.5)) expect(b % 2).toBe(1);
  });

  it("leaves a flat image flat", () => {
    const out = gaussianBlur(solid(20, 20, [90, 140, 200]), 3);
    expect(px(out, 10, 10).slice(0, 3)).toEqual([90, 140, 200]);
    expect(px(out, 0, 0).slice(0, 3)).toEqual([90, 140, 200]);
  });

  it("softens a hard edge", () => {
    const img = solid(20, 1, [0, 0, 0]);
    for (let x = 10; x < 20; x++) img.data.set([255, 255, 255, 255], x * 4);
    const out = gaussianBlur(img, 2);
    const [left] = px(out, 9, 0);
    const [right] = px(out, 10, 0);
    expect(left).toBeGreaterThan(0);
    expect(right).toBeLessThan(255);
  });
});

describe("dim room", () => {
  it("keeps black black and darkens white", () => {
    expect(px(dim(solid(1, 1, [0, 0, 0]), 1), 0, 0).slice(0, 3)).toEqual([0, 0, 0]);
    const [w] = px(dim(solid(1, 1, [255, 255, 255]), 1), 0, 0);
    expect(w).toBeLessThan(160);
  });

  it("crushes dark greys harder than light ones", () => {
    const dark = px(dim(solid(1, 1, [60, 60, 60]), 1), 0, 0)[0] / 60;
    const light = px(dim(solid(1, 1, [220, 220, 220]), 1), 0, 0)[0] / 220;
    expect(dark).toBeLessThan(light);
  });

  it("is identity at strength 0", () => {
    const src = solid(2, 2, [12, 150, 240]);
    expect(dim(src, 0).data).toEqual(src.data);
  });
});

describe("registry", () => {
  it("never mutates the source and keeps dimensions", () => {
    const src = solid(8, 6, [240, 30, 60]);
    const before = new Uint8ClampedArray(src.data);
    for (const c of CONDITIONS) {
      const out = c.apply(src, 1);
      expect([out.width, out.height]).toEqual([8, 6]);
    }
    expect(src.data).toEqual(before);
  });

  it("gives every condition an honesty label and method text", () => {
    for (const c of CONDITIONS) {
      expect(["measured", "modelled", "illustrative"]).toContain(c.honesty);
      expect(c.method.length).toBeGreaterThan(20);
    }
  });

  it("stacks conditions in order", () => {
    const src = solid(4, 4, [255, 0, 0]);
    const stacked = applyConditions(src, [
      { id: "deuteranopia", strength: 1 },
      { id: "dim-room", strength: 1 },
    ]);
    const manual = getCondition("dim-room").apply(getCondition("deuteranopia").apply(src, 1), 1);
    expect(stacked.data).toEqual(manual.data);
  });
});
