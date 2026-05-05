import { createClient } from "https://esm.sh/@supabase/supabase-js@2";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

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

function generateEmailHTML(alertName: string, vehicle: VehiclePayload, score: number, siteUrl: string): string {
  const priceFormatted = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(vehicle.price);
  const mileageFormatted = new Intl.NumberFormat("fr-BE").format(vehicle.mileage);
  const imageUrl = vehicle.photos?.[0] || "";
  const vehicleUrl = `${siteUrl}/car/${vehicle.id}`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#0d9488;padding:24px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:24px;">🚗 AutoRA.be</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">Nouvelle annonce pour "${alertName}"</p>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 16px 16px;">
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
      <span style="font-size:32px;font-weight:bold;color:#0d9488;">${score}%</span>
      <p style="margin:4px 0 0;color:#0f766e;font-size:14px;">Correspondance avec vos critères</p>
    </div>
    ${imageUrl ? `<img src="${imageUrl}" alt="${vehicle.brand} ${vehicle.model}" style="width:100%;border-radius:12px;margin-bottom:16px;max-height:300px;object-fit:cover;" />` : ""}
    <h2 style="margin:0 0 4px;font-size:20px;color:#18181b;">${vehicle.brand} ${vehicle.model}</h2>
    <p style="font-size:24px;font-weight:bold;color:#0d9488;margin:0 0 12px;">${priceFormatted}</p>
    <p style="color:#71717a;font-size:14px;margin:0 0 20px;">
      📅 ${vehicle.year} &bull; 🛣️ ${mileageFormatted} km &bull; ⛽ ${vehicle.fuel_type}
      ${vehicle.car_pass_verified ? " &bull; ✅ Car-Pass" : ""}
      ${vehicle.location ? ` &bull; 📍 ${vehicle.location}` : ""}
    </p>
    <a href="${vehicleUrl}" style="display:block;background:#0d9488;color:white;text-decoration:none;padding:14px 24px;border-radius:12px;text-align:center;font-weight:600;font-size:16px;">
      Voir l'annonce →
    </a>
    <p style="color:#a1a1aa;font-size:12px;text-align:center;margin:20px 0 0;">
      💡 Les bonnes affaires partent vite ! Contactez le vendeur rapidement.
    </p>
  </div>
  <p style="color:#a1a1aa;font-size:11px;text-align:center;margin:16px 0 0;">
    Vous recevez cet email car vous avez créé une alerte sur AutoRA.be
  </p>
</div>
</body></html>`;
}

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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
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

      // Send email if enabled
      if (alert.notify_email && resendApiKey) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          try {
            // Skip suppressed recipients (GDPR opt-out compliance)
            const { data: suppressed } = await supabase
              .from("suppressed_emails")
              .select("id")
              .eq("email", userEmail.toLowerCase())
              .maybeSingle();
            if (suppressed) {
              console.log(`Skipping suppressed recipient: ${userEmail}`);
              continue;
            }

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "AutoRA <onboarding@resend.dev>",
                to: userEmail,
                subject: `🚗 Nouveau : ${vehicle.brand} ${vehicle.model} à ${new Intl.NumberFormat("fr-BE").format(vehicle.price)}€`,
                html: generateEmailHTML(alert.name, vehicle, score, siteUrl),
              }),
            });
          } catch (emailError) {
            console.error("Email send error:", emailError);
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
