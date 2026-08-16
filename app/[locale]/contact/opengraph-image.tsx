import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { locales, type Locale } from "@/i18n/routing";
import { GenericOgCard } from "@/lib/og-card";
import { ogSize } from "@/lib/og";

export const alt = "Druid Forge — digital studio, Split";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** See `about/opengraph-image.tsx` for why this file needs to exist at all. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const tn = await getTranslations({ locale, namespace: "nav" });
  const t = await getTranslations({ locale, namespace: "meta.contact" });

  return new ImageResponse(
    <GenericOgCard
      eyebrow={tn("contact")}
      title={t("title")}
      subtitle={t("description")}
    />,
    size,
  );
}
