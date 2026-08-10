import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
