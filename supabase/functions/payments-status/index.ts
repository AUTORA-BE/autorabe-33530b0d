import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

/**
 * État public des paiements — unique source de vérité côté interface.
 *
 * Lit exactement la même variable que `create-checkout` / `create-boost-checkout`,
 * avec la même condition (défaut fermé, comparaison stricte après `.trim()`).
 * Ne renvoie qu'un booléen : aucune clé, aucun identifiant, aucun tarif.
 */
serve((req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);

  const enabled = (Deno.env.get("PAYMENTS_ENABLED") ?? "").trim() === "true";

  return new Response(JSON.stringify({ enabled }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
});
