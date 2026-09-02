"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * GA4, loaded only after the visitor accepts the "analytics" cookie category.
 *
 * `<CookieConsent>` (see `components/cookie-consent.tsx`) broadcasts a
 * `cc:analytics` event on first consent, on every page load, and whenever the
 * preference changes later - this just listens rather than importing the CC
 * singleton itself. Nothing here runs before that event says so, matching the
 * site's stated principle that nothing beyond necessary cookies fires before
 * explicit opt-in.
 */
export function GoogleAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;

    const onConsentEvent = (event: Event) => {
      setConsented(Boolean((event as CustomEvent<boolean>).detail));
    };

    window.addEventListener("cc:analytics", onConsentEvent);
    return () => window.removeEventListener("cc:analytics", onConsentEvent);
  }, []);

  // No property configured yet, or consent not (yet) granted - render nothing.
  if (!GA_ID || !consented) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      {/* Same-origin file, not an inline block - see public/gtag-init.js. */}
      <Script src={`/gtag-init.js?id=${GA_ID}`} strategy="afterInteractive" />
    </>
  );
}
