import { describe, it, expect, beforeEach } from "vitest";
import {
  getConsent,
  hasConsented,
  analyticsAllowed,
  setConsent,
  resetConsent,
} from "./consent";

describe("consent", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConsent();
  });

  it("starts with no consent", () => {
    expect(hasConsented()).toBe(false);
    expect(analyticsAllowed()).toBe(false);
  });

  it("setConsent(true) enables analytics and persists", () => {
    setConsent(true);
    expect(hasConsented()).toBe(true);
    expect(analyticsAllowed()).toBe(true);
    const raw = localStorage.getItem("autora_cookie_consent");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toMatchObject({ analytics: true, consented: true });
  });

  it("setConsent(false) records consent without analytics", () => {
    setConsent(false);
    expect(hasConsented()).toBe(true);
    expect(analyticsAllowed()).toBe(false);
  });

  it("resetConsent wipes the choice", () => {
    setConsent(true);
    resetConsent();
    expect(hasConsented()).toBe(false);
    expect(localStorage.getItem("autora_cookie_consent")).toBeNull();
  });

  it("essential is always true", () => {
    setConsent(false);
    expect(getConsent().essential).toBe(true);
  });
});
