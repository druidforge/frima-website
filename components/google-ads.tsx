"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

import { ADS_ID } from "@/lib/google-ads";

/**
 * Google Ads conversion tracking, loaded only after the visitor accepts the
 * "ads" cookie category.
 *
 * Deliberately a separate category and a separate component from GA4: counting
 * visits and attributing an ad click to a form submission are different
 * purposes, so consent to one is not consent to the other. `<CookieConsent>`
 * broadcasts `cc:ads` on first consent, on every page load, and whenever the
 * preference changes later - this just listens rather than importing the CC
 * singleton itself.
 *
 * The tag has to be present on the page *before* the conversion fires, which
 * is why it lives in the layout rather than on the contact page alone: the ad
 * click and the form submission are usually separated by a few pages, and
 * `_gcl_aw` has to be written on the landing page for the click to be linked
 * to the conversion at all.
 */
export function GoogleAds() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!ADS_ID) return;

    const onConsentEvent = (event: Event) => {
      setConsented(Boolean((event as CustomEvent<boolean>).detail));
    };

    window.addEventListener("cc:ads", onConsentEvent);
    return () => window.removeEventListener("cc:ads", onConsentEvent);
  }, []);

  // No Ads account configured, or consent not (yet) granted - render nothing.
  if (!ADS_ID || !consented) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`} strategy="afterInteractive" />
      {/* Same-origin file, not an inline block - see public/gtag-init.js. */}
      <Script src={`/gtag-init.js?id=${ADS_ID}`} strategy="afterInteractive" />
    </>
  );
}
