import { describe, it, expect } from "vitest";
import {
  ALERT_FREQUENCIES,
  ALERT_FREQUENCY_OPTIONS,
  DEFAULT_ALERT_FREQUENCY,
  DELIVERED_ALERT_FREQUENCIES,
  isDeliveredAlertFrequency,
} from "./alertFrequency";

/**
 * Garde-fou du lot P3c : l'UI ne doit jamais proposer une fréquence que le
 * back-end n'honore pas. `match-new-vehicle` filtre sur
 * `frequency = 'instant'` et aucun cron de digest n'existe — « quotidien » et
 * « hebdomadaire » ne déclenchaient donc strictement rien.
 */
describe("fréquences d'alerte proposées dans l'UI", () => {
  it("ne propose que des fréquences réellement envoyées", () => {
    const nonServies = ALERT_FREQUENCY_OPTIONS.filter(
      (option) => !isDeliveredAlertFrequency(option.value),
    ).map((option) => option.value);

    expect(nonServies).toEqual([]);
  });

  it("propose au moins une fréquence", () => {
    expect(ALERT_FREQUENCY_OPTIONS.length).toBeGreaterThan(0);
  });

  it("n'expose ni quotidien ni hebdomadaire tant que le digest n'existe pas", () => {
    const valeurs = ALERT_FREQUENCY_OPTIONS.map((option) => option.value);

    expect(valeurs).not.toContain("daily");
    expect(valeurs).not.toContain("weekly");
    expect(isDeliveredAlertFrequency("daily")).toBe(false);
    expect(isDeliveredAlertFrequency("weekly")).toBe(false);
  });

  it("applique par défaut une fréquence réellement envoyée et proposée", () => {
    expect(isDeliveredAlertFrequency(DEFAULT_ALERT_FREQUENCY)).toBe(true);
    expect(ALERT_FREQUENCY_OPTIONS.map((o) => o.value)).toContain(
      DEFAULT_ALERT_FREQUENCY,
    );
  });

  it("garde la liste complète des valeurs acceptées en base", () => {
    // La colonne user_alerts.frequency n'est pas modifiée : les valeurs
    // restent valides côté base, elles ne sont simplement plus proposées.
    expect([...ALERT_FREQUENCIES]).toEqual(["instant", "daily", "weekly"]);
    expect([...DELIVERED_ALERT_FREQUENCIES]).toEqual(["instant"]);
  });
});
