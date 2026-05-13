/**
 * auth-email-hook
 *
 * Supabase auth email hook — renders React Email templates and enqueues them
 * for delivery via the process-email-queue dispatcher.
 *
 * Replaces @lovable.dev/email-js and @lovable.dev/webhooks-js with native
 * HMAC-SHA256 webhook verification using Deno's built-in crypto API.
 *
 * Required secrets (set via `supabase secrets set`):
 *   EMAIL_WEBHOOK_SECRET   – shared secret for HMAC-SHA256 signature verification
 *   SUPABASE_URL           – injected automatically
 *   SUPABASE_SERVICE_ROLE_KEY – injected automatically
 */

import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-nomiro-signature, x-nomiro-timestamp',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = Deno.env.get('SITE_NAME') ?? 'nomiro'
const SENDER_DOMAIN = Deno.env.get('EMAIL_SENDER_DOMAIN') ?? 'nomiro.app'
const ROOT_DOMAIN = Deno.env.get('APP_DOMAIN') ?? 'nomiro.app'
const FROM_DOMAIN = SENDER_DOMAIN

// ── HMAC-SHA256 webhook verification ────────────────────────────────────────

async function verifyHmacSignature(
  secret: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const message = encoder.encode(`${timestamp}.${body}`)
  const computed = await crypto.subtle.sign('HMAC', key, message)
  const computedHex = Array.from(new Uint8Array(computed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time compare
  if (computedHex.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < computedHex.length; i++) {
    diff |= computedHex.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

// ── Preview handler ──────────────────────────────────────────────────────────

async function handlePreview(req: Request): Promise<Response> {
  const previewCors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }
  if (req.method === 'OPTIONS') return new Response(null, { headers: previewCors })

  const secret = Deno.env.get('EMAIL_WEBHOOK_SECRET')
  const authHeader = req.headers.get('Authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...previewCors, 'Content-Type': 'application/json' },
    })
  }

  const { type } = await req.json()
  const EmailTemplate = EMAIL_TEMPLATES[type]
  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCors, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: 'user@example.test',
    confirmationUrl: `https://${ROOT_DOMAIN}`,
    token: '123456',
    email: 'user@example.test',
    newEmail: 'new@example.test',
  }

  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))
  return new Response(html, {
    status: 200,
    headers: { ...previewCors, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// ── Webhook handler ──────────────────────────────────────────────────────────

async function handleWebhook(req: Request): Promise<Response> {
  const secret = Deno.env.get('EMAIL_WEBHOOK_SECRET')
  if (!secret) {
    console.error('EMAIL_WEBHOOK_SECRET not configured')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const body = await req.text()
  const signature = req.headers.get('x-nomiro-signature') ?? ''
  const timestamp = req.headers.get('x-nomiro-timestamp') ?? ''

  // Reject stale requests (5-minute window)
  const tsMs = parseInt(timestamp, 10)
  if (isNaN(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    return new Response(JSON.stringify({ error: 'Stale or missing timestamp' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const valid = await verifyHmacSignature(secret, signature, timestamp, body)
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailType = payload?.data?.action_type ?? payload?.type
  console.log('Received auth event', { emailType, email: payload?.data?.email })

  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    console.error('Unknown email type', { emailType })
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: payload.data.email,
    confirmationUrl: payload.data.url,
    token: payload.data.token,
    email: payload.data.email,
    newEmail: payload.data.new_email,
  }

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const messageId = crypto.randomUUID()
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: payload.data.email,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'auth_emails',
    payload: {
      message_id: messageId,
      to: payload.data.email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: EMAIL_SUBJECTS[emailType] || 'Notification',
      html,
      text,
      purpose: 'transactional',
      label: emailType,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue auth email', { error: enqueueError, emailType })
    return new Response(JSON.stringify({ error: 'Failed to enqueue email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, queued: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const url = new URL(req.url)
  if (url.pathname.endsWith('/preview')) return handlePreview(req)
  try {
    return await handleWebhook(req)
  } catch (error) {
    console.error('Webhook handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
