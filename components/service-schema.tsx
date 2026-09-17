import { getTranslations } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/metadata";
import { serviceNodeId } from "@/lib/service-schema";
import {
  entryPricing,
  priceAmount,
  timelineRange,
  type Service,
} from "@/lib/services";
import { siteUrl } from "@/lib/site";

/**
 * The `Service` entity for one service page, plus its `FAQPage`.
 *
 * Why this exists: the organisation graph in `structured-data.tsx` is
 * identical on all thirty URLs, and until this component every service page
 * carried nothing of its own beyond a breadcrumb - six pages describing six
 * different offerings, emitting the same six-item `OfferCatalog` between them
 * and no entity anchored to the page actually being read.
 *
 * The `@id` is the join. It matches the one the catalogue now puts on this
 * service's `itemOffered`, so the enumeration on every page and the detailed
 * node on this one are read as a single entity rather than as look-alikes.
 * That merge also means the short catalogue description and the fuller one
 * here both land on it; two `description` values is legal and the specific one
 * wins, which is a fair trade for having the entity be one thing.
 *
 * Absent on purpose: `monthly` and `storeFee`. Expressing recurring cost
 * honestly needs `UnitPriceSpecification` with a billing period, and getting
 * that subtly wrong would assert a price structure this studio does not sell.
 * Both figures are stated plainly in the page copy, which is where a client
 * reads them anyway.
 */
export async function ServiceSchema({
  locale,
  service,
  slug,
}: {
  locale: Locale;
  service: Service;
  slug: string;
}) {
  const ti = await getTranslations({ locale, namespace: "services.items" });

  const url = absoluteUrl(
    getPathname({
      href: { pathname: "/services/[slug]", params: { slug } },
      locale,
    }),
  );

  /**
   * One offer per way of buying: a single figure, or one per tier so the
   * 40 € template and the 180 € custom invitation are not flattened into a
   * single misleading price.
   */
  /**
   * Paired up explicitly rather than sniffed off the pricing object with an
   * `"id" in pricing` check: for an untiered service `entryPricing` hands back
   * the service itself, which carries an `id` of its own, so that test passes
   * for every service and names the offer after a tier that does not exist.
   */
  const options = service.tiers
    ? service.tiers.map((tier) => ({ pricing: tier, tierId: tier.id }))
    : [{ pricing: entryPricing(service), tierId: undefined }];

  const offers = options.map(({ pricing, tierId }) => {
    const lead = timelineRange(pricing.timeline);

    return {
      "@type": "Offer",
      ...(tierId
        ? { name: ti(`${service.id}.tiers.${tierId}.name`) }
        : {}),
      url,
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "EUR",
        // `minPrice`, never `price`: every figure on this site is an entry
        // point ("from 700 €"), and `price` would assert it as the total.
        minPrice: priceAmount(pricing.from),
      },
      deliveryLeadTime: {
        "@type": "QuantitativeValue",
        minValue: lead.min,
        maxValue: lead.max,
        // UN/CEFACT codes, which is what schema.org's `unitCode` expects.
        unitCode: pricing.timelineUnit === "days" ? "DAY" : "WEE",
      },
    };
  });

  const faq = ti.raw(`${service.id}.faq`) as { q: string; a: string }[];

  const graph = [
    {
      "@type": "Service",
      "@id": serviceNodeId(url),
      name: ti(`${service.id}.name`),
      description: ti(`${service.id}.description`),
      // The organisation node carries the address, geo and `areaServed`, so
      // this points at it rather than restating any of them.
      provider: { "@id": `${siteUrl}/#organization` },
      url,
      // Concatenated, not run through `absoluteUrl`: that appends the trailing
      // slash every *page* needs, and a file path with an extension is the one
      // thing `trailingSlash` leaves alone. `/…​.avif/` would be a 404.
      ...(service.image ? { image: `${siteUrl}${service.image}` } : {}),
      offers,
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      // Not here for a rich result - Google restricted those to government
      // and health sites in 2023. It is here because the questions and their
      // answers are on the page, and this states which text answers which
      // question for anything reading the page as data rather than as layout.
      mainEntity: faq.map((entry) => ({
        "@type": "Question",
        name: entry.q,
        acceptedAnswer: { "@type": "Answer", text: entry.a },
      })),
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
