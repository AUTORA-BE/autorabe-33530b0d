import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const systemPrompt = `Tu es un assistant expert automobile pour AutoRA, une marketplace automobile belge.

Tu aides les utilisateurs avec:
- Questions sur les voitures (caractéristiques, comparaisons, conseils d'achat)
- Informations sur les zones LEZ en Belgique (Bruxelles, Anvers, Gand)
- Conseils sur le Car-Pass (obligatoire en Belgique)
- Calcul du TCO (Total Cost of Ownership)
- Normes Euro et compatibilité environnementale

Réponds toujours en français, de manière professionnelle mais accessible.
Si on te demande quelque chose hors du domaine automobile, redirige poliment vers ton expertise.`;

const MAX_MESSAGES = 30;
const MAX_CONTENT_LEN = 2000;

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return handlePreflight(req);

  try {
    // ── Per-IP rate limit: 15 calls / hour ──
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const { data: rlAllowed } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: `car_chat_ip:${ip}`,
      _max_attempts: 15,
      _window_seconds: 3600,
    });
    if (rlAllowed === false) {
      return new Response(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans une heure." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" } }
      );
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Trop de messages (max ${MAX_MESSAGES}).` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Sanitize: only allow user/assistant roles, cap content length
    const safeMessages = messages
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_CONTENT_LEN) }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...safeMessages],
        stream: true,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
