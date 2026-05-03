/**
 * E2E Test 3 — Realtime messaging
 * User A contacts a listing of User B → User B receives the message live.
 *
 * Requires E2E_LISTING_ID belonging to user2. Skipped otherwise.
 */
import { test, expect, BrowserContext } from "@playwright/test";
import { login, TEST_CREDENTIALS, TEST_LISTING_ID, skipIfNoCreds } from "./helpers";

test.describe("Realtime messaging", () => {
  test("user A messages user B's listing → B sees it", async ({ browser }, testInfo) => {
    skipIfNoCreds(testInfo);
    if (!TEST_CREDENTIALS.user2.email || !TEST_LISTING_ID) {
      testInfo.skip("E2E_USER2_* and E2E_LISTING_ID required.");
    }

    let ctxA: BrowserContext | null = null;
    let ctxB: BrowserContext | null = null;
    try {
      ctxA = await browser.newContext();
      ctxB = await browser.newContext();
      const pageA = await ctxA.newPage();
      const pageB = await ctxB.newPage();

      // Login both users in parallel
      await Promise.all([
        login(pageA, TEST_CREDENTIALS.user1.email, TEST_CREDENTIALS.user1.password),
        login(pageB, TEST_CREDENTIALS.user2.email, TEST_CREDENTIALS.user2.password),
      ]);

      // B opens messages page first (subscribes to realtime)
      await pageB.goto("/messages");

      // A opens the listing and sends a message
      const uniqueMsg = `e2e-${Date.now()}`;
      await pageA.goto(`/vehicle/${TEST_LISTING_ID}`);

      const contactBtn = pageA
        .getByRole("button", { name: /contacter|message|contact/i })
        .first();
      await contactBtn.click({ timeout: 15_000 });

      const textarea = pageA.locator('textarea, input[type="text"]').filter({
        hasText: "",
      }).first();
      await textarea.fill(uniqueMsg);

      const sendBtn = pageA
        .getByRole("button", { name: /envoyer|send|verzenden|senden/i })
        .first();
      await sendBtn.click();

      // B should see the message arrive without page reload
      await expect(pageB.locator("body")).toContainText(uniqueMsg, {
        timeout: 20_000,
      });
    } finally {
      await ctxA?.close();
      await ctxB?.close();
    }
  });
});
