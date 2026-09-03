/**
 * Google Consent Mode v2 defaults.
 *
 * Loaded with `strategy="beforeInteractive"` from the root layout, which is
 * why this is separate from `gtag-init.js`: `consent default` only means
 * anything if it reaches `dataLayer` ahead of every `config` and every
 * `consent update`, and this file is injected into the initial HTML and
 * fetched before any first-party code. Next does not promise that it also
 * *executes* before hydration, so the same defaults are repeated behind the
 * same `if (!window.gtag)` guard in `gtag-init.js` and `lib/google-consent.ts`
 * - whichever of the three runs first sets them, and the guard stops the other
 * two from pushing a second `default` after an `update` has already landed.
 *
 * Everything non-essential starts denied. In that state gtag.js writes no
 * cookie and reads no storage; it sends only a cookieless ping, which is what
 * lets Google model the conversions of visitors who decline or never answer
 * the banner. Nothing here weakens the rule that no non-essential cookie is
 * set before an explicit opt-in - it changes *when the tag loads*, not what it
 * is allowed to store.
 *
 * `ads_data_redaction` strips ad click identifiers from those denied pings.
 * `url_passthrough` keeps `gclid` on the URL across navigations so a
 * conversion can still be attributed without the `_gcl_aw` cookie.
 *
 * `wait_for_update` holds the first ping briefly so a returning visitor whose
 * stored consent is about to be restored is measured as granted rather than
 * producing a denied ping and then a second granted one. It cannot cover a
 * first-time visitor - the banner is deliberately delayed several seconds -
 * and is not meant to.
 */
(function () {
  window.dataLayer = window.dataLayer || [];
  if (window.gtag) return;

  window.gtag = function () {
    dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 2000,
  });

  window.gtag("set", "ads_data_redaction", true);
  window.gtag("set", "url_passthrough", true);

  window.gtag("js", new Date());
})();
