/**
 * notify-reporter — DSA Art. 16 compliance.
 *
 * Sends an email to the user who submitted a report when an admin marks it as reviewed.
 * Admin-only endpoint. Called from the admin reports dashboard after updating a report.
 *
 * Body: { report_id, outcome: "actioned" | "rejected", admin_note?: string }
 * Returns: { success: true }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { buildCorsHeaders, handlePreflight, jsonResponse } from "../_shared/cors.ts";

interface NotifyReporterBody {
  report_id: string;
  outcome: "actioned" | "rejected";
  admin_note?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflight(req);

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify caller is admin
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return jsonResponse(req, { error: "Forbidden: admin only" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as NotifyReporterBody | null;
    if (!body?.report_id || !["actioned", "rejected"].includes(body.outcome ?? "")) {
      return jsonResponse(req, { error: "report_id and valid outcome required" }, { status: 400 });
    }

    // Fetch report + reporter user_id + listing details
    const { data: report, error: repErr } = await admin
      .from("reports")
      .select("id, user_id, reason, car_listing_id, status, car_listings(brand, model, year)")
      .eq("id", body.report_id)
      .maybeSingle();

    if (repErr || !report) {
      return jsonResponse(req, { error: "Report not found" }, { status: 404 });
    }

    // Get reporter email from auth.users
    const { data: reporterData, error: authErr } = await admin.auth.admin.getUserById(report.user_id);
    if (authErr || !reporterData?.user?.email) {
      return jsonResponse(req, { error: "Could not resolve reporter email" }, { status: 500 });
    }
    const reporterEmail = reporterData.user.email;

    // Check suppression list (GDPR opt-out)
    const { data: suppressed } = await admin
      .from("suppressed_emails")
      .select("id")
      .eq("email", reporterEmail.toLowerCase())
      .maybeSingle();

    if (suppressed) {
      console.log(`[notify-reporter] Skipping suppressed email: ${reporterEmail}`);
      return jsonResponse(req, { success: true, skipped: "suppressed" });
    }

    // Mark report as reviewed in DB
    await admin
      .from("reports")
      .update({ status: "reviewed", updated_at: new Date().toISOString() })
      .eq("id", body.report_id);

    const listing = report.car_listings as { brand: string; model: string; year: number } | null;
    const vehicleName = listing ? `${listing.brand} ${listing.model} (${listing.year})` : "annonce signalée";
    const isActioned = body.outcome === "actioned";

    const outcomeText = isActioned
      ? "Le contenu a été examiné et des mesures ont été prises conformément à nos conditions d'utilisation."
      : "Le contenu a été examiné et ne constitue pas une violation de nos conditions d'utilisation.";

    const subject = isActioned
      ? "✅ Votre signalement a été traité — AutoRA"
      : "📋 Votre signalement a été examiné — AutoRA";

    const adminNoteHtml = body.admin_note
      ? `<div style="background:#f1f5f9;padding:12px 16px;border-radius:8px;border-left:4px solid #94a3b8;margin:16px 0;">
           <p style="margin:0;font-size:13px;color:#64748b;">Note de l'équipe AutoRA</p>
           <p style="margin:4px 0 0;font-size:14px;color:#334155;">${body.admin_note}</p>
         </div>`
      : "";

    await resend.emails.send({
      from: "AutoRA <noreply@autora.be>",
      to: [reporterEmail],
      subject,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f0f0f0;">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">🚗 AutoRA</h1>
            <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Traitement de votre signalement</p>
          </div>
          <div style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
            <p>Bonjour,</p>
            <p>Nous avons bien traité votre signalement concernant <strong>${vehicleName}</strong>.</p>
            <p>${outcomeText}</p>
            ${adminNoteHtml}
            <p style="font-size:13px;color:#64748b;margin-top:24px;">
              Merci de contribuer à la qualité de la plateforme AutoRA. Votre signalement a été traité dans les 48 heures ouvrables conformément à l'article 16 du Digital Services Act (DSA).
            </p>
            <div style="text-align:center;margin-top:28px;">
              <a href="https://autora.be" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:500;">
                Retour à AutoRA
              </a>
            </div>
            <p style="font-size:11px;color:#94a3b8;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">
              Si vous souhaitez contester cette décision, contactez-nous à autoracontact@gmail.com.
            </p>
          </div>
        </body></html>`,
    });

    console.log(`[notify-reporter] Report ${body.report_id} reviewed, notified ${reporterEmail}`);
    return jsonResponse(req, { success: true });
  } catch (err) {
    console.error("[notify-reporter] error", err);
    return jsonResponse(req, { error: "Internal error" }, { status: 500 });
  }
});
