import { createClient } from "https://esm.sh/@supabase/supabase-js@2";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { sendTemplateEmailLogged } from "../_shared/sendTemplateEmailLogged.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

interface VehiclePayload {
  id: string;
  brand: string;
  model: string;
  price: number;
  year: number;
  mileage: number;
  fuel_type: string;
  euro_norm: string | null;
  car_pass_verified: boolean | null;
  location: string | null;
  photos: string[] | null;
}

interface AlertFilters {
  brand?: string;
  model?: string;
  max_price?: number;
  min_year?: number;
  max_km?: number;
  fuel_types?: string[];
  lez_compatible?: boolean;
  carpass_verified?: boolean;
}

function calculateMatchScore(vehicle: VehiclePayload, filters: AlertFilters): number {
  let score = 0;
  let maxScore = 0;

  // Prix (30 points)
  maxScore += 30;
  if (!filters.max_price || vehicle.price <= filters.max_price) {
    score += 30;
  } else if (vehicle.price <= filters.max_price * 1.1) {
    score += 15;
  }

  // Marque (25 points)
  maxScore += 25;
  if (!filters.brand || vehicle.brand.toLowerCase() === filters.brand.toLowerCase()) {
    score += 25;
  }

  // Modèle (20 points bonus si spécifié)
  if (filters.model) {
    maxScore += 20;
    if (vehicle.model.toLowerCase().includes(filters.model.toLowerCase())) {
      score += 20;
    }
  }

  // Année (15 points)
  maxScore += 15;
  if (!filters.min_year || vehicle.year >= filters.min_year) {
    score += 15;
  }

  // Kilométrage (15 points)
  maxScore += 15;
  if (!filters.max_km || vehicle.mileage <= filters.max_km) {
    score += 15;
  }

  // Type de carburant (10 points)
  maxScore += 10;
  if (!filters.fuel_types?.length || filters.fuel_types.some(f => 
    vehicle.fuel_type.toLowerCase().includes(f.toLowerCase())
  )) {
    score += 10;
  }

  // LEZ compatible (10 points)
  if (filters.lez_compatible) {
    maxScore += 10;
    const lezNorms = ["euro 6", "euro 6d", "euro 6d-temp"];
    const isLez = vehicle.euro_norm && lezNorms.some(n => vehicle.euro_norm!.toLowerCase().includes(n));
    if (isLez || vehicle.fuel_type.toLowerCase().includes("electr")) {
      score += 10;
    }
  }

  // Car-Pass (5 points)
  if (filters.carpass_verified) {
    maxScore += 5;
    if (vehicle.car_pass_verified) {
      score += 5;
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/** Gabarit React Email enregistré dans `_shared/transactional-email-templates/registry.ts`. */
const TEMPLATE_NAME = "alert-match";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);

  try {
    // Validate that the caller is using the service_role key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Only allow service_role key (internal calls only)
    if (token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vehicle } = (await req.json()) as { vehicle: VehiclePayload };
    if (!vehicle?.id) {
      return new Response(JSON.stringify({ error: "Missing vehicle data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    // Validate that the vehicle actually exists in the database
    const { data: realVehicle, error: vehicleError } = await supabase
      .from("car_listings")
      .select("id")
      .eq("id", vehicle.id)
      .eq("status", "approved")
      .maybeSingle();

    if (vehicleError || !realVehicle) {
      return new Response(JSON.stringify({ error: "Vehicle not found or not approved" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("user_alerts")
      .select("*")
      .eq("active", true)
      .eq("frequency", "instant");

    if (alertsError) throw alertsError;
    if (!alerts?.length) {
      return new Response(JSON.stringify({ matched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")
      ? "https://auto-belgium.lovable.app"
      : "https://auto-belgium.lovable.app";

    let matchedCount = 0;

    for (const alert of alerts) {
      const score = calculateMatchScore(vehicle, alert.filters as AlertFilters);

      if (score < 60) continue;

      matchedCount++;

      // Record notification
      await supabase.from("alert_notifications").insert({
        alert_id: alert.id,
        car_listing_id: vehicle.id,
        match_score: score,
      });

      // Update alert stats
      await supabase
        .from("user_alerts")
        .update({
          last_sent_at: new Date().toISOString(),
          match_count: (alert.match_count || 0) + 1,
        })
        .eq("id", alert.id);

      // Send email if enabled — through the managed send path (verified sender,
      // server-side suppression, retries and email_send_log journalling).
      if (alert.notify_email) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          // No manual `suppressed_emails` lookup here: suppression is enforced
          // server-side by the managed API, which reports it as
          // { sent: false, reason: 'recipient_suppressed' } — a normal outcome.
          const result = await sendTemplateEmailLogged(TEMPLATE_NAME, userEmail, {
            idempotencyKey: `${TEMPLATE_NAME}-${alert.id}-${vehicle.id}`,
            templateData: {
              alertName: alert.name,
              brand: vehicle.brand,
              model: vehicle.model,
              price: vehicle.price,
              priceFormatted: new Intl.NumberFormat("fr-BE", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(vehicle.price),
              mileageFormatted: new Intl.NumberFormat("fr-BE").format(vehicle.mileage),
              year: vehicle.year,
              fuelType: vehicle.fuel_type,
              carPassVerified: vehicle.car_pass_verified ?? false,
              location: vehicle.location ?? "",
              imageUrl: vehicle.photos?.[0] ?? "",
              vehicleUrl: `${siteUrl}/car/${vehicle.id}`,
              score,
            },
          });

          if (result.sent) {
            console.log(`[match-new-vehicle] alert email sent for alert ${alert.id}`);
          } else if (result.reason === "recipient_suppressed") {
            // Expected: the recipient opted out. Not an error.
            console.log(`[match-new-vehicle] recipient suppressed for alert ${alert.id}`);
          } else {
            // A real send failure must never pass unnoticed again.
            await logOpsAlert(
              "match-new-vehicle",
              `Envoi de l'alerte échoué (gabarit ${TEMPLATE_NAME})`,
              {
                severity: "error",
                context: {
                  template: TEMPLATE_NAME,
                  alert_id: alert.id,
                  listing_id: vehicle.id,
                  reason: result.reason,
                },
              },
            );
          }
        }
      }
    }

    return new Response(JSON.stringify({ matched: matchedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("match-new-vehicle error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
