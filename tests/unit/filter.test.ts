/** Each condition's filter() must describe the same model as its apply(). */
import { describe, expect, it } from "vitest";
import { CONDITIONS, getCondition } from "@/lib/simulations";
import { sigmaForWidth } from "@/lib/simulations/blur";
import { DEUTERANOPIA, mixMatrix } from "@/lib/simulations/colorBlindness";
import { dim } from "@/lib/simulations/dimRoom";
import { glare, sunlightSettings } from "@/lib/simulations/sunlight";
import { linearToSrgb, srgbToLinear } from "@/lib/simulations/color";

/** Evaluate an evenly sampled table the way SVG feFuncX type="table" does. */
function table(values: number[], x: number): number {
  const n = values.length - 1;
  const k = Math.min(n - 1, Math.floor(x * n));
  const t = x * n - k;
  return values[k] + (values[k + 1] - values[k]) * t;
}

describe("live filters", () => {
  it("every condition offers one, so the hero can show it", () => {
    for (const c of CONDITIONS) expect(c.filter, c.id).toBeTypeOf("function");
  });

  it.each([0.3, 0.8, 1])("dim room's table matches its pixel LUT at strength %s", (s) => {
    const [step] = getCondition("dim-room").filter!(s);
    expect(step.kind).toBe("table");
    if (step.kind !== "table") return;
    const ramp = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) ramp.set([i, i, i, 255], i * 4);
    const out = dim({ width: 256, height: 1, data: ramp }, s);
    for (let i = 0; i < 256; i++) {
      expect(Math.abs(table(step.values, i / 255) * 255 - out.data[i * 4])).toBeLessThanOrEqual(1.5);
    }
  });

  it("blur's σ matches the pixel model on a 390 pt phone", () => {
    const [step] = getCondition("blurred-vision").filter!(0.6);
    expect(step).toEqual({ kind: "blur", sigmaPt: sigmaForWidth(390, 0.6) });
  });

  it("deuteranopia's matrix is the Machado matrix at the same severity", () => {
    const [step] = getCondition("deuteranopia").filter!(0.5);
    expect(step).toEqual({ kind: "matrix", values: [...mixMatrix(DEUTERANOPIA, 0.5)] });
  });

  it("sunlight's linear map matches its pixel LUT", () => {
    const params = { light: "shade", phone: "budget" };
    const [step] = getCondition("sunlight").filter!(1, params);
    expect(step.kind).toBe("linear");
    if (step.kind !== "linear") return;
    const ramp = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) ramp.set([i, i, i, 255], i * 4);
    const out = glare({ width: 256, height: 1, data: ramp }, sunlightSettings(params).R);
    for (let i = 0; i < 256; i++) {
      expect(linearToSrgb(step.slope * srgbToLinear(i) + step.intercept)).toBe(out.data[i * 4]);
    }
  });
});
