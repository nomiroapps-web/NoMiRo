/**
 * Shared SMTP mailer for Supabase Edge Functions (Deno runtime).
 *
 * Works with any SMTP server: Gmail, Postfix, Brevo, Mailgun SMTP, Proton, Mailpit (local testing).
 * Uses npm:nodemailer via Deno's npm compatibility layer.
 *
 * Required Supabase secrets:
 *   SMTP_HOST     e.g. smtp.gmail.com | smtp.brevo.com | localhost
 *   SMTP_PORT     e.g. 587 (STARTTLS) | 465 (TLS) | 25
 *   SMTP_USER     your smtp username / email
 *   SMTP_PASS     your smtp password / app password
 *   SMTP_FROM     e.g. NoMiRo <noreply@nomiro.app>
 *   SMTP_SECURE   "true" for port 465, omit/false for STARTTLS (587)
 */

import nodemailer from 'npm:nodemailer@6.9.14'

export interface MailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

function getTransport() {
  const host = Deno.env.get('SMTP_HOST')
  const port = parseInt(Deno.env.get('SMTP_PORT') ?? '587', 10)
  const user = Deno.env.get('SMTP_USER')
  const pass = Deno.env.get('SMTP_PASS')
  const secure = Deno.env.get('SMTP_SECURE') === 'true'

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS)')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(host === 'localhost' || host === '127.0.0.1'
      ? { tls: { rejectUnauthorized: false } }
      : {}),
  })
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const transport = getTransport()
  const from = opts.from ?? Deno.env.get('SMTP_FROM') ?? `NoMiRo <noreply@nomiro.app>`
  await transport.sendMail({
    from,
    to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })
}
