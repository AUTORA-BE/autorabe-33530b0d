import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — E2E for AutoRa critical paths.
 *
 * IMPORTANT — these tests run against the PUBLISHED app by default
 * (https://autorabe.lovable.app). They are SMOKE tests and require:
 *   - A test account `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` (existing in DB)
 *   - A second test account `E2E_USER2_EMAIL` / `E2E_USER2_PASSWORD` (for messaging test)
 *   - A test listing ID `E2E_LISTING_ID` belonging to user 2
 *
 * Without these env vars, tests are skipped (so CI doesn't fail on first run).
 * Run locally: BASE_URL=http://localhost:8080 bunx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // sequential — we share user accounts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || "https://autorabe.lovable.app",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
