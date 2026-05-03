import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  image?: string;
}

// Web Push utilities
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function generateVAPIDHeaders(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { alg: "ES256", typ: "JWT" };
  const payload = { aud: audience, exp: expiration, sub: "mailto:autoracontact@gmail.com" };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privateKeyBytes = urlBase64ToUint8Array(vapidPrivateKey);
  const publicKeyBytes = urlBase64ToUint8Array(vapidPublicKey);

  const jwkPrivate = {
    kty: "EC",
    crv: "P-256",
    x: btoa(String.fromCharCode(...publicKeyBytes.slice(1, 33))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"),
    y: btoa(String.fromCharCode(...publicKeyBytes.slice(33, 65))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"),
    d: btoa(String.fromCharCode(...privateKeyBytes)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"),
  };

  const key = await crypto.subtle.importKey("jwk", jwkPrivate, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsignedToken));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return {
    authorization: `vapid t=${unsignedToken}.${signatureB64}, k=${vapidPublicKey}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const payloadString = JSON.stringify(payload);
    const headers = await generateVAPIDHeaders(subscription.endpoint, vapidPublicKey, vapidPrivateKey);
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        TTL: "86400",
        Authorization: headers.authorization,
        "Crypto-Key": headers.cryptoKey,
      },
      body: payloadString,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Push notification failed:", response.status, errorText);
      if (response.status === 404 || response.status === 410) return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── AUTH GUARD ──
    // Two valid auth modes:
    //  1. Service role token (internal server-to-server calls)
    //  2. End-user JWT, but ONLY allowed to push to themselves (userId === auth.uid())
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isServiceRole = serviceRoleKey && token === serviceRoleKey;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
    );

    const { userId, title, body, icon, badge, tag, data, image }: PushPayload = await req.json();
    if (!userId || !title || !body) {
      return new Response(JSON.stringify({ error: "userId, title, and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isServiceRole) {
      // Verify the JWT and ensure caller can only push to their own user_id
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const callerId = claimsData.claims.sub;
      if (callerId !== userId) {
        // Not allowed to push to other users
        return new Response(JSON.stringify({ error: "Forbidden: cannot push to other users" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check if user has push notifications enabled
    const { data: preferences } = await supabaseAdmin
      .from("user_preferences")
      .select("push_notifications_enabled")
      .eq("user_id", userId)
      .single();

    if (preferences && !preferences.push_notifications_enabled) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subError) throw new Error("Failed to fetch subscriptions");
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_subscriptions" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPublicKey || !vapidPrivateKey) throw new Error("VAPID keys not configured");

    // Cap title/body length to prevent abuse
    const safeTitle = String(title).slice(0, 120);
    const safeBody = String(body).slice(0, 300);

    const payload = {
      title: safeTitle,
      body: safeBody,
      icon: icon || "/favicon.png",
      badge: badge || "/favicon.png",
      tag: tag || "autora-notification",
      data: data || { url: "/messages" },
      image,
    };

    let successCount = 0;
    const expiredSubscriptions: string[] = [];

    for (const sub of subscriptions) {
      const success = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        vapidPublicKey,
        vapidPrivateKey
      );
      if (success) successCount++;
      else expiredSubscriptions.push(sub.id);
    }

    if (expiredSubscriptions.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", expiredSubscriptions);
    }

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: subscriptions.length, cleaned: expiredSubscriptions.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
