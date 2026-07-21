import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Flight encoding adds transport overhead to the 10 MB raw backup cap.
      bodySizeLimit: '16mb',
    },
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.openligadb.de' },
    ],
  },
  async headers() {
    // Next.js emits inline bootstrap/style data. A per-request nonce would be
    // the next tightening step; all external resource classes are restricted
    // explicitly in the meantime instead of falling back to an open policy.
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      `connect-src 'self'${process.env.NODE_ENV === 'development' ? ' ws:' : ''}`,
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src 'none'",
      "img-src 'self' data: blob: https:",
      "manifest-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "worker-src 'self' blob:",
    ].join('; ')

    const headers = [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=()' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ]

    if (process.env.NODE_ENV === 'production') {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      })
    }

    return [{ source: '/(.*)', headers }]
  },
};

export default nextConfig;
