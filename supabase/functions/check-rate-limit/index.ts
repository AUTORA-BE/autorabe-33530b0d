import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Actions whose identifier MUST be the caller's auth.uid() (prevents lockout DoS by 3rd parties)
const USER_BOUND_ACTIONS = new Set(["listing_create", "message", "message_send", "report"]);
// Actions that always use IP as identifier (caller-supplied identifier is ignored)
const IP_BOUND_ACTIONS = new Set(["contact_form", "login", "signup", "password_reset"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, identifier: rawIdentifier } = await req.json();

    if (!action || typeof action !== "string") {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limits: Record<string, { max: number; window: number }> = {
      contact_form: { max: 3, window: 3600 },
      login: { max: 10, window: 900 },
      signup: { max: 5, window: 3600 },
      message: { max: 30, window: 3600 },
      message_send: { max: 30, window: 3600 },
      report: { max: 5, window: 3600 },
      listing_create: { max: 10, window: 86400 },
      password_reset: { max: 3, window: 3600 },
    };

    if (!limits[action]) {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();

    // Resolve identifier safely depending on action class
    let identifier: string;

    if (IP_BOUND_ACTIONS.has(action)) {
      // Always use IP — ignore caller-supplied identifier to prevent targeted lockout
      identifier = ip;
    } else if (USER_BOUND_ACTIONS.has(action)) {
      // Require auth and bind identifier to auth.uid() — caller cannot lock out other users
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "").trim();
      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
      if (claimsErr || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      identifier = claimsData.claims.sub;
    } else {
      // Unknown class: fall back to IP, never honor arbitrary identifier
      identifier = ip;
    }

    // Note: rawIdentifier is intentionally NOT used to derive the key.
    void rawIdentifier;

    const config = limits[action];
    const key = `${action}:${identifier}`;

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
      // Fail closed on internal errors only for sensitive actions; otherwise allow
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ allowed }), {
      status: allowed ? 200 : 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Rate limit error:", err);
    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
