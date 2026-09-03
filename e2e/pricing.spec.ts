/**
 * E2E Test — Structure de l'offre (/pricing)
 *
 * Un paiement Stripe réel n'est pas testable en e2e, mais la STRUCTURE
 * commerciale l'est : deux offres particulier self-serve (Gratuit + Particulier
 * 25€), aucune ancienne offre achetable (50€ / 250€), et le tunnel de devis pro.
 */
import { test, expect } from "@playwright/test";

test.describe("Pricing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
    const refuse = page.getByRole("button", { name: /refuser|decline|weigeren|ablehnen/i });
    if (await refuse.isVisible().catch(() => false)) {
      await refuse.click();
    }
  });

  test("affiche exactement deux offres particulier : Gratuit et Particulier 25€", async ({ page }) => {
    const body = page.locator("body");
    await expect(body).toContainText(/Pour les particuliers/i, { timeout: 15_000 });

    await expect(page.getByRole("heading", { name: /^Gratuit$/i })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: /^Particulier$/i })).toHaveCount(1);

    await expect(body).toContainText(/25\s*€/);
  });

  test("aucune offre achetable à 50€ ou 250€", async ({ page }) => {
    await expect(page.locator("body")).toContainText(/Pour les particuliers/i, { timeout: 15_000 });
    const text = (await page.locator("main").innerText()).replace(/\u00a0/g, " ");
    expect(text).not.toMatch(/\b50\s*€/);
    expect(text).not.toMatch(/\b250\s*€/);
  });

  test("le bloc professionnel est sur devis", async ({ page }) => {
    await expect(page.locator("body")).toContainText(/Garages & Professionnels/i, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/Sur devis/i);
  });

  test("le CTA devis mène vers /contact?sujet=devis-pro avec le sujet pré-rempli", async ({ page }) => {
    await page.getByRole("button", { name: /demander votre devis/i }).first().click();
    await page.getByRole("button", { name: /demander mon devis/i }).first().click();

    await expect(page).toHaveURL(/\/contact\?.*sujet=devis-pro/, { timeout: 20_000 });

    const subject = page.locator('input[name="subject"], #subject').first();
    await expect(subject).toHaveValue(/devis/i, { timeout: 15_000 });
  });
});
