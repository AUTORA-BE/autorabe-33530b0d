import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_listing",
  title: "Détail d'une annonce",
  description:
    "Récupère la fiche complète d'une annonce AutoRA.be à partir de son identifiant (specs, prix, Car-Pass, localisation, photos).",
  inputSchema: { id: z.string().describe("Identifiant UUID de l'annonce") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("car_listings_public")
      .select(
        "id, brand, model, year, price, mileage, fuel_type, transmission, body_type, doors, color, power, puissance_cv, co2, co2_cycle, fuel_consumption, euro_norm, mma, features, description, location, seller_type, car_pass_status, car_pass_date, ct_valid, maintenance_book_complete, photos, created_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Annonce introuvable." }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { listing: data },
    };
  },
});
