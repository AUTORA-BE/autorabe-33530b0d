import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_listings",
  title: "Mes annonces",
  description:
    "Liste les annonces publiées par l'utilisateur connecté sur AutoRA.be, avec leur statut de modération (approved, pending, rejected, sold).",
  inputSchema: {
    status: z.string().optional().describe("Filtre de statut : approved, pending, rejected ou sold"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("car_listings")
      .select("id, brand, model, year, price, mileage, status, car_pass_status, location, created_at, updated_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(50);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const results = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify({ count: results.length, results }, null, 2) }],
      structuredContent: { count: results.length, results },
    };
  },
});
