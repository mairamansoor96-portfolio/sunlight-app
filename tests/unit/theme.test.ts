/**
 * "Sunlight's own interface passes every test it offers" (SPEC.md → Personality).
 * Checks the colour tokens in app/globals.css against WCAG 2.x AA.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "@/lib/simulations/color";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const root = css.match(/:root\s*{([^}]*)}/)?.[1] ?? "";
const tokens = Object.fromEntries(
  Array.from(root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi), (m) => [m[1], m[2]]),
);

function lum(name: string) {
  const hex = tokens[name];
  if (!hex) throw new Error(`Missing colour token --${name}`);
  const n = parseInt(hex.slice(1), 16);
  return relativeLuminance((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

const ratio = (a: string, b: string) => contrastRatio(lum(a), lum(b));

// [foreground, background]: text must reach 4.5:1.
const TEXT_PAIRS: [string, string][] = [
  ["ink", "bg"],
  ["ink", "surface"],
  ["ink", "surface-warm"],
  ["ink", "sun"],
  ["ink-muted", "bg"],
  ["ink-muted", "surface"],
  ["ink-muted", "surface-warm"],
  ["ember", "bg"],
  ["ember", "surface"],
  ["measured-ink", "measured-bg"],
  ["modelled-ink", "modelled-bg"],
  ["illustrative-ink", "illustrative-bg"],
  ["error-ink", "error-bg"],
];

// Focus rings, control borders, the slider handle: non-text UI needs 3:1.
const UI_PAIRS: [string, string][] = [
  ["ember", "bg"],
  ["ember", "surface-warm"],
  ["line-strong", "surface"],
  ["ink", "sun"],
];

describe("Sunlight's own colours", () => {
  it.each(TEXT_PAIRS)("text --%s on --%s meets AA (4.5:1)", (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)("UI --%s on --%s meets 3:1", (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
