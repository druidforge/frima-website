import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import { CookieConsentLoader } from "@/components/cookie-consent-loader";
import { Footer } from "@/components/footer";
import { RoutePrefetcher } from "@/components/route-prefetcher";
import { SiteHeader } from "@/components/site-header";
import { StructuredData } from "@/components/structured-data";
import { locales, routing, type Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/metadata";
import { siteUrl } from "@/lib/site";

import "../globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["opsz", "wdth"],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "meta.home" });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `Druid Forge — ${t("title")}`,
      template: "%s — Druid Forge",
    },
    description: t("description"),
    alternates: buildAlternates("/", locale),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    // Icons and social images come from the file conventions in `app/`
    // (icon.svg, apple-icon.tsx, opengraph-image.tsx), so no manual list here.
    manifest: "/manifest.webmanifest",
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts every page in this segment into static rendering.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });

  /**
   * Only the namespaces a Client Component actually reads.
   *
   * `NextIntlClientProvider` serialises whatever it is given into the HTML of
   * every page. Handed the whole catalogue it shipped ~16KB per request,
   * including the full privacy and cookie policies - text that is rendered
   * exclusively on the server, on two pages out of nine.
   *
   * Anything used only through `getTranslations` or in a Server Component
   * stays out: `legal`, `about`, `meta`, `notFound` and `footer`.
   *
   * Adding `useTranslations("x")` to a file marked "use client" means adding
   * "x" here too, or it throws at runtime.
   */
  const messages = await getMessages();
  const clientNamespaces = [
    "common",
    "nav",
    "home",
    "services",
    "contact",
    "cookies",
    "error",
  ] as const;
  const clientMessages = Object.fromEntries(
    clientNamespaces
      .filter((key) => key in messages)
      .map((key) => [key, messages[key as keyof typeof messages]]),
  );

  return (
    <html
      lang={locale}
      className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <NextIntlClientProvider messages={clientMessages}>
          <a
            href="#main"
            className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-100 focus-visible:rounded-sm focus-visible:bg-ink focus-visible:px-4 focus-visible:py-2 focus-visible:text-paper"
          >
            {t("skipToContent")}
          </a>
          <StructuredData locale={locale as Locale} />
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieConsentLoader />
          {/* Lives in the layout so the queue survives navigation: it is worked
              through once per visit, not restarted on every page. */}
          <RoutePrefetcher />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
