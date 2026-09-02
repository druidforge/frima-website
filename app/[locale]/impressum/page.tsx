import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalPage, type LegalSection } from "@/components/legal-page";
import { locales, type Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

const sectionKeys = ["s1", "s2", "s3", "s4", "s5"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.impressum" });

  return {
    ...buildMetadata({
      title: t("title"),
      description: t("description"),
      href: "/impressum",
      locale,
    }),
    robots: { index: false, follow: true },
  };
}

/**
 * The disclosures TMG §5 (Germany) and the Croatian e-commerce act both
 * expect from a commercial site: who operates it, how to reach them, and
 * where they are registered. Croatia and Germany ask for largely the same
 * categories of fact, so one page in three languages covers both rather
 * than needing a separate German-only page.
 */
export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal.impressum");

  const vars = {
    legalName: site.legalName,
    owner: site.owner,
    street: site.address.street,
    postalCode: site.address.postalCode,
    city: site.address.city,
    email: site.email,
    phone: site.phone,
    oib: site.oib,
    vatId: site.vatId,
    mbo: site.registration.mbo,
    craftLicenseNumber: site.registration.craftLicenseNumber,
    authority: site.registration.authority,
  };

  const sections: LegalSection[] = sectionKeys.map((key) => ({
    id: key,
    title: t(`${key}Title`),
    body: <p>{t(`${key}Body`, vars)}</p>,
  }));

  return (
    <LegalPage
      eyebrow={t("title")}
      title={t("title")}
      intro={t("intro")}
      sections={sections}
      seed={41}
      hue={[-16, 18]}
    />
  );
}
