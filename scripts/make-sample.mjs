// Renders scripts/sample-screen.html to public/sample-screenshot.png at 3×,
// like an iPhone screenshot. Set CHROMIUM_PATH to use a preinstalled browser.
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.goto(new URL("./sample-screen.html", import.meta.url).href);
await page.screenshot({ path: "public/sample-screenshot.png" });
await browser.close();
