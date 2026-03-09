import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Reset expired boosts back to 'none'
    const { data, error } = await supabase
      .from("car_listings")
      .update({ boost_level: "none", boost_expires_at: null })
      .not("boost_level", "eq", "none")
      .not("boost_expires_at", "is", null)
      .lt("boost_expires_at", new Date().toISOString())
      .select("id, brand, model");

    if (error) throw error;

    const count = data?.length ?? 0;
    console.log(`Expired ${count} boost(s)`, data);

    return new Response(
      JSON.stringify({ success: true, expired: count, listings: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error expiring boosts:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
