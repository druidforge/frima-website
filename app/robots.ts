import type { MetadataRoute } from "next";

import { isIndexableDeployment, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  /**
   * Preview deployments stay *crawlable* on purpose, and are kept out of the
   * index by the `X-Robots-Tag: noindex, nofollow` they send instead (see
   * `next.config.ts`).
   *
   * Disallowing them here would be self-defeating, for exactly the reason
   * spelled out for the legal pages below: a blocked URL is never fetched, so
   * the `noindex` is never read, and a preview URL that picked up an inbound
   * link can sit in the index indefinitely with no way to remove it. Allowing
   * the crawl is what lets the directive actually do its job.
   *
   * No `sitemap`/`host` line here either - a preview should not advertise the
   * production sitemap.
   */
  if (!isIndexableDeployment) {
    return {
      rules: [{ userAgent: "*", allow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Only the API surface is blocked. The legal pages carry `noindex`
        // instead of a Disallow on purpose: blocking the crawl would stop
        // Google from ever reading that tag, and a disallowed URL can still be
        // indexed bare from inbound links. Noindex needs a crawl to work.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
