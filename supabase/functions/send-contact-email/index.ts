import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { sendTemplateEmailLogged } from "../_shared/sendTemplateEmailLogged.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

/** Boîte de réception des demandes de contact / devis pro. Repli sur la valeur historique. */
const CONTACT_INBOX = Deno.env.get("CONTACT_INBOX") ?? "autoracontact@gmail.com";



interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') return handlePreflight(req);

  try {
    // ── Server-side rate limit per IP (3 / hour) — cannot be bypassed ──
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown")
      .split(",")[0]
      .trim();
    const { data: rlAllowed } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: `contact_form_ip:${ip}`,
      _max_attempts: 3,
      _window_seconds: 3600,
    });
    if (rlAllowed === false) {
      return new Response(
        JSON.stringify({ error: "Trop de demandes. Réessayez dans une heure." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "3600", ...corsHeaders },
        }
      );
    }

    // Authenticate optional user
    let userId: string | null = null;
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const { data } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
        userId = data?.user?.id ?? null;
      }
    } catch { /* anonymous contact — no-op */ }

    const { name, email, subject, message }: ContactFormData = await req.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Tous les champs sont requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Adresse email invalide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate lengths
    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Un ou plusieurs champs dépassent la limite autorisée" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Notification interne (email managé, destinataire fixe défini par le gabarit)
    const inboxResult = await sendTemplateEmailLogged("contact-inbox", CONTACT_INBOX, {
      idempotencyKey: `contact-inbox-${crypto.randomUUID()}`,
      replyTo: email,
      templateData: { name, email, subject, message },
    });

    if (!inboxResult.sent && inboxResult.reason === "send_failed") {
      await logOpsAlert("send-contact-email", "Envoi du message de contact vers la boîte interne échoué", {
        severity: "error",
        context: { hasUser: Boolean(userId) },
      });
    }

    // Confirmation applicative (email managé)
    await sendTemplateEmailLogged("contact-confirmation", email, {
      idempotencyKey: `contact-confirm-${crypto.randomUUID()}`,
      templateData: { name, subject },
    });

    // Persist message to DB for admin review (best-effort, never blocks the response)
    try {
      await supabaseAdmin.from("contact_messages").insert({
        name,
        email,
        subject,
        message,
        user_id: userId,
        status: "new",
      });
    } catch (dbErr) {
      console.error("Failed to persist contact message:", dbErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Emails envoyés avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
