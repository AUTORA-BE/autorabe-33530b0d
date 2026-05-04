import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { buildCorsHeaders, handlePreflight, jsonResponse } from "../_shared/cors.ts";

// Actions whose identifier MUST be the caller's auth.uid() (prevents lockout DoS by 3rd parties)
const USER_BOUND_ACTIONS = new Set(["listing_create", "message", "message_send", "report"]);
// Actions that always use IP as identifier (caller-supplied identifier is ignored)
const IP_BOUND_ACTIONS = new Set(["contact_form", "login", "signup", "password_reset"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflight(req);
  // CORS headers are attached by jsonResponse — no need to compute manually
  // unless you build a custom Response.

  try {
    const { action, identifier: rawIdentifier } = await req.json();

    if (!action || typeof action !== "string") {
      return jsonResponse(req, { error: "Missing action" }, { status: 400 });
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
      return jsonResponse(req, { error: "Unknown action" }, { status: 400 });
    }

    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();

    // Resolve identifier safely depending on action class
    let identifier: string;

    if (IP_BOUND_ACTIONS.has(action)) {
      identifier = ip;
    } else if (USER_BOUND_ACTIONS.has(action)) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "").trim();
      if (!token) {
        return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
      }
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
      if (claimsErr || !claimsData?.claims?.sub) {
        return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
      }
      identifier = claimsData.claims.sub;
    } else {
      identifier = ip;
    }

    // Note: rawIdentifier is intentionally NOT used to derive the key.
    void rawIdentifier;

    const config = limits[action];
    const key = `${action}:${identifier}`;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: allowed, error } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: key,
      _max_attempts: config.max,
      _window_seconds: config.window,
    });

    if (error) {
      console.error("Rate limit check error:", error);
      return jsonResponse(req, { allowed: true });
    }

    return jsonResponse(req, { allowed }, { status: allowed ? 200 : 429 });
  } catch (err) {
    console.error("Rate limit error:", err);
    return jsonResponse(req, { allowed: true });
  }
});
// Quiet "unused" warning for the buildCorsHeaders import — used inside jsonResponse.
void buildCorsHeaders;
