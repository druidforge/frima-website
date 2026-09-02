import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalPage, type LegalSection } from "@/components/legal-page";
import { locales, type Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

const sectionKeys = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.privacy" });

  return {
    ...buildMetadata({
      title: t("title"),
      description: t("description"),
      href: "/privacy",
      locale,
    }),
    // Legal boilerplate has no business competing for search traffic, but it
    // must stay crawlable so the consent flow's links resolve.
    robots: { index: false, follow: true },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal.privacy");

  const vars = {
    legalName: site.legalName,
    street: site.address.street,
    postalCode: site.address.postalCode,
    city: site.address.city,
    oib: site.oib,
    vatId: site.vatId,
    email: site.email,
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
      intro={t("intro", vars)}
      sections={sections}
      seed={58}
      hue={[-28, -4]}
    />
  );
}
