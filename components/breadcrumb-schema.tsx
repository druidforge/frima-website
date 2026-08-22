import { getTranslations } from "next-intl/server";

import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/metadata";

/**
 * `BreadcrumbList` for the one genuinely nested route on this site: a service
 * detail page sits under the services index, which sits under the homepage.
 * Nothing else here is more than one level deep, so nothing else gets one.
 *
 * Emitted as its own JSON-LD block rather than folded into the `@graph` in
 * `structured-data.tsx`: that graph describes the business and the site as
 * entities and is identical on every page, whereas this is per-page. Keeping
 * them separate means the shared graph never has to vary by route.
 *
 * Every `item` is an absolute, canonical, locale-correct URL built through the
 * same `getPathname`/`absoluteUrl` pair the canonical tags use, so the trail
 * points at the same URLs the sitemap and hreflang do - including each
 * locale's own translated slugs.
 */
export async function ServiceBreadcrumbSchema({
  locale,
  serviceId,
  slug,
}: {
  locale: Locale;
  serviceId: string;
  slug: string;
}) {
  const tn = await getTranslations({ locale, namespace: "nav" });
  const ts = await getTranslations({ locale, namespace: "services" });
  const ti = await getTranslations({ locale, namespace: "services.items" });

  const trail = [
    { name: tn("home"), url: absoluteUrl(getPathname({ href: "/", locale })) },
    {
      name: ts("indexTitle"),
      url: absoluteUrl(getPathname({ href: "/services", locale })),
    },
    {
      name: ti(`${serviceId}.name`),
      url: absoluteUrl(
        getPathname({
          href: { pathname: "/services/[slug]", params: { slug } },
          locale,
        }),
      ),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Content is fully authored here - no user input reaches this string.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map((step, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: step.name,
            item: step.url,
          })),
        }),
      }}
    />
  );
}
