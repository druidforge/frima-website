"use client";

import { useEffect } from "react";
import Script from "next/script";

import { GA_ID } from "@/lib/google-analytics";
import { consentState, updateConsent } from "@/lib/google-consent";

/**
 * GA4, gated through Consent Mode v2 rather than by withholding the script.
 *
 * `analytics_storage` starts denied in `public/gtag-bootstrap.js`, so the tag
 * loads without setting a `_ga` cookie or reading one. `<CookieConsent>`
 * broadcasts `cc:analytics` on first consent, on every page load, and whenever
 * the preference changes later - this listens rather than importing the CC
 * singleton itself, and sends the answer as a consent update in both
 * directions, so withdrawing consent is honoured without a reload.
 *
 * Only `analytics_storage` is touched here. The three advertising signals
 * belong to the "ads" category and are sent by `<GoogleAds>`; gtag merges
 * consecutive updates, so neither component overwrites the other's answer.
 */
export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_ID) return;

    const onConsentEvent = (event: Event) => {
      updateConsent({
        analytics_storage: consentState(
          Boolean((event as CustomEvent<boolean>).detail),
        ),
      });
    };

    window.addEventListener("cc:analytics", onConsentEvent);
    return () => window.removeEventListener("cc:analytics", onConsentEvent);
  }, []);

  // No property configured yet - render nothing.
  if (!GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      {/* Same-origin file, not an inline block - see public/gtag-init.js. */}
      <Script src={`/gtag-init.js?id=${GA_ID}`} strategy="afterInteractive" />
    </>
  );
}
