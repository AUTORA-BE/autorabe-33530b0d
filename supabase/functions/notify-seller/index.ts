import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifySellerRequest {
  conversationId: string;
  messageContent: string;
  senderName?: string;
  carBrand?: string;
  carModel?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messageContent, senderName, carBrand, carModel }: NotifySellerRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation details
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("seller_id, buyer_id, car_brand, car_model")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error("Conversation not found");
    }

    // Check if seller has email notifications enabled
    const { data: preferences } = await supabaseAdmin
      .from("user_preferences")
      .select("email_notifications_enabled")
      .eq("user_id", conversation.seller_id)
      .single();

    if (preferences && !preferences.email_notifications_enabled) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get seller's email
    const { data: sellerData, error: sellerError } = await supabaseAdmin.auth.admin.getUserById(
      conversation.seller_id
    );

    if (sellerError || !sellerData?.user?.email) {
      throw new Error("Seller email not found");
    }

    const sellerEmail = sellerData.user.email;
    const vehicleName = (conversation.car_brand && conversation.car_model)
      ? `${conversation.car_brand} ${conversation.car_model}`
      : "votre véhicule";

    // Send via transactional email system
    await supabaseAdmin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "seller-notification",
        recipientEmail: sellerEmail,
        idempotencyKey: `seller-notify-${conversationId}-${Date.now()}`,
        templateData: {
          vehicleName,
          messagePreview: messageContent,
          senderName: senderName || "Un acheteur",
        },
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-seller function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
