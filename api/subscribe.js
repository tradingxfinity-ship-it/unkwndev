/**
 * POST /api/subscribe
 *
 * Vercel Serverless Function. Receives an email, validates, rate-limits,
 * stores in Supabase, fires confirmation + admin emails best-effort.
 *
 * Response shape (always JSON):
 *   200 { ok: true }                                  — saved (and probably emailed)
 *   200 { ok: true, duplicate: true }                 — already on the list
 *   400 { ok: false, error: 'INVALID_EMAIL' }
 *   400 { ok: false, error: 'BAD_REQUEST' }
 *   403 { ok: false, error: 'FORBIDDEN' }             — honeypot tripped
 *   405 { ok: false, error: 'METHOD_NOT_ALLOWED' }
 *   429 { ok: false, error: 'RATE_LIMITED', retryAfter }
 *   500 { ok: false, error: 'STORAGE_FAILED' }
 *
 * We intentionally return 200 for honeypot in some configurations, but
 * here we 403 to make legitimate clients fail loudly during testing.
 */

import { validateEmail, sanitizeTag } from '../server/validation.js'
import { checkRateLimit } from '../server/rateLimit.js'
import { saveSubscriber } from '../server/supabase.js'
import {
  sendConfirmationEmail,
  sendAdminNotification,
} from '../server/emails/send.js'

const SITE_NAME = process.env.SITE_NAME || 'UNKWN'
const SITE_URL = process.env.SITE_URL || ''

function setCors(req, res) {
  const origin = req.headers?.origin || ''
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // If no allowlist configured, fall back to "*" so local/dev works.
  // In production set ALLOWED_ORIGINS to your real domain(s).
  let allowOrigin = '*'
  if (allowed.length > 0) {
    allowOrigin = allowed.includes(origin) ? origin : allowed[0]
  }

  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

function clientIp(req) {
  const xff = req.headers?.['x-forwarded-for']
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim()
  }
  return (
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    null
  )
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return null
    }
  }
  // Manual stream read fallback (rare in Vercel — body parser usually fires).
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 10_000) {
        req.destroy()
        resolve(null)
      }
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(null)
      }
    })
    req.on('error', () => resolve(null))
  })
}

function serializeResult(r) {
  if (!r) return null
  if (r.status === 'fulfilled') {
    const v = r.value || {}
    return {
      status: 'fulfilled',
      ok: v.ok ?? null,
      skipped: v.skipped ?? null,
      id: v.id ?? null,
      error: v.error ? String(v.error?.message || v.error?.name || v.error) : null,
    }
  }
  return {
    status: 'rejected',
    reason: String(r.reason?.message || r.reason || 'unknown'),
  }
}

export default async function handler(req, res) {
  setCors(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
    return
  }

  const ip = clientIp(req)

  // Rate limit BEFORE parsing — cheap defense vs. flood.
  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter))
    res
      .status(429)
      .json({ ok: false, error: 'RATE_LIMITED', retryAfter: rl.retryAfter })
    return
  }

  const body = await readJsonBody(req)
  if (!body || typeof body !== 'object') {
    res.status(400).json({ ok: false, error: 'BAD_REQUEST' })
    return
  }

  // Honeypot — bots love filling every field. Real users can't see it.
  // Field name kept generic ("company") to look attractive to scrapers.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    res.status(403).json({ ok: false, error: 'FORBIDDEN' })
    return
  }

  const v = validateEmail(body.email)
  if (!v.ok) {
    res.status(400).json({ ok: false, error: 'INVALID_EMAIL', reason: v.error })
    return
  }

  const source = sanitizeTag(body.source, 32) || 'hero'
  const userAgent = String(req.headers?.['user-agent'] || '').slice(0, 256)

  const saved = await saveSubscriber({
    email: v.value,
    source,
    userAgent,
    ip,
  })

  if (!saved.ok) {
    if (saved.duplicate) {
      // Duplicates aren't a user-visible error — we want the UX to look
      // like success either way (idempotent).
      res.status(200).json({ ok: true, duplicate: true })
      return
    }
    console.error('[subscribe] storage failure', saved.error)
    res.status(500).json({ ok: false, error: 'STORAGE_FAILED' })
    return
  }

  // Await the email sends so Vercel's runtime doesn't kill the function
  // before they complete. Adds ~1s to the response, but the frontend
  // progress animation already covers that gap. Errors from email are
  // swallowed inside the send helpers — they never throw to here, so
  // signup success is still reported even if email fails.
  const emailResults = await Promise.allSettled([
    sendConfirmationEmail({
      email: v.value,
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
    }),
    sendAdminNotification({
      email: v.value,
      source,
      userAgent,
      ip,
      siteName: SITE_NAME,
      createdAt: saved.subscriber?.created_at || new Date().toISOString(),
    }),
  ])

  // TEMP DEBUG: surface what happened during email send so the frontend
  // can show it. Remove once email is working in production.
  const debug = {
    resendKeyPresent: !!process.env.RESEND_API_KEY,
    resendKeyPrefix: (process.env.RESEND_API_KEY || '').slice(0, 6),
    resendFromEmail: process.env.RESEND_FROM_EMAIL || null,
    adminEmail: process.env.ADMIN_EMAIL || null,
    confirmation: serializeResult(emailResults[0]),
    adminNotify: serializeResult(emailResults[1]),
  }

  res.status(200).json({ ok: true, _debug: debug })
}
