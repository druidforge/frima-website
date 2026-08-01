import type { MetadataRoute } from "next";

import { getPathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { services } from "@/lib/services";
import { absoluteUrl } from "@/lib/metadata";

type Entry = MetadataRoute.Sitemap[number];

/**
 * Every URL is listed once per locale, and each entry carries the full
 * `alternates.languages` set. That is what tells Google the three language
 * versions are one page in three languages rather than three thin pages.
 *
 * The legal pages are deliberately absent - they are `noindex`, so listing them
 * would send mixed signals.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: Entry[] = [];

  const add = (
    href: Parameters<typeof getPathname>[0]["href"],
    priority: number,
    changeFrequency: Entry["changeFrequency"],
  ) => {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = absoluteUrl(getPathname({ href, locale }));
    }

    for (const locale of locales) {
      entries.push({
        url: languages[locale],
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }
  };

  add("/", 1, "monthly");
  add("/services", 0.9, "monthly");
  add("/about", 0.7, "yearly");
  add("/contact", 0.7, "yearly");

  for (const service of services) {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = absoluteUrl(
        getPathname({
          href: {
            pathname: "/services/[slug]",
            params: { slug: service.slug[locale as Locale] },
          },
          locale,
        }),
      );
    }
    for (const locale of locales) {
      entries.push({
        url: languages[locale],
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.85,
        alternates: { languages },
      });
    }
  }

  return entries;
}
