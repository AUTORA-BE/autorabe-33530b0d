import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const EXPORT_RATE_LIMIT_HOURS = 24;

async function hashId(id: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const userId = userData.user.id;

    // Rate limit: 1 export per 24h (GDPR art. 12 — reasonable delay allowed)
    const since = new Date(Date.now() - EXPORT_RATE_LIMIT_HOURS * 3600 * 1000).toISOString();
    const { data: recentExport } = await supabase
      .from("audit_log")
      .select("created_at")
      .eq("user_id", userId)
      .eq("action", "data_export")
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();

    if (recentExport) {
      return new Response(
        JSON.stringify({ error: `Un export a déjà été demandé dans les dernières ${EXPORT_RATE_LIMIT_HOURS}h. Réessayez plus tard.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(EXPORT_RATE_LIMIT_HOURS * 3600) } },
      );
    }

    console.log(`[EXPORT-DATA] Starting export for user ${userId}`);

    // Log the export before fetching (prevents race on rapid parallel requests)
    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "data_export",
      details: { initiated_at: new Date().toISOString() },
    });

    // Fetch all user data
    const [
      { data: profile },
      { data: listings },
      { data: favorites },
      { data: conversations },
      { data: reviews },
      { data: alerts },
      { data: preferences },
      { data: auditLogs },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("car_listings").select("*").eq("user_id", userId),
      supabase.from("favorites").select("*, car_listings_public(brand, model, year, price)").eq("user_id", userId),
      supabase.from("conversations").select("*, messages(*)").or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      supabase.from("reviews").select("*").eq("user_id", userId),
      supabase.from("user_alerts").select("*").eq("user_id", userId),
      supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
      // Exclude details column — may contain PII hashes; return action + timestamps only
      supabase.from("audit_log").select("id, action, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
    ]);

    // Anonymize counterparty UUIDs in conversations (GDPR — their data is not ours to export)
    const anonymizedConversations = await Promise.all(
      (conversations ?? []).map(async (conv: Record<string, unknown>) => {
        const counterpartyId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
        const anonId = typeof counterpartyId === "string" ? await hashId(counterpartyId) : null;
        const isUserBuyer = conv.buyer_id === userId;
        return {
          ...conv,
          buyer_id: isUserBuyer ? userId : `[anon:${anonId}]`,
          seller_id: isUserBuyer ? `[anon:${anonId}]` : userId,
        };
      }),
    );

    const exportData = {
      export_date: new Date().toISOString(),
      format_version: "1.1",
      notice: "Counterparty identifiers in conversations are anonymised (GDPR art. 20).",
      user: {
        id: userData.user.id,
        email: userData.user.email,
        created_at: userData.user.created_at,
        last_sign_in_at: userData.user.last_sign_in_at,
      },
      profile,
      listings: listings ?? [],
      favorites: favorites ?? [],
      conversations: anonymizedConversations,
      reviews: reviews ?? [],
      alerts: alerts ?? [],
      preferences,
      audit_log: auditLogs ?? [],
    };

    console.log(`[EXPORT-DATA] Export complete for user ${userId}`);

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="autora-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[EXPORT-DATA] Error: ${message}`);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
