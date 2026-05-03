/**
 * E2E Test 1 — Auth flow
 * Login → access dashboard
 *
 * NOTE: Signup with email confirmation cannot be fully E2E tested without
 * an email mock or magic-link interception. We test the LOGIN path which
 * is the realistic re-entry flow.
 */
import { test, expect } from "@playwright/test";
import { login, TEST_CREDENTIALS, skipIfNoCreds } from "./helpers";

test.describe("Auth", () => {
  test("login → dashboard", async ({ page }, testInfo) => {
    skipIfNoCreds(testInfo);
    await login(page, TEST_CREDENTIALS.user1.email, TEST_CREDENTIALS.user1.password);

    await page.goto("/dashboard");
    // Dashboard renders some KPI / heading specific to logged-in users.
    await expect(page.locator("body")).toContainText(
      /dashboard|tableau de bord|annonces|listings/i,
      { timeout: 15_000 }
    );
  });
});
