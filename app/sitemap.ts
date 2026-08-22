import type { MetadataRoute } from "next";

import { getPathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { services } from "@/lib/services";
import { absoluteUrl } from "@/lib/metadata";

type Href = Parameters<typeof getPathname>[0]["href"];

/**
 * Every URL is listed once per locale, and each entry carries the full
 * `alternates.languages` set. That is what tells Google the three language
 * versions are one page in three languages rather than three thin pages.
 *
 * Deliberately absent:
 *
 * - The legal pages (privacy, cookies, impressum). They are `noindex`, so
 *   listing them would send Google two contradicting instructions.
 * - `lastModified`. There is no per-page modification data in this project,
 *   and stamping every entry with the build time would claim that every page
 *   changed on every deploy. Google discounts a `lastmod` it finds
 *   untrustworthy, so an absent one is worth more than a fabricated one.
 * - `changeFrequency`, for the same reason: it would be a guess, and Google
 *   ignores it regardless.
 *
 * `priority` stays, because relative importance is something this site can
 * honestly assert - the homepage really does matter more than the imprint.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  /**
   * `hrefFor` resolves the route per locale rather than taking one `href`,
   * because a service page's slug is itself translated
   * (`/usluge/web-aplikacije` vs `/leistungen/web-anwendungen`), so the two
   * cannot share a single definition.
   */
  const add = (hrefFor: (locale: Locale) => Href, priority: number) => {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = absoluteUrl(
        getPathname({ href: hrefFor(locale), locale }),
      );
    }
    // Mirrors `buildAlternates()` in `lib/metadata.ts`, so the hreflang set
    // in the sitemap and the one in the page's <head> agree exactly.
    languages["x-default"] = languages.hr;

    for (const locale of locales) {
      entries.push({
        url: languages[locale],
        priority,
        alternates: { languages },
      });
    }
  };

  add(() => "/", 1);
  add(() => "/services", 0.9);
  add(() => "/about", 0.7);
  add(() => "/contact", 0.7);

  for (const service of services) {
    add(
      (locale) => ({
        pathname: "/services/[slug]",
        params: { slug: service.slug[locale] },
      }),
      0.85,
    );
  }

  return entries;
}
