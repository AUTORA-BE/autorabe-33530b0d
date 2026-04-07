import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, identifier } = await req.json();

    if (!action || typeof action !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const key = `${action}:${identifier || req.headers.get("x-forwarded-for") || "unknown"}`;

    // Config per action
    const limits: Record<string, { max: number; window: number }> = {
      contact_form: { max: 3, window: 3600 },
      login: { max: 10, window: 900 },
      signup: { max: 5, window: 3600 },
      message: { max: 30, window: 3600 },
      report: { max: 5, window: 3600 },
    };

    const config = limits[action] || { max: 20, window: 3600 };

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: allowed, error } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: key,
      _max_attempts: config.max,
      _window_seconds: config.window,
    });

    if (error) {
      console.error("Rate limit check error:", error);
      return new Response(
        JSON.stringify({ allowed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ allowed }),
      {
        status: allowed ? 200 : 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Rate limit error:", err);
    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
