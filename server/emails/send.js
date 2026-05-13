/**
 * Resend wrapper. Lazy-imports the SDK so the API endpoint doesn't crash at
 * cold-start when keys are missing — instead we just log and skip the send.
 *
 * Email failures must NEVER bubble up to the user's submit flow. The signup
 * itself is already persisted; the email is best-effort.
 */

import { confirmationEmail } from './confirmation.js'
import { adminNotifyEmail } from './adminNotify.js'

let _resend = null

async function getResend() {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  try {
    const { Resend } = await import('resend')
    _resend = new Resend(key)
    return _resend
  } catch (err) {
    console.error('[email] failed to load resend sdk', err)
    return null
  }
}

function fromAddress() {
  // Resend wants either "name <addr>" or a bare addr. Default to bare.
  return process.env.RESEND_FROM_EMAIL || 'UNKWN <onboarding@resend.dev>'
}

/**
 * Send the subscriber-facing confirmation. Returns {ok, id?} but errors are
 * swallowed and logged — never thrown.
 */
export async function sendConfirmationEmail({ email, siteName, siteUrl }) {
  const resend = await getResend()
  if (!resend) {
    console.warn('[email] skipping confirmation — RESEND_API_KEY missing')
    return { ok: false, skipped: true }
  }
  const { subject, html, text } = confirmationEmail({ email, siteName, siteUrl })
  try {
    const res = await resend.emails.send({
      from: fromAddress(),
      to: [email],
      subject,
      html,
      text,
    })
    if (res?.error) {
      console.error('[email] confirmation send error', res.error)
      return { ok: false, error: res.error }
    }
    return { ok: true, id: res?.data?.id }
  } catch (err) {
    console.error('[email] confirmation send threw', err)
    return { ok: false, error: err }
  }
}

/**
 * Notify the admin inbox. ADMIN_EMAIL may be a single addr or comma list.
 */
export async function sendAdminNotification({
  email,
  source,
  userAgent,
  ip,
  siteName,
  createdAt,
}) {
  const adminTo = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (adminTo.length === 0) {
    return { ok: false, skipped: true }
  }
  const resend = await getResend()
  if (!resend) {
    console.warn('[email] skipping admin notify — RESEND_API_KEY missing')
    return { ok: false, skipped: true }
  }
  const { subject, html, text } = adminNotifyEmail({
    email,
    source,
    userAgent,
    ip,
    siteName,
    createdAt,
  })
  try {
    const res = await resend.emails.send({
      from: fromAddress(),
      to: adminTo,
      subject,
      html,
      text,
    })
    if (res?.error) {
      console.error('[email] admin notify error', res.error)
      return { ok: false, error: res.error }
    }
    return { ok: true, id: res?.data?.id }
  } catch (err) {
    console.error('[email] admin notify threw', err)
    return { ok: false, error: err }
  }
}
