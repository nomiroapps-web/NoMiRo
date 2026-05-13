import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendMail } from "../_shared/smtp.ts";

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
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

interface InviteRequest {
  email: string;
  familyId: string;
  familyName: string;
  inviterName: string;
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { email, familyId, familyName, inviterName }: InviteRequest = await req.json();

    if (!email || !familyId || !familyName) {
      throw new Error("Missing required fields");
    }

    // Rate limit: max 5 invites per family per day
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      _key: `invite:${familyId}`,
      _max_requests: 5,
      _window_seconds: 86400,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many invitations sent today. Please try again tomorrow." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is family owner
    const { data: isOwner } = await supabase.rpc("is_family_owner", {
      _family_id: familyId,
      _user_id: user.id,
    });

    if (!isOwner) {
      throw new Error("Only family owner can send invitations");
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from("family_invitations")
      .select("id")
      .eq("family_id", familyId)
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      throw new Error("An invitation has already been sent to this email");
    }

    // Create invitation
    const { data: invitation, error: insertError } = await supabase
      .from("family_invitations")
      .insert({
        family_id: familyId,
        email: email.toLowerCase(),
        invited_by: user.id,
      })
      .select("token")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to create invitation");
    }

    // Send invitation email
    const appOrigin = req.headers.get("origin") || Deno.env.get("APP_URL") || "https://nomiro.app";
    const inviteUrl = `${appOrigin}/accept-invite?token=${invitation.token}`;

    await sendMail({
      to: email,
      subject: `You're invited to join ${familyName} on NoMiRo!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 48px;">✨</span>
                <h1 style="color: #18181b; margin: 16px 0 8px;">You're Invited!</h1>
              </div>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join the <strong>${familyName}</strong> family on NoMiRo!
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                As a parent or guardian, you'll be able to:
              </p>
              
              <ul style="color: #52525b; font-size: 16px; line-height: 1.8;">
                <li>Assign and manage chores for the kids</li>
                <li>Approve completed tasks and award points</li>
                <li>Set up rewards and manage redemptions</li>
              </ul>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #a1a1aa; font-size: 14px; text-align: center;">
                This invitation expires in 24 hours.
              </p>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Invitation email sent to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-parent-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
});
