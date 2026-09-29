import { defineConfig, devices } from "@playwright/test";

// Runs against the static export, i.e. exactly what ships. `npm run build` first.
// Set CHROMIUM_PATH to use a preinstalled Chromium instead of Playwright's own.
export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:4173",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx serve out -l 4173",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
});
