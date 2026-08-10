import type { Metadata } from "next";

import { getPathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

type Href = Parameters<typeof getPathname>[0]["href"];

/**
 * Absolute URL for a route, in the site's canonical trailing-slash form.
 *
 * `trailingSlash: true` in next.config means every page is served at a path
 * ending in `/`, and requests without one are 308'd there. Metadata is built
 * from `getPathname`, which does not know about that setting, so without this
 * every canonical and hreflang would point at a URL that immediately redirects
 * - which is precisely the signal that stops Google consolidating the three
 * language versions into one cluster.
 */
export function absoluteUrl(path: string) {
  const normalised = path.endsWith("/") ? path : `${path}/`;
  return `${siteUrl}${normalised}`;
}

/**
 * Builds canonical + hreflang alternates for one logical page.
 *
 * Every locale gets a self-referencing canonical and a full sibling set, which
 * is what Google requires before it will treat /hr, /en and /de as one cluster
 * rather than three competing pages. `x-default` points at the Croatian entry,
 * since that is the home market.
 */
export function buildAlternates(href: Href, locale: Locale) {
  const languages: Record<string, string> = {};

  for (const alt of locales) {
    languages[alt] = absoluteUrl(getPathname({ href, locale: alt }));
  }
  languages["x-default"] = absoluteUrl(getPathname({ href, locale: "hr" }));

  return {
    canonical: absoluteUrl(getPathname({ href, locale })),
    languages,
  };
}

const ogLocale: Record<Locale, string> = {
  hr: "hr_HR",
  en: "en_US",
  de: "de_DE",
};

export function buildMetadata({
  title,
  description,
  href,
  locale,
}: {
  title: string;
  description: string;
  href: Href;
  locale: Locale;
}): Metadata {
  const alternates = buildAlternates(href, locale);

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      title,
      description,
      url: alternates.canonical,
      siteName: "Druid Forge",
      locale: ogLocale[locale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => ogLocale[l]),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
