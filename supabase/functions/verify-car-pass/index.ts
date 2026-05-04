/**
 * verify-car-pass — kicks off (and, in this stub, completes) a Car-Pass check.
 *
 * Flow:
 *   1. Authenticate the caller via JWT.
 *   2. Confirm the listing belongs to them (or they are admin).
 *   3. Insert a row in car_pass_verification_requests with status='pending'.
 *   4. Flip car_listings.car_pass_status to 'pending'.
 *   5. (Stub) Wait 2 s, then mark the request 'completed' and the listing 'verified'.
 *      Replace the simulateExternalApi() call with the real Car-Pass API later.
 *
 * Returns: { request_id, status }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { buildCorsHeaders, handlePreflight, jsonResponse } from "../_shared/cors.ts";

interface VerifyBody {
  listing_id: string;
}

async function simulateExternalApi(): Promise<{ ok: boolean; raw: Record<string, unknown> }> {
  // TODO: replace with a real fetch() to the Car-Pass partner API.
  await new Promise((r) => setTimeout(r, 2000));
  return {
    ok: true,
    raw: { source: "stub", verified_at: new Date().toISOString() },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflight(req);
  const cors = buildCorsHeaders(req);

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
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Anon client just to validate the JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
    }
    const userId = userData.user.id;

    // Service-role client for owner check + writes (bypasses RLS so we can flip status)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = (await req.json().catch(() => null)) as VerifyBody | null;
    if (!body?.listing_id || typeof body.listing_id !== "string") {
      return jsonResponse(req, { error: "Missing listing_id" }, { status: 400 });
    }

    const { data: listing, error: lErr } = await admin
      .from("car_listings")
      .select("id, user_id, car_pass_status")
      .eq("id", body.listing_id)
      .maybeSingle();

    if (lErr) {
      console.error("listing fetch error", lErr);
      return jsonResponse(req, { error: "Internal error" }, { status: 500 });
    }
    if (!listing) {
      return jsonResponse(req, { error: "Listing not found" }, { status: 404 });
    }
    if (listing.user_id !== userId) {
      return jsonResponse(req, { error: "Forbidden" }, { status: 403 });
    }
    if (listing.car_pass_status === "pending") {
      return jsonResponse(req, { error: "Verification already in progress" }, { status: 409 });
    }

    // 1. Insert audit row
    const { data: reqRow, error: insErr } = await admin
      .from("car_pass_verification_requests")
      .insert({
        listing_id: listing.id,
        requested_by: userId,
        status: "pending",
      })
      .select("id")
      .single();

    if (insErr || !reqRow) {
      console.error("insert request failed", insErr);
      return jsonResponse(req, { error: "Could not create request" }, { status: 500 });
    }

    // 2. Flip listing → pending
    await admin
      .from("car_listings")
      .update({
        car_pass_status: "pending",
        car_pass_request_id: reqRow.id,
      })
      .eq("id", listing.id);

    // 3. Run external check (stubbed)
    let result: { ok: boolean; raw: Record<string, unknown> };
    try {
      result = await simulateExternalApi();
    } catch (e) {
      console.error("external api error", e);
      await admin
        .from("car_pass_verification_requests")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: (e as Error).message ?? "external_error",
        })
        .eq("id", reqRow.id);
      await admin
        .from("car_listings")
        .update({ car_pass_status: "rejected" })
        .eq("id", listing.id);

      return jsonResponse(req, { request_id: reqRow.id, status: "failed" }, { status: 502 });
    }

    // 4. Persist outcome
    const newStatus = result.ok ? "verified" : "rejected";
    await admin
      .from("car_pass_verification_requests")
      .update({
        status: result.ok ? "completed" : "failed",
        completed_at: new Date().toISOString(),
        api_response: result.raw,
      })
      .eq("id", reqRow.id);

    await admin
      .from("car_listings")
      .update({ car_pass_status: newStatus })
      .eq("id", listing.id);

    return jsonResponse(req, { request_id: reqRow.id, status: newStatus });
  } catch (err) {
    console.error("verify-car-pass error", err);
    return jsonResponse(req, { error: "Internal error" }, { status: 500 });
  }
});
