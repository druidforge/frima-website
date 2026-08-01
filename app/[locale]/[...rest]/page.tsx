import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { locales, type Locale } from "@/i18n/routing";

/**
 * Catch-all that turns any unmatched URL under a locale into a proper 404.
 *
 * Without it, `/hr/anything-wrong` never enters the `[locale]` segment at all -
 * Next cannot know a URL it has no route for belongs there - so it falls
 * through to `app/not-found.tsx`, the bare document with no header, footer or
 * translations. Since the proxy prefixes every request with a locale, that made
 * the unbranded fallback the 404 nearly every visitor actually saw.
 *
 * More specific routes always win over a catch-all, so this only receives what
 * genuinely matches nothing. Calling `notFound()` keeps the real 404 status and
 * hands rendering to `app/[locale]/not-found.tsx`.
 */
export function generateStaticParams() {
  return [];
}

export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>;
}) {
  const { locale } = await params;

  if (locales.includes(locale as Locale)) {
    // Lets the 404 body render in the language the visitor asked for.
    setRequestLocale(locale as Locale);
  }

  notFound();
}
