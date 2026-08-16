import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { CtaBand } from "@/components/cta-band";
import { PageHeader } from "@/components/page-header";
import { ServicesShowcase } from "@/components/services-showcase";
import { locales, type Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.services" });

  return buildMetadata({
    title: t("title"),
    description: t("description"),
    href: "/services",
    locale,
  });
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ServicesHeader />
      <ServicesGrid locale={locale} />
      <ServicesCta />
    </>
  );
}

function ServicesHeader() {
  const t = useTranslations("services");
  return (
    <PageHeader
      eyebrow={t("indexTitle")}
      title={t("indexHeadline")}
      lead={t("indexLead")}
      seed={43}
      hue={[-14, 16]}
    />
  );
}

function ServicesGrid({ locale }: { locale: Locale }) {
  return (
    // `PageHeader` contributes pb-16 / md:pb-24, so pt-12 brings the space above
    // the panels to 7rem / 9rem - matching the air left below them.
    <section className="pt-12 pb-28 md:pb-36">
      <div className="shell">
        <ServicesShowcase locale={locale} />
      </div>
    </section>
  );
}

function ServicesCta() {
  const t = useTranslations("services");
  return <CtaBand title={t("ctaTitle")} body={t("ctaBody")} />;
}
