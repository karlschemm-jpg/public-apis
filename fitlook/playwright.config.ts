import { defineConfig, devices } from "@playwright/test";

// npx playwright test  (BASE_URL=https://fitlook-beta.vercel.app to test the live site)
export default defineConfig({
  testDir: "tests",
  timeout: 150_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.BASE_URL || "http://localhost:3000", trace: "off" },
  projects: [
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: false } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
