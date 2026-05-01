import type { NextConfig } from 'next';

/**
 * next.config.ts
 *
 * Key setting — serverExternalPackages:
 *
 * The IBM Cloudant SDK (@ibm-cloud/cloudant) and ibm-cloud-sdk-core use
 * Node.js built-ins (fs, http, https, stream, etc.) that cannot be bundled
 * by Next.js's Webpack/Turbopack for the server runtime.
 *
 * Listing them as external packages tells Next.js to require() them at
 * runtime from node_modules instead of bundling them — preventing errors
 * like "Module not found: Can't resolve 'fs'" during build.
 *
 * @google/generative-ai is also listed as it uses Node.js fetch internals
 * that behave better when treated as external on the server.
 */
const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@ibm-cloud/cloudant',
    '@google/generative-ai',
  ],

  /* ── Security headers ──────────────────────────────────────────────────── */
  async headers() {
    return [
      {
        /* Apply to all routes */
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        /* Extra headers for API routes — prevent caching of auth responses */
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
