/**
 * Profil acheteur stocké en localStorage pour le TCO Matchmaker.
 * Permet de calculer un score "Parfait pour toi" sur chaque annonce.
 *
 * @module features/tco/hooks/useBuyerProfile
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "autora_buyer_profile";

/** Profil acheteur pour le matching TCO */
export interface BuyerProfile {
  /** Région belge de l'acheteur */
  region: "bruxelles" | "flandre" | "wallonie";
  /** Kilomètres parcourus par an */
  kmPerYear: number;
  /** Budget maximum en EUR */
  maxBudget: number;
  /** Type de carburant préféré (optionnel) */
  preferredFuel?: string;
  /** Profil configuré */
  isConfigured: boolean;
}

const DEFAULT_PROFILE: BuyerProfile = {
  region: "bruxelles",
  kmPerYear: 15000,
  maxBudget: 25000,
  isConfigured: false,
};

/**
 * Hook pour gérer le profil acheteur (localStorage)
 */
export function useBuyerProfile() {
  const [profile, setProfile] = useState<BuyerProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as BuyerProfile;
    } catch { /* ignore */ }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    if (profile.isConfigured) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<BuyerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const saveProfile = useCallback((data: Omit<BuyerProfile, "isConfigured">) => {
    const newProfile = { ...data, isConfigured: true };
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { profile, updateProfile, saveProfile, clearProfile };
}
