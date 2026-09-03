import Script from "next/script";

import { ADS_ID } from "@/lib/google-ads";
import { GA_ID } from "@/lib/google-analytics";

/**
 * Consent Mode v2 defaults, loaded before anything else on the page.
 *
 * `beforeInteractive` is the reason this is its own component and its own
 * script file: the strategy only works from the root layout, and the ordering
 * it guarantees - ahead of hydration, so ahead of the consent library and
 * ahead of the `afterInteractive` tags - is exactly what `consent default`
 * requires to mean anything. See `public/gtag-bootstrap.js`.
 *
 * Renders nothing when no Google tag is configured, so a deployment without
 * either id pays for no request.
 */
export function GoogleTagBootstrap() {
  if (!ADS_ID && !GA_ID) return null;

  return (
    /* The rule looks for `pages/_document.js` and cannot see an App Router
       root layout at all, let alone one at `app/[locale]/layout.tsx`. This is
       the documented placement for this strategy - verified in the built HTML,
       where the tag is present in the initial markup of every page. */
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script src="/gtag-bootstrap.js" strategy="beforeInteractive" />
  );
}
