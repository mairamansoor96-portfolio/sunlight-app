import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const SAMPLE = path.join(__dirname, "../../public/sample-screenshot.png");

test("upload, switch conditions and wipe the slider", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Let’s go outside");

  await page.getByLabel("Choose a screenshot").setInputFiles(SAMPLE);

  const after = page.getByRole("img", { name: /simulated/ });
  await expect(after).toBeVisible();
  await expect(page.locator(".stage__status")).toHaveText(/Drag the divider/);

  // Every condition shows an honesty label.
  for (const name of ["Dim room, battery saver", "Blurred vision", "Deuteranopia (red–green)"]) {
    const option = page.locator(".studio__controls").getByRole("radio", { name: new RegExp(name.replace(/[()]/g, "\\$&")) });
    await option.check();
    await expect(after).toHaveAccessibleName(new RegExp(name.replace(/[()]/g, "\\$&")));
    await expect(page.locator(".stage__status")).toHaveText(/Drag the divider/);
  }
  await expect(page.locator(".method .tag")).toHaveText("Modelled");
  await expect(page.getByRole("img", { name: /Tone strip/ })).toBeVisible();

  const handle = page.getByRole("slider", { name: /Comparison/ });
  await handle.focus();
  await page.keyboard.press("Home");
  await expect(handle).toHaveAttribute("aria-valuenow", "0");
  await page.keyboard.press("ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", "2");
  await page.keyboard.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "100");

  // Pointer: clicking near the left edge moves the divider there.
  const frame = page.getByTestId("compare-frame");
  const box = (await frame.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.5);
  const now = Number(await handle.getAttribute("aria-valuenow"));
  expect(now).toBeGreaterThan(20);
  expect(now).toBeLessThan(30);
});

test("the simulated image really differs from the original", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use a sample screen" }).click();
  await page.locator(".studio__controls").getByRole("radio", { name: /Deuteranopia/ }).check();
  await expect(page.locator(".stage__status")).toHaveText(/Drag the divider/);

  const differs = await page.evaluate(() => {
    const [a, b] = Array.from(document.querySelectorAll("canvas"));
    const da = a.getContext("2d")!.getImageData(0, 0, a.width, a.height).data;
    const db = b.getContext("2d")!.getImageData(0, 0, b.width, b.height).data;
    let changed = 0;
    for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1]) changed++;
    return changed;
  });
  expect(differs).toBeGreaterThan(1000);
});

test("rejects files that aren't screenshots", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Choose a screenshot").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });
  await expect(page.locator(".upload__error[role=alert]")).toContainText("isn't an image");
});

test("opens images that arrive without a file type, as phone galleries often send them", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Choose a screenshot").setInputFiles({
    name: "IMG_0412",
    mimeType: "",
    buffer: readFileSync(SAMPLE),
  });
  await expect(page.getByRole("img", { name: /simulated/ })).toBeVisible();
});

test.describe("live hero", () => {
  test("tours every condition on its own, two seconds each", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Looks great on your monitor. Let’s go outside.");
    await expect(page.locator(".live-hero").getByRole("radio")).toHaveCount(0);
    const overlay = page.getByTestId("hero-overlay");
    await expect(overlay).toHaveAttribute("data-condition", "dim-room", { timeout: 3000 });
    await expect(overlay).toHaveAttribute("data-condition", "blurred-vision", { timeout: 3000 });
    await expect(overlay).toHaveAttribute("data-condition", "deuteranopia", { timeout: 3000 });
    await expect(page.locator(".live-hero__readout")).toContainText("Machado 2009");
    await expect(overlay).toHaveAttribute("data-condition", "monitor", { timeout: 3000 });
  });

  test("pauses and resumes", async ({ page }) => {
    await page.goto("/");
    const overlay = page.getByTestId("hero-overlay");
    await expect(overlay).toHaveAttribute("data-condition", "dim-room", { timeout: 3000 });
    await page.getByRole("button", { name: /Pause tour/ }).click();
    const held = await overlay.getAttribute("data-condition");
    await page.waitForTimeout(3000);
    await expect(overlay).toHaveAttribute("data-condition", held!);
    await page.getByRole("button", { name: /Play tour/ }).click();
    await expect(overlay).not.toHaveAttribute("data-condition", held!);
  });

  test("stays still for people who prefer reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForTimeout(2500);
    await expect(page.getByTestId("hero-overlay")).toHaveAttribute("data-condition", "monitor");
    await expect(page.getByRole("button", { name: /Play tour/ })).toBeVisible();
  });
});
