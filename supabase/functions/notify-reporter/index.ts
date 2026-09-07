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
import { buildCorsHeaders, handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { sendTemplateEmailLogged } from "../_shared/sendTemplateEmailLogged.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

interface NotifyReporterBody {
  report_id: string;
  outcome: "actioned" | "rejected";
  admin_note?: string;
}

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

    // Mark report as reviewed in DB
    await admin
      .from("reports")
      .update({ status: "reviewed", updated_at: new Date().toISOString() })
      .eq("id", body.report_id);

    const listing = report.car_listings as { brand: string; model: string; year: number } | null;
    const vehicleName = listing ? `${listing.brand} ${listing.model} (${listing.year})` : "annonce signalée";
    const isActioned = body.outcome === "actioned";

    const result = await sendTemplateEmailLogged("report-reviewed", reporterEmail, {
      idempotencyKey: `report-reviewed-${body.report_id}`,
      templateData: {
        vehicleName,
        outcome: body.outcome,
        adminNote: body.admin_note,
      },
    });

    if (!result.sent && result.reason === "send_failed") {
      await logOpsAlert("notify-reporter", "Envoi de la réponse au signalement échoué", {
        severity: "error",
        context: { reportId: body.report_id, outcome: body.outcome },
      });
      return jsonResponse(req, { error: "Email send failed" }, { status: 500 });
    }

    console.log(`[notify-reporter] Report ${body.report_id} reviewed (sent=${result.sent})`);
    return jsonResponse(req, { success: true });
  } catch (err) {
    console.error("[notify-reporter] error", err);
    return jsonResponse(req, { error: "Internal error" }, { status: 500 });
  }
});
