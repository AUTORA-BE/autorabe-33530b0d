import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Strip newlines and control chars to defeat prompt injection */
function safe(input: unknown, max = 80): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/[\r\n\t`<>]/g, " ")
    .slice(0, max)
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const brand        = safe(body.brand, 40);
    const model        = safe(body.model, 40);
    const year         = safe(body.year, 4);
    const mileage      = safe(body.mileage, 10);
    const fuelType     = safe(body.fuel_type, 30);
    const transmission = safe(body.transmission, 20);
    const bodyType     = safe(body.body_type, 20);
    const color        = safe(body.color, 20);
    const power        = safe(body.power, 6);
    const euroNorm     = safe(body.euro_norm, 10);
    const ctValid      = body.ct_valid ? "CT valide" : "CT non précisé";
    const carPass      = body.car_pass_verified ? "Car-Pass disponible" : "";
    const maintenance  = body.maintenance_book_complete ? "Carnet d'entretien complet" : "";
    const features     = Array.isArray(body.features)
      ? body.features.slice(0, 10).map((f: unknown) => safe(f, 40)).join(", ")
      : "";

    const systemPrompt = `Tu es un expert en rédaction d'annonces automobiles pour le marché belge.
Tu rédiges des descriptions commerciales HONNÊTES, PRÉCISES et ENGAGEANTES.
Règles absolues :
- Maximum 4 phrases courtes (120 mots max)
- Mentionne uniquement les faits fournis — n'invente RIEN
- Sois factuel sur l'état : n'embellis pas excessivement
- Mets en avant les vrais points forts (Car-Pass, CT, entretien, équipements)
- Ton professionnel sans être froid, commercial sans être racoleur
- Rédige en français, à la 3e personne ("Ce véhicule…", "La voiture…")
- Ne commence PAS par "Je" ou "Nous"`;

    const userPrompt = `Rédige une description d'annonce pour ce véhicule :
Marque/Modèle : ${brand} ${model} (${year})
Kilométrage : ${mileage} km
Carburant : ${fuelType} | Boîte : ${transmission} | Carrosserie : ${bodyType}
Couleur : ${color} | Puissance : ${power} ch | Norme : ${euroNorm}
État : ${ctValid}${carPass ? " | " + carPass : ""}${maintenance ? " | " + maintenance : ""}
Équipements : ${features || "non précisés"}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI gateway non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "Crédits IA épuisés, contactez l'administrateur." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!response.ok) {
      const err = await response.text();
      console.error("AI gateway error:", err);
      return new Response(
        JSON.stringify({ error: "Erreur IA" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-description error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
