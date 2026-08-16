import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { locales, type Locale } from "@/i18n/routing";
import { getServiceBySlug, services } from "@/lib/services";
import { GenericOgCard, ServiceOgCard } from "@/lib/og-card";
import { ogSize } from "@/lib/og";

export const alt = "Druid Forge — digital studio, Split";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    services.map((service) => ({ locale, slug: service.slug[locale] })),
  );
}

/**
 * Without this file, every service page fell back to the same generic
 * homepage card - "Web Applications" and "Business Cards" previewed
 * identically when shared. This gives each service its own photography, and
 * (see `about/opengraph-image.tsx`) is what actually makes `og:image` appear
 * at all on a route whose `generateMetadata` authors its own `openGraph`.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const service = getServiceBySlug(slug, locale);
  const t = await getTranslations({ locale, namespace: "services.items" });
  const ts = await getTranslations({ locale, namespace: "services" });

  if (!service) {
    // Unreachable via generateStaticParams, but generateMetadata on the page
    // itself falls back to `{}` for an unknown slug rather than 404ing here,
    // so this keeps the image route total over the same input.
    return new ImageResponse(
      <GenericOgCard
        eyebrow={ts("indexTitle")}
        title="Druid Forge"
        subtitle=""
      />,
      size,
    );
  }

  // `service.image` is `/services/website-design.avif` - the basename is all
  // `serviceOgImageDataUri` (in `lib/og.ts`) needs to find the pre-cropped
  // card photo.
  const imageBasename = service.image
    ?.split("/")
    .pop()
    ?.replace(/\.avif$/, "");

  if (!imageBasename) {
    return new ImageResponse(
      <GenericOgCard
        eyebrow={ts("indexTitle")}
        title={t(`${service.id}.name`)}
        subtitle={t(`${service.id}.short`)}
      />,
      size,
    );
  }

  return new ImageResponse(
    <ServiceOgCard
      eyebrow={ts("indexTitle")}
      title={t(`${service.id}.name`)}
      subtitle={t(`${service.id}.short`)}
      from={`${ts("fromLabel")} ${service.from}`}
      imageBasename={imageBasename}
    />,
    size,
  );
}
