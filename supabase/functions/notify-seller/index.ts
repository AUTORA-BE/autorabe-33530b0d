import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messageContent, senderName, carBrand, carModel }: NotifySellerRequest = await req.json();

    console.log("Notify seller request received:", { conversationId, carBrand, carModel });

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get conversation details
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("seller_id, buyer_id, car_brand, car_model")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      console.error("Error fetching conversation:", convError);
      throw new Error("Conversation not found");
    }

    // Check if seller has email notifications enabled
    const { data: preferences } = await supabaseAdmin
      .from("user_preferences")
      .select("email_notifications_enabled")
      .eq("user_id", conversation.seller_id)
      .single();

    // If preferences exist and notifications are disabled, skip sending
    if (preferences && !preferences.email_notifications_enabled) {
      console.log("Email notifications disabled for seller, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get seller's email from auth.users
    const { data: sellerData, error: sellerError } = await supabaseAdmin.auth.admin.getUserById(
      conversation.seller_id
    );

    if (sellerError || !sellerData?.user?.email) {
      console.error("Error fetching seller:", sellerError);
      throw new Error("Seller email not found");
    }

    const sellerEmail = sellerData.user.email;
    const vehicleName = conversation.car_brand && conversation.car_model 
      ? `${conversation.car_brand} ${conversation.car_model}` 
      : "votre véhicule";

    console.log("Sending email to seller:", sellerEmail);

    const emailResponse = await resend.emails.send({
      from: "AutoRa <noreply@autora.be>",
      to: [sellerEmail],
      subject: `Nouveau message concernant ${vehicleName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">🚗 AutoRa</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1a1a2e; margin-top: 0;">Nouveau message reçu</h2>
              
              <p>Bonjour,</p>
              
              <p>Vous avez reçu un nouveau message concernant <strong>${vehicleName}</strong>.</p>
              
              <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <p style="margin: 0; color: #555; font-style: italic;">"${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}"</p>
              </div>
              
              <p>Connectez-vous à votre compte AutoRa pour répondre à ce message.</p>
              
              <a href="https://autora.be/messages" 
                 style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; margin-top: 10px;">
                Voir mes messages
              </a>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                Cet email a été envoyé automatiquement par AutoRa.<br>
                Vous recevez cet email car vous avez une annonce active sur notre plateforme.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
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
};

serve(handler);
