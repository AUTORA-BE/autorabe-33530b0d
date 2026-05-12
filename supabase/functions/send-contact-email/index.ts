import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "AutoRA <noreply@autora.be>",
      to,
      subject,
      html,
      ...(replyTo && { reply_to: replyTo }),
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return res.json();
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

    // Escape HTML to prevent XSS
    const escapeHtml = (str: string) => 
      str.replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    // Send notification email to AutoRA team
    const notificationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: 600; color: #6366f1; margin-bottom: 5px; }
          .value { background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Nouveau message de contact</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Via le formulaire AutoRA</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Nom</div>
              <div class="value">${safeName}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
            </div>
            <div class="field">
              <div class="label">Sujet</div>
              <div class="value">${safeSubject}</div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="message-box">${safeMessage.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      ["autoracontact@gmail.com"],
      `[Contact AutoRA] ${safeSubject}`,
      notificationHtml,
      email
    );

    console.log("Notification email sent");

    // Send confirmation email to the user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Merci de nous avoir contacté !</h1>
          </div>
          <div class="content">
            <p>Bonjour ${safeName},</p>
            <p>Nous avons bien reçu votre message concernant "<strong>${safeSubject}</strong>".</p>
            <p>Notre équipe traitera votre demande dans les plus brefs délais. Nous nous efforçons de répondre sous 24 heures ouvrées.</p>
            <p>En attendant, n'hésitez pas à consulter notre <a href="https://autora.be/faq">FAQ</a> qui pourrait répondre à certaines de vos questions.</p>
            <p>Cordialement,<br><strong>L'équipe AutoRA</strong></p>
          </div>
          <div class="footer">
            <p>AutoRA - La marketplace automobile belge de confiance</p>
            <p>Rue de la Loi 1, 1000 Bruxelles, Belgique</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      [email],
      "Nous avons bien reçu votre message - AutoRA",
      confirmationHtml
    );

    console.log("Confirmation email sent");

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
