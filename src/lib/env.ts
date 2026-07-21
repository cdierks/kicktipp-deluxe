import 'server-only'

const PLACEHOLDER_SECRET = /^(?:change|generate|replace|your)[-_ ]/i

function requireSecret(name: 'NEXTAUTH_SECRET' | 'CRON_SECRET') {
  const value = process.env[name]?.trim()
  if (!value || Buffer.byteLength(value, 'utf8') < 32 || PLACEHOLDER_SECRET.test(value)) {
    throw new Error(`${name} must be a non-placeholder secret of at least 32 UTF-8 bytes`)
  }
  return value
}

function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim()
  if (!value) throw new Error('DATABASE_URL is required')

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('DATABASE_URL must be a valid MySQL URL')
  }
  if (
    url.protocol !== 'mysql:'
    || !url.hostname
    || !url.username
    || url.pathname === '/'
    || !url.pathname
  ) {
    throw new Error('DATABASE_URL must include a MySQL host, user, and database')
  }
  return value
}

function isPrivateNetworkHost(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized === '::1') {
    return true
  }
  if (/^(?:fc|fd|fe8|fe9|fea|feb)[0-9a-f:]*$/i.test(normalized)) return true

  const octets = normalized.split('.').map(Number)
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }
  return octets[0] === 10
    || octets[0] === 127
    || (octets[0] === 169 && octets[1] === 254)
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168)
}

function validateNextAuthUrl() {
  const value = process.env.NEXTAUTH_URL?.trim()
  if (!value) {
    if (process.env.NODE_ENV === 'production') throw new Error('NEXTAUTH_URL is required in production')
    return undefined
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('NEXTAUTH_URL must be an absolute URL')
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error('NEXTAUTH_URL must be an HTTP(S) origin')
  }
  // A local standalone instance may intentionally serve a private LAN without
  // TLS. Public production origins still fail closed unless they use HTTPS.
  if (
    process.env.NODE_ENV === 'production'
    && url.protocol !== 'https:'
    && !isPrivateNetworkHost(url.hostname)
  ) {
    throw new Error('NEXTAUTH_URL must use HTTPS for a public production host')
  }
  return url.origin
}

/** Validated once per server process; values never cross the client boundary. */
export const serverEnv = Object.freeze({
  DATABASE_URL: requireDatabaseUrl(),
  NEXTAUTH_SECRET: requireSecret('NEXTAUTH_SECRET'),
  NEXTAUTH_URL: validateNextAuthUrl(),
  CRON_SECRET: requireSecret('CRON_SECRET'),
})
