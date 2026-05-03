/**
 * Shared helpers for Playwright tests.
 * Centralised so selectors are easy to update when UI changes.
 */
import { Page, expect } from "@playwright/test";

export const TEST_CREDENTIALS = {
  user1: {
    email: process.env.E2E_USER_EMAIL || "",
    password: process.env.E2E_USER_PASSWORD || "",
  },
  user2: {
    email: process.env.E2E_USER2_EMAIL || "",
    password: process.env.E2E_USER2_PASSWORD || "",
  },
};

export const TEST_LISTING_ID = process.env.E2E_LISTING_ID || "";

export function skipIfNoCreds(testInfo: { skip: (reason?: string) => void }) {
  if (!TEST_CREDENTIALS.user1.email || !TEST_CREDENTIALS.user1.password) {
    testInfo.skip("E2E credentials not configured (E2E_USER_EMAIL/E2E_USER_PASSWORD).");
  }
}

/**
 * Log in via the email/password form on /auth.
 * Resilient: closes cookie banner if present.
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/auth");

  // Dismiss cookie banner if it appears
  const refuse = page.getByRole("button", { name: /refuser|decline|weigeren|ablehnen/i });
  if (await refuse.isVisible().catch(() => false)) {
    await refuse.click();
  }

  // Switch to "Sign in" tab if present
  const signInTab = page.getByRole("tab", { name: /se connecter|sign in|inloggen|anmelden/i });
  if (await signInTab.isVisible().catch(() => false)) {
    await signInTab.click();
  }

  await page.getByLabel(/email|e-mail/i).first().fill(email);
  await page.getByLabel(/mot de passe|password|wachtwoord|passwort/i).first().fill(password);

  await page
    .getByRole("button", { name: /^(se connecter|sign in|inloggen|anmelden)$/i })
    .first()
    .click();

  // Successful login redirects away from /auth
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 20_000 });
}
