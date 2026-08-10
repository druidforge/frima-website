import { defineRouting } from "next-intl/routing";

export const locales = ["hr", "en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "hr";

/**
 * Localized path segments. Search engines index each market separately, so the
 * URL itself is translated rather than reusing English slugs under a prefix.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  // Always prefix, including the default locale, so /hr /en /de are all real
  // canonical URLs with no duplicate-content root competing against them.
  localePrefix: "always",
  localeDetection: true,
  pathnames: {
    "/": "/",
    "/services": {
      hr: "/usluge",
      en: "/services",
      de: "/leistungen",
    },
    "/services/[slug]": {
      hr: "/usluge/[slug]",
      en: "/services/[slug]",
      de: "/leistungen/[slug]",
    },
    "/about": {
      hr: "/o-nama",
      en: "/about",
      de: "/ueber-uns",
    },
    "/contact": {
      hr: "/kontakt",
      en: "/contact",
      de: "/kontakt",
    },
    "/privacy": {
      hr: "/privatnost",
      en: "/privacy",
      de: "/datenschutz",
    },
    "/cookies": {
      hr: "/kolacici",
      en: "/cookie-policy",
      de: "/cookie-richtlinie",
    },
  },
});

export type AppPathnames = keyof typeof routing.pathnames;
