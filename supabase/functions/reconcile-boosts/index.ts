/**
 * Rattrapage des mises en avant payées mais jamais appliquées.
 *
 * Un boost n'est activé que par `payments-webhook`. Si sa livraison est perdue,
 * le client a payé et rien n'arrive — et rien, nulle part, ne le sait : aucune
 * table ne garde trace d'un paiement de boost. La seule trace est chez Stripe.
 *
 * Cette fonction relit donc les sessions de paiement réellement réglées et
 * applique ce qui manque via la RPC `public.apply_paid_boost`, idempotente par
 * session. Elle ne touche ni à la signature ni à l'idempotence du webhook.
 *
 * Deux appelants :
 * - un vendeur connecté : ses propres paiements, à l'ouverture de son dashboard ;
 * - le service role ou le jeton cron partagé : tous les paiements récents.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createStripeClient, parseEnv } from "../_shared/stripe.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";
import {
  type AnnonceBoost,
  type SessionBoost,
  annoncesAConsulter,
  decider,
  marqueurDe,
  sessionDuMarqueur,
} from "../_shared/boostReconciliation.ts";

/** Fenêtre relue chez Stripe. Au-delà, un rattrapage relève du support. */
const FENETRE_JOURS = 30;
const MAX_SESSIONS = 100;

const json = (body: unknown, status: number, headers: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

/** Session Stripe → forme attendue par le module de décision. */
// deno-lint-ignore no-explicit-any
function versSessionBoost(s: any): SessionBoost {
  const completedAt = s?.status_transitions?.completed_at ?? s?.created ?? null;
  const heures = Number(s?.metadata?.boost_hours);
  return {
    id: String(s?.id ?? ""),
    listingId: s?.metadata?.listing_id ?? null,
    userId: s?.metadata?.userId ?? s?.metadata?.supabase_user_id ?? null,
    level: s?.metadata?.boost_level ?? null,
    hours: Number.isFinite(heures) && heures > 0 ? heures : null,
    paidAt: completedAt ? new Date(completedAt * 1000).toISOString() : null,
  };
}

/** Ne garde que les paiements ponctuels réellement réglés portant un boost. */
// deno-lint-ignore no-explicit-any
const estPaiementBoostRegle = (s: any) =>
  s?.mode === "payment" && s?.payment_status === "paid" && Boolean(s?.metadata?.listing_id);

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);

  // Même interrupteur que create-boost-checkout : défaut fermé. Sans paiements
  // actifs il n'y a rien à rattraper, et surtout aucune clé Stripe à supposer.
  if ((Deno.env.get("PAYMENTS_ENABLED") ?? "").trim() !== "true") {
    return json({ enabled: false, examined: 0, applied: 0, alerts: 0 }, 200, corsHeaders);
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey, {
      auth: { persistSession: false },
    });

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Unauthorized" }, 401, corsHeaders);

    // Appelant interne : service role, ou jeton cron partagé (même motif
    // qu'expire-boosts et match-new-vehicle).
    let interne = token === serviceRoleKey;
    if (!interne) {
      const { data: ok } = await supabaseAdmin.rpc("verify_cron_token", { p_token: token });
      interne = ok === true;
    }

    let userId: string | null = null;
    if (!interne) {
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      userId = userData?.user?.id ?? null;
      if (!userId) return json({ error: "Unauthorized" }, 401, corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const stripe = createStripeClient(parseEnv(body?.environment));
    const depuis = Math.floor((Date.now() - FENETRE_JOURS * 86_400_000) / 1000);

    // Un vendeur ne voit que ses propres paiements. On cherche son client
    // Stripe sans jamais en créer un : ouvrir un dashboard ne doit rien créer.
    let customerId: string | undefined;
    if (userId) {
      if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return json({ error: "Unauthorized" }, 401, corsHeaders);
      const trouve = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      if (!trouve.data.length) {
        return json({ enabled: true, examined: 0, applied: 0, alerts: 0 }, 200, corsHeaders);
      }
      customerId = trouve.data[0].id;
    }

    const liste = await stripe.checkout.sessions.list({
      limit: MAX_SESSIONS,
      created: { gte: depuis },
      ...(customerId ? { customer: customerId } : {}),
    });

    const sessions = liste.data.filter(estPaiementBoostRegle).map(versSessionBoost);
    if (sessions.length === 0) {
      return json({ enabled: true, examined: 0, applied: 0, alerts: 0 }, 200, corsHeaders);
    }

    const idsAnnonces = annoncesAConsulter(sessions);
    const { data: lignes } = await supabaseAdmin
      .from("car_listings")
      .select("id,user_id,boost_level,boost_expires_at")
      .in("id", idsAnnonces);

    const annonces: AnnonceBoost[] = (lignes ?? []).map((l) => ({
      id: String(l.id),
      userId: String(l.user_id),
      boostLevel: (l.boost_level as string | null) ?? null,
      boostExpiresAt: (l.boost_expires_at as string | null) ?? null,
    }));

    const { data: marqueurs } = await supabaseAdmin
      .from("stripe_processed_events")
      .select("event_id")
      .in("event_id", sessions.map((s) => marqueurDe(s.id)));

    const dejaFaites = (marqueurs ?? [])
      .map((m) => sessionDuMarqueur(String(m.event_id)))
      .filter((id): id is string => Boolean(id));

    const decisions = decider(sessions, annonces, dejaFaites);

    let applied = 0;
    let alerts = 0;

    for (const d of decisions) {
      if (d.action === "alerter") {
        alerts++;
        await logOpsAlert("reconcile-boosts", `Paiement de boost incohérent : ${d.motif}`, {
          severity: "error",
          context: {
            motif: d.motif,
            session_id: d.session.id,
            listing_id: d.session.listingId ?? "",
            boost_level: d.session.level ?? "",
          },
        });
        continue;
      }
      if (d.action !== "appliquer") continue;

      const { data: res, error } = await supabaseAdmin.rpc("apply_paid_boost", {
        p_session_id: d.session.id,
        p_listing_id: d.listingId,
        p_level: d.level,
        p_hours: d.hours,
      });

      // deno-lint-ignore no-explicit-any
      const resultat = res as any;
      if (error || !resultat?.applied) {
        // `already_applied` : une autre exécution a gagné la course, rien à signaler.
        if (!error && resultat?.reason === "already_applied") continue;
        alerts++;
        await logOpsAlert("reconcile-boosts", "Rattrapage de boost impossible", {
          severity: "critical",
          context: {
            session_id: d.session.id,
            listing_id: d.listingId,
            boost_level: d.level,
            motif: String(error?.message ?? resultat?.reason ?? "inconnu"),
          },
        });
        continue;
      }

      applied++;
      // Un rattrapage réussi signifie qu'un webhook a été perdu : ça se sait.
      await logOpsAlert("reconcile-boosts", "Boost payé appliqué par rattrapage (webhook perdu)", {
        severity: "warn",
        context: {
          session_id: d.session.id,
          listing_id: d.listingId,
          boost_level: d.level,
          boost_hours: d.hours,
        },
      });
    }

    return json(
      { enabled: true, examined: sessions.length, applied, alerts },
      200,
      corsHeaders,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[reconcile-boosts] Error:", message);
    await logOpsAlert("reconcile-boosts", `Échec du rattrapage des boosts : ${message}`, {
      severity: "critical",
    });
    return json({ error: "Internal server error" }, 500, corsHeaders);
  }
});
