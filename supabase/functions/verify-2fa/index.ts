import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configure your production domains via ALLOWED_ORIGINS env var (comma-separated)
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
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

interface Verify2FARequest {
  userId: string;
  code: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, code }: Verify2FARequest = await req.json();

    if (!userId || !code) {
      throw new Error("Missing required fields");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Rate limit: max 5 attempts per user per 10 minutes
    const { data: allowed } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: `verify2fa:${userId}`,
      _max_requests: 5,
      _window_seconds: 600,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many attempts. Please wait and try again." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get profile with 2FA code
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("two_factor_code, two_factor_code_expires_at")
      .eq("user_id", userId)
      .single();

    if (fetchError || !profile) {
      throw new Error("Profile not found");
    }

    // Verify code
    if (profile.two_factor_code !== code) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid code" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check expiration
    if (new Date(profile.two_factor_code_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Code expired" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Clear the code after successful verification
    await supabaseAdmin
      .from("profiles")
      .update({
        two_factor_code: null,
        two_factor_code_expires_at: null,
      })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-2fa:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
});
