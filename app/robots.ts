import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
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
