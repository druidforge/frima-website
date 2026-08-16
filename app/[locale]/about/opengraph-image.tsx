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

/**
 * Without this file, the route fell back to the homepage's own card - see
 * the sibling `page.tsx`'s `generateMetadata`, which builds its `openGraph`
 * object by hand. A route that authors its own `openGraph` metadata does not
 * inherit an ancestor segment's file-convention image; it needs one of its
 * own at the same segment, which is what this file is for.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const tn = await getTranslations({ locale, namespace: "nav" });
  const t = await getTranslations({ locale, namespace: "meta.about" });

  return new ImageResponse(
    <GenericOgCard
      eyebrow={tn("about")}
      title={t("title")}
      subtitle={t("description")}
    />,
    size,
  );
}
