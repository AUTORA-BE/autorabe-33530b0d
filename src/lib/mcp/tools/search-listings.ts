import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const COLUMNS =
  "id, brand, model, year, price, mileage, fuel_type, transmission, body_type, power, co2, euro_norm, location, seller_type, car_pass_status, photos, created_at";

export default defineTool({
  name: "search_listings",
  title: "Rechercher des annonces",
  description:
    "Recherche des annonces de voitures d'occasion publiées sur AutoRA.be (marché belge). Filtres optionnels : marque, modèle, carburant, prix max, année min, kilométrage max, localisation.",
  inputSchema: {
    brand: z.string().optional().describe("Marque, ex. BMW"),
    model: z.string().optional().describe("Modèle, ex. Serie 3"),
    fuel_type: z.string().optional().describe("Carburant, ex. essence, diesel, electrique, hybride"),
    max_price: z.number().optional().describe("Prix maximum en euros"),
    min_year: z.number().optional().describe("Année de mise en circulation minimum"),
    max_mileage: z.number().optional().describe("Kilométrage maximum"),
    location: z.string().optional().describe("Ville ou région en Belgique"),
    limit: z.number().optional().describe("Nombre de résultats (défaut 20, max 50)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const limit = Math.min(Math.max(Math.trunc(input.limit ?? 20), 1), 50);

    let query = supabase
      .from("car_listings_public")
      .select(COLUMNS)
      .order("boost_rank", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (input.brand) query = query.ilike("brand", `%${input.brand}%`);
    if (input.model) query = query.ilike("model", `%${input.model}%`);
    if (input.fuel_type) query = query.ilike("fuel_type", `%${input.fuel_type}%`);
    if (input.location) query = query.ilike("location", `%${input.location}%`);
    if (typeof input.max_price === "number") query = query.lte("price", input.max_price);
    if (typeof input.min_year === "number") query = query.gte("year", input.min_year);
    if (typeof input.max_mileage === "number") query = query.lte("mileage", input.max_mileage);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const results = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify({ count: results.length, results }, null, 2) }],
      structuredContent: { count: results.length, results },
    };
  },
});
