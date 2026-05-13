/**
 * send-push-notification
 *
 * Delivers Web Push (VAPID) notifications using the open web-push protocol.
 * No proprietary push SaaS. Works with all browsers that support the Push API.
 *
 * Required Supabase secrets:
 *   VAPID_PUBLIC_KEY   – base64url-encoded VAPID public key
 *   VAPID_PRIVATE_KEY  – base64url-encoded VAPID private key
 *   VAPID_SUBJECT      – mailto: or https: contact URL  e.g. mailto:admin@nomiro.app
 *
 * Generate keys once:
 *   npx web-push generate-vapid-keys
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const ALLOWED_ORIGIN_ENV = Deno.env.get('ALLOWED_ORIGINS') ?? '';
const allowedOrigins = [
  'https://nomiro.app',
  'https://www.nomiro.app',
  ...ALLOWED_ORIGIN_ENV.split(',').map((o: string) => o.trim()).filter(Boolean),
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject    = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@nomiro.app";

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId, title, body, url, icon }: PushPayload = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 20 notifications per user per hour
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      _key: `push:${userId}`,
      _max_requests: 20,
      _window_seconds: 3600,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many notifications. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all push subscriptions for this user
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      // Still create an in-app notification as fallback
      await supabase.from("notifications").insert({
        user_id: userId, type: "reminder", title, message: body,
      });
      return new Response(
        JSON.stringify({ message: "No push subscriptions; in-app notification created", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pushData = JSON.stringify({ title, body, url: url || "/", icon: icon || "/favicon.ico" });
    let successCount = 0;
    const expiredEndpoints: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await webpush.sendNotification(pushSubscription, pushData);
          successCount++;
        } catch (err: any) {
          console.error("Push send failed:", sub.endpoint, err?.statusCode, err?.message);
          // 404/410 = subscription expired — clean up
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Remove expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .in("endpoint", expiredEndpoints);
      console.log(`Removed ${expiredEndpoints.length} expired subscriptions for user ${userId}`);
    }

    // Also create in-app notification as fallback
    await supabase.from("notifications").insert({
      user_id: userId, type: "reminder", title, message: body,
    });

    return new Response(
      JSON.stringify({ message: "Push notifications sent", sent: successCount, expired_cleaned: expiredEndpoints.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
