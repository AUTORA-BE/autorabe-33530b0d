import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createStripeClient, parseEnv, resolveOrCreateCustomer } from "../_shared/stripe.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { environment, returnUrl } = await req.json().catch(() => ({}));
    const env = parseEnv(environment);

    const stripe = createStripeClient(env);
    const customerId = await resolveOrCreateCustomer(stripe, {
      email: user.email,
      userId: user.id,
    });

    const ALLOWED_ORIGINS = [
      "https://autora.be",
      "https://www.autora.be",
      "https://autorabe.lovable.app",
    ];
    const rawOrigin = req.headers.get("origin") || "";
    const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : "https://autora.be";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: typeof returnUrl === "string" && /^https?:\/\//.test(returnUrl)
        ? returnUrl
        : `${origin}/pricing`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[customer-portal] Error:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
