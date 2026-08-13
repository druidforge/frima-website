import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { locales, type Locale } from "@/i18n/routing";
import { cookieTable } from "@/lib/cookies";
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
  const t = await getTranslations({ locale, namespace: "meta.cookies" });

  return {
    ...buildMetadata({
      title: t("title"),
      description: t("description"),
      href: "/cookies",
      locale,
    }),
    robots: { index: false, follow: true },
  };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal.cookiePolicy");
  const tc = await getTranslations("cookies");

  const sections: LegalSection[] = [
    {
      id: "choice",
      title: t("s1Title"),
      body: (
        <>
          <p>{t("s1Body")}</p>
          <CookieSettingsButton className="mt-6 inline-flex rounded-sm bg-ink px-5 py-3 text-sm font-medium text-paper transition-transform duration-300 hover:-translate-y-0.5">
            {t("openSettings")}
          </CookieSettingsButton>
        </>
      ),
    },
    {
      id: "categories",
      title: t("s2Title"),
      body: (
        <>
          <p>{t("s2Body")}</p>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="font-medium text-ink">{tc("necessaryTitle")}</dt>
              <dd className="mt-1">{tc("necessaryBody")}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">{tc("analyticsTitle")}</dt>
              <dd className="mt-1">{tc("analyticsBody")}</dd>
            </div>
          </dl>
        </>
      ),
    },
    {
      id: "list",
      title: t("s3Title"),
      body: (
        <>
          <p>{t("s3Body")}</p>
          <CookieList category="necessary" title={tc("necessaryTitle")} />
          <CookieList category="analytics" title={tc("analyticsTitle")} />
        </>
      ),
    },
    {
      id: "browser",
      title: t("s4Title"),
      body: <p>{t("s4Body")}</p>,
    },
  ];

  return (
    <LegalPage
      eyebrow={t("title")}
      title={t("title")}
      intro={t("intro")}
      sections={sections}
      seed={92}
      hue={[14, 36]}
    />
  );
}

/**
 * Renders straight from `lib/cookies.ts`, the same source the consent modal
 * reads, so the published policy cannot drift from what the site actually sets.
 */
async function CookieList({
  category,
  title,
}: {
  category: "necessary" | "analytics";
  title: string;
}) {
  const tc = await getTranslations("cookies");
  const rows = cookieTable[category];

  return (
    <div className="mt-8">
      <h3 className="eyebrow">{title}</h3>
      <div className="mt-4 -mx-1 min-w-0 overflow-x-auto px-1">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <Th>{tc("tableName")}</Th>
              <Th>{tc("tableDomain")}</Th>
              <Th>{tc("tableExpiration")}</Th>
              <Th>{tc("tableDescription")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-border/60">
                <Td>
                  <code className="font-mono text-xs">{row.name}</code>
                </Td>
                <Td>{row.domain}</Td>
                <Td>
                  {row.duration === "session" ? tc("session") : row.duration}
                </Td>
                <Td>{tc(row.descriptionKey)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="py-2.5 pr-4 font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-ink-faint"
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 pr-4 align-top">{children}</td>;
}
