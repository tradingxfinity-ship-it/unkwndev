import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

let _client = null

function getClient() {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }
  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'x-application-name': 'unkwn-hero' } },
  })
  return _client
}

/**
 * SHA-256 the IP with a server-side salt so we can still detect repeat IPs
 * without storing actual addresses. Salt should be set in env; falls back
 * to a non-secret string so dev doesn't crash.
 */
function hashIp(ip) {
  if (!ip) return null
  const salt = process.env.IP_HASH_SALT || 'unkwn-default-salt-change-me'
  return crypto
    .createHash('sha256')
    .update(`${salt}:${ip}`)
    .digest('hex')
    .slice(0, 32)
}

/**
 * Insert a new subscriber. Returns:
 *   { ok: true, subscriber }        on success
 *   { ok: false, duplicate: true }  if email already exists
 *   { ok: false, error }            on any other failure
 */
export async function saveSubscriber({ email, source, userAgent, ip }) {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email,
        source: source || 'hero',
        status: 'active',
        user_agent: (userAgent || '').slice(0, 256) || null,
        ip_hash: hashIp(ip),
      })
      .select('id, email, source, status, created_at')
      .single()

    if (error) {
      // Postgres unique_violation
      if (error.code === '23505') return { ok: false, duplicate: true }
      return { ok: false, error }
    }
    return { ok: true, subscriber: data }
  } catch (err) {
    return { ok: false, error: err }
  }
}
