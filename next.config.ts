import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  /**
   * Lets the dev server be reached from another device on the LAN - a phone
   * or a second machine hitting this Mac's local IP - without the HMR socket
   * getting blocked as cross-origin. Production is unaffected: this only
   * gates `next dev`.
   */
  allowedDevOrigins: ["192.168.1.236"],
  /**
   * Lets a verification build write somewhere other than `.next`.
   *
   * `next dev` keeps its chunk graph in `.next/dev`, and an already-open tab
   * holds references into it. Running `next build` - or worse, clearing `.next`
   * - while the dev server is live swaps that graph underneath the page, and
   * every later hot update fails with "No link element found for chunk".
   *
   * Nothing changes for normal use. Set NEXT_DIST_DIR to build in isolation:
   *   NEXT_DIST_DIR=.next-verify npm run build
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    /**
     * How long a prefetched route stays usable in the client router cache.
     *
     * The default is five minutes, after which a prefetch is discarded and the
     * next click on that link pays for a fresh fetch - so a visitor who reads
     * for a while loses everything `RoutePrefetcher` warmed and navigation goes
     * back to feeling slow exactly when they have settled in.
     *
     * Every route here is prerendered at build time, so a cached payload cannot
     * go stale within a session: the only thing that changes it is a deploy, and
     * a deploy changes the build ID, which invalidates these entries anyway.
     * An hour simply means one warm-up serves a whole visit.
     */
    staleTimes: {
      static: 3600,
    },
  },
  images: {
    /**
     * The service photography is mastered as AVIF. Without this, the optimiser
     * only ever emits WebP and every one of those files is re-encoded into a
     * larger format than it arrived in.
     */
    formats: ["image/avif", "image/webp"],
  },
  // One canonical shape for every URL. Next 308s the slashless form, and all
  // metadata is generated through `absoluteUrl` so canonicals, hreflang and the
  // sitemap agree with what is actually served.
  trailingSlash: true,
  async headers() {
    return [
      {
        /**
         * Content-addressed and effectively immutable: the octopus mark and the
         * service photography only ever change by being replaced with a new
         * file. Next already sends `immutable` for /_next/static, but files
         * served straight from /public get no caching header at all.
         */
        source: "/:path*.(svg|avif|webp|jpg|jpeg|png|ico|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
