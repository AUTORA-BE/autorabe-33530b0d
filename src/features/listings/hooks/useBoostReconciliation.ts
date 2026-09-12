/**
 * Rattrapage des mises en avant payées dont le webhook a été perdu.
 *
 * Un boost n'est activé que par `payments-webhook`. Si sa livraison échoue, le
 * vendeur a payé et ne reçoit rien, sans qu'aucune alerte ne se déclenche : la
 * base ne garde aucune trace d'un paiement de boost. L'ouverture du dashboard
 * est le moment naturel pour rattraper — c'est là que le vendeur constaterait
 * le manque.
 *
 * Le déclenchement est volontairement silencieux et sans effet de bord visible :
 * l'affichage du dashboard ne doit jamais dépendre de la disponibilité de
 * Stripe. L'idempotence est garantie côté serveur (`apply_paid_boost`), pas ici.
 *
 * @module features/listings/hooks
 */

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export interface ResultatRattrapage {
  enabled: boolean;
  examined: number;
  applied: number;
  alerts: number;
}

/**
 * Lit la réponse de `reconcile-boosts`. Toute réponse illisible vaut « rien
 * fait » : le dashboard ne doit pas se rafraîchir sur une réponse douteuse.
 */
export function lireResultatRattrapage(data: unknown): ResultatRattrapage | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
  if (typeof d.enabled !== "boolean") return null;
  return {
    enabled: d.enabled,
    examined: nombre(d.examined),
    applied: nombre(d.applied),
    alerts: nombre(d.alerts),
  };
}

export interface OptionsRattrapage {
  /** N'appelle rien tant que les paiements sont fermés. */
  actif: boolean;
  /** Appelé seulement si au moins un boost payé vient d'être appliqué. */
  onApplique?: (resultat: ResultatRattrapage) => void;
}

/** Déclenche le rattrapage une fois, à l'ouverture du dashboard vendeur. */
export function useBoostReconciliation({ actif, onApplique }: OptionsRattrapage): void {
  const dejaLance = useRef(false);
  const rappel = useRef(onApplique);
  rappel.current = onApplique;

  useEffect(() => {
    if (!actif || dejaLance.current) return;
    dejaLance.current = true;

    let annule = false;
    void supabase.functions
      .invoke("reconcile-boosts", { body: { environment: getStripeEnvironment() } })
      .then(({ data, error }) => {
        if (annule || error) return;
        const resultat = lireResultatRattrapage(data);
        if (resultat && resultat.applied > 0) rappel.current?.(resultat);
      })
      .catch(() => {
        // Silence volontaire : le dashboard s'affiche même si Stripe est injoignable.
      });

    return () => {
      annule = true;
    };
  }, [actif]);
}
