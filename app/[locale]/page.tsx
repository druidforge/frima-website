import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

import { CtaBand } from "@/components/cta-band";
import { Hero } from "@/components/home/hero";
import { Process } from "@/components/home/process";
import { ServicesStack } from "@/components/home/services-stack";
import { Stats } from "@/components/home/stats";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });

  return {
    ...buildMetadata({
      title: t("title"),
      description: t("description"),
      href: "/",
      locale,
    }),
    // The homepage owns the brand-first title rather than the "%s — OKTOPOD"
    // template every other page uses.
    title: `OKTOPOD — ${t("title")}`,
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ServicesStack />
      <Stats />
      <Process />
      <HomeCta />
    </>
  );
}

function HomeCta() {
  const t = useTranslations("home");
  return <CtaBand title={t("ctaTitle")} body={t("ctaBody")} />;
}
