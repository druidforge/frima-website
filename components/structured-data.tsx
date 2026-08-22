import { getTranslations } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { priceRange, services } from "@/lib/services";
import { absoluteUrl } from "@/lib/metadata";
import { site, siteUrl } from "@/lib/site";

/**
 * JSON-LD for the organisation and its service catalogue.
 *
 * `ProfessionalService` (a LocalBusiness subtype) is what earns the Split
 * address, opening hours and geo a place in local results; the `Service` nodes
 * give each offering an entity of its own so the service pages can rank on
 * their own terms rather than only through the homepage.
 */
export async function StructuredData({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "services.items" });
  const tm = await getTranslations({ locale, namespace: "meta.home" });

  const businessId = `${siteUrl}/#organization`;

  const graph = [
    {
      "@type": "ProfessionalService",
      "@id": businessId,
      name: site.name,
      legalName: site.legalName,
      description: tm("description"),
      url: absoluteUrl(`/${locale}`),
      email: site.email,
      telephone: site.phone,
      foundingDate: site.founded,
      vatID: site.oib,
      // Through `absoluteUrl` so this lands on the trailing-slash form the
      // site actually serves. Built by hand it pointed at `/opengraph-image`,
      // which 308s - structured data should reference the final URL, not a
      // redirect to it. The logo is exempt: paths with a file extension are
      // not rewritten by `trailingSlash`, and serve 200 as-is.
      image: absoluteUrl("/opengraph-image"),
      logo: `${siteUrl}/druid-forge.svg`,
      // Derived from the services' own entry prices - see `lib/services.ts`.
      priceRange,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        postalCode: site.address.postalCode,
        addressCountry: site.address.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: site.geo.lat,
        longitude: site.geo.lng,
      },
      // Croatia and Germany stay named explicitly - they're the two actual
      // priority markets, worth the regional-relevance signal a bare
      // "Worldwide" can't give. Austria is dropped rather than swapped for
      // a fourth country: the business takes clients anywhere (meetings are
      // remote outside Split), so a fixed short list of countries was never
      // the accurate shape - the last entry says that directly instead of
      // us silently maintaining an ever-growing enumeration.
      areaServed: [
        { "@type": "Country", name: "Croatia" },
        { "@type": "Country", name: "Germany" },
        { "@type": "Place", name: "Worldwide" },
      ],
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        // Mon-Fri 08:00-16:00, closed weekends - matching the Google Business
        // Profile exactly, so the two sources cannot disagree.
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "16:00",
      },
      sameAs: Object.values(site.social),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: site.name,
        itemListElement: services.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: t(`${service.id}.name`),
            description: t(`${service.id}.short`),
            url: absoluteUrl(
              getPathname({
                href: {
                  pathname: "/services/[slug]",
                  params: { slug: service.slug[locale] },
                },
                locale,
              }),
            ),
          },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: absoluteUrl(`/${locale}`),
      name: site.name,
      inLanguage: locales,
      publisher: { "@id": businessId },
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Content is fully authored here - no user input reaches this string.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}
