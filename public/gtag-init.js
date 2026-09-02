/**
 * gtag bootstrap, as a same-origin static file rather than an inline <script>.
 *
 * Shared by `components/google-analytics.tsx` (GA4) and
 * `components/google-ads.tsx` (Google Ads conversion tracking). Reads the
 * property/account id off its own <script src> query string instead of having
 * one baked in, so this file stays generic - the components supply the id,
 * same as they supply it to the gtag.js loader tag.
 *
 * Both tags share one `dataLayer` and one `gtag()`, which is how gtag.js is
 * designed to carry several products at once. The one-time setup is guarded so
 * that whichever tag loads second only adds its own `config` call rather than
 * resetting what the first one established.
 */
(function () {
  var id = new URL(document.currentScript.src).searchParams.get("id");
  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
  }

  window.gtag("config", id);
})();
