/**
 * Simple in-memory per-IP rate limiter.
 * Resets per window; suitable for single-instance deployments (Vercel serverless: each
 * cold start gets a fresh Map, which is fine for abuse deterrence).
 */

interface BucketEntry {
  count: number
  windowStart: number
}

const buckets = new Map<string, BucketEntry>()

/**
 * Returns true if the request is within the allowed rate.
 *
 * @param ip       The requester's IP address (or any string key).
 * @param limit    Max requests allowed per window (default 20).
 * @param windowMs Window duration in ms (default 60 000 ms = 1 min).
 */
export function checkRateLimit(
  ip: string,
  limit = 20,
  windowMs = 60_000,
): boolean {
  const now = Date.now()
  const entry = buckets.get(ip)

  if (!entry || now - entry.windowStart > windowMs) {
    buckets.set(ip, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

/** Extract best-effort IP from a Next.js request. */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return (req.headers as Headers).get('x-real-ip') ?? 'unknown'
}
