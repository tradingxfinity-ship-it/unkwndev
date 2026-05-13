/**
 * In-memory rate limiter — sliding window per IP.
 *
 * IMPORTANT: serverless functions cold-start, so this limiter resets when
 * an instance spins down. It's good enough to stop casual abuse on low/
 * medium traffic. For a hard production guarantee swap this module for a
 * Redis-backed limiter (Upstash works great with Vercel — see SETUP.md).
 */

const buckets = new Map()
const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 5
const HARD_CAP = 5000 // never let the map grow unbounded

/**
 * @param {string|null|undefined} key — typically an IP address
 * @returns {{ok: true} | {ok: false, retryAfter: number}}
 */
export function checkRateLimit(key) {
  if (!key) return { ok: true } // can't rate limit anonymous requests

  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS }
  }

  bucket.count++
  buckets.set(key, bucket)

  // periodic cleanup to keep map size bounded
  if (buckets.size > HARD_CAP) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k)
      if (buckets.size <= HARD_CAP / 2) break
    }
  }

  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return { ok: false, retryAfter }
  }

  return { ok: true }
}
