import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "../_shared/smtp.ts";

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

interface Send2FARequest {
  userId: string;
  email: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email }: Send2FARequest = await req.json();

    if (!userId || !email) {
      throw new Error("Missing required fields");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Rate limit: max 3 codes per email per hour
    const { data: allowed } = await supabaseAdmin.rpc("check_rate_limit", {
      _key: `2fa:${email}`,
      _max_requests: 3,
      _window_seconds: 3600,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a cryptographically secure 6-digit code
    const codeArray = new Uint32Array(1);
    crypto.getRandomValues(codeArray);
    const code = String(100000 + (codeArray[0] % 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update profile with 2FA code
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        two_factor_code: code,
        two_factor_code_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw new Error("Failed to generate 2FA code");
    }

    // Send via SMTP (open source — no third-party email SaaS needed)
    await sendMail({
      to: email,
      subject: "Your NoMiRo Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7c3aed;">✨ NoMiRo</h1>
          <h2 style="color: #1F2937;">Your Verification Code</h2>
          <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); border-radius: 12px; padding: 30px; text-align: center; margin: 20px 0;">
            <p style="color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
          </div>
          <p style="color: #6B7280; text-align: center;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #6B7280; text-align: center; font-size: 14px; margin-top: 30px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
});
