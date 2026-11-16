import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LegalPage, type LegalSection } from "@/components/legal-page";
import { locales, type Locale } from "@/i18n/routing";
import { apps, getAppBySlug } from "@/lib/apps";
import { buildMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

type Params = { locale: Locale; app: string };

/** Sections every app policy has, in order (texts under `legal.apps.<id>`). */
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
  "s10",
  "s11",
] as const;

// Only the apps in lib/apps.ts exist; any other slug is a 404, never rendered on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    apps.map((app) => ({ locale, app: app.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, app: slug } = await params;
  const app = getAppBySlug(slug);
  if (!app) return {};
  const t = await getTranslations({ locale, namespace: "meta.appPrivacy" });

  return {
    ...buildMetadata({
      title: t("title", { app: app.name }),
      description: t("description", { app: app.name }),
      href: { pathname: "/privacy/[app]", params: { app: app.slug } },
      locale,
    }),
    // Same as the site's own legal pages: crawlable (so this tag is actually
    // read) but never indexed. These pages exist for the app stores and the
    // in-app link, which is also why they are not in the sitemap.
    robots: { index: false, follow: true },
  };
}

export default async function AppPrivacyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, app: slug } = await params;
  const app = getAppBySlug(slug);
  if (!app) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(`legal.apps.${app.id}`);

  const vars = {
    app: app.name,
    legalName: site.legalName,
    owner: site.owner,
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
      eyebrow={app.name}
      title={t("title")}
      intro={t("intro", vars)}
      sections={sections}
      updated={app.updated}
      seed={61}
      hue={[-28, -4]}
    />
  );
}
