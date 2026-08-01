"use client";

import dynamic from "next/dynamic";

/**
 * Defers the consent library off the critical path.
 *
 * `vanilla-cookieconsent` plus its stylesheet is roughly a third of the CSS the
 * site ships and is never needed for first paint. Loading it client-side only,
 * after hydration, keeps it out of the initial bundle.
 *
 * This is safe for compliance because the site sets no non-essential cookie
 * before consent is granted: analytics is declared `enabled: false`, so nothing
 * can fire in the window before the banner mounts.
 */
const CookieConsent = dynamic(
  () => import("@/components/cookie-consent").then((m) => m.CookieConsent),
  { ssr: false },
);

export function CookieConsentLoader() {
  return <CookieConsent />;
}
