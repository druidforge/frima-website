import { getTranslations } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { services } from "@/lib/services";
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
      image: `${siteUrl}/opengraph-image`,
      logo: `${siteUrl}/octopus_silhouette_gradient.svg`,
      priceRange: "€€",
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
      areaServed: [
        { "@type": "Country", name: "Croatia" },
        { "@type": "Country", name: "Germany" },
        { "@type": "Country", name: "Austria" },
      ],
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
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
