/**
 * usePaymentsEnabled — état des paiements, lu depuis le serveur.
 *
 * Source de vérité unique : la fonction `payments-status`, qui lit la même
 * variable `PAYMENTS_ENABLED` que les fonctions de caisse. Aucun booléen de
 * paiement n'est écrit en dur côté client.
 *
 * Défaut fermé : erreur réseau, délai dépassé ou réponse illisible ⇒ désactivé.
 */

import { useQuery } from "@tanstack/react-query";

const TIMEOUT_MS = 5000;

async function fetchPaymentsEnabled(): Promise<boolean> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payments-status`;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { apikey, Authorization: `Bearer ${apikey}` },
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data: unknown = await res.json();
    return (data as { enabled?: unknown } | null)?.enabled === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** `true` uniquement si le serveur confirme que les paiements sont ouverts. */
export function usePaymentsEnabled(): boolean {
  const { data } = useQuery({
    queryKey: ["payments-status"],
    queryFn: fetchPaymentsEnabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return data === true;
}
