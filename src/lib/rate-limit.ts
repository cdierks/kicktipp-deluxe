import 'server-only'

type RateBucket = { count: number; resetAt: number }

const MAX_BUCKETS = 5_000
const globalRateLimits = globalThis as typeof globalThis & {
  kicktippRateLimits?: Map<string, RateBucket>
}
const buckets = globalRateLimits.kicktippRateLimits ?? new Map<string, RateBucket>()

if (process.env.NODE_ENV !== 'production') {
  globalRateLimits.kicktippRateLimits = buckets
}

/**
 * Bounded in-memory limiter for the single-process standalone deployment.
 * The reverse proxy remains the outer DoS boundary; this layer slows repeated
 * credential work and bcrypt amplification inside the application process.
 */
export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey)
      }
      if (buckets.size >= MAX_BUCKETS) {
        const oldestKey = buckets.keys().next().value
        if (oldestKey) buckets.delete(oldestKey)
      }
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (current.count >= limit) return false
  current.count += 1
  return true
}

export function normalizeRequestIp(value: string | null | undefined) {
  const addresses = value?.split(',').map((entry) => entry.trim()).filter(Boolean) ?? []
  // Only the rightmost forwarded value is controlled by the nearest trusted
  // proxy. Deployments should prefer an overwritten X-Real-IP header.
  const candidate = addresses.at(-1)
  return candidate && /^[0-9a-f:.]{3,64}$/i.test(candidate) ? candidate : 'unknown'
}
