/**
 * Input validation. Server-side authoritative checks — the frontend can lie.
 */

// RFC-5322-ish — pragmatic. Rejects obvious garbage, accepts common formats.
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

// Common throwaway providers. Block at the policy layer if you don't want them.
const DISPOSABLE_DOMAINS = new Set([
  '0-mail.com',
  '10minutemail.com',
  '20minutemail.com',
  'discard.email',
  'fakeinbox.com',
  'getairmail.com',
  'guerrillamail.com',
  'mailinator.com',
  'maildrop.cc',
  'mintemail.com',
  'mohmal.com',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
])

/**
 * Validate and normalize an email address.
 * @param {unknown} input
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
export function validateEmail(input) {
  if (typeof input !== 'string') return { ok: false, error: 'NOT_A_STRING' }
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return { ok: false, error: 'EMPTY' }
  if (trimmed.length > 254) return { ok: false, error: 'TOO_LONG' }
  if (!EMAIL_RE.test(trimmed)) return { ok: false, error: 'BAD_FORMAT' }

  const domain = trimmed.split('@')[1]
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, error: 'DISPOSABLE' }

  return { ok: true, value: trimmed }
}

/**
 * Sanitize a short tag-like string (e.g. submission `source`).
 * Strips control chars, caps length, drops anything if invalid.
 */
export function sanitizeTag(input, maxLen = 64) {
  if (typeof input !== 'string') return null
  // strip control characters and anything outside printable ASCII
  // eslint-disable-next-line no-control-regex
  const cleaned = input.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen)
  return cleaned || null
}
