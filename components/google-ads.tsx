"use client";

import { useEffect } from "react";
import Script from "next/script";

import { ADS_ID } from "@/lib/google-ads";
import { consentState, updateConsent } from "@/lib/google-consent";

/**
 * Google Ads conversion tracking, gated through Consent Mode v2 rather than by
 * withholding the script.
 *
 * The tag loads for every visitor, but `public/gtag-bootstrap.js` has already
 * denied `ad_storage`, `ad_user_data` and `ad_personalization` before it runs.
 * Denied is not a softer form of loaded: gtag.js writes no cookie and reads no
 * storage in that state, and sends only a cookieless ping. What it buys over
 * withholding the script entirely is conversion modelling - Google can
 * attribute a share of the conversions from visitors who decline or never
 * answer the banner, which is money on a paid campaign - and a tag that
 * Google's own detection can actually see, since that crawler never accepts a
 * cookie banner.
 *
 * Deliberately a separate category and a separate component from GA4:
 * counting visits and attributing an ad click to a form submission are
 * different purposes, so consent to one is not consent to the other.
 * `<CookieConsent>` broadcasts `cc:ads` on first consent, on every page load,
 * and whenever the preference changes later - this just listens rather than
 * importing the CC singleton itself. Because the signals are sent as updates
 * rather than by mounting the script, a visitor who later withdraws consent
 * is honoured too: `granted` goes back to `denied` on the same event.
 *
 * The tag has to be present on the page *before* the conversion fires, which
 * is why it lives in the layout rather than on the contact page alone: the ad
 * click and the form submission are usually separated by a few pages.
 */
export function GoogleAds() {
  useEffect(() => {
    if (!ADS_ID) return;

    const onConsentEvent = (event: Event) => {
      const state = consentState(
        Boolean((event as CustomEvent<boolean>).detail),
      );

      updateConsent({
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
      });
    };

    window.addEventListener("cc:ads", onConsentEvent);
    return () => window.removeEventListener("cc:ads", onConsentEvent);
  }, []);

  // No Ads account configured - render nothing.
  if (!ADS_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`} strategy="afterInteractive" />
      {/* Same-origin file, not an inline block - see public/gtag-init.js. */}
      <Script src={`/gtag-init.js?id=${ADS_ID}`} strategy="afterInteractive" />
    </>
  );
}
