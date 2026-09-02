import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_favorites",
  title: "Mes favoris",
  description:
    "Liste les véhicules enregistrés dans le garage (favoris) de l'utilisateur connecté sur AutoRA.be.",
  inputSchema: {
    limit: z.number().optional().describe("Nombre de résultats (défaut 20, max 50)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const max = Math.min(Math.max(Math.trunc(limit ?? 20), 1), 50);

    const { data: favorites, error } = await supabase
      .from("favorites")
      .select("listing_id, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(max);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const ids = (favorites ?? []).map((f) => f.listing_id).filter(Boolean);
    let listings: unknown[] = [];
    if (ids.length > 0) {
      const { data, error: listErr } = await supabase
        .from("car_listings_public")
        .select("id, brand, model, year, price, mileage, fuel_type, location, photos")
        .in("id", ids);
      if (listErr) return { content: [{ type: "text", text: listErr.message }], isError: true };
      listings = data ?? [];
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ count: listings.length, favorites: listings }, null, 2) }],
      structuredContent: { count: listings.length, favorites: listings },
    };
  },
});
