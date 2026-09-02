import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * `'unsafe-inline'` on both `script-src` and `style-src` isn't a shortcut -
 * it's the actual constraint this site's architecture puts on the choice.
 *
 * Next's nonce-based CSP (its documented "strict" path) requires every page
 * to render dynamically per request - static generation, ISR and CDN caching
 * all get disabled site-wide, since a nonce can't be baked into a build-time
 * HTML file. Every route here is prerendered (`generateStaticParams` on all
 * of them); trading that away for this one header would be a real regression
 * for a marketing site with no data sensitive enough to need it.
 *
 * Even without nonces, two things on this site render real inline content
 * regardless: Next's own App Router embeds the serialised RSC/hydration
 * payload as an inline `<script>` in every page (framework-level, unrelated to
 * anything in this repo), and `motion` sets inline `style` attributes for a
 * component's initial/server-rendered frame before it takes over animation
 * via direct style-property writes (which CSP doesn't govern at all - only
 * the attribute form does). Both are why `'unsafe-inline'` is on script-src
 * and style-src here rather than a stricter default.
 *
 * What this still buys: `script-src`/`connect-src` are an explicit allowlist,
 * not "anything goes" - an XSS payload can run inline JS, but it can't load a
 * remote script from, or exfiltrate to, any origin outside this list. Paired
 * with `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and
 * `frame-ancestors` matching the existing `X-Frame-Options`, that's a real
 * reduction in attack surface even with the two inline exceptions.
 *
 * `isDev` gates two more exceptions, both dev-server-only: React uses `eval()`
 * in development to reconstruct server-side stack traces for its error
 * overlay - neither React nor Next.js call `eval()` in production, so
 * `'unsafe-eval'` is dropped there rather than left in by default. `ws:`/`wss:`
 * covers the HMR socket `next dev` opens back to itself; production is fully
 * static, so there's no such connection to allow.
 */
const isDev = process.env.NODE_ENV === "development";

/**
 * Mirrors `isIndexableDeployment` in `lib/site.ts` - duplicated rather than
 * imported because `next.config.ts` is loaded before the `@/` path alias
 * exists. Keep the two in step.
 */
const isIndexableDeployment =
  process.env.VERCEL_ENV !== "preview" &&
  process.env.VERCEL_ENV !== "development";
/**
 * Google Ads conversion tracking needs more origins than GA4 does, and gets
 * them per-directive rather than as one blanket allowance.
 *
 * gtag.js pulls its conversion module from `googleadservices.com`, then reports
 * the conversion through `google.com`, `google.<ccTLD>` (the visitor's local
 * Google domain - `.hr` and `.de` for two of the three locales here) and
 * `googleads.g.doubleclick.net`. Historically those pings were 1x1 images and
 * are now largely `fetch`, and gtag falls back between the two, so both
 * `img-src` and `connect-src` have to allow them or conversions are dropped
 * silently in whichever mode the browser picks.
 *
 * `frame-src` appears for the first time here: it was inheriting `default-src
 * 'self'`, which blocks the `td.doubleclick.net` iframe the tag uses to write
 * its cookies in browsers that still allow third-party storage.
 */
const googleAdsOrigins =
  "https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://www.google.hr https://www.google.de";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: ${googleAdsOrigins};
  font-src 'self';
  connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com ${googleAdsOrigins}${isDev ? " ws: wss:" : ""};
  frame-src 'self' https://td.doubleclick.net https://www.googletagmanager.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

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
            // The header carrying `preload` is itself inert - browsers only
            // enforce HSTS preloading from their own shipped static list, which
            // is populated by submitting to hstspreload.org, not by reading
            // this header off live traffic. That submission *is* the hard to
            // reverse step (removal takes months once it ships in a browser
            // release), so it stays a deliberate manual step for once HTTPS
            // has actually been confirmed solid in production - do not submit
            // the domain until then.
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: cspHeader },
          /**
           * Preview deployments only. `robots.txt` stops the crawl, but a URL
           * that was already discovered can stay indexed without one - this
           * header is what actually keeps a `*.vercel.app` copy out of, and
           * removes it from, the index. Never emitted in production.
           */
          ...(isIndexableDeployment
            ? []
            : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
