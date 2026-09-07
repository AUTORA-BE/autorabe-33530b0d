/**
 * Interrupteur d'affichage des paiements (côté client).
 *
 * L'autorité reste le serveur : `PAYMENTS_ENABLED` dans les edge functions
 * `create-checkout` / `create-boost-checkout`. Ce drapeau ne sert qu'à masquer
 * les points d'entrée d'achat pour ne pas proposer un bouton qui échouerait.
 *
 * Défaut fermé : seule la valeur exacte "true" active l'affichage.
 */
export function paymentsEnabled(): boolean {
  return (import.meta.env.VITE_PAYMENTS_ENABLED as string | undefined)?.trim() === "true";
}
