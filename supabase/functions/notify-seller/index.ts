import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifySellerRequest {
  conversationId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth required: only conversation participants can trigger ──
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const callerId = claimsData.claims.sub;

    const { conversationId }: NotifySellerRequest = await req.json();
    if (!conversationId) {
      return new Response(JSON.stringify({ error: "conversationId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get conversation details + verify caller is a participant
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("seller_id, buyer_id, car_brand, car_model")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (callerId !== conversation.buyer_id && callerId !== conversation.seller_id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── Lookup the latest message server-side (don't trust caller content) ──
    const { data: lastMsg } = await supabaseAdmin
      .from("messages")
      .select("content, sender_id")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastMsg) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_message" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Determine recipient: notify the OTHER participant (not the sender)
    const recipientId = lastMsg.sender_id === conversation.seller_id ? conversation.buyer_id : conversation.seller_id;

    // Rate limit per recipient (anti-spam)
    const { data: rlAllowed, error: rlError } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: `message_send:${recipientId}`,
      _max_attempts: 30,
      _window_seconds: 3600,
    });
    if (rlError) {
      console.warn("[notify-seller] Rate limit check failed, allowing:", rlError);
    } else if (rlAllowed === false) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "rate_limit" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if recipient has email notifications enabled
    const { data: preferences } = await supabaseAdmin
      .from("user_preferences")
      .select("email_notifications_enabled")
      .eq("user_id", recipientId)
      .single();

    if (preferences && !preferences.email_notifications_enabled) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get recipient's email
    const { data: recipientData, error: recipientError } = await supabaseAdmin.auth.admin.getUserById(recipientId);
    if (recipientError || !recipientData?.user?.email) {
      throw new Error("Recipient email not found");
    }

    // Get sender's display name
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("user_id", lastMsg.sender_id)
      .single();
    const senderName = senderProfile?.display_name || "Un acheteur";

    const vehicleName = (conversation.car_brand && conversation.car_model)
      ? `${conversation.car_brand} ${conversation.car_model}`
      : "votre véhicule";

    // Cap message preview length
    const messagePreview = String(lastMsg.content).slice(0, 300);

    await supabaseAdmin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "seller-notification",
        recipientEmail: recipientData.user.email,
        idempotencyKey: `seller-notify-${conversationId}-${Date.now()}`,
        templateData: { vehicleName, messagePreview, senderName },
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-seller function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
